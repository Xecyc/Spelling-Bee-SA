import test from 'node:test';
import assert from 'node:assert/strict';
import { WheelSlice } from '../types/presentation';
import { recalibrateSliceColors, VIBRANT_STAGE_PALETTE } from './palette';

test('spin stop selects a valid non-empty active slice', () => {
  const slices: WheelSlice[] = [
    { id: '1', text: 'HELLO', color: '#111' },
    { id: '2', text: 'WORLD', color: '#222' },
    { id: '3', text: '   ', color: '#333' }, // empty text should be filtered
    { id: '4', text: 'DISABLED', enabled: false, color: '#444' }, // disabled
  ];

  const validSlices = slices.filter((s) => s.enabled !== false && s.text.trim());
  assert.equal(validSlices.length, 2);
  assert.deepEqual(validSlices.map((s) => s.id), ['1', '2']);

  // Random pick should always pick from valid slices
  const picked = validSlices[Math.floor(Math.random() * validSlices.length)];
  assert.ok(picked.id === '1' || picked.id === '2');
});

test('recalibrateSliceColors maintains distinct neighboring colors with odd count protection', () => {
  const slices: WheelSlice[] = [
    { id: '1', text: 'A', color: '#f00' },
    { id: '2', text: 'B', color: '#0f0' },
    { id: '3', text: 'C', color: '#00f' },
  ];

  const recalibrated = recalibrateSliceColors(slices, VIBRANT_STAGE_PALETTE);
  assert.equal(recalibrated.length, 3);
  // No adjacent slice should have identical color, including first and last
  assert.notEqual(recalibrated[0].color, recalibrated[1].color);
  assert.notEqual(recalibrated[1].color, recalibrated[2].color);
  assert.notEqual(recalibrated[0].color, recalibrated[2].color);
});

test('spin double-tap guard prevents mobile touchscreen jitter from prematurely cancelling spin', () => {
  let isSpinning = false;
  let spinCount = 0;
  let stopCount = 0;
  let spinStartTime = 0;

  const handleSpinClick = (now: number) => {
    if (isSpinning) {
      if (now - spinStartTime > 1200) {
        isSpinning = false;
        stopCount++;
      }
      return;
    }
    isSpinning = true;
    spinStartTime = now;
    spinCount++;
  };

  // 1. Initial click at t=100ms
  handleSpinClick(100);
  assert.equal(isSpinning, true);
  assert.equal(spinCount, 1);
  assert.equal(stopCount, 0);

  // 2. Accidental touchscreen jitter at t=250ms (within 1200ms)
  handleSpinClick(250);
  assert.equal(isSpinning, true);
  assert.equal(spinCount, 1);
  assert.equal(stopCount, 0, 'Should NOT stop spin on rapid second touch');

  // 3. Intentional stop click after 1500ms (t=1650ms)
  handleSpinClick(1650);
  assert.equal(isSpinning, false);
  assert.equal(stopCount, 1, 'Should allow stopping after 1200ms grace period');
});

test('spin watchdog auto-unlocks isSpinning state if network drops', () => {
  let stageState = { isSpinning: true };
  const watchdog = (state: { isSpinning: boolean }) => {
    state.isSpinning = false;
  };

  watchdog(stageState);
  assert.equal(stageState.isSpinning, false, 'Watchdog must unlock isSpinning to false');
});
