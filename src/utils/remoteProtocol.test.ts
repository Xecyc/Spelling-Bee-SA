import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMAND_TYPES,
  createDeduper,
  makeCommandId,
  normalizeCommandType,
  sanitizeWinners,
  validatePayload,
} from './remoteProtocol.ts';

test('every button on the phone maps to a known command type', () => {
  for (const type of [
    'spin_wheel', 'stop_spin', 'start_timer', 'pause_timer', 'reset_timer',
    'remove_word', 'close_modal', 'push_winners', 'clear_board',
  ]) {
    assert.ok((COMMAND_TYPES as readonly string[]).includes(type), type);
  }
});

test('legacy aliases are normalized and unknown types are rejected', () => {
  assert.equal(normalizeCommandType('stop_timer'), 'pause_timer');
  assert.equal(normalizeCommandType('clear_winners'), 'clear_board');
  assert.equal(normalizeCommandType('spin_wheel'), 'spin_wheel');
  assert.equal(normalizeCommandType('rm -rf'), null);
  assert.equal(normalizeCommandType(42), null);
  assert.equal(normalizeCommandType(undefined), null);
});

test('podium names are trimmed, capped and never non-strings', () => {
  assert.deepEqual(sanitizeWinners({ first: '  Sofia Rodriguez ', second: 'Mateo', third: 7, extra: 'x' }), {
    first: 'Sofia Rodriguez',
    second: 'Mateo',
    third: '',
  });
  assert.equal(sanitizeWinners({ first: 'x'.repeat(500) }).first.length, 80);
  assert.deepEqual(sanitizeWinners(null), { first: '', second: '', third: '' });
});

test('set_slide only accepts integer slides 0..3', () => {
  assert.equal(validatePayload('set_slide', 2).ok, true);
  assert.equal(validatePayload('set_slide', 4).ok, false);
  assert.equal(validatePayload('set_slide', -1).ok, false);
  assert.equal(validatePayload('set_slide', 1.5).ok, false);
  assert.equal(validatePayload('set_slide', '2').ok, false);
});

test('set_timer_duration accepts integer seconds between 5 and 600', () => {
  assert.equal(validatePayload('set_timer_duration', 20).ok, true);
  assert.equal(validatePayload('set_timer_duration', 40).ok, true);
  assert.equal(validatePayload('set_timer_duration', 4).ok, false);
  assert.equal(validatePayload('set_timer_duration', 601).ok, false);
  assert.equal(validatePayload('set_timer_duration', '20').ok, false);
});

test('deduper accepts an id once and forgets only the oldest ids', () => {
  const firstTime = createDeduper(3);
  assert.equal(firstTime('a'), true);
  assert.equal(firstTime('a'), false);
  firstTime('b'); firstTime('c'); firstTime('d'); // 'a' falls out of the window
  assert.equal(firstTime('d'), false);
  assert.equal(firstTime('a'), true);
});

test('command ids are unique even without crypto.randomUUID (plain http on a phone)', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
  try {
    const ids = new Set(Array.from({ length: 5000 }, () => makeCommandId()));
    assert.equal(ids.size, 5000);
    assert.ok([...ids].every((id) => id.length > 8 && id.length <= 100));
  } finally {
    if (original) Object.defineProperty(globalThis, 'crypto', original);
  }
});
