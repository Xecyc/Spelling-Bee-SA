/**
 * Transport layer shared by the stage display and the phone remote.
 *
 * Transports, in order of preference:
 *   1. Socket.IO (instant, with an acknowledgement from the server)
 *   2. HTTP POST/GET (used when the socket is down or the ack times out)
 *   3. BroadcastChannel (only reaches other tabs of the SAME browser; handy for testing on one PC)
 *
 * A command is sent over ONE of the server transports and is stamped with a unique id, so a retry over
 * HTTP after a lost socket ack can never run twice: both the server and the stage de-duplicate on the id.
 *
 * Deliberately has no React/zustand/window dependency beyond optional browser globals, so it can be
 * exercised end-to-end against the real server in tests.
 */
import { io, type Socket } from 'socket.io-client';
import type { WinnersData } from '../types/presentation';
import {
  type CommandType,
  type DeliveryResult,
  type StageSyncState,
  MAX_COMMAND_AGE_MS,
  createDeduper,
  makeCommandId,
  normalizeCommandType,
  validatePayload,
} from './remoteProtocol';

export type ClientRole = 'stage' | 'remote';

export interface IncomingCommand {
  id: string;
  type: CommandType;
  payload?: unknown;
}

export interface RemoteClientOptions {
  role: ClientRole;
  /** '' = same origin as the page (browser). Tests pass the full URL of a test server. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Default: on when the runtime has BroadcastChannel. */
  useBroadcastChannel?: boolean;
  /** How often to poll over HTTP while the socket is down. */
  pollIntervalMs?: number;
  /** Never open the socket: HTTP only. For tests, and for networks that block Socket.IO entirely. */
  disableSocket?: boolean;
  /** Commands older than this (server clock) are not executed when caught up by polling. */
  maxCommandAgeMs?: number;
  /** Stage only: a command to execute. Called at most once per command id. */
  onCommand?: (command: IncomingCommand) => void;
  /** Remote only: the stage's latest snapshot. */
  onStageState?: (state: StageSyncState) => void;
  /** Stage only: podium names the server still remembers (e.g. after a page refresh). */
  onWinners?: (winners: WinnersData) => void;
  /** True while the server is reachable by socket OR by HTTP. */
  onConnection?: (connected: boolean) => void;
  /** Number of stage displays the server currently sees. */
  onPresence?: (stages: number) => void;
  onLatency?: (ms: number) => void;
}

export interface RemoteClient {
  send: (type: CommandType, payload?: unknown) => Promise<DeliveryResult>;
  publishStageState: (state: StageSyncState) => void;
  requestStageState: () => void;
  isConnected: () => boolean;
  destroy: () => void;
}

const CHANNEL_NAME = 'salto_angel_remote_v2';
const SOCKET_ACK_TIMEOUT_MS = 2000;

interface PollResponse {
  commands?: { id: string; seq: number; type: string; payload?: unknown; ts: number }[];
  latestSeq?: number;
  serverNow?: number;
  stageState?: StageSyncState | null;
  winners?: WinnersData | null;
  stages?: number;
}

export function createRemoteClient(options: RemoteClientOptions): RemoteClient {
  const { role } = options;
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
  const doFetch: typeof fetch =
    options.fetchImpl ?? ((input, init) => (globalThis.fetch as typeof fetch)(input, init));
  const clientId = makeCommandId();
  const firstTime = createDeduper(300);

  let destroyed = false;
  let cursor = -1; // last server seq this stage has seen; -1 = "not learned yet, never replay history"
  let httpOk = false;
  let lastReportedConnected: boolean | null = null;
  let restoredWinners = false;
  let lastStateJson = '';
  let lastState: StageSyncState | null = null;

  // ---- socket -------------------------------------------------------------------------------------
  const socketOptions = {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    auth: { role, cid: clientId },
    autoConnect: !options.disableSocket,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 8000,
  };
  const socket: Socket = baseUrl ? io(baseUrl, socketOptions) : io(socketOptions);

  function reportConnection(): void {
    const connected = socket.connected || httpOk;
    if (connected === lastReportedConnected) return;
    lastReportedConnected = connected;
    options.onConnection?.(connected);
  }

  // ---- stage: receive commands ---------------------------------------------------------------------
  function deliver(raw: { id?: unknown; seq?: unknown; type?: unknown; payload?: unknown }, ageMs = 0): void {
    if (typeof raw.seq === 'number' && raw.seq > cursor) cursor = raw.seq;
    if (role !== 'stage') return;
    if (ageMs > (options.maxCommandAgeMs ?? MAX_COMMAND_AGE_MS)) return; // never replay an old spin
    const type = normalizeCommandType(raw.type);
    if (!type || typeof raw.id !== 'string') return;
    const checked = validatePayload(type, raw.payload);
    if (!checked.ok) return;
    if (!firstTime(raw.id)) return; // same tap arrived over another transport
    options.onCommand?.({ id: raw.id, type, payload: checked.payload });
  }

  // ---- HTTP polling fallback (also used for the very first "where is the head?" question) -----------
  let polling = false;
  async function pollOnce(): Promise<void> {
    if (destroyed || polling) return;
    polling = true;
    try {
      const since = role === 'stage' ? cursor : -1;
      const res = await doFetch(
        `${baseUrl}/api/remote/poll?since=${since}&role=${role}&cid=${encodeURIComponent(clientId)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`poll ${res.status}`);
      const data = (await res.json()) as PollResponse;
      httpOk = true;
      if (role === 'stage') {
        if (cursor < 0) {
          cursor = typeof data.latestSeq === 'number' ? data.latestSeq : 0; // start at the head, no replay
        } else {
          const now = typeof data.serverNow === 'number' ? data.serverNow : Date.now();
          for (const command of data.commands ?? []) deliver(command, now - command.ts);
        }
        if (data.winners && !restoredWinners) {
          restoredWinners = true;
          options.onWinners?.(data.winners);
        }
      } else if (data.stageState) {
        options.onStageState?.(data.stageState);
      }
      if (typeof data.stages === 'number') options.onPresence?.(data.stages);
    } catch {
      httpOk = false;
    } finally {
      polling = false;
      reportConnection();
    }
  }

  // ---- same-browser channel --------------------------------------------------------------------------
  let channel: BroadcastChannel | null = null;
  const wantChannel = options.useBroadcastChannel ?? typeof BroadcastChannel !== 'undefined';
  if (wantChannel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent) => {
      const message = event.data as { kind?: string; command?: unknown; state?: StageSyncState } | null;
      if (!message) return;
      if (message.kind === 'command' && role === 'stage') {
        deliver(message.command as Record<string, unknown>);
      } else if (message.kind === 'stage_state' && role === 'remote' && message.state) {
        options.onStageState?.(message.state);
      }
    };
  }

  // ---- wire up socket events -------------------------------------------------------------------------
  socket.on('connect', () => {
    reportConnection();
    socket.emit('ping', Date.now());
    if (role === 'remote') socket.emit('request_stage_state');
    else {
      void pollOnce(); // catch up on anything sent while we were disconnected (old ones are dropped)
      if (lastState) socket.emit('stage_state', lastState); // e.g. the server restarted: tell it where we are
    }
  });
  socket.on('disconnect', reportConnection);
  socket.on('connect_error', reportConnection);
  socket.on('pong', (startedAt: number) => {
    if (typeof startedAt === 'number') options.onLatency?.(Date.now() - startedAt);
  });
  socket.on('presence', (payload: { stages?: number }) => {
    if (payload && typeof payload.stages === 'number') options.onPresence?.(payload.stages);
  });
  if (role === 'stage') {
    socket.on('command', (command) => deliver(command));
  } else {
    socket.on('stage_state', (state: StageSyncState) => options.onStageState?.(state));
  }

  const pingTimer = setInterval(() => {
    if (socket.connected) socket.emit('ping', Date.now());
  }, 10_000);
  const pollTimer = setInterval(() => {
    if (!socket.connected) void pollOnce();
  }, options.pollIntervalMs ?? 1000);
  // Do not keep a Node process (tests) alive just for these timers.
  (pingTimer as unknown as { unref?: () => void }).unref?.();
  (pollTimer as unknown as { unref?: () => void }).unref?.();

  void pollOnce(); // learn the head (stage) / reachability (remote) right away

  // ---- public API --------------------------------------------------------------------------------------
  async function send(type: CommandType, payload?: unknown): Promise<DeliveryResult> {
    const id = makeCommandId();
    const envelope = { id, type, payload };

    // Same-browser fast path. Harmless if the server also delivers: the stage de-duplicates on `id`.
    channel?.postMessage({ kind: 'command', command: { id, seq: 0, type, payload, ts: Date.now() } });

    const finish = (result: DeliveryResult): DeliveryResult => {
      if (typeof result.stages === 'number') options.onPresence?.(result.stages);
      return result;
    };

    if (socket.connected) {
      const viaSocket = await new Promise<DeliveryResult | null>((resolve) => {
        socket
          .timeout(SOCKET_ACK_TIMEOUT_MS)
          .emit('command', envelope, (error: Error | null, result?: DeliveryResult) =>
            resolve(error ? null : result ?? null)
          );
      });
      if (viaSocket) return finish(viaSocket);
    }

    // Retry over HTTP with the SAME id: if the socket actually delivered it, the server answers `duplicate`.
    try {
      const res = await doFetch(`${baseUrl}/api/remote/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope),
      });
      const body = (await res.json().catch(() => null)) as DeliveryResult | null;
      httpOk = true;
      reportConnection();
      if (body && typeof body.ok === 'boolean') return finish(body);
      return { ok: false, error: `Server answered ${res.status}` };
    } catch {
      httpOk = false;
      reportConnection();
      return { ok: false, error: 'Cannot reach the stage server' };
    }
  }

  function publishStageState(state: StageSyncState): void {
    const json = JSON.stringify(state);
    if (json === lastStateJson) return;
    lastStateJson = json;
    lastState = state;
    channel?.postMessage({ kind: 'stage_state', state });
    if (socket.connected) {
      socket.emit('stage_state', state);
    } else {
      doFetch(`${baseUrl}/api/remote/stage-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, cid: clientId }),
      }).catch(() => {});
    }
  }

  function requestStageState(): void {
    if (socket.connected) socket.emit('request_stage_state');
    else void pollOnce();
  }

  /** Tell the server this stage is gone (HTTP-mode stages have no socket to disconnect). */
  function announceLeaving(): void {
    if (role !== 'stage') return;
    doFetch(`${baseUrl}/api/remote/stage-leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid: clientId }),
      keepalive: true,
    }).catch(() => {});
  }
  if (typeof window !== 'undefined') window.addEventListener('pagehide', announceLeaving);

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', announceLeaving);
    announceLeaving();
    clearInterval(pingTimer);
    clearInterval(pollTimer);
    channel?.close();
    socket.removeAllListeners();
    socket.disconnect();
  }

  return {
    send,
    publishStageState,
    requestStageState,
    isConnected: () => socket.connected || httpOk,
    destroy,
  };
}
