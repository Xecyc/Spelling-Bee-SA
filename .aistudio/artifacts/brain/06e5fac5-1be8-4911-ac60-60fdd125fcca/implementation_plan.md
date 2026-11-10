# Remote Slides Controls Accordion, Live Slide Sync & Stage Fullscreen

Implementation plan to transition the slide navigation controls from a floating pill into a dedicated accordion dropdown menu on the Stage Remote (positioned between Roulette and Podium), fix the slide counter numbers with optimistic local state and bidirectional stage synchronization, and route the fullscreen control directly to the stage display screen.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Accordion Placement**: Positioned in the middle, directly between **Roulette & Timer Controls** and **Podium Menu**.
> - **Initial State**: Collapsed by default on screen load (Roulette Controls remains open by default).
> - **Stage Fullscreen Command**: The fullscreen toggle button sends a new `toggle_fullscreen` command to the stage display PC/projector, rather than toggling fullscreen on the operator's phone.
> - **Live Slide Number Sync**: Optimistic local state updates paired with server state reconciliation ensure that `<` and `>` update the slide counter (`1 / 3`, `2 / 3`, `3 / 3`) instantaneously on the remote without getting stuck.

---

## 1. Overview & Core Concept

1. **Integrated Slides Controls Accordion**:
   - Replaces the bottom floating pill with an accordion section matching the visual design of the other remote panels (`#1a1d24` card with `#20242d` toggle header).
   - Displays the current slide badge directly in the header (e.g. `Slide 2 / 3: Roulette Wheel`) so the operator can monitor stage progress even when the menu is collapsed.

2. **Instant & Authoritative Slide Synchronization**:
   - Resolves the frozen slide counter bug by maintaining an optimistic local slide index on the remote, updating `< 1 / 3 >` on tap, and reconciling with the stage snapshot.
   - In the stage app, `currentSlide` state changes trigger an immediate broadcast across all active clients.

3. **Remote Stage Fullscreen Controller**:
   - Adds a `toggle_fullscreen` protocol action. When tapped on the phone remote, it commands the auditorium stage PC to toggle full-screen mode, eliminating the need for an operator to walk over to the stage keyboard.

---

## 2. User Experience & Visual Design

### A. Remote Menu Structure (Top to Bottom)
1. **Stage Remote Header**: Connection status pill, latency indicator, active wheel title.
2. **Dropdown 1: Roulette & Timer Controls** (Open by default):
   - Primary `Spin Wheel` & `Stop Spin` buttons.
   - Winning Word & Countdown Timer Card with inline click-to-edit duration, `Pause Timer`, `Start timer`, and saved-duration reset.
3. **Dropdown 2: Slides Controls** (NEW - Collapsed by default):
   - **Accordion Header**: `Presentation` icon, `Slides Controls` label, dynamic slide badge (`Slide 2 / 3: Roulette Wheel`), and chevron arrow.
   - **Expanded Content**:
     - Genially-styled slide navigation pill: `<` (prev), `[1 / 3]` counter, `>` (next), vertical divider, `[Grid]` thumbnail toggle, `[Volume]` audio mute toggle, and `[Stage Fullscreen]` expand toggle.
     - Quick-Jump Slide Buttons:
       - `1. Welcome / Cover`
       - `2. Roulette Wheel`
       - `3. Winner Podium`
4. **Dropdown 3: Podium Menu** (Collapsed by default):
   - 1st, 2nd, and 3rd place input fields.
   - `Clear Board` and `Push to Stage` buttons.
5. **Footer**:
   - Backstage return / `Open Stage Display` link with comfortable bottom padding (no overlapping floating bars).

---

## 3. Technical Architecture & Protocol Extension

```
┌─────────────────────────────────────────────────────────────┐
│                    Stage Remote (Phone)                     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [1] Roulette & Timer Controls (Expanded)            │   │
│   └─────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [2] Slides Controls (Collapsed by default)          │   │
│   │     - < 1 / 3 > (Optimistic instant counter)        │   │
│   │     - Quick Slide Select: Cover | Wheel | Podium    │   │
│   │     - Stage Fullscreen & Mute Buttons               │   │
│   └──────────────────────────┬──────────────────────────┘   │
│   ┌──────────────────────────┼──────────────────────────┐   │
│   │ [3] Podium Menu          │                          │   │
│   └──────────────────────────┼──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │ Commands:
                               │  - set_slide (0, 1, 2)
                               │  - toggle_fullscreen
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Stage Auditorium Screen                   │
│                                                             │
│   1. Switches active presentation slide (0, 1, 2)           │
│   2. Toggles browser Fullscreen API on projector screen     │
│   3. Broadcasts updated currentSlide & isFullscreen back    │
└─────────────────────────────────────────────────────────────┘
```

### Protocol Updates:
- Add `toggle_fullscreen` to `COMMAND_TYPES` in `src/utils/remoteProtocol.ts`.
- Add `toggleFullscreen()` callback to `useStageSync.ts`.
- In `App.tsx`:
  - Handle `case 'toggle_fullscreen'` to invoke document fullscreen requests on the stage.
  - Broadcast `currentSlide` and `isFullscreen` in `StageSyncState`.

---

## 4. Verification & Testing Plan

1. **Slide Counter Responsiveness**:
   - Open remote, tap `<` and `>` in the Slides Controls dropdown.
   - Verify the numbers immediately cycle `1 / 3` $\leftrightarrow$ `2 / 3` $\leftrightarrow$ `3 / 3` without delay or freezing.
2. **Stage Display Slide Navigation**:
   - Verify the auditorium screen transitions between Slide 1 (Cover), Slide 2 (Roulette), and Slide 3 (Podium) in perfect synchronization.
3. **Stage Fullscreen Verification**:
   - Tap the fullscreen icon on the remote; verify the stage PC display enters/exits fullscreen mode without altering the phone screen.
4. **Layout & Accordion Interaction**:
   - Verify Slides Controls resides neatly between Roulette and Podium.
   - Verify smooth expand/collapse animations and clean padding without floating clutter.
5. **Automated Suite**:
   - Run `compile_applet` and `lint_applet` together.
   - Run `npm test` to verify all protocol and relay tests pass.
