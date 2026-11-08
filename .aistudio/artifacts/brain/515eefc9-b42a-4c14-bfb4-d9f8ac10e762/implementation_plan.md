# Continuous Background Wheel Physics & True Slide Independence

Clarify and implement genuine continuous background wheel physics and total slide independence: pressing Spin on the phone will **never** force-switch the TV slide, while the wheel remains continuously running in the background so navigating to Slide 1 mid-spin shows the wheel actively spinning in real-time.

---

### Clarification & Solution to Your Question

> [!IMPORTANT]
> **Your Question**: *"If I press Spin on Remote while the TV is on the very first slide (Slide 0), and I switch to the wheel slide before the spin ends, will I see it spinning?"*
>
> **The Solution**: **YES, absolutely.**
> - **The Problem in Previous Code**: Previously, when the TV was on Slide 0, the wheel component was conditionally unmounted (`{currentSlide === 1 && <WheelCanvas />}`). Because it didn't exist in the DOM, it couldn't spin in the background and would freeze.
> - **The New Architecture**: `WheelCanvas` will remain **continuously mounted** in the slide stage across all slides (hidden behind Slide 0/2 via CSS visibility and layering, not destroyed).
> - **Result**: When you tap Spin on your phone, the physics engine starts rotating the wheel immediately in the background. If you switch to Slide 1 two seconds later, **you will see it actively spinning in real time**, decelerating smoothly, and landing on the winning slice right on schedule!
> - **Zero Forced Slide Switches**: The TV will **never** automatically change slides when Spin is pressed. The TV stays on whatever slide you put it on until you manually navigate.

---

### User Review & Critical Decisions

1. **True Slide Independence**:
   - Tapping **Spin** on the mobile remote will **never** change the TV's slide. The TV stays on Slide 0, Slide 1, or Slide 2 until explicitly changed via slide navigation buttons.
2. **Always-Running Background Canvas**:
   - `PresentationDeck` will keep all slide layers mounted, using CSS visibility (`opacity-100 z-10` vs `opacity-0 z-0 pointer-events-none`). The wheel canvas continues its physics loop uninterrupted even when hidden.
3. **Mid-Spin Navigation Visibility**:
   - If the presenter or TV navigates to Slide 1 mid-spin (e.g., 2 seconds after pressing Spin on Slide 0), the wheel is immediately visible spinning at its exact elapsed rotation angle.
4. **Clean "Stop Spin" Button**:
   - While spinning, the spin button on both mobile remote and stage switches to a clean **"Stop Spin"** state. Pressing it triggers rapid braking to halt the wheel and pick the slice.
5. **7.5s Fail-Safe Watchdog**:
   - A background safety timer guarantees that `isSpinning` will never remain stuck under any circumstances.
6. **Top Bar & Tiebreak**:
   - Untouched as instructed.

---

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CONTINUOUS BACKGROUND PHYSICS ENGINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Mobile Phone Remote]                  [Auditorium TV / Stage Display]    │
│   ┌─────────────────────┐                ┌─────────────────────────────┐    │
│   │ • Stays in Remote   │                │ • Stays on CURRENT Slide    │    │
│   │   menu (no kickout) │                │   (e.g., Slide 0 Welcome)   │    │
│   │ • Spin / Stop Spin  │                │ • WheelCanvas stays MOUNTED │    │
│   │   toggle button     │                │   and SPINS in background   │    │
│   └──────────┬──────────┘                │ • Switching to Slide 1      │    │
│              │                           │   shows it spinning LIVE!   │    │
│              │ Socket.io / Broadcast     └──────────────┬──────────────┘    │
│              └──────────────────┬───────────────────────┘                   │
│                                 ▼                                           │
│                 [Global Spin & Physics Loop]                                │
│                 - Continuously updates rotation angle                       │
│                 - 7.5s Safety Watchdog prevents freeze                      │
│                 - Instant or 0.4s quick-brake on "Stop Spin"                │
│                 - Reliable onSpinEnd resolution                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Planned File Changes

1. **`src/components/PresentationDeck.tsx`**:
   - Replace conditional rendering (`{currentSlide === 1 && ...}`) with permanent DOM mounting using CSS opacity/pointer-events transitions.
   - `WheelCanvas` remains mounted on Slide 1 at all times so background spins execute smoothly.
2. **`src/App.tsx`**:
   - Remove any forced slide changes (`setCurrentSlide(1)`) from `handleRemoteAction('spin_wheel')`.
   - Add `stop_spin` handler that halts the wheel and resolves the winning word.
   - Add a 7.5s watchdog timer that auto-resolves any lingering spin.
3. **`src/components/RemoteControl.tsx`**:
   - Keep presenter inside the remote control interface when spinning.
   - When `stageState.isSpinning` is true, spin button stays **enabled** and displays **"Stop Spin"** (solid icon, no animations).
   - Tapping "Stop Spin" triggers `stopSpin()`.
4. **`src/hooks/useStageSync.ts` & `server.ts`**:
   - Add and relay `stop_spin` event over sockets and broadcast channel.
