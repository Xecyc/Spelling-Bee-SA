/**
 * End-to-end tests: a REAL Socket.IO/HTTP server (server/remoteServer.ts) and the REAL client code
 * (src/utils/remoteClient.ts) playing the two devices: the stage display (PC) and the phone remote.
 * BroadcastChannel is left ON on purpose: both clients live in one process, so every command also
 * arrives over that second transport, which proves the de-duplication.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import type { AddressInfo } from 'net';
import { attachRemoteServer, type RemoteServer } from './remoteServer.ts';
import { createRemoteClient, type IncomingCommand, type RemoteClient, type RemoteClientOptions } from '../src/utils/remoteClient.ts';
import type { StageSyncState } from '../src/utils/remoteProtocol.ts';

let httpServer: http.Server;
let remoteServer: RemoteServer;
let baseUrl = '';
const clients: RemoteClient[] = [];

before(async () => {
  const app = express();
  httpServer = http.createServer(app);
  remoteServer = attachRemoteServer(app, httpServer, { getPort: () => (httpServer.address() as AddressInfo).port });
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

after(async () => {
  clients.forEach((client) => client.destroy());
  await remoteServer.close();
  httpServer.closeAllConnections?.();
  await new Promise((resolve) => httpServer.close(resolve));
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean, what: string, timeoutMs = 4000): Promise<void> {
  const started = Date.now();
  while (!condition()) {
    if (Date.now() - started > timeoutMs) assert.fail(`Timed out waiting for: ${what}`);
    await sleep(15);
  }
}

function makeStage(extra: Partial<RemoteClientOptions> = {}) {
  const commands: IncomingCommand[] = [];
  const winners: unknown[] = [];
  let connected = false;
  const client = createRemoteClient({
    role: 'stage',
    baseUrl,
    onCommand: (command) => commands.push(command),
    onWinners: (w) => winners.push(w),
    onConnection: (value) => (connected = value),
    ...extra,
  });
  clients.push(client);
  return { client, commands, winners, isConnected: () => connected };
}

function makePhone(extra: Partial<RemoteClientOptions> = {}) {
  const states: StageSyncState[] = [];
  let stages: number | null = null;
  let connected = false;
  const client = createRemoteClient({
    role: 'remote',
    baseUrl,
    onStageState: (state) => states.push(state),
    onPresence: (value) => (stages = value),
    onConnection: (value) => (connected = value),
    ...extra,
  });
  clients.push(client);
  return { client, states, stages: () => stages, isConnected: () => connected };
}

test('one tap on the phone runs exactly once on the stage (socket + BroadcastChannel both deliver)', async () => {
  const stage = makeStage();
  const phone = makePhone();
  await waitFor(() => stage.isConnected() && phone.isConnected() && phone.stages() === 1, 'both devices online');

  const result = await phone.client.send('spin_wheel');
  assert.equal(result.ok, true);
  assert.equal(result.stages, 1, 'phone is told that one stage screen received it');

  await sleep(400); // give any duplicate path time to misbehave
  assert.deepEqual(stage.commands.map((c) => c.type), ['spin_wheel']);

  stage.client.destroy();
  phone.client.destroy();
});

test('every button the phone has reaches the stage, once each, in order', async () => {
  const stage = makeStage();
  const phone = makePhone();
  await waitFor(() => stage.isConnected() && phone.stages() === 1, 'online');

  const sequence = ['spin_wheel', 'stop_spin', 'start_timer', 'pause_timer', 'reset_timer', 'remove_word', 'close_modal', 'clear_board'] as const;
  for (const type of sequence) assert.equal((await phone.client.send(type)).ok, true, type);
  await waitFor(() => stage.commands.length >= sequence.length, 'all commands');
  await sleep(300);
  assert.deepEqual(stage.commands.map((c) => c.type), [...sequence]);

  stage.client.destroy();
  phone.client.destroy();
});

test('"Push to Stage" delivers cleaned podium names', async () => {
  const stage = makeStage();
  const phone = makePhone();
  await waitFor(() => stage.isConnected() && phone.stages() === 1, 'online');

  await phone.client.send('push_winners', { first: '  Sofia Rodriguez ', second: 'Mateo Gonzalez', third: 'Camila Perez', hack: '<script>' });
  await waitFor(() => stage.commands.length === 1, 'podium command');
  await sleep(200);
  assert.equal(stage.commands.length, 1);
  assert.equal(stage.commands[0].type, 'push_winners');
  assert.deepEqual(stage.commands[0].payload, { first: 'Sofia Rodriguez', second: 'Mateo Gonzalez', third: 'Camila Perez' });

  stage.client.destroy();
  phone.client.destroy();
});

test('a stage that reloads mid-ceremony gets the podium names back, and never replays old spins', async () => {
  const phone = makePhone();
  await phone.client.send('spin_wheel');
  await phone.client.send('push_winners', { first: 'Ana', second: 'Beto', third: 'Carla' });

  const reloadedStage = makeStage();
  await waitFor(() => reloadedStage.winners.length === 1, 'podium restored');
  assert.deepEqual(reloadedStage.winners[0], { first: 'Ana', second: 'Beto', third: 'Carla' });
  await sleep(300);
  assert.equal(reloadedStage.commands.length, 0, 'history must not be replayed on load');

  await phone.client.send('clear_board');
  const afterClear = makeStage();
  await sleep(400);
  assert.equal(afterClear.winners.length, 0, 'cleared podium is not restored');

  reloadedStage.client.destroy();
  afterClear.client.destroy();
  phone.client.destroy();
});

test('retrying the same command id over HTTP (lost socket ack) does not run it twice', async () => {
  const stage = makeStage({ useBroadcastChannel: false });
  await waitFor(() => stage.isConnected(), 'stage online');

  const post = () =>
    fetch(`${baseUrl}/api/remote/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'retry-me', type: 'spin_wheel' }),
    }).then((r) => r.json() as Promise<{ ok: boolean; duplicate: boolean }>);

  const first = await post();
  const second = await post();
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  await sleep(300);
  assert.equal(stage.commands.filter((c) => c.id === 'retry-me').length, 1);

  stage.client.destroy();
});

test('works with sockets completely blocked: HTTP-only phone drives a polling stage', async () => {
  const stage = makeStage({ disableSocket: true, pollIntervalMs: 80, useBroadcastChannel: false });
  const phone = makePhone({ disableSocket: true, pollIntervalMs: 80, useBroadcastChannel: false });
  await waitFor(() => stage.isConnected() && phone.isConnected(), 'HTTP reachability');
  await waitFor(() => phone.stages() === 1, 'stage seen through HTTP polling presence');

  const result = await phone.client.send('spin_wheel');
  assert.equal(result.ok, true);
  assert.equal(result.stages, 1);
  await waitFor(() => stage.commands.length === 1, 'polling stage received the command');
  await sleep(300);
  assert.equal(stage.commands.length, 1, 'polling must not deliver it twice');

  stage.client.destroy();
  phone.client.destroy();
});

test('a polling stage skips commands that are too old (no surprise spin after a network blip)', async () => {
  const stage = makeStage({ disableSocket: true, pollIntervalMs: 1200, maxCommandAgeMs: 150, useBroadcastChannel: false });
  await waitFor(() => stage.isConnected(), 'stage polled once (head learned)');

  await fetch(`${baseUrl}/api/remote/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'spin_wheel' }),
  });
  await sleep(1700); // next poll sees it, but it is older than maxCommandAgeMs
  assert.equal(stage.commands.length, 0);

  stage.client.destroy();
});

test('stage snapshots reach the phone live, and a phone that joins late gets the latest immediately', async () => {
  const stage = makeStage({ useBroadcastChannel: false });
  const earlyPhone = makePhone({ useBroadcastChannel: false });
  await waitFor(() => stage.isConnected() && earlyPhone.isConnected(), 'online');

  stage.client.publishStageState({ winningWord: 'WINTER', timeLeft: 37, isTimerRunning: true, showWinnerModal: true });
  await waitFor(() => earlyPhone.states.some((s) => s.winningWord === 'WINTER'), 'live state on phone');
  const received = earlyPhone.states.find((s) => s.winningWord === 'WINTER');
  assert.equal(received?.timeLeft, 37);

  const latePhone = makePhone({ useBroadcastChannel: false });
  await waitFor(() => latePhone.states.some((s) => s.winningWord === 'WINTER'), 'late phone gets snapshot on connect');

  stage.client.destroy();
  earlyPhone.client.destroy();
  latePhone.client.destroy();
});

test('the phone learns when no stage screen is connected, and when one arrives or leaves', async () => {
  const phone = makePhone({ useBroadcastChannel: false });
  await waitFor(() => phone.isConnected(), 'phone online');
  await waitFor(() => phone.stages() === 0, 'zero stages known');

  const lonely = await phone.client.send('spin_wheel');
  assert.equal(lonely.ok, true);
  assert.equal(lonely.stages, 0, 'delivered to the server, but nobody is listening: the UI can warn');

  const stage = makeStage({ useBroadcastChannel: false });
  await waitFor(() => phone.stages() === 1, 'stage arrives');
  stage.client.destroy();
  await waitFor(() => phone.stages() === 0, 'stage leaves');

  phone.client.destroy();
});

test('invalid commands are refused with a clear error', async () => {
  const phone = makePhone({ useBroadcastChannel: false });
  await waitFor(() => phone.isConnected(), 'online');
  const bad = await phone.client.send('set_slide', 99);
  assert.equal(bad.ok, false);
  assert.match(bad.error ?? '', /slide/);

  const res = await fetch(`${baseUrl}/api/remote/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'drop_database' }),
  });
  assert.equal(res.status, 400);
  phone.client.destroy();
});

test('30 quick taps arrive in order, exactly once each', async () => {
  const stage = makeStage();
  const phone = makePhone();
  await waitFor(() => stage.isConnected() && phone.stages() === 1, 'online');
  const before = stage.commands.length;

  for (let i = 0; i < 30; i++) await phone.client.send('set_slide', i % 4);
  await waitFor(() => stage.commands.length >= before + 30, 'all 30');
  await sleep(300);
  const slides = stage.commands.slice(before).map((c) => c.payload);
  assert.deepEqual(slides, Array.from({ length: 30 }, (_, i) => i % 4));

  stage.client.destroy();
  phone.client.destroy();
});

test('unreachable server: the phone reports failure instead of silently doing nothing', async () => {
  const dead = await new Promise<number>((resolve) => {
    const probe = http.createServer().listen(0, '127.0.0.1', () => {
      const port = (probe.address() as AddressInfo).port;
      probe.close(() => resolve(port));
    });
  });
  let connected: boolean | null = null;
  const phone = createRemoteClient({
    role: 'remote',
    baseUrl: `http://127.0.0.1:${dead}`,
    onConnection: (value) => (connected = value),
    useBroadcastChannel: false,
  });
  clients.push(phone);

  const result = await phone.send('spin_wheel');
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /Cannot reach/);
  await waitFor(() => connected === false, 'reported offline');
  phone.destroy();
});

test('polling responses are never cacheable (phone browsers cache GETs aggressively)', async () => {
  const res = await fetch(`${baseUrl}/api/remote/poll?since=-1`);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const body = (await res.json()) as { commands: unknown[]; latestSeq: number };
  assert.deepEqual(body.commands, []);
  assert.equal(typeof body.latestSeq, 'number');
});

test('/api/network-ip tells the QR code which address a phone should use', async () => {
  const res = await fetch(`${baseUrl}/api/network-ip`);
  const body = (await res.json()) as { localIp: string; allIps: string[]; port: number };
  assert.equal(body.port, Number(new URL(baseUrl).port));
  assert.ok(Array.isArray(body.allIps));
  assert.equal(typeof body.localIp, 'string');
});
