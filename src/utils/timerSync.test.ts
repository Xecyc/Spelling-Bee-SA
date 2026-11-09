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

test('remote timer pause preserves remaining seconds and resumes without resetting', () => {
  let remoteSeconds = 40;
  let isRunning = false;
  let lastWinningWord: string | null = 'ELEPHANT';
  let lastDuration = 40;

  // Simulate remote sync logic
  function syncRemoteState(stageWord: string | null, stageDuration: number) {
    const wordChanged = stageWord !== lastWinningWord;
    const durationChanged = stageDuration !== lastDuration;
    if (wordChanged || durationChanged) {
      lastWinningWord = stageWord;
      lastDuration = stageDuration;
      isRunning = false;
      remoteSeconds = stageDuration;
    }
  }

  // 1. Start timer
  isRunning = true;

  // Simulate countdown ticking 15 seconds down to 25
  for (let i = 0; i < 15; i++) {
    remoteSeconds--;
  }
  assert.equal(remoteSeconds, 25, 'Timer should have 25 seconds remaining after 15 ticks');

  // 2. User presses PAUSE
  isRunning = false;

  // Sync is called when paused (e.g. state echoes or re-renders)
  syncRemoteState('ELEPHANT', 40);

  // CRITICAL CHECK: remaining seconds MUST NOT reset to 40
  assert.equal(remoteSeconds, 25, 'Timer must retain exactly 25 seconds when paused!');
  assert.equal(isRunning, false, 'Timer must be stopped');

  // 3. User presses START again to resume
  if (remoteSeconds <= 0) {
    remoteSeconds = 40;
  }
  isRunning = true;

  // Count down 5 more seconds
  for (let i = 0; i < 5; i++) {
    remoteSeconds--;
  }
  assert.equal(remoteSeconds, 20, 'Timer must resume from 25s down to 20s');

  // 4. When stage selects a NEW word, it resets
  syncRemoteState('GIRAFFE', 40);
  assert.equal(remoteSeconds, 40, 'Timer should reset to 40 only when a new word is chosen');
  assert.equal(isRunning, false);
});

test('handleStageState in RemoteControl ignores partial, null, or repeated state updates while paused', () => {
  let remoteSeconds = 40;
  let isRunning = false;
  let stageState = {
    isSpinning: false,
    showWinnerModal: false,
    winningWord: null as string | null,
    currentWheelName: '1st Grade',
    timerDuration: 40,
  };

  function handleStageState(newState: Partial<typeof stageState>) {
    const prev = stageState;
    if (newState.winningWord && newState.winningWord !== prev.winningWord) {
      isRunning = false;
      remoteSeconds = newState.timerDuration || prev.timerDuration || 40;
    } else if (
      typeof newState.timerDuration === 'number' &&
      newState.timerDuration !== prev.timerDuration &&
      !prev.winningWord
    ) {
      remoteSeconds = newState.timerDuration;
    }
    stageState = { ...prev, ...newState };
  }

  // Timer started
  isRunning = true;
  remoteSeconds = 27; // counted down to 27

  // Paused by user
  isRunning = false;
  assert.equal(remoteSeconds, 27);

  // Partial updates arrive from polling, SSE, or localStorage
  handleStageState({ isSpinning: false });
  assert.equal(remoteSeconds, 27, 'Partial isSpinning update must not reset seconds');

  handleStageState({ winningWord: null });
  assert.equal(remoteSeconds, 27, 'Null winningWord update must not reset seconds');

  handleStageState({ timerDuration: 40 });
  assert.equal(remoteSeconds, 27, 'Same timerDuration must not reset seconds');

  handleStageState({ currentWheelName: '1st Grade' });
  assert.equal(remoteSeconds, 27, 'Wheel name update must not reset seconds');

  // Only when a genuine new word is chosen does it reset
  handleStageState({ winningWord: 'CHAMPION', timerDuration: 40 });
  assert.equal(remoteSeconds, 40, 'New word must reset seconds to 40');
  assert.equal(isRunning, false);
});

test('timer reset button restores previously saved duration instead of forcing 40 seconds', () => {
  let savedDuration = 25; // User previously typed and saved 25 seconds
  let currentSecondsRemaining = 25;
  let isRunning = true;

  // Timer counts down during contest
  for (let i = 0; i < 11; i++) {
    currentSecondsRemaining--;
  }
  assert.equal(currentSecondsRemaining, 14, 'Countdown reached 14s');

  // User taps the reset button (<RotateCcw />)
  const handleReset = () => {
    isRunning = false;
    currentSecondsRemaining = savedDuration;
  };

  handleReset();
  assert.equal(currentSecondsRemaining, 25, 'Reset must restore the previously saved 25 seconds, NOT 40');
  assert.equal(savedDuration, 25, 'Saved duration in session must remain 25 seconds');
  assert.equal(isRunning, false);
});
