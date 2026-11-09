import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelay } from './relay.ts';

test('accepted commands get increasing seq numbers', () => {
  const relay = createRelay();
  const a = relay.publish({ id: 'a', type: 'spin_wheel' });
  const b = relay.publish({ id: 'b', type: 'start_timer' });
  assert.ok(a.ok && b.ok);
  if (a.ok && b.ok) {
    assert.equal(a.command.seq, 1);
    assert.equal(b.command.seq, 2);
    assert.equal(a.duplicate, false);
  }
  assert.equal(relay.latestSeq(), 2);
});

test('the same id is acknowledged but never accepted twice', () => {
  const relay = createRelay();
  relay.publish({ id: 'tap-1', type: 'spin_wheel' });
  const again = relay.publish({ id: 'tap-1', type: 'spin_wheel' });
  assert.ok(again.ok);
  if (again.ok) {
    assert.equal(again.duplicate, true);
    assert.equal(again.command.seq, 1);
  }
  assert.equal(relay.latestSeq(), 1);
  assert.equal(relay.since(0).length, 1);
});

test('legacy action names are accepted; garbage is rejected', () => {
  const relay = createRelay();
  const stop = relay.publish({ type: 'stop_timer' });
  assert.ok(stop.ok && stop.command.type === 'pause_timer');
  assert.equal(relay.publish({ type: 'launch_missiles' }).ok, false);
  assert.equal(relay.publish(null).ok, false);
  assert.equal(relay.publish({ type: 'set_slide', payload: 99 }).ok, false);
});

test('commands without an id still get a server id', () => {
  const relay = createRelay();
  const r = relay.publish({ type: 'spin_wheel' });
  assert.ok(r.ok && r.command.id.length > 0);
});

test('since() returns only newer commands and history is bounded', () => {
  const relay = createRelay({ historyLimit: 5 });
  for (let i = 0; i < 12; i++) relay.publish({ id: `c${i}`, type: 'spin_wheel' });
  assert.equal(relay.since(0).length, 5);
  assert.deepEqual(relay.since(10).map((c) => c.seq), [11, 12]);
  assert.equal(relay.since(12).length, 0);
  // an id that fell out of the window can be accepted again (bounded memory)
  const old = relay.publish({ id: 'c0', type: 'spin_wheel' });
  assert.ok(old.ok && old.duplicate === false);
});

test('podium names are remembered for late joiners until the board is cleared', () => {
  const relay = createRelay();
  assert.equal(relay.getWinners(), null);
  relay.publish({ type: 'push_winners', payload: { first: ' Sofia ', second: 'Mateo', third: 'Camila' } });
  assert.deepEqual(relay.getWinners(), { first: 'Sofia', second: 'Mateo', third: 'Camila' });
  relay.publish({ type: 'clear_winners' });
  assert.equal(relay.getWinners(), null);
});

test('stage snapshots report whether anything actually changed', () => {
  const relay = createRelay();
  assert.equal(relay.setStageState({ timeLeft: 40 }), true);
  assert.equal(relay.setStageState({ timeLeft: 40 }), false);
  assert.equal(relay.setStageState({ timeLeft: 39 }), true);
  assert.deepEqual(relay.getStageState(), { timeLeft: 39 });
  assert.equal(relay.setStageState(null), false);
  assert.equal(relay.setStageState([1, 2]), false);
  assert.equal(relay.setStageState({ blob: 'x'.repeat(30_000) }), false);
});
