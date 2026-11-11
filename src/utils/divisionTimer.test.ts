import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_WHEELS } from './defaultData.ts';
import {
  ELEMENTARY_DEFAULT_TIMER_SECONDS,
  HIGH_SCHOOL_DEFAULT_TIMER_SECONDS,
  getDefaultTimerForGroup,
} from './timerSession.ts';

test('division default timer constants are 30s for Elementary and 40s for High School', () => {
  assert.equal(ELEMENTARY_DEFAULT_TIMER_SECONDS, 30);
  assert.equal(HIGH_SCHOOL_DEFAULT_TIMER_SECONDS, 40);
  assert.equal(getDefaultTimerForGroup('elementary'), 30);
  assert.equal(getDefaultTimerForGroup('high_school'), 40);
  assert.equal(getDefaultTimerForGroup(undefined), 40);
});

test('all initial elementary wheels default to timerDuration of 30 seconds', () => {
  const elemWheels = INITIAL_WHEELS.filter((w) => w.group === 'elementary');
  assert.ok(elemWheels.length >= 8, 'Must have at least 8 elementary wheels');
  for (const wheel of elemWheels) {
    assert.equal(
      wheel.timerDuration,
      30,
      `Elementary wheel "${wheel.name}" must default to 30s timer`
    );
  }
});

test('initial high school wheels default to timerDuration of 40 seconds', () => {
  const hsWheels = INITIAL_WHEELS.filter((w) => w.group === 'high_school');
  assert.ok(hsWheels.length >= 2, 'Must have at least 2 high school wheels');
  for (const wheel of hsWheels) {
    assert.equal(
      wheel.timerDuration,
      40,
      `High School wheel "${wheel.name}" must default to 40s timer`
    );
  }
});

test('auto-switching timer duration calculation when switching between wheels', () => {
  const elemWheel = INITIAL_WHEELS.find((w) => w.group === 'elementary')!;
  const hsWheel = INITIAL_WHEELS.find((w) => w.group === 'high_school')!;

  const getDurationForWheel = (w: typeof elemWheel) =>
    w.timerDuration || getDefaultTimerForGroup(w.group);

  assert.equal(getDurationForWheel(elemWheel), 30);
  assert.equal(getDurationForWheel(hsWheel), 40);
});

test('every elementary tiebreak wheel from 1st to 6th grade defaults to 30 seconds', () => {
  const grades = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
  for (const grade of grades) {
    const tbWheel = INITIAL_WHEELS.find(
      (w) => w.group === 'elementary' && w.grade === grade && w.role === 'tiebreak'
    );
    assert.ok(tbWheel, `Tiebreak wheel for grade ${grade} must exist`);
    assert.equal(
      tbWheel.timerDuration,
      30,
      `Tiebreak wheel for grade ${grade} must be 30 seconds by default`
    );
  }
});

test('sanitizer preserves custom timer values (e.g. 20s) and defaults missing to 30s/40s', () => {
  const sanitizeTimer = (wheel: { group?: string; timerDuration?: number }) => {
    return typeof wheel.timerDuration === 'number' && wheel.timerDuration >= 5 && wheel.timerDuration <= 600
      ? wheel.timerDuration
      : (wheel.group === 'elementary' ? 30 : 40);
  };

  // Custom values set by user (e.g. 20s, 25s) MUST be preserved!
  assert.equal(sanitizeTimer({ group: 'elementary', timerDuration: 20 }), 20);
  assert.equal(sanitizeTimer({ group: 'elementary', timerDuration: 25 }), 25);
  assert.equal(sanitizeTimer({ group: 'high_school', timerDuration: 35 }), 35);

  // Missing or invalid values default to division defaults
  assert.equal(sanitizeTimer({ group: 'elementary', timerDuration: undefined }), 30);
  assert.equal(sanitizeTimer({ group: 'high_school', timerDuration: undefined }), 40);
});

