import test from 'node:test';
import assert from 'node:assert/strict';

test('timerActionSignal deduplication ignores duplicate or stale timestamps', () => {
  let executedCount = 0;
  let lastHandledTs = 0;

  function processSignal(signal: { type: string; ts: number }) {
    if (!signal || signal.ts <= lastHandledTs) return;
    lastHandledTs = signal.ts;
    executedCount++;
  }

  const signal1 = { type: 'start', ts: 1000 };
  processSignal(signal1);
  assert.equal(executedCount, 1, 'First signal should execute');

  // Re-render with same signal reference/timestamp
  processSignal(signal1);
  assert.equal(executedCount, 1, 'Duplicate signal with same timestamp should be ignored');

  // Third re-render with identical timestamp
  processSignal({ type: 'start', ts: 1000 });
  assert.equal(executedCount, 1, 'Signal with identical timestamp should be ignored');

  // Stale timestamp arrives late
  processSignal({ type: 'start', ts: 999 });
  assert.equal(executedCount, 1, 'Stale timestamp should be ignored');

  // New legitimate action with newer timestamp
  processSignal({ type: 'pause', ts: 1005 });
  assert.equal(executedCount, 2, 'New signal with advanced timestamp should execute');
});

test('stageState deduplication prevents redundant broadcasts', () => {
  let broadcastCount = 0;
  let lastBroadcastJson = '';

  function broadcastState(state: { isSpinning: boolean; winningWord: string | null; timerDuration: number }) {
    const json = JSON.stringify(state);
    if (json === lastBroadcastJson) return;
    lastBroadcastJson = json;
    broadcastCount++;
  }

  const baseState = { isSpinning: false, winningWord: 'CHAMPION', timerDuration: 40 };

  broadcastState(baseState);
  assert.equal(broadcastCount, 1, 'Initial broadcast should send');

  // Re-render with same values in new object
  broadcastState({ isSpinning: false, winningWord: 'CHAMPION', timerDuration: 40 });
  assert.equal(broadcastCount, 1, 'Identical state values should not broadcast again');

  // Change spinning state
  broadcastState({ isSpinning: true, winningWord: 'CHAMPION', timerDuration: 40 });
  assert.equal(broadcastCount, 2, 'Changed state should trigger broadcast');

  // Re-render again
  broadcastState({ isSpinning: true, winningWord: 'CHAMPION', timerDuration: 40 });
  assert.equal(broadcastCount, 2, 'Unchanged state should be ignored');
});

test('timer countdown decrements cleanly and clamps at 0', () => {
  let seconds = 3;
  let isRunning = true;
  let finishedCalled = false;

  function tick() {
    if (!isRunning) return;
    if (seconds <= 1) {
      seconds = 0;
      isRunning = false;
      finishedCalled = true;
      return;
    }
    seconds -= 1;
  }

  tick(); // 3 -> 2
  assert.equal(seconds, 2);
  assert.equal(isRunning, true);

  tick(); // 2 -> 1
  assert.equal(seconds, 1);
  assert.equal(isRunning, true);

  tick(); // 1 -> 0
  assert.equal(seconds, 0);
  assert.equal(isRunning, false);
  assert.equal(finishedCalled, true);

  tick(); // extra tick when stopped
  assert.equal(seconds, 0);
});
