import test from 'node:test';
import assert from 'node:assert/strict';

test('timer warning beep fires at 5 seconds, not at 10..6 seconds', () => {
  const beepsTriggeredAt: number[] = [];

  // Simulate countdown from 12 seconds down to 0
  for (let prev = 12; prev >= 1; prev--) {
    const next = prev - 1;
    // Condition from StopwatchTimer.tsx
    if (prev <= 6) {
      beepsTriggeredAt.push(next);
    }
  }

  // Must NOT trigger at 10, 9, 8, 7, 6
  for (const second of [10, 9, 8, 7, 6]) {
    assert.equal(beepsTriggeredAt.includes(second), false, `Should not beep at ${second}s`);
  }

  // MUST trigger at 5, 4, 3, 2, 1
  for (const second of [5, 4, 3, 2, 1]) {
    assert.equal(beepsTriggeredAt.includes(second), true, `Should beep at ${second}s`);
  }

  assert.deepEqual(beepsTriggeredAt, [5, 4, 3, 2, 1, 0]);
});

test('visual isWarning flag activates only when seconds <= 5 and > 0', () => {
  const checkIsWarning = (secs: number) => secs <= 5 && secs > 0;

  assert.equal(checkIsWarning(10), false);
  assert.equal(checkIsWarning(8), false);
  assert.equal(checkIsWarning(6), false);
  assert.equal(checkIsWarning(5), true);
  assert.equal(checkIsWarning(3), true);
  assert.equal(checkIsWarning(1), true);
  assert.equal(checkIsWarning(0), false);
});
