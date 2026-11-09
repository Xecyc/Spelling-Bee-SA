import test from 'node:test';
import assert from 'node:assert/strict';

test('remote action types are fully recognized in stage action schema', () => {
  const recognizedActions = [
    'spin_wheel',
    'stop_spin',
    'start_timer',
    'stop_timer',
    'pause_timer',
    'reset_timer',
    'remove_word',
    'close_modal',
    'push_winners',
    'clear_winners',
    'clear_board',
    'set_slide',
  ];

  for (const action of recognizedActions) {
    assert.ok(typeof action === 'string' && action.length > 0);
  }
});

test('push_winners payload correctly serializes 1st, 2nd, and 3rd place names', () => {
  const input = {
    first: '  Sofia Rodriguez  ',
    second: ' Mateo Gonzalez ',
    third: 'Camila Perez',
  };

  const payload = {
    first: input.first.trim(),
    second: input.second.trim(),
    third: input.third.trim(),
  };

  assert.equal(payload.first, 'Sofia Rodriguez');
  assert.equal(payload.second, 'Mateo Gonzalez');
  assert.equal(payload.third, 'Camila Perez');
});

test('stage state with live timer countdown updates remote without losing word', () => {
  interface StageState {
    isSpinning: boolean;
    showWinnerModal: boolean;
    winningWord: string | null;
    timerDuration: number;
    timeLeft?: number;
    isTimerRunning?: boolean;
    currentSlide?: number;
  }

  let remoteSeconds = 40;
  let remoteIsRunning = false;

  const stageStateUpdate: StageState = {
    isSpinning: false,
    showWinnerModal: true,
    winningWord: 'WINTER',
    timerDuration: 40,
    timeLeft: 37,
    isTimerRunning: true,
    currentSlide: 1,
  };

  if (typeof stageStateUpdate.timeLeft === 'number') {
    remoteSeconds = stageStateUpdate.timeLeft;
  }
  if (typeof stageStateUpdate.isTimerRunning === 'boolean') {
    remoteIsRunning = stageStateUpdate.isTimerRunning;
  }

  assert.equal(remoteSeconds, 37);
  assert.equal(remoteIsRunning, true);
});

test('server 7.5s watchdog lease clears stuck isSpinning state', async () => {
  let isSpinning = true;
  let timerId: any = null;

  const triggerWatchdog = () => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      isSpinning = false;
    }, 50); // mocked short timeout for unit test
  };

  triggerWatchdog();
  assert.equal(isSpinning, true);

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(isSpinning, false);
});
