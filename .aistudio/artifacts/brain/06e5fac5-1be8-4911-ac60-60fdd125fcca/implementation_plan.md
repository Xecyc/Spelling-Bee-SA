# Dynamic Inline-Editable Contest Timer with Session Persistence

A targeted refactoring that replaces all hardcoded timer durations with a user-configurable, inline-editable timer that defaults to 40 seconds for all rounds (including tiebreakers), retains custom durations during the session, and preserves the exact existing visual design without adding unrequested buttons or controls.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions and behavior constraints have been confirmed with the user and will be strictly enforced during implementation:

- **Confirmed Decision 1 (Direct Inline Typing)**: The user will modify timer seconds by clicking directly on the timer numbers (`00:40`). When clicked in an idle/paused state, the digits transition into an inline numerical input styled identically to the digital readout (same font, tabular figures, color, alignment, and size). Pressing Enter or clicking outside (blur) commits the new duration.
- **Confirmed Decision 2 (Circular Reset Button Behavior)**: Clicking the existing circular reset button on the timer resets the timer duration back to the factory default of **40 seconds** and stops the timer, fulfilling the reset requirement without introducing any new buttons.
- **Confirmed Decision 3 (Unified 40-Second Default)**: All wheel definitions, tiebreakers, analyzer imports, and default datasets will initialize to **40 seconds** by default (eliminating the old 20-second hardcoded tiebreaker split).
- **Confirmed Decision 4 (Session-Level Persistence)**: When the user types a new duration (e.g., 20 seconds), it persists across wheel switches, round transitions, and modal openings for the entire browser session (`sessionStorage` / in-memory session state). Exiting the site (closing the browser tab) clears the custom duration and restores the 40-second default.
- **Confirmed Constraint (Strict Zero-Bloat & Visual Preservation)**: Zero new buttons, features, or styling alterations will be introduced. The existing Genially menus, top/bottom bars, and timer widget pill geometry will remain visually identical.

---

## 1. Overview & Core Concept

- **What It Does**: Enables contest coordinators and stage operators to type any custom countdown duration directly into the timer numbers on stage or within the winner modal. Both regular wheels and tiebreaker rounds start at 40 seconds by default.
- **Target Audience**: U.E.P. Salto Ángel Spelling Bee coordinators running live auditorium presentations and tiebreaker rounds.
- **Key Value**: Immediate flexibility to adjust timer length on the fly (e.g., speeding up tiebreakers to 15s or 20s or granting 60s for championship words) without modifying code or navigating complex settings.

---

## 2. User Experience & Visual Design

- **Default State**:
  - The timer widget displays `00:40` in its existing tabular monospace typography (`font-mono font-black text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl`).
  - No new icons, edit pencils, or auxiliary buttons are added.
- **Editing Interaction**:
  - Clicking on the timer display text toggles inline edit mode.
  - An inline numerical `<input>` appears seamlessly in place of the text with identical font sizing, line height, text color, and transparent background.
  - The input auto-focuses with the current seconds pre-selected.
  - Typing a number (e.g. `20`) and pressing `Enter`, `Tab`, or clicking outside instantly updates the timer to `00:20`.
  - Input validation clamps the value between 5 and 600 seconds, preventing negative or non-numeric values.
- **Reset Interaction**:
  - Clicking the existing circular reset button (`<RotateCcw />`) restores the timer duration to the standard 40 seconds.
- **Session Continuity**:
  - The customized timer duration is saved in session storage (`sessionStorage.getItem('salto_angel_session_timer')`).
  - Moving between Slide 1 (wheel), Slide 2/3 (podium), the Winner Modal, or switching between Elementary and High School wheels retains the custom duration.
  - Closing the browser window/tab automatically resets the session back to 40 seconds.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Inline Editing vs. Auxiliary Settings Modal**
  - *Chosen Approach*: Inline click-to-type directly on the numbers.
  - *Why*: Satisfies the user's explicit directive: *"The menu and timer should look the same. Add rules to yourself to not add any other feature, button or design choice without my consent."* It adds zero DOM clutter and zero extra buttons.
  - *Alternatives Considered*: Adding an edit button or extra dropdown (rejected as it violates the zero-feature-bloat rule).

- **Decision 2: Session Storage vs. LocalStorage**
  - *Chosen Approach*: `sessionStorage` with in-memory fallback.
  - *Why*: The user explicitly specified: *"once i modify the timer say i put 20 seconds, it will save it until i reset it or exit the entire site."* `sessionStorage` persists across refreshes and page navigation within the tab, but automatically purges when the user exits the site.
  - *Alternatives Considered*: `localStorage` (rejected because it persists even after closing the site).

- **Decision 3: Universal 40s Tiebreaker Default**
  - *Chosen Approach*: Replace all default 20s constants in `defaultData.ts`, `wheelSlice.ts`, and `DocumentAnalyzerModal.tsx` with 40s.
  - *Why*: Completely eliminates hardcoded 20-second tiebreaker overrides so the system begins from a uniform 40-second baseline across all categories.

---

## 4. Technical Architecture & Data Strategy

### System Component & Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Tab Session                       │
│  sessionStorage: 'salto_angel_session_timer' (default 40s)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
     ┌───────────────────┐           ┌───────────────────┐
     │  App State Store  │           │   Winner Modal    │
     │  (useContestStore)│           │  (Active Word)    │
     └─────────┬─────────┘           └─────────┬─────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │        StopwatchTimer         │
               │  ┌─────────────────────────┐  │
               │  │  Digital Readout (00:40)│  │
               │  │  [Click to edit inline] │  │
               │  └────────────┬────────────┘  │
               │               │               │
               │  ┌────────────▼────────────┐  │
               │  │ Circular Reset Button   │  │
               │  │ (Restores default 40s)  │  │
               │  └─────────────────────────┘  │
               └───────────────────────────────┘
```

### Data Model & State Updates

1. **Session Timer Helper (`src/utils/timerSession.ts`)**:
   - `getSessionTimerDuration(): number`: Reads from `sessionStorage`; defaults to 40.
   - `setSessionTimerDuration(secs: number): void`: Writes to `sessionStorage`.
   - `resetSessionTimerDuration(): void`: Resets `sessionStorage` entry to 40.

2. **Default Datasets (`src/utils/defaultData.ts`)**:
   - Update all `WORDS_TB_*` wheels and `INITIAL_WHEELS` configurations from `timerDuration: 20` to `timerDuration: 40`.

3. **StopwatchTimer Component (`src/components/StopwatchTimer.tsx`)**:
   - Add inline editing state: `isEditing: boolean`, `editValue: string`.
   - In idle mode, clicking the numbers opens an inline input with autofocus.
   - On blur or Enter, validate `parseInt(editValue, 10)`:
     - If valid ($5 \le \text{secs} \le 600$), update `totalSeconds`, `secondsRemaining`, update `sessionStorage`, and notify parent via `onDurationChange?.(secs)`.
   - Update `handleReset`:
     - Resets `totalSeconds` and `secondsRemaining` to the default 40 seconds.
     - Resets `sessionStorage` back to 40.

4. **Remote Relay & Sync (`src/components/RemoteControl.tsx`)**:
   - Ensure the mobile remote panel honors the dynamic session timer duration sent by the stage.
