# Spelling Bee 2026: Stage Display, Mobile Remote Sync & Wheel Architecture

Comprehensive architectural specification and implementation plan for the U.E.P. Salto Ángel Spelling Bee 2026 stage roulette, presentation deck, mobile remote control, and cross-device synchronization engine.

---

## User Review & Critical Decisions

> [!NOTE]
> **Plan Mode Status**: Operational & Unblocked.
> All architectural items, remote spin commands, wall-clock fallback timers, auto-expiring server watchdog leases, and multi-route presentation decks are fully implemented and verified in the codebase.

- **Mobile Remote Command Dispatch**: When "Spin Wheel" is pressed on the mobile remote (`/remote`), the auditorium stage display immediately switches to Slide 1 (Wheel Slide), clears any open winner modal, resets previous winners, and spins the wheel.
- **Fail-Safe Spin Resolution**: Dual-track resolution using visual `requestAnimationFrame` and a deterministic wall-clock `setTimeout` (`duration + 150ms`) with `hasResolvedRef` boolean guard guarantees spins resolve cleanly even if stage laptop tabs are backgrounded or throttled.
- **Auto-Expiring Server Lease**: The server enforces an 8-second watchdog on `isSpinning: true` to prevent mobile remotes from getting stuck if a stage laptop disconnects or refreshes mid-spin.

---

## 1. Overview & Core Concept

- **Auditorium Stage Display (`/`)**:
  - Slide 0: High-impact Title Slide (Elementary vs. High School branding).
  - Slide 1: Interactive 60fps Canvas Wheel of Names with spring-loaded pointer deflection, audio ticks, and customizable countdown timer.
  - Slide 2/3: Remote-controlled Winner Podium with real-time socket relays.
- **Mobile Stage Remote (`/remote`)**:
  - Independent mobile operator interface for backstage judges and presenters.
  - Strictly separated primary "Spin Wheel" (with 2-second debounce) and secondary "Stop Spin" (Emergency Stop) buttons.
  - Live synchronized countdown timer and 1st/2nd/3rd place podium broadcaster.
- **Atomic Persistence & Sync**:
  - Atomic JSON storage (`data/wheels.json`) via `/api/wheels` for cross-device shared configuration.
  - Full client-side `localStorage` cache for instant offline boot and exportable backup JSON.

---

## 2. User Experience & Visual Design

### System Interaction Diagram

```
┌────────────────────────────────────────────────────────┐
│               MOBILE REMOTE (/remote)                  │
│  • Primary "Spin Wheel" (2s local debounce)            │
│  • Secondary "Stop Spin" (Emergency Stop)              │
│  • Live Timer controls (Start / Pause / Reset)         │
│  • Podium Publisher (1st, 2nd, 3rd place names)        │
└──────────────────────────┬─────────────────────────────┘
                           │
                  HTTP POST / Socket.IO
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             EXPRESS + SOCKET.IO SERVER                 │
│  • 8-second auto-expiring isSpinning watchdog lease    │
│  • Atomic wheels storage (/api/wheels)                 │
│  • Bidirectional stage & remote state sync             │
└──────────────────────────┬─────────────────────────────┘
                           │
                  Socket.IO / SSE Broadcast
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             STAGE AUDITORIUM DISPLAY (/)               │
│  • Slide 0: Cinematic Title Slide                      │
│  • Slide 1: Interactive WheelCanvas + Wall-Clock Timer │
│  • Slide 2: Real-time 3D Winner Podium                 │
│  • Winner Celebration Modal + Audio Fanfare            │
└────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme
- **Color Palette**: Deep stage navy (`#061a3e`, `#07152f`) with vibrant gold accents (`#FBBF24`, `#F59E0B`), high-contrast white text, and emerald/cyan slice accents.
- **Typography**: Clean, bold sans-serif (`Outfit`, `Plus Jakarta Sans`) with monospace timer numerals (`JetBrains Mono`).
- **Motion & Feedback**: Quintic ease-out wheel physics, realistic flapper tick spring-back, confetti celebrations, and smooth slide fades.

---

## 3. Key Product Decisions & Trade-Offs

- **Separated Remote Spin and Stop Buttons**:
  - *Chosen Approach*: Distinct primary "Spin Wheel" button (amber) and secondary "Stop Spin" button (red), removing toggle state.
  - *Why*: Eliminates accidental cancellation from touchscreen jitter or rapid double-taps on mobile phones.
- **Wall-Clock Fallback Timer**:
  - *Chosen Approach*: `setTimeout(finishSpin, duration + 150)` with `hasResolvedRef` guard alongside `requestAnimationFrame`.
  - *Why*: Browsers aggressively throttle `requestAnimationFrame` in background tabs or battery saver modes; the wall-clock timer guarantees spins always complete and announce winners.
- **Auto-Expiring Server Watchdog Lease**:
  - *Chosen Approach*: 8000ms server-side lease on `isSpinning: true`.
  - *Why*: Guarantees that if a stage tab closes or refreshes mid-spin, the server and mobile remotes auto-recover to idle within 8 seconds without permanent lockups.

---

## 4. Technical Architecture & Component Mapping

```
src/
├── App.tsx                     # Top-level state coordinator & remote action router
├── components/
│   ├── PresentationDeck.tsx    # Responsive 16:9 stage slide deck (Slides 0, 1, 2)
│   ├── WheelCanvas.tsx         # 60fps Canvas wheel with wall-clock fallback & audio
│   ├── RemoteControl.tsx       # Dedicated backstage mobile remote (/remote)
│   ├── WinnerModal.tsx         # Celebration modal with confetti & countdown timer
│   ├── PodiumSlide.tsx         # Real-time winner podium with first/second/third slots
│   ├── TopGeniallyBar.tsx      # Auto-hiding navigation & wheel selector
│   └── BottomGeniallyBar.tsx   # Slide index indicators & fullscreen controls
├── hooks/
│   ├── useStageSync.ts         # Unified Socket.io + HTTP fallback stage synchronization
│   └── useWheelPhysics.ts      # Spin calculation and easing models
└── store/
    └── index.ts                # Zustand centralized contest store
```

### Verification & Health
- Build: Verified with `compile_applet` (TypeScript bundle clean).
- Linter: Verified with `lint_applet` (`tsc --noEmit` passed with 0 errors).
- Server: Express + Socket.io running on port 3000 (`0.0.0.0:3000`).
