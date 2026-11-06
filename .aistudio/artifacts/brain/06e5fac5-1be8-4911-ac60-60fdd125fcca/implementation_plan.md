# Salto Ángel Spelling Bee 2026 – Genially Interactive Presentation Deck & Wheel of Names

A pixel-faithful, interactive Single Page Application (SPA) emulating **Genially** and **Wheel of Names**, built directly with the exact slide graphics, layout, and visual identity provided in your images for the **Salto Ángel Elementary 2026 Spelling Bee**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The application will strictly use the design, background assets, and interface structures from the linked images:

1. **Exact Slide Graphics & Assets**:
   - **Slide 1 (Welcome & Title)**: Uses `/public/assets/aistudio/image_b5f00fc8.png` featuring the Salto Ángel emblem, 3D extruded "SPELLING BEE ELEMENTARY 2026", cartoon bees, confetti, and flags.
   - **Slide 2 (It's a Tie! Interactive Hub)**: Uses `/public/assets/aistudio/image_9aadae19.png` with 3D "It's a Tie!" text and interactive **1st**, **2nd**, and **3rd** place badges with animated hand-tap indicators that link directly to each tiebreaker wheel.
   - **Slide 3 (Live Wheel Challenge & Timer)**: Uses `/public/assets/aistudio/image_8223c65a.png` layout featuring the Salto Ángel badge, centered interactive Wheel with top needle indicator, and the exact digital stopwatch timer (`00:40` with Play and Reset buttons).
   - **Slide 4 (Celebration & Closing)**: Uses `/public/assets/aistudio/image_d2ab69fa.png` with victory banner and confetti.
2. **Genially Presentation Deck UI**:
   - Auto-hiding left and right chevron navigation buttons that reveal smoothly on hover.
   - Genially-style floating bottom presentation bar: slide counter (e.g. `1 / 4`), slide thumbnail navigation strip toggle, audio toggle, and fullscreen button.
   - Genially-style top/floating action menu with dropdown / arrow switcher allowing instant swapping between **Presentation Deck** and **Wheel Studio**.
3. **Authentic Wheel of Names Workspace (Image 1)**:
   - Header with Wheel of Names branding, "Customize", "New", "Open", "Save", "Share", "Gallery", and language controls.
   - Wheel role switcher supporting **1st Grade / 1st Place Tie**, **2nd Place Tie**, and **3rd Place Tie** via the "+ Add wheel" dropdown.
   - Right-hand panel with **Entries (up to 50)** and **Results** tabs, "Shuffle", "Sort", "Add image", individual slice hex color customization, and live wheel redraw.
4. **Countdown Stopwatch Timer (Image 3)**:
   - Exact recreation of the pill-shaped stopwatch widget: Stopwatch icon + `00:40` (configurable) + Circular Play/Pause + Circular Reset buttons.
   - Configurable auto-start on winning word selection + manual control.
5. **Sound & Confetti System**:
   - Authentic mechanical wheel clicking ticks (Web Audio synthesis, no external network dependencies).
   - Winner celebration fanfare with full-screen particle confetti.
   - Audio volume slider and mute controls accessible in both Genially presentation bar and Wheel Studio.

---

### 1. Overview & Core Concept

- **Presentation Experience (Genially Clone)**: A polished deck designed for school auditoriums, smartboards, and projection screens. The presentation transitions smoothly between slides, retains student engagement through animated bees and interactive hot-spots, and hosts the live spelling competition.
- **Wheel of Names Studio (Creator UI)**: An exact functional clone of Wheel of Names (`wheelofnames.com`) allowing teachers to curate 3 distinct tiebreaker word lists, assign colors, adjust spin duration, and test spin mechanics before or during the event.
- **Unified State**: Switching between the Wheel Studio and the Presentation Deck instantly reflects all word edits, slice color changes, and active tiebreaker selections without reloading.

---

### 2. User Experience & Visual Design

#### Slide Deck Walkthrough
1. **Slide 1 – Title Screen**:
   - High-impact visual from `image_b5f00fc8.png` with gentle floating bee micro-animations.
   - "Start Spelling Bee" primary action or right arrow navigation.
2. **Slide 2 – "It's a Tie!" Selector**:
   - The interactive fork from `image_9aadae19.png`.
   - Three 3D glossy badge buttons (`1st`, `2nd`, `3rd`) with animated Genially tap-indicator rings.
   - Clicking `1st` loads the 1st Place Tiebreaker word list and glides into the Wheel Slide. Clicking `2nd` or `3rd` loads their respective word lists and proceeds to the wheel.
3. **Slide 3 – Interactive Wheel & 40s Timer**:
   - Exact aesthetic from `image_8223c65a.png`.
   - Center physics wheel rendered in HTML5 Canvas with pastel slice palette and radial text.
   - Top pointer flipper that vibrates as slices brush past.
   - "Click to spin or press ctrl+enter" center label.
   - Below the wheel: The custom `00:40` digital stopwatch. Presenters can start, pause, or reset the countdown, and optionally have it auto-trigger when the wheel selects a word.
   - Winner popup modal with confetti, sound fanfare, and "Keep" or "Remove Word" options.
4. **Slide 4 – Finale / Closing**:
   - `image_d2ab69fa.png` celebration screen with final winner announcements.

#### Genially Interface Menus & Controls
- **Left / Right Navigation**: Subtle translucent circular arrow buttons anchored to the screen edges, vanishing when idle and brightening on hover.
- **Top Quick-Menu**: Discreet dropdown tab at top center (`Presentation Deck` ⇋ `Wheel Studio`), giving the teacher one-click access to the wheel creator without leaving fullscreen.
- **Bottom Status Bar**: Genially-style control pill with:
  - Slide pagination (`< 2 / 4 >`)
  - Overview / Thumbnail Grid modal button
  - Sound effects toggle (Mute / Unmute / Volume)
  - Fullscreen toggle (`⛶`)

---

### 3. Key Product Decisions & Trade-Offs

- **Asset Preservation**:
  - *Chosen Approach*: Directly embed and utilize the high-resolution provided slide assets (`/public/assets/aistudio/...`) as native slide backgrounds with interactive canvas and SVG overlays.
  - *Why*: Ensures 100% visual familiarity with the exact artwork created for Salto Ángel Elementary 2026.
- **Multi-Wheel Routing Logic**:
  - *Chosen Approach*: Centralized store maintaining 3 distinct wheel configs (`wheel_1st`, `wheel_2nd`, `wheel_3rd`) pre-populated with grade-appropriate spelling words and pastel colors.
  - *Why*: Allows teachers to manage tiebreakers independently without having to paste new words during a live stage event.
- **Canvas Physics & Deceleration**:
  - *Chosen Approach*: Cubic-bezier decay with variable initial impulse and flipper deflection logic.
  - *Why*: Replicates the authentic physical feel of Wheel of Names while guaranteeing the wheel always stops cleanly centered on a winning slice.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Salto Ángel Presentation Engine                       │
│  - Active View: 'presentation' | 'studio'                                   │
│  - Active Slide: 0 (Title) | 1 (Tie Hub) | 2 (Wheel + Timer) | 3 (End)      │
│  - Active Wheel ID: '1st-tie' | '2nd-tie' | '3rd-tie'                       │
│  - Persistence: LocalStorage automatic sync                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│     Genially Deck View       │              │   Wheel of Names Studio      │
│  - Auto-hide Side Chevrons   │              │  - Exact image_768f9a2e UI   │
│  - Top Mode Swapper Dropdown │              │  - Top Toolbar (New, Save...)│
│  - Bottom Genially Pill Bar  │              │  - 3 Tiebreaker Wheel Tabs   │
│  - Slide 1: Welcome Banner   │              │  - 50-Word Entries Textarea  │
│  - Slide 2: "It's a Tie!"    │              │  - Slice Hex Color Pickers   │
│    (1st, 2nd, 3rd Badges)    │              │  - Shuffle & Sort Buttons    │
│  - Slide 3: Wheel + 00:40    │              │  - Live Canvas Redraw        │
│    Stopwatch Timer (image 3) │              │  - "Return to Slides" Button │
│  - Slide 4: Podium / Outro   │              └──────────────────────────────┘
└───────────────┬──────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Shared High-DPI Canvas Wheel & Web Audio Engine             │
│  - 0 to 50 slices, dynamic radial text layout, pointer needle physics       │
│  - Realistic audio click synthesis & fanfare trumpet melodies               │
│  - 00:40 countdown stopwatch with progress ring & completion chime          │
│  - Winner pop-up modal with particle confetti animation                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### File Implementation Plan
1. `src/types/presentation.ts`: Type definitions for `WheelItem`, `WheelConfig`, `SlideData`, `TimerConfig`, and sound preferences.
2. `src/utils/audio.ts`: Synthesizer using Web Audio API for mechanical wheel tick clacks, winner trumpet fanfare, and countdown warning beeps.
3. `src/utils/defaultData.ts`: Pre-filled spelling bee tiebreaker wheels (1st, 2nd, 3rd grade tiebreakers) populated with ~30 words each and vibrant pastel colors.
4. `src/components/TopGeniallyBar.tsx`: Auto-hiding top hover dropdown allowing seamless mode swapping (`Presentation Deck ⇋ Wheel Studio`) and quick settings.
5. `src/components/BottomGeniallyBar.tsx`: Classic Genially bottom bar with slide pagination, thumbnail drawer toggle, audio controls, and fullscreen toggle.
6. `src/components/WheelCanvas.tsx`: High-performance 2D Canvas wheel matching Image 3 with top flipper, dynamic radial text, and physics-based spin mechanics.
7. `src/components/StopwatchTimer.tsx`: Pixel-accurate replica of the 00:40 stopwatch timer from Image 3 with play/pause, reset, and auto-start integration.
8. `src/components/WinnerModal.tsx`: Celebration dialog announcing the winning word with confetti burst and "Keep" / "Remove" options.
9. `src/components/WheelCreatorStudio.tsx`: Complete Wheel of Names clone (Image 1) with Entries/Results tabs, Shuffle/Sort, individual slice color pickers, and multi-wheel management.
10. `src/components/PresentationDeck.tsx`: Full-screen slide container supporting auto-hiding navigation arrows, keyboard navigation, and the interactive 1st/2nd/3rd tiebreaker badge links.
11. `src/App.tsx`: Top-level application coordinator managing active view, persistent storage, and hotkeys.
