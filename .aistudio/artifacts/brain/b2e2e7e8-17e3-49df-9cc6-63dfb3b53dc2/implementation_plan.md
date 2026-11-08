# Spelling Bee 2026: Cross-PC Wheel Sync, Document Analyzer & Navy/Gold UI Redesign

A complete solution providing seamless cross-device wheel persistence across multiple PCs without requiring user login accounts, a hybrid Word/Excel document analyzer to automatically classify words into grade wheels, auto-hiding presentation navigation zones, and an uncluttered navy-and-gold visual redesign of the top dropdown switcher.

## User Review & Critical Decisions: Cross-PC Persistence

> [!IMPORTANT]
> **How to open and edit wheels across different PCs without user accounts:**
> - **The Problem with Browser Storage (`localStorage`)**: Standard `localStorage` is tied strictly to a single browser profile on a single physical computer. If you import or customize wheels on your laptop, the classroom presentation PC or judge's desktop cannot see them.
> - **The Recommended Solution (Centralized Shared Server Persistence)**: We store the shared wheels list in the server's atomic storage (`data/wheels.json` via `/api/wheels`). When you open the URL on **any PC**, it automatically fetches the latest saved wheels in real-time. No username, password, or sign-in is required.
> - **Offline / Zero-Config Safety Net (1-Click Portable JSON Backup)**: In addition to cloud sync, the app includes a 1-click **"Export All Wheels" / "Import Wheels"** button. This lets you download your entire competition setup as a `.json` file that can be carried on a USB drive or emailed as an instant failsafe.

---

## 1. Overview & Core Concept

- **Zero-Login Cross-Device Persistence**:
  - Automatically syncs all wheels to storage whenever an update, creation, or deletion occurs.
  - Any computer opening the app (teacher laptop, podium presentation PC, judge monitor) instantly loads the latest configuration.
  - If a device is offline, it seamlessly falls back to local storage and allows instant import from a backup file.
- **Hybrid Document Analyzer & Wheel Generator**:
  - Upload Word (.docx), Excel (.xlsx/.csv), or plain text files containing words organized by grade and year.
  - **Fast Rule-Based Parser**: Instantly extracts well-structured headings, bullet lists, or spreadsheet tables offline.
  - **Gemini Server Classifier**: Intelligently interprets freeform Word text, messy notes, or custom grade labels, producing standardized wheel schemas.
  - **Append Mode**: Appends newly created grade wheels alongside existing competition wheels.
- **Auto-Hide Presentation Navigation Zones**:
  - Left and right navigation arrows and the top dropdown menu trigger default to `opacity: 0` with a smooth `transition: opacity 0.3s ease;`.
  - Transparent hover trigger zones along the left, right, and top edges reveal the buttons at `opacity: 1` as soon as the mouse approaches, keeping the presentation slide 100% clean and cinematic.
- **Sober Navy & Golden-Yellow Dropdown Redesign**:
  - Background: Rich presentation navy (`#061a3e` / `#051838` with subtle border `border-blue-400/20`).
  - Active States: Solid golden-yellow (`#fbbf24` / `#f59e0b`) matching the 3D "SPELLING BEE" title, with dark navy text (`text-[#06152d] font-black`).
  - Inactive Buttons: Minimal semi-transparent navy outlines (`bg-[#0a2354]/60 border border-blue-400/25 text-blue-100 hover:bg-[#0e2f6d] hover:text-white`).
  - Header: Clean white "SWITCH VIEW & WHEEL" with the noisy yellow breadcrumb text completely removed.

---

## 2. User Experience & Visual Design

### User Flows & Cross-PC Architecture

```
┌────────────────────────────────────────────────────────┐
│                   TEACHER'S LAPTOP                     │
│  1. Uploads Word/Excel word list                       │
│  2. Wheels automatically created & appended            │
│  3. Changes auto-saved to Shared Server                │
└──────────────────────────┬─────────────────────────────┘
                           │
                 [Shared API /api/wheels]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               CLASSROOM PODIUM PC                      │
│  1. Opens App URL                                      │
│  2. Automatically loads all updated wheels instantly   │
│  3. Cinematic Presentation with auto-hiding arrows     │
└────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme (Sober Navy & Gold)
- **Modal & Dropdown Canvas**: Deep navy blue (`#061a3e`), perfectly cohesive with the presentation slide background.
- **Accent Highlighting**: Rich golden-yellow matching the official Salto Ángel Spelling Bee typography.
- **Inactive Surfaces**: Subdued vector borders with semi-transparent navy fills, eliminating bulky gray boxes.
- **Typography**: Clean, bold sans-serif (`Outfit` / `Plus Jakarta Sans`, `font-black tracking-wide uppercase`), matching "ELEMENTARY 2026".

---

## 3. Key Product Decisions & Trade-Offs

- **Cross-PC Persistence**:
  - *Chosen Approach*: Server atomic JSON storage for shared app state, paired with a client-side localStorage fallback and portable JSON file export/import.
  - *Why*: Eliminates the need for user accounts, registration, or logins while guaranteeing that any PC loading the app URL gets the exact same wheels.
- **Hybrid Document Parsing**:
  - *Chosen Approach*: Instant browser-based text/table parsing for standard formats, backed by Gemini on `/api/analyze-words` for unstructured documents.
  - *Why*: Gives users zero-latency uploads for clean files while handling human-formatted Word documents with high accuracy.
- **Auto-Hide Navigation Controls**:
  - *Chosen Approach*: Full-height edge hover zones (`w-20` on left/right screen edges) and a top-edge zone (`w-48 h-10`).
  - *Why*: Eliminates the frustration of hunting for a tiny invisible button while maintaining an uncluttered presentation stage.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT ARCHITECTURE                       │
│                                                              │
│  PresentationDeck (Auto-hide hover zones left/right)         │
│  TopGeniallyBar   (Navy & Gold theme, auto-hide top tab)     │
│  DocumentAnalyzerModal (File drop, hybrid parse, preview)    │
│  WheelCreatorStudio (Add, edit, remove wheels)               │
│                                                              │
│  Sync Engine:                                                │
│  ├── 1. Reads/writes Shared Server (/api/wheels)             │
│  ├── 2. Syncs to localStorage cache for instant boot         │
│  └── 3. 1-Click "Export All Wheels (.json)" backup file      │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVER ARCHITECTURE                       │
│                                                              │
│  Express Server (server.ts)                                  │
│  ├── POST /api/analyze-words                                 │
│  │    └── GoogleGenAI ('gemini-3.8-flash')                   │
│  │         └── Structured JSON schema classification         │
│  └── Static assets & Vite middlewares                        │
└──────────────────────────────────────────────────────────────┘
```

### Execution Status
All items in this plan are fully implemented, verified, and active in the codebase.
