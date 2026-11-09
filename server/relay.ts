/**
 * Pure, framework-free state of the remote-control relay.
 * server/remoteServer.ts wires this to Socket.IO + HTTP; tests drive it directly.
 */
import {
  type CommandEnvelope,
  type StageSyncState,
  normalizeCommandType,
  validatePayload,
  MAX_ID_LENGTH,
} from '../src/utils/remoteProtocol.ts';
import type { WinnersData } from '../src/types/presentation.ts';

export interface PublishInput {
  id?: unknown;
  type?: unknown;
  payload?: unknown;
}

export type PublishResult =
  | { ok: true; command: CommandEnvelope; duplicate: boolean }
  | { ok: false; error: string };

export interface RelayOptions {
  historyLimit?: number;
  now?: () => number;
}

const MAX_STATE_JSON = 20_000;

export function createRelay(options: RelayOptions = {}) {
  const historyLimit = options.historyLimit ?? 200;
  const now = options.now ?? Date.now;

  let seq = 0;
  const history: CommandEnvelope[] = [];
  const byId = new Map<string, CommandEnvelope>();

  let winners: WinnersData | null = null;
  let stageState: StageSyncState | null = null;
  let stageStateJson = '';

  function publish(input: PublishInput | null | undefined): PublishResult {
    const type = normalizeCommandType(input?.type);
    if (!type) return { ok: false, error: 'Unknown command type' };

    const rawId = input?.id;
    const id =
      typeof rawId === 'string' && rawId.length > 0 && rawId.length <= MAX_ID_LENGTH ? rawId : null;

    // Same id seen before (socket + HTTP retry, double delivery...): acknowledge, do not re-run.
    if (id) {
      const existing = byId.get(id);
      if (existing) return { ok: true, command: existing, duplicate: true };
    }

    const checked = validatePayload(type, input?.payload);
    if (!checked.ok) return { ok: false, error: checked.error };

    seq += 1;
    const command: CommandEnvelope = {
      id: id ?? `srv-${seq}-${now().toString(36)}`,
      seq,
      type,
      payload: checked.payload,
      ts: now(),
    };
    history.push(command);
    byId.set(command.id, command);
    while (history.length > historyLimit) {
      const oldest = history.shift();
      if (oldest) byId.delete(oldest.id);
    }

    if (type === 'push_winners') winners = checked.payload as WinnersData;
    else if (type === 'clear_board') winners = null;

    return { ok: true, command, duplicate: false };
  }

  /** Commands accepted after `afterSeq`. */
  function since(afterSeq: number): CommandEnvelope[] {
    return history.filter((command) => command.seq > afterSeq);
  }

  /** Stores the latest stage snapshot. Returns true only when it actually changed. */
  function setStageState(state: unknown): boolean {
    if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
    let json: string;
    try {
      json = JSON.stringify(state);
    } catch {
      return false;
    }
    if (json.length > MAX_STATE_JSON) return false;
    if (json === stageStateJson) return false;
    stageState = state as StageSyncState;
    stageStateJson = json;
    return true;
  }

  return {
    publish,
    since,
    setStageState,
    latestSeq: () => seq,
    getStageState: () => stageState,
    getWinners: () => winners,
  };
}

export type Relay = ReturnType<typeof createRelay>;
