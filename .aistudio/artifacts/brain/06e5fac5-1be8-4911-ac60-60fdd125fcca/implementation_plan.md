# Contest Presentation Deck & Top Navigation Enhancements (With Comprehensive Testing Plan)

Strict, zero-style-change implementation plan featuring automated test suites and behavioral verifications for all three updated features.

## User Review & Critical Scope Commitments

> [!IMPORTANT]
> **Strict Constraints**:
> - **Zero Style Changes**: All visual designs, colors, fonts, borders, layouts, and animations remain 100% identical.
> - **Extensive Testing Suite**: Every updated feature will be backed by automated unit tests and verified via the build compiler and linter.

- **Feature 1 (5-Second Timer Warning Beep)**:
  - Warning beep triggers exclusively when 5 seconds remain (beeping at 5, 4, 3, 2, 1).
  - Amber pulse visual indicator triggers at `<= 5` seconds.
- **Feature 2 (30-Second Elementary Default Timer & Auto-Switch)**:
  - Elementary wheels (`group: 'elementary'`) initialize and default to **30 seconds**.
  - High School wheels (`group: 'high_school'`) remain at **40 seconds**.
  - Selecting an Elementary wheel auto-switches active countdown duration to 30s; selecting a High School wheel auto-switches to 40s.
  - State broadcasts to mobile remote seamlessly.
- **Feature 3 (Top Dropdown Menu Dismissal & Auto-Hide)**:
  - Clicking the down/up chevron toggle closes the menu if open.
  - Clicking outside the menu container closes it immediately.
  - Moving the cursor away from the menu starts a **3-second** timer that auto-closes the menu upon expiration. Re-entering cancels the timer.

---

## 1. Technical Implementation Breakdown

### 1. Timer Warning Beep (StopwatchTimer.tsx)
- In the countdown interval, adjust `playTimerWarning()` condition:
  `if (prev <= 6) { audioManager.playTimerWarning(); }` (fires as the clock transitions to 5, 4, 3, 2, 1).
- Set `isWarning = secondsRemaining <= 5 && secondsRemaining > 0`.
- Zero changes to component markup or styles.

### 2. Elementary 30s Timer & Division Auto-Switch (defaultData.ts, timerSession.ts, App.tsx)
- In `src/utils/defaultData.ts`:
  Set `timerDuration: 30` for all 5 Elementary wheels (`wheel-elem-1-3-general`, `wheel-elem-1st-tb`, `wheel-elem-2nd-tb`, `wheel-elem-3rd-tb`, and 4th-6th grade general/TB).
  High school wheels retain `timerDuration: 40`.
- In `src/utils/timerSession.ts`:
  Add `getDefaultTimerForGroup(group?: string): number` returning `30` if `group === 'elementary'` and `40` otherwise.
- In `src/App.tsx`:
  When a wheel is selected in `handleSelectWheel(wheelId)`:
  Determine target duration: `selectedWheel.timerDuration || (selectedWheel.group === 'elementary' ? 30 : 40)`.
  Update `modalTimerState` with the target duration and call `setSessionTimerDuration(targetDuration)`.
  The existing `broadcastStageState` effect automatically syncs this new duration to mobile remotes.

### 3. Top Dropdown Menu Dismissal & Auto-Hide (TopGeniallyBar.tsx)
- Wrap the dropdown menu and toggle tab in a single outer ref: `containerRef = useRef<HTMLDivElement>(null)`.
- **Outside Click**:
  ```ts
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  ```
- **3-Second Auto-Hide on Mouse Leave**:
  ```ts
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearAutoHideTimer();
  };

  const handleMouseLeave = () => {
    clearAutoHideTimer();
    if (isOpen) {
      autoHideTimerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    }
  };
  ```
- **Chevron Toggle**:
  `onClick={() => { clearAutoHideTimer(); setIsOpen(!isOpen); }}` cleanly toggles open/close on click.

---

## 2. Extensive Testing & Verification Strategy

### Automated Unit & Integration Tests (Vitest / Node Test Runner)
We will add dedicated unit tests covering all new and modified behaviors:

1. **Timer Warning Threshold Test (`src/utils/timerWarning.test.ts`)**:
   - Verify warning trigger fires ONLY when seconds remaining are $\le 5$ and $> 0$.
   - Verify seconds $10, 9, 8, 7, 6$ do NOT trigger the warning beep.
   - Verify seconds $5, 4, 3, 2, 1$ DO trigger the warning beep.
   - Verify second $0$ triggers the finished alarm clock sound.

2. **Elementary vs. High School Division Timer Test (`src/utils/divisionTimer.test.ts`)**:
   - Verify all Elementary wheels in `INITIAL_WHEELS` have `timerDuration === 30`.
   - Verify all High School wheels in `INITIAL_WHEELS` have `timerDuration === 40`.
   - Verify `getDefaultTimerForGroup('elementary') === 30` and `getDefaultTimerForGroup('high_school') === 40`.
   - Verify selecting an elementary wheel dispatches `timerDuration: 30` and selecting a high school wheel dispatches `timerDuration: 40`.

3. **Menu Auto-Hide & Outside Click Logic Test (`src/utils/menuBehavior.test.ts`)**:
   - Verify outside click callback triggers when target is not within container.
   - Verify click inside container does NOT trigger close.
   - Verify timer arms for 3000ms on mouse leave and triggers close.
   - Verify mouse re-entry clears the 3000ms timer and keeps menu open.

4. **Full Test Suite & Compilation Gate**:
   - Execute `npm test` across all 55+ tests to guarantee 100% pass rate.
   - Co-execute `compile_applet` and `lint_applet` to guarantee zero TypeScript or lint errors.
