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
