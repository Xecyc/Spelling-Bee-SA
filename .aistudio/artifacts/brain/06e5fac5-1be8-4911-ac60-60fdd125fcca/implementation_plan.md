# Architectural Audit & Production Refactoring Plan
## U.E.P. Salto Ángel Spelling Bee 2026 — Stage Roulette & Presentation System

Comprehensive Senior Staff Full-Stack Engineering audit and refactoring blueprint for high-stakes live stage event software.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions below were confirmed based on your requirements and preferences:
> - **State Management**: **Zustand** with modular slices for Wheel Data and Stage Sync to eliminate prop drilling and prevent unnecessary re-renders during 60fps canvas animations.
> - **Execution Strategy**: **Complete step-by-step audit guide with drop-in production code** provided in this blueprint before touching live files.
> - **Backend Persistence**: **Atomic JSON file writer with backup snapshots** (`.tmp` + rename pattern) to prevent data corruption during sudden power losses or auditorium server reboots.

---

## 1. Folder Structure & Separation of Concerns

### Proposed Production Folder Hierarchy

```
/
├── server/                                # Isolated Node.js backend
│   ├── index.ts                           # Express app entry & HTTP/WS server boot
│   ├── socket.ts                          # Socket.io lifecycle, rooms & presence tracking
│   ├── routes/                            # Modular Express REST endpoints
│   │   ├── wheels.ts                      # /api/wheels CRUD with atomic file persistence
│   │   ├── analyze.ts                     # /api/analyze-words (Gemini AI parsing chain)
│   │   └── health.ts                      # /api/health & /api/network-ip diagnostics
│   ├── storage/                           # File storage & persistence engine
│   │   └── atomicStore.ts                 # Atomic write (.tmp -> rename) & snapshot manager
│   └── types.ts                           # Server-side event schemas & payloads
│
├── src/                                   # Frontend React 19 SPA
│   ├── assets/                            # Static banners, crests, logos, sounds
│   ├── components/                        # UI Components
│   │   ├── stage/                         # Auditorium presentation components
│   │   │   ├── PresentationDeck.tsx       # 16:9 stage container & slide transitions
│   │   │   ├── TitleSlide.tsx             # Slide 0: Welcome banner (Elementary & HS)
│   │   │   ├── RouletteSlide.tsx          # Slide 1: Wheel canvas & digital countdown
│   │   │   └── PodiumSlide.tsx            # Slide 2: Glassmorphic winner pedestals
│   │   ├── remote/                        # Mobile & Backstage Remote Control
│   │   │   ├── RemoteControl.tsx          # Backstage winner submission & quick actions
│   │   │   └── RemoteQRCodeModal.tsx      # Dynamic QR modal with fallback links
│   │   ├── studio/                        # Wheel Creator & Management Studio
│   │   │   ├── WheelCreatorStudio.tsx     # Studio root & category selector
│   │   │   ├── WordListEditor.tsx         # Multi-word card editor & shuffle
│   │   │   ├── StudioCustomizer.tsx       # Spin physics & theme options
│   │   │   └── DocumentAnalyzerModal.tsx  # Gemini doc parser modal
│   │   ├── navigation/                    # Stage navigation toolbars
│   │   │   ├── TopGeniallyBar.tsx         # Hidden auto-reveal top controls
│   │   │   └── BottomGeniallyBar.tsx      # Slide step indicators & sound controls
│   │   └── ui/                            # Reusable Design System Primitives
│   │       ├── GlassCard.tsx              # Standardized glassmorphic container
│   │       ├── StageButton.tsx            # High-contrast auditorium button
│   │       ├── StageBadge.tsx             # Quiet unboxed metadata indicators
│   │       └── ConnectionPill.tsx         # Real-time WebSocket connection indicator
│   │
│   ├── hooks/                             # Custom React Hooks
│   │   ├── useStageSync.ts                # WebSocket & BroadcastChannel stage sync
│   │   ├── useWheelPhysics.ts             # Decoupled 60fps canvas animation hook
│   │   ├── useStageSound.ts               # Synthesized Web Audio tick & buzzer
│   │   └── useFullscreen.ts               # Projector fullscreen manager
│   │
│   ├── store/                             # Zustand Global State
│   │   ├── index.ts                       # Unified contest store
│   │   ├── wheelSlice.ts                  # Wheels list, active wheel, CRUD, persistence
│   │   ├── stageSlice.ts                  # Current slide, mode, presentation state
│   │   └── syncSlice.ts                   # WebSocket status, winners payload, heartbeats
│   │
│   ├── utils/                             # Pure business logic & algorithms
│   │   ├── canvas/                        # High-DPI Canvas 2D math & rendering
│   │   │   ├── wheelRenderer.ts           # Pure 2D slice & peg drawing routines
│   │   │   └── easing.ts                  # Quintic deceleration physics
│   │   ├── audio.ts                       # Web Audio API engine
│   │   ├── defaultData.ts                 # Initial factory contest wheels & words
│   │   └── urlHelper.ts                   # Universal origin & base path resolution
│   │
│   ├── types/                             # TypeScript type contracts
│   │   ├── contest.ts                     # Wheels, slices, categories, timers
│   │   ├── events.ts                      # Socket.io & BroadcastChannel typed events
│   │   └── presentation.ts                # Slide indices, sound settings, winners
│   │
│   ├── App.tsx                            # Root view router & orchestrator
│   ├── main.tsx                           # React DOM mount point
│   └── index.css                          # Tailwind CSS & design tokens
│
├── data/                                  # Persistent JSON data
│   ├── wheels.json                        # Active contest wheels database
│   └── wheels.backup.json                 # Automatic fallback snapshot
├── public/                                # Static build assets (404.html, .nojekyll)
├── vite.config.ts                         # Multi-route static bundling & aliasing
├── tsconfig.json                          # TypeScript configuration
└── package.json                           # Dependencies & scripts
```

### Decoupling Rules & Component Ownership
1. **Socket.io Client**: Encapsulated strictly inside `src/hooks/useStageSync.ts` and bound to the Zustand `syncSlice`. Individual UI components never import `socket.io-client` directly.
2. **Canvas Physics Engine**: Isolated inside `src/utils/canvas/` as pure, testable mathematical functions. `WheelCanvas.tsx` becomes a thin React wrapper with an internal mutable ref that avoids triggering React re-renders during the 60fps spin.
3. **Express API Routes**: Organized under `/server/routes/` with explicit input sanitization and unified error middlewares.

---

## 2. Custom Hooks & State Management (Zustand & `useStageSync`)

### Zustand Store (`src/store/index.ts`)
Combines `wheelSlice`, `stageSlice`, and `syncSlice` into a single, high-performance store with zero prop-drilling:

```typescript
// src/store/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createWheelSlice, WheelSlice } from './wheelSlice';
import { createStageSlice, StageSlice } from './stageSlice';
import { createSyncSlice, SyncSlice } from './syncSlice';

export type ContestStore = WheelSlice & StageSlice & SyncSlice;

export const useContestStore = create<ContestStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createWheelSlice(...a),
        ...createStageSlice(...a),
        ...createSyncSlice(...a),
      }),
      {
        name: 'salto-angel-contest-store',
        partialize: (state) => ({
          wheels: state.wheels,
          activeWheelId: state.activeWheelId,
          soundSettings: state.soundSettings,
        }),
      }
    )
  )
);
```

### Centralized `useStageSync` Hook (`src/hooks/useStageSync.ts`)
Centralizes WebSocket lifecycle, BroadcastChannel cross-tab mirroring, heartbeats, and clean teardown:

```typescript
// src/hooks/useStageSync.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useContestStore } from '../store';
import { WinnersPayload } from '../types/events';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    socketInstance = io(origin, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  }
  return socketInstance;
}

export function useStageSync() {
  const socket = getSocket();
  const setIsConnected = useContestStore((s) => s.setIsConnected);
  const setLatency = useContestStore((s) => s.setLatency);
  const setWinnersData = useContestStore((s) => s.setWinnersData);
  const setCurrentSlide = useContestStore((s) => s.setCurrentSlide);
  const isRemoteRoute = useContestStore((s) => s.isRemoteRoute);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // 1. Initialize persistent BroadcastChannel for static GitHub Pages / cross-tab fallback
    if (typeof BroadcastChannel !== 'undefined' && !broadcastChannelRef.current) {
      const channel = new BroadcastChannel('salto_angel_podium_channel');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'show_winners' && event.data?.payload) {
          if (!isRemoteRoute) {
            setWinnersData(event.data.payload);
            setCurrentSlide(2);
          }
        } else if (event.data?.type === 'clear_board') {
          if (!isRemoteRoute) {
            setWinnersData(null);
            setCurrentSlide(1);
          }
        }
      };
    }

    // 2. Socket Event Listeners
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onConnectError = () => setIsConnected(false);

    const onShowWinners = (payload: WinnersPayload) => {
      // Remote operators stay in controls; TV audience switches to Podium
      if (!isRemoteRoute) {
        setWinnersData(payload);
        setCurrentSlide(2);
      }
    };

    const onHideWinners = () => {
      if (!isRemoteRoute) {
        setWinnersData(null);
        setCurrentSlide(1);
      }
    };

    // Ping / Heartbeat monitor
    const onPong = (startTime: number) => {
      setLatency(Date.now() - startTime);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('show_winners', onShowWinners);
    socket.on('hide_winners', onHideWinners);
    socket.on('pong', onPong);

    // Initial state reflection
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('show_winners', onShowWinners);
      socket.off('hide_winners', onHideWinners);
      socket.off('pong', onPong);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [isRemoteRoute, setCurrentSlide, setIsConnected, setLatency, setWinnersData, socket]);

  const pushWinners = (payload: WinnersPayload) => {
    socket.emit('push_winners', payload);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'show_winners', payload });
    }
    try {
      localStorage.setItem(
        'salto_angel_remote_winners',
        JSON.stringify({ type: 'show_winners', payload, ts: Date.now() })
      );
    } catch {}
  };

  const clearBoard = () => {
    socket.emit('clear_board');
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'clear_board' });
    }
    try {
      localStorage.setItem(
        'salto_angel_remote_winners',
        JSON.stringify({ type: 'clear_board', ts: Date.now() })
      );
    } catch {}
  };

  return { pushWinners, clearBoard };
}
```

---

## 3. Redundancy & DRY UI Design System

### Standardized Primitive Components

#### `src/components/ui/GlassCard.tsx`
Unified, high-contrast glassmorphic panel with border glow:

```tsx
// src/components/ui/GlassCard.tsx
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'podium' | 'modal' | 'panel';
  accent?: 'gold' | 'silver' | 'bronze' | 'blue';
}

const ACCENT_STYLES = {
  gold: 'border-yellow-400/40 shadow-[0_20px_50px_rgba(250,204,21,0.15)]',
  silver: 'border-slate-300/40 shadow-[0_20px_50px_rgba(203,213,225,0.15)]',
  bronze: 'border-amber-600/40 shadow-[0_20px_50px_rgba(217,119,6,0.15)]',
  blue: 'border-blue-400/30 shadow-[0_20px_50px_rgba(30,58,138,0.3)]',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'panel',
  accent = 'blue',
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-[#061229]/85 backdrop-blur-md border rounded-2xl';
  return (
    <div
      className={`${baseClasses} ${ACCENT_STYLES[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
```

#### `src/components/ui/StageButton.tsx`
Auditorium-visible button with tactile feedback:

```tsx
// src/components/ui/StageButton.tsx
import React from 'react';

interface StageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold shadow-lg',
  secondary: 'bg-white/10 text-white hover:bg-white/15 border border-white/20 font-semibold',
  danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 font-semibold',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5 font-medium',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-2xl',
};

export const StageButton: React.FC<StageButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Global Tailwind CSS Design Tokens (`src/index.css`)
Consolidate repeated Tailwind gradient and backdrop strings into clean utility classes:

```css
@import "tailwindcss";

@layer utilities {
  .stage-vignette {
    background: radial-gradient(circle at center, transparent 40%, rgba(4, 11, 26, 0.95) 100%);
  }

  .gold-plate-glow {
    box-shadow: 0 0 25px rgba(250, 204, 21, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.6);
  }

  .stage-text-championship {
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: 'Outfit', sans-serif;
  }
}
```

---

## 4. Performance & Live Event Stability (Canvas 60fps & Framer Motion)

### Decoupling HTML5 Canvas 60fps Loop
**The Problem**: Triggering `setState` inside `requestAnimationFrame` creates React reconciliation churn, dropping frames during high-speed wheel rotation.
**The Solution**: Pure mutable physics object held in a `useRef`, only calling React state on spin finish:

```typescript
// src/hooks/useWheelPhysics.ts
import { useRef, useCallback } from 'react';
import { easeOutQuint } from '../utils/canvas/easing';

export interface PhysicsState {
  angle: number;
  angularVelocity: number;
  isSpinning: boolean;
  startTime: number;
  duration: number;
  targetAngle: number;
  initialAngle: number;
}

export function useWheelPhysics(onSpinEnd: (winningIndex: number) => void) {
  const physicsRef = useRef<PhysicsState>({
    angle: 0,
    angularVelocity: 0,
    isSpinning: false,
    startTime: 0,
    duration: 6000,
    targetAngle: 0,
    initialAngle: 0,
  });

  const animFrameRef = useRef<number | null>(null);

  const startSpin = useCallback((totalSlices: number) => {
    if (physicsRef.current.isSpinning) return;

    const extraRounds = 5 + Math.floor(Math.random() * 4); // 5 to 8 full rotations
    const randomStop = Math.random() * (Math.PI * 2);
    const targetAngle = physicsRef.current.angle + (extraRounds * Math.PI * 2) + randomStop;

    physicsRef.current = {
      angle: physicsRef.current.angle % (Math.PI * 2),
      angularVelocity: 0,
      isSpinning: true,
      startTime: performance.now(),
      duration: 6500, // 6.5s smooth deceleration
      targetAngle,
      initialAngle: physicsRef.current.angle % (Math.PI * 2),
    };

    const tick = (now: number) => {
      const elapsed = now - physicsRef.current.startTime;
      const progress = Math.min(elapsed / physicsRef.current.duration, 1);
      const easedProgress = easeOutQuint(progress);

      physicsRef.current.angle =
        physicsRef.current.initialAngle +
        (physicsRef.current.targetAngle - physicsRef.current.initialAngle) * easedProgress;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        physicsRef.current.isSpinning = false;
        // Compute winning slice cleanly at finish
        const normalizedAngle = (Math.PI * 2 - (physicsRef.current.angle % (Math.PI * 2))) % (Math.PI * 2);
        const sliceAngle = (Math.PI * 2) / totalSlices;
        const winnerIndex = Math.floor(normalizedAngle / sliceAngle) % totalSlices;
        onSpinEnd(winnerIndex);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [onSpinEnd]);

  return { physicsRef, startSpin, animFrameRef };
}
```

### Pre-loaded Framer Motion Variants (Zero Layout Thrashing)
Define variants outside React components using only hardware-accelerated CSS properties (`transform: translate3d/scale`, `opacity`):

```typescript
// src/components/stage/podiumVariants.ts
import { Variants } from 'framer-motion';

export const pedestalVariants: Variants = {
  hidden: { y: 160, opacity: 0, scale: 0.95 },
  visible: (delay: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      delay,
      type: 'spring',
      stiffness: 70,
      damping: 14,
      mass: 0.9,
    },
  }),
};

export const floatingRibbonVariants: Variants = {
  hidden: { opacity: 0, y: -25, scale: 0.8 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: delay + 0.35,
      type: 'spring',
      stiffness: 90,
      damping: 12,
    },
  }),
};
```

---

## 5. Backend & Sync Reliability (`server/atomicStore.ts` & `server.ts`)

### Atomic File Writer with Backup Snapshotting
Prevents file truncation or corruption if power cuts during a contest edit:

```typescript
// server/storage/atomicStore.ts
import fs from 'fs';
import path from 'path';

export class AtomicStore<T> {
  private filePath: string;
  private tempPath: string;
  private backupPath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.tempPath = `${filePath}.tmp`;
    this.backupPath = `${filePath}.bak`;
  }

  read(fallback: T): T {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.error(`[Store] Corruption detected reading ${this.filePath}. Attempting backup restore...`, err);
      if (fs.existsSync(this.backupPath)) {
        try {
          const backupRaw = fs.readFileSync(this.backupPath, 'utf-8');
          const data = JSON.parse(backupRaw) as T;
          this.write(data); // Re-instate healthy file
          return data;
        } catch {}
      }
    }
    return fallback;
  }

  write(data: T): boolean {
    try {
      const serialized = JSON.stringify(data, null, 2);

      // 1. Write to temporary file
      fs.writeFileSync(this.tempPath, serialized, 'utf-8');

      // 2. Rotate current healthy file to backup
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupPath);
      }

      // 3. Atomically rename temp file to target
      fs.renameSync(this.tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error(`[Store] Failed atomic write to ${this.filePath}:`, err);
      if (fs.existsSync(this.tempPath)) {
        try { fs.unlinkSync(this.tempPath); } catch {}
      }
      return false;
    }
  }
}
```

### Server Refactor & Heartbeat Mechanism (`server/socket.ts`)
Adds client heartbeat tracking to immediately alert AV directors if the mobile remote loses connection:

```typescript
// server/socket.ts
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

export function setupSocketServer(httpServer: http.Server) {
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['polling', 'websocket'],
    pingTimeout: 10000,
    pingInterval: 5000,
  });

  let currentWinners: any = null;
  let isWinnersActive = false;

  io.on('connection', (socket) => {
    // Stage display presence
    socket.emit('sync_state', { isWinnersActive, currentWinners });

    // Remote ping-pong for genuine latency & health
    socket.on('ping', () => {
      socket.emit('pong', Date.now());
    });

    socket.on('push_winners', (payload) => {
      currentWinners = payload;
      isWinnersActive = true;
      io.emit('show_winners', currentWinners);
    });

    socket.on('clear_board', () => {
      currentWinners = null;
      isWinnersActive = false;
      io.emit('hide_winners');
    });
  });

  return io;
}
```

---

## 6. Bug Hunt & Top 5 Silent Bugs in Live Event Apps

| # | Silent Bug | Real-World Stage Consequence | Defensive Solution |
|---|---|---|---|
| **1** | **React 19 Strict Mode Double-Mount** | Duplicate Socket listeners fire twice, causing sound effects to double-trigger with audible acoustic echo. | Store Socket as singleton in module scope; implement explicit `socket.off()` in `useEffect` cleanup. |
| **2** | **Stale Closure in Socket Handlers** | Event listener reads initial `activeWheel` state from mount time, applying winners to the wrong grade. | Read state dynamically from Zustand's `useContestStore.getState()` or pass updater functions. |
| **3** | **Canvas Blurring on Projector Hotplug** | Projector HDMI handshake resets DPI scale, making wheel labels pixelated and unreadable. | Implement `ResizeObserver` with `window.devicePixelRatio` canvas backing-store rescaling. |
| **4** | **Browser Web Audio Autoplay Lock** | First wheel spin is silent because browser requires a user gesture before Web Audio context can play. | Lazy-resume `AudioContext.resume()` on the very first user interaction or mode change. |
| **5** | **Race Condition on Network Reconnect** | Remote button spammed during temporary Wi-Fi drop pushes multiple conflicting winner updates. | Debounce action dispatches with client-side unique operation IDs (`uuidv4`) and idempotent handling. |

### Code snippet for Bug #3: Retina Canvas Rescaling (`src/utils/canvas/dpi.ts`)
```typescript
export function setupHighDPICanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  return ctx;
}
```

---

## Technical Architecture & Event Flow

```
┌────────────────────────────────────────────────────────┐
│                   Stage AV Director                    │
│   (Mobile / Tablet Remote at https://.../?view=remote) │
└───────────────────────────┬────────────────────────────┘
                            │
               1. push_winners(payload)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Node/Express Server (Port 3000)          │
│   ┌───────────────────────┐  ┌──────────────────────┐  │
│   │ Socket.io Event Relay │  │ Atomic Store (JSON)  │  │
│   └───────────┬───────────┘  └──────────────────────┘  │
└───────────────┼────────────────────────────────────────┘
                │
                ├─────────────────────────────┐
                │ 2. Broadcast show_winners   │ (Fallback via BroadcastChannel
                ▼                             ▼  & LocalStorage on static GH Pages)
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     Main Stage Projector     │ │   Judges / Audience Screens  │
│ (Switches to Slide 2 Podium) │ │ (Switches to Slide 2 Podium) │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## Phased Execution Roadmap

- [ ] **Phase 1: Foundation & Primitives**: Create `src/components/ui/` (`GlassCard`, `StageButton`, `StageBadge`) and establish utility classes in `src/index.css`.
- [ ] **Phase 2: Global State Migration**: Install `zustand`, construct `wheelSlice`, `stageSlice`, and `syncSlice` in `src/store/`, replacing prop-drilling across `App.tsx`.
- [ ] **Phase 3: Centralized Sync Hook**: Implement `useStageSync.ts`, migrating all raw socket calls from `App.tsx`, `RemoteControl.tsx`, and `PodiumSlide.tsx`.
- [ ] **Phase 4: Backend Refactor**: Migrate `server.ts` logic into `/server` with `AtomicStore` (`.tmp` + `.bak` rotation) and heartbeat health checks.
- [ ] **Phase 5: Canvas & Animation Hardening**: Extract physics into `useWheelPhysics.ts` and apply DPI setup utility to prevent projector blur.
- [ ] **Phase 6: Verification & QA**: Run full compilation and linting suite, restart dev server, and verify multi-screen sync across slides.
