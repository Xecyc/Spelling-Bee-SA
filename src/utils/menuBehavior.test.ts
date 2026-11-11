import test from 'node:test';
import assert from 'node:assert/strict';

test('click-outside detection identifies clicks outside container', () => {
  let isClosed = false;
  const mockContainer = { id: 'top-menu-container' };

  const handleClickOutside = (target: { parent?: any }) => {
    // If target is inside container, do not close
    if (target === mockContainer || target.parent === mockContainer) {
      return;
    }
    isClosed = true;
  };

  // Click inside
  handleClickOutside({ parent: mockContainer });
  assert.equal(isClosed, false, 'Click inside must not close menu');

  // Click outside
  handleClickOutside({ parent: null });
  assert.equal(isClosed, true, 'Click outside must close menu');
});

test('auto-hide timer logic: arms on leave, clears on re-entry, closes on expiration', async () => {
  let isOpen = true;
  let timerId: any = null;

  const clearTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const handleMouseLeave = (delayMs = 40) => {
    clearTimer();
    if (isOpen) {
      timerId = setTimeout(() => {
        isOpen = false;
      }, delayMs);
    }
  };

  const handleMouseEnter = () => {
    clearTimer();
  };

  // 1. Mouse leaves, but user re-enters before expiration
  handleMouseLeave(40);
  assert.ok(timerId !== null, 'Timer must be armed on leave');
  handleMouseEnter();
  assert.equal(timerId, null, 'Timer must be cleared on re-entry');
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(isOpen, true, 'Menu must remain open because user re-entered');

  // 2. Mouse leaves and timer expires
  handleMouseLeave(40);
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(isOpen, false, 'Menu must close after auto-hide timer expires');
});
