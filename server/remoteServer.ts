import express from 'express';
import type http from 'http';
import os from 'os';
import { Server as SocketIOServer } from 'socket.io';
import { createRelay, type Relay } from './relay.ts';
import { rankLanAddresses } from './network.ts';
import type { DeliveryResult } from '../src/utils/remoteProtocol.ts';

interface AttachOptions {
  /** Port reported by /api/network-ip (the real one is only known after listen()). */
  getPort: () => number;
  /** An HTTP-polling stage counts as "online" if it polled within this window. */
  httpStageTtlMs?: number;
}

export interface RemoteServer {
  io: SocketIOServer;
  relay: Relay;
  stageCount: () => number;
  close: () => Promise<void>;
}

/**
 * One command bus for everything the phone can do:
 *   phone --(socket 'command' | POST /api/remote/command)--> relay --(socket 'command')--> stage
 *   stage --(socket 'stage_state' | POST /api/remote/stage-state)--> relay --(socket 'stage_state')--> phones
 * Plus GET /api/remote/poll as a fallback for networks that break websockets.
 */
export function attachRemoteServer(
  app: express.Express,
  httpServer: http.Server,
  options: AttachOptions
): RemoteServer {
  const relay = createRelay();
  const httpStageTtlMs = options.httpStageTtlMs ?? 5000;

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['polling', 'websocket'],
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // A stage is identified by a stable client id (`cid`), so a stage that has a socket AND also polls over
  // HTTP (it does one startup poll) is counted once, and a closed stage disappears at once.
  const stageSocketCids = new Map<string, Set<string>>(); // cid -> live socket ids
  const httpStages = new Map<string, number>(); // cid -> last HTTP poll (ms); only for stages without a socket

  function stageCount(): number {
    const cutoff = Date.now() - httpStageTtlMs;
    for (const [cid, seenAt] of httpStages) {
      if (seenAt < cutoff) httpStages.delete(cid);
    }
    return new Set([...stageSocketCids.keys(), ...httpStages.keys()]).size;
  }

  const presenceTimer = setInterval(() => io.emit('presence', { stages: stageCount() }), 3000);
  presenceTimer.unref();
  const broadcastPresence = () => io.emit('presence', { stages: stageCount() });

  const validCid = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0 && value.length <= 100;

  function touchHttpStage(cid: unknown): void {
    if (!validCid(cid) || stageSocketCids.has(cid)) return; // its socket already represents it
    const isNew = !httpStages.has(cid);
    httpStages.set(cid, Date.now());
    if (isNew) broadcastPresence();
  }

  function runCommand(raw: unknown): { status: number; body: DeliveryResult } {
    const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const result = relay.publish({ id: input.id, type: input.type ?? input.action, payload: input.payload });
    if (!result.ok) {
      return { status: 400, body: { ok: false, error: result.error, stages: stageCount() } };
    }
    if (!result.duplicate) io.emit('command', result.command);
    return {
      status: 200,
      body: {
        ok: true,
        id: result.command.id,
        seq: result.command.seq,
        duplicate: result.duplicate,
        stages: stageCount(),
      },
    };
  }

  io.on('connection', (socket) => {
    const role = socket.handshake.auth?.role === 'stage' ? 'stage' : 'remote';
    const authCid = socket.handshake.auth?.cid;
    const cid = validCid(authCid) ? authCid : socket.id;
    if (role === 'stage') {
      const sockets = stageSocketCids.get(cid) ?? new Set<string>();
      sockets.add(socket.id);
      stageSocketCids.set(cid, sockets);
      httpStages.delete(cid); // the socket supersedes HTTP presence
    }
    broadcastPresence();

    // A phone that connects mid-show immediately learns what the stage is doing.
    const snapshot = relay.getStageState();
    if (snapshot) socket.emit('stage_state', snapshot);

    socket.on('ping', (startedAt: number) => socket.emit('pong', startedAt));

    socket.on('command', (raw: unknown, ack?: (result: DeliveryResult) => void) => {
      const { body } = runCommand(raw);
      if (typeof ack === 'function') ack(body);
    });

    socket.on('stage_state', (state: unknown) => {
      if (role !== 'stage') return;
      if (relay.setStageState(state)) socket.broadcast.emit('stage_state', state);
    });

    socket.on('request_stage_state', () => {
      const latest = relay.getStageState();
      if (latest) socket.emit('stage_state', latest);
    });

    socket.on('disconnect', () => {
      if (role !== 'stage') return;
      const sockets = stageSocketCids.get(cid);
      sockets?.delete(socket.id);
      if (sockets && sockets.size === 0) stageSocketCids.delete(cid);
      broadcastPresence();
    });
  });

  // Small bodies only for the remote API (the app-wide 50 MB parser is for wheel imports).
  app.use('/api/remote', express.json({ limit: '100kb' }));

  const noStore: express.RequestHandler = (_req, res, next) => {
    // Phone browsers love to cache GETs; a cached poll means a dead remote.
    res.set('Cache-Control', 'no-store');
    next();
  };

  const commandRoute: express.RequestHandler = (req, res) => {
    const { status, body } = runCommand(req.body);
    res.status(status).json(body);
  };
  app.post('/api/remote/command', commandRoute);
  app.post('/api/remote/action', commandRoute); // legacy path

  app.get('/api/remote/poll', noStore, (req, res) => {
    if (req.query.role === 'stage') touchHttpStage(req.query.cid);
    const since = Number(req.query.since);
    // since missing/negative => "just tell me where the head is" so a fresh stage never replays history.
    const commands = Number.isFinite(since) && since >= 0 ? relay.since(since) : [];
    res.json({
      commands,
      latestSeq: relay.latestSeq(),
      serverNow: Date.now(),
      stageState: relay.getStageState(),
      winners: relay.getWinners(),
      stages: stageCount(),
    });
  });

  app.post('/api/remote/stage-state', (req, res) => {
    touchHttpStage(req.body?.cid);
    const state = req.body?.state;
    if (relay.setStageState(state)) io.emit('stage_state', state);
    res.json({ ok: true });
  });

  // Sent by a closing stage page so the phone's "stage connected" indicator drops immediately.
  app.post('/api/remote/stage-leave', (req, res) => {
    const cid = req.body?.cid;
    if (validCid(cid) && httpStages.delete(cid)) broadcastPresence();
    res.json({ ok: true });
  });

  app.get('/api/remote/stage-state', noStore, (_req, res) => {
    res.json({ state: relay.getStageState(), winners: relay.getWinners(), stages: stageCount() });
  });

  // The QR code must contain an address the PHONE can reach, not "localhost".
  app.get('/api/network-ip', noStore, (_req, res) => {
    const allIps = rankLanAddresses(os.networkInterfaces());
    res.json({ localIp: allIps[0] ?? 'localhost', allIps, port: options.getPort() });
  });

  return {
    io,
    relay,
    stageCount,
    close: () =>
      new Promise<void>((resolve) => {
        clearInterval(presenceTimer);
        io.close(() => resolve());
      }),
  };
}
