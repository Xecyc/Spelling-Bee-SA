/**
 * Shared protocol between the stage display, the phone remote and the server.
 *
 * Design rules (this file is imported by BOTH the browser and server/):
 *  - Every command carries a unique `id`. The server and the stage both
 *    de-duplicate on it, so the same tap may travel over several transports
 *    (socket, HTTP retry, BroadcastChannel) and still run exactly once.
 *  - The server stamps each accepted command with an increasing `seq`, which
 *    is the cursor used by the HTTP polling fallback.
 *  - Nothing in here touches window/DOM/Node APIs, so it is trivially testable.
 */
import type { WinnersData } from '../types/presentation';

export const COMMAND_TYPES = [
  'spin_wheel',
  'stop_spin',
  'start_timer',
  'pause_timer',
  'reset_timer',
  'set_timer_duration',
  'remove_word',
  'close_modal',
  'push_winners',
  'clear_board',
  'set_slide',
] as const;

export type CommandType = (typeof COMMAND_TYPES)[number];

/** Older names that are still accepted and mapped onto the canonical ones. */
const COMMAND_ALIASES: Record<string, CommandType> = {
  stop_timer: 'pause_timer',
  clear_winners: 'clear_board',
};

export const COMMAND_LABELS: Record<CommandType, string> = {
  spin_wheel: 'Spin wheel',
  stop_spin: 'Stop spin',
  start_timer: 'Start timer',
  pause_timer: 'Stop timer',
  reset_timer: 'Reset timer',
  set_timer_duration: 'Set timer duration',
  remove_word: 'Remove word',
  close_modal: 'Close',
  push_winners: 'Push to stage',
  clear_board: 'Clear board',
  set_slide: 'Change slide',
};

/** A command older than this (measured by the server clock) is never replayed. */
export const MAX_COMMAND_AGE_MS = 8000;
export const MAX_NAME_LENGTH = 80;
export const MAX_ID_LENGTH = 100;

export function normalizeCommandType(raw: unknown): CommandType | null {
  if (typeof raw !== 'string') return null;
  const type = COMMAND_ALIASES[raw] ?? raw;
  return (COMMAND_TYPES as readonly string[]).includes(type) ? (type as CommandType) : null;
}

export interface CommandEnvelope {
  id: string;
  seq: number;
  type: CommandType;
  payload?: unknown;
  /** Server clock (ms) when the command was accepted. */
  ts: number;
}

export interface DeliveryResult {
  ok: boolean;
  id?: string;
  seq?: number;
  duplicate?: boolean;
  /** How many stage displays are currently connected to the server. */
  stages?: number;
  error?: string;
}

export interface StageSyncState {
  isSpinning?: boolean;
  showWinnerModal?: boolean;
  winningWord?: string | null;
  currentWheelName?: string;
  timerDuration?: number;
  timeLeft?: number;
  isTimerRunning?: boolean;
  currentSlide?: number;
  winnersData?: WinnersData | null;
}

export function sanitizeWinners(input: unknown): WinnersData {
  const read = (value: unknown): string =>
    typeof value === 'string' ? value.trim().slice(0, MAX_NAME_LENGTH) : '';
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  return { first: read(source.first), second: read(source.second), third: read(source.third) };
}

export type PayloadResult = { ok: true; payload: unknown } | { ok: false; error: string };

/** Validates and normalizes the payload for a command. Unknown payloads are dropped. */
export function validatePayload(type: CommandType, payload: unknown): PayloadResult {
  if (type === 'push_winners') {
    return { ok: true, payload: sanitizeWinners(payload) };
  }
  if (type === 'set_slide') {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0 && payload <= 3) {
      return { ok: true, payload };
    }
    return { ok: false, error: 'set_slide needs an integer slide number from 0 to 3' };
  }
  if (type === 'set_timer_duration') {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 5 && payload <= 600) {
      return { ok: true, payload };
    }
    return { ok: false, error: 'set_timer_duration needs an integer between 5 and 600' };
  }
  return { ok: true, payload: undefined };
}

let idCounter = 0;

/**
 * Unique command id. `crypto.randomUUID` only exists in secure contexts, and the
 * phone loads the remote over plain http://<LAN-ip>, so a fallback is REQUIRED.
 */
export function makeCommandId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    try {
      return webCrypto.randomUUID();
    } catch {
      // fall through to the manual id
    }
  }
  idCounter = (idCounter + 1) % 1_000_000;
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${random}`;
}

/**
 * Returns a function that answers "is this the first time I see this id?".
 * Remembers the most recent `limit` ids.
 */
export function createDeduper(limit = 256): (id: string) => boolean {
  const seen = new Set<string>();
  return (id: string) => {
    if (seen.has(id)) return false;
    seen.add(id);
    if (seen.size > limit) {
      const oldest = seen.values().next().value;
      if (oldest !== undefined) seen.delete(oldest);
    }
    return true;
  };
}
