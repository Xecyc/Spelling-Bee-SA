import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WheelConfig,
  WheelSlice,
  WheelRole,
  PresentationSlideId,
  SoundSettings,
  WinnersData,
} from './types/presentation';
import { INITIAL_WHEELS, PASTEL_PALETTE } from './utils/defaultData';
import {
  VIBRANT_STAGE_PALETTE,
  CHAMPIONSHIP_PALETTE,
  recalibrateSliceColors,
} from './utils/palette.ts';
import { audioManager } from './utils/audio';
import { PresentationDeck } from './components/PresentationDeck';
import { WheelCreatorStudio } from './components/WheelCreatorStudio';
import { TopGeniallyBar } from './components/TopGeniallyBar';
import { BottomGeniallyBar } from './components/BottomGeniallyBar';
import { WinnerModal, TimerActionSignal } from './components/WinnerModal';
import { DocumentAnalyzerModal } from './components/DocumentAnalyzerModal';
import { RemoteControl } from './components/RemoteControl';
import { RemoteQRCodeModal } from './components/RemoteQRCodeModal';
import { useContestStore } from './store';
import { useStageSync } from './hooks/useStageSync';
import {
  getSessionTimerDuration,
  setSessionTimerDuration,
  resetSessionTimerDuration,
  DEFAULT_TIMER_SECONDS,
  getDefaultTimerForGroup,
} from './utils/timerSession';

const sanitizeWheel = (wheel: WheelConfig): WheelConfig => {
  const palette = (wheel.group === 'high_school' && wheel.place === 'championship')
    ? CHAMPIONSHIP_PALETTE
    : VIBRANT_STAGE_PALETTE;
  const timerDuration = typeof wheel.timerDuration === 'number' && wheel.timerDuration >= 5 && wheel.timerDuration <= 600
    ? wheel.timerDuration
    : (wheel.group === 'elementary' ? 30 : 40);
  return {
    ...wheel,
    timerDuration,
    slices: recalibrateSliceColors(wheel.slices, palette),
  };
};

const SLIDE_TITLES = [
  'Welcome & Title',
  'Interactive Wheel & Timer',
  'Winner Podium',
];

function checkIsRemotePath(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  const s = window.location.search.toLowerCase();
  const h = window.location.hash.toLowerCase();
  return (
    p.endsWith('/remote') ||
    p.includes('/remote/') ||
    s.includes('view=remote') ||
    s.includes('remote=true') ||
    s.includes('remote=1') ||
    s.includes('p=/remote') ||
    h.includes('remote')
  );
}

export default function App() {
  // Unified Contest Store
  const currentMode = useContestStore((s) => s.currentMode);
  const setCurrentMode = useContestStore((s) => s.setCurrentMode);
  const currentSlide = useContestStore((s) => s.currentSlide);
  const setCurrentSlide = useContestStore((s) => s.setCurrentSlide);
  const winnersData = useContestStore((s) => s.winnersData);
  const setWinnersData = useContestStore((s) => s.setWinnersData);
  const isRemoteRoute = useContestStore((s) => s.isRemoteRoute);
  const setIsRemoteRoute = useContestStore((s) => s.setIsRemoteRoute);
  const contestLanguage = useContestStore((s) => s.contestLanguage);
  const setContestLanguage = useContestStore((s) => s.setContestLanguage);

  // Wheels state with localStorage persistence (sanitized for balanced palette & 30s elementary timer)
  const [wheels, setWheels] = useState<WheelConfig[]>(() => {
    try {
      // Clear previous versions
      localStorage.removeItem('salto_angel_wheels_2026_v8');
      localStorage.removeItem('salto_angel_wheels_2026_v7');
      localStorage.removeItem('salto_angel_wheels_2026_v6');
      localStorage.removeItem('salto_angel_wheels_2026_v4');
      const saved = localStorage.getItem('salto_angel_wheels_2026_v9');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 10 &&
          parsed.some((w) => w.group === 'high_school')
        ) {
          const hasSpanish = parsed.some((w) => w.language === 'es' || w.id === 'wheel-spanish-elem-1-6');
          const fullList = (hasSpanish ? parsed : [INITIAL_WHEELS[0], ...parsed]).map((w) => {
            if ((w.id === 'wheel-spanish-elem-1-6' || w.language === 'es') && w.name.includes('1° a 6°')) {
              return { ...w, name: 'Primaria (4to a 6to Grado)' };
            }
            return w;
          });
          return fullList.map(sanitizeWheel);
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_WHEELS.map(sanitizeWheel);
  });

  // Active wheel id (defaults to Spanish elementary wheel)
  const [activeWheelId, setActiveWheelId] = useState<string>(() => {
    return INITIAL_WHEELS[0].id;
  });

  // Sound settings with localStorage persistence
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    try {
      const saved = localStorage.getItem('salto_angel_sound_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return {
      enabled: true,
      volume: 0.8,
      tickSound: 'click',
      fanfare: 'trumpet',
      announceWinnerVoice: true,
    };
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Keep route synced on back/forward browser navigation or pushState/hashchange
  useEffect(() => {
    setIsRemoteRoute(checkIsRemotePath());
    const handleUrlChange = () => {
      setIsRemoteRoute(checkIsRemotePath());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [setIsRemoteRoute]);

  const [showRemoteModal, setShowRemoteModal] = useState<boolean>(false);

  // Wheel spin state
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [winningSlice, setWinningSlice] = useState<WheelSlice | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [remoteTimerSignal, setRemoteTimerSignal] = useState<TimerActionSignal | null>(null);
  const [showDocumentAnalyzer, setShowDocumentAnalyzer] = useState(false);
  const [modalTimerState, setModalTimerState] = useState<{
    timeLeft: number;
    isRunning: boolean;
  }>(() => {
    const initialDuration = INITIAL_WHEELS[0]?.timerDuration || 30;
    return {
      timeLeft: getSessionTimerDuration(initialDuration),
      isRunning: false,
    };
  });
  const [podiumAnimationKey, setPodiumAnimationKey] = useState<number>(Date.now());

  // Load shared wheels from server on mount (syncs across multiple PCs)
  useEffect(() => {
    if (isRemoteRoute) return;
    fetch('/api/wheels')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.wheels) && data.wheels.length > 0) {
          const sanitized = data.wheels.map(sanitizeWheel);
          setWheels(sanitized);
          localStorage.setItem('salto_angel_wheels_2026_v9', JSON.stringify(sanitized));
        }
      })
      .catch(() => {
        // Offline or dev server fallback
      });
  }, []);

  // Save wheels to localStorage and shared server endpoint
  useEffect(() => {
    try {
      localStorage.setItem('salto_angel_wheels_2026_v9', JSON.stringify(wheels));
      fetch('/api/wheels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheels }),
      }).catch(() => {});
    } catch {
      // Ignore storage errors
    }
  }, [wheels]);

  // Append newly analyzed wheels (sanitized with odd-boundary protection)
  const handleAppendWheels = (newWheels: WheelConfig[]) => {
    const sanitized = newWheels.map(sanitizeWheel);
    setWheels((prev) => [...prev, ...sanitized]);
    if (sanitized.length > 0) {
      setActiveWheelId(sanitized[0].id);
    }
  };

  // Save sound settings
  useEffect(() => {
    try {
      localStorage.setItem('salto_angel_sound_settings', JSON.stringify(soundSettings));
      audioManager.setMuted(!soundSettings.enabled);
      audioManager.setVolume(soundSettings.volume);
      audioManager.setTickType(soundSettings.tickSound);
      audioManager.setFanfareType(soundSettings.fanfare);
      audioManager.setSpeechEnabled(soundSettings.announceWinnerVoice);
    } catch {
      // Ignore
    }
  }, [soundSettings]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Fullscreen mouse cursor inactivity auto-hide (3 seconds)
  useEffect(() => {
    if (!isFullscreen) {
      document.documentElement.classList.remove('hide-cursor');
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const showCursorAndArmTimer = () => {
      document.documentElement.classList.remove('hide-cursor');
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        document.documentElement.classList.add('hide-cursor');
      }, 3000);
    };

    // Arm timer immediately on entering fullscreen
    showCursorAndArmTimer();

    window.addEventListener('mousemove', showCursorAndArmTimer, { passive: true });
    window.addEventListener('mousedown', showCursorAndArmTimer, { passive: true });
    window.addEventListener('keydown', showCursorAndArmTimer, { passive: true });
    window.addEventListener('touchstart', showCursorAndArmTimer, { passive: true });

    return () => {
      if (timer) clearTimeout(timer);
      document.documentElement.classList.remove('hide-cursor');
      window.removeEventListener('mousemove', showCursorAndArmTimer);
      window.removeEventListener('mousedown', showCursorAndArmTimer);
      window.removeEventListener('keydown', showCursorAndArmTimer);
      window.removeEventListener('touchstart', showCursorAndArmTimer);
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Find active wheel
  const activeWheel = wheels.find((w) => w.id === activeWheelId) || wheels[0] || INITIAL_WHEELS[0];

  // Update a wheel
  const handleUpdateWheel = (updated: WheelConfig) => {
    setWheels((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // Update timer duration for current active wheel (persists across spins & saves to localStorage)
  const handleWheelTimerChange = useCallback(
    (newDuration: number) => {
      setWheels((prev) =>
        prev.map((w) => (w.id === activeWheel.id ? { ...w, timerDuration: newDuration } : w))
      );
      setSessionTimerDuration(newDuration);
      setModalTimerState({ timeLeft: newDuration, isRunning: false });
    },
    [activeWheel.id]
  );

  // Create a new wheel
  const handleCreateWheel = (role: WheelRole, name: string) => {
    const defaultTimer = getSessionTimerDuration();
    const newWheel: WheelConfig = {
      id: `wheel-${Date.now()}`,
      name,
      role,
      group: 'elementary',
      spinDuration: 6,
      timerDuration: defaultTimer,
      slices: [
        { id: `s-${Date.now()}-1`, text: 'WORD 1', color: '#FBBF24' },
        { id: `s-${Date.now()}-2`, text: 'WORD 2', color: '#60A5FA' },
        { id: `s-${Date.now()}-3`, text: 'WORD 3', color: '#34D399' },
        { id: `s-${Date.now()}-4`, text: 'WORD 4', color: '#F472B6' },
      ],
    };
    setWheels((prev) => [...prev, newWheel]);
    setActiveWheelId(newWheel.id);
  };

  // Delete a wheel
  const handleDeleteWheel = (wheelId: string) => {
    if (wheels.length <= 1) return;
    const remaining = wheels.filter((w) => w.id !== wheelId);
    setWheels(remaining);
    if (activeWheelId === wheelId) {
      setActiveWheelId(remaining[0].id);
    }
  };

  // Select wheel (resets winning slice and modal, auto-switches timer duration to division default)
  const handleSelectWheel = (wheelId: string) => {
    setActiveWheelId(wheelId);
    setIsWheelSpinning(false);
    setWinningSlice(null);
    setShowWinnerModal(false);

    const targetWheel = wheels.find((w) => w.id === wheelId);
    if (targetWheel?.language === 'es') {
      setContestLanguage('es');
      if (currentSlide > 1) {
        setCurrentSlide(1);
      }
    } else if (targetWheel) {
      setContestLanguage('en');
    }

    const divDuration = typeof targetWheel?.timerDuration === 'number' && targetWheel.timerDuration >= 5 && targetWheel.timerDuration <= 600
      ? targetWheel.timerDuration
      : (targetWheel?.group === 'elementary' ? 30 : 40);

    setSessionTimerDuration(divDuration);
    setModalTimerState({ timeLeft: divDuration, isRunning: false });
  };

  // Switch contest language between Spanish and English
  const handleSwitchContestLanguage = useCallback(
    (lang: 'es' | 'en') => {
      setContestLanguage(lang);
      if (lang === 'es') {
        const spanishWheel =
          wheels.find((w) => w.language === 'es' || w.id === 'wheel-spanish-elem-1-6') ||
          INITIAL_WHEELS[0];
        if (spanishWheel) {
          handleSelectWheel(spanishWheel.id);
        }
        if (currentSlide > 1) {
          setCurrentSlide(1);
        }
      } else {
        const englishWheel =
          wheels.find((w) => w.language !== 'es' && w.id !== 'wheel-spanish-elem-1-6') ||
          INITIAL_WHEELS[1];
        if (englishWheel) {
          handleSelectWheel(englishWheel.id);
        }
      }
    },
    [wheels, currentSlide, setCurrentSlide, setContestLanguage]
  );

  const isSpinningRef = useRef(false);
  isSpinningRef.current = isWheelSpinning;

  const spinWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSpinWatchdog = () => {
    if (spinWatchdogRef.current) {
      clearTimeout(spinWatchdogRef.current);
      spinWatchdogRef.current = null;
    }
  };

  // Spin lifecycle
  const handleSpinStart = useCallback(() => {
    clearSpinWatchdog();
    isSpinningRef.current = true;
    setIsWheelSpinning(true);
    setWinningSlice(null);
    setShowWinnerModal(false);

    // 8.0s fail-safe watchdog timer guarantees the wheel never gets trapped spinning
    spinWatchdogRef.current = setTimeout(() => {
      isSpinningRef.current = false;
      setIsWheelSpinning(false);
      const validSlices = activeWheel.slices.filter((s) => s.enabled !== false && s.text.trim());
      const fallback = validSlices[Math.floor(Math.random() * validSlices.length)] || activeWheel.slices[0];
      if (fallback) {
        setWinningSlice(fallback);
        setShowWinnerModal(true);
      }
    }, 8000);
  }, [activeWheel]);

  const handleSpinEnd = useCallback((slice: WheelSlice) => {
    clearSpinWatchdog();
    isSpinningRef.current = false;
    setIsWheelSpinning(false);
    setWinningSlice(slice);
    // Modal opens with timer strictly stopped; only starts on explicit user action
    setShowWinnerModal(true);
  }, []);

  const handleSpinStop = useCallback(() => {
    clearSpinWatchdog();
    isSpinningRef.current = false;
    setIsWheelSpinning(false);
    const validSlices = activeWheel.slices.filter((s) => s.enabled !== false && s.text.trim());
    const picked = validSlices[Math.floor(Math.random() * validSlices.length)] || activeWheel.slices[0];
    if (picked) {
      setWinningSlice(picked);
      setShowWinnerModal(true);
    }
  }, [activeWheel]);

  // Remove winning word from current wheel and dynamically recalculate colors
  const handleRemoveWinningWord = useCallback(() => {
    if (!winningSlice) return;
    setWheels((prev) =>
      prev.map((w) => {
        if (w.id === activeWheel.id) {
          const remainingSlices = w.slices.filter((s) => s.id !== winningSlice.id);
          const palette = (w.group === 'high_school' && w.place === 'championship')
            ? CHAMPIONSHIP_PALETTE
            : VIBRANT_STAGE_PALETTE;
          const recalibratedSlices = recalibrateSliceColors(remainingSlices, palette);
          return {
            ...w,
            slices: recalibratedSlices,
          };
        }
        return w;
      })
    );
    setWinningSlice(null);
    setShowWinnerModal(false);
  }, [winningSlice, activeWheel.id]);

  const handleStartModalTimer = useCallback(() => {
    if (currentMode === 'studio') {
      setCurrentMode('presentation');
      setCurrentSlide(1);
    }
  }, [currentMode, setCurrentMode, setCurrentSlide]);

  // Remote Control action handler from WebSocket / BroadcastChannel
  const handleRemoteAction = useCallback(
    (action: string, payload?: any) => {
      switch (action) {
        case 'spin_wheel':
          // Always force the stage display to show the wheel: call setCurrentMode('presentation') and setCurrentSlide(1)
          setCurrentMode('presentation');
          setCurrentSlide(1);
          // Close any open winner modal and reset previous winners: setShowWinnerModal(false) and setWinningSlice(null)
          setShowWinnerModal(false);
          setWinningSlice(null);
          // Force-clear the spin guard ref BEFORE starting the spin (isSpinningRef.current = false)
          isSpinningRef.current = false;
          setIsWheelSpinning(false);
          // Trigger handleSpinStart()
          handleSpinStart();
          break;
        case 'set_slide':
          if (typeof payload === 'number') {
            setCurrentMode('presentation');
            setCurrentSlide(payload as PresentationSlideId);
          }
          break;
        case 'toggle_fullscreen':
          toggleFullscreen();
          break;
        case 'stop_spin':
          // A stray Stop tap while idle must not pop a random word onto the stage.
          if (isSpinningRef.current) handleSpinStop();
          break;
        case 'start_timer':
          setModalTimerState((prev) => ({ ...prev, isRunning: true }));
          setRemoteTimerSignal({ type: 'start', ts: Date.now() });
          break;
        case 'stop_timer':
        case 'pause_timer':
          setModalTimerState((prev) => ({ ...prev, isRunning: false }));
          setRemoteTimerSignal({ type: 'pause', ts: Date.now() });
          break;
        case 'reset_timer': {
          const savedDuration = getSessionTimerDuration();
          setModalTimerState((prev) => ({
            ...prev,
            timeLeft: savedDuration,
            isRunning: false,
          }));
          setRemoteTimerSignal({ type: 'reset', ts: Date.now() });
          break;
        }
        case 'set_timer_duration':
          if (typeof payload === 'number' && payload >= 5 && payload <= 600) {
            setSessionTimerDuration(payload);
            setWheels((prev) =>
              prev.map((w) => (w.id === activeWheel.id ? { ...w, timerDuration: payload } : w))
            );
            setModalTimerState((prev) => ({
              ...prev,
              timeLeft: prev.isRunning ? prev.timeLeft : payload,
            }));
          }
          break;
        case 'remove_word':
          handleRemoveWinningWord();
          break;
        case 'close_modal':
          setShowWinnerModal(false);
          setWinningSlice(null);
          break;
        case 'push_winners':
          if (payload) {
            setWinnersData({
              first: payload.first || '',
              second: payload.second || '',
              third: payload.third || '',
            });
          }
          setCurrentMode('presentation');
          setCurrentSlide(2);
          setShowWinnerModal(false);
          setWinningSlice(null);
          setPodiumAnimationKey(Date.now());
          break;
        case 'clear_winners':
        case 'clear_board':
          setWinnersData({
            first: '',
            second: '',
            third: '',
          });
          setPodiumAnimationKey(Date.now());
          break;
      }
    },
    [handleSpinStart, handleSpinStop, handleRemoveWinningWord, setCurrentMode, setCurrentSlide, setWinnersData, toggleFullscreen]
  );

  // Centralized Stage & Remote sync hook
  const { broadcastStageState } = useStageSync({ onRemoteAction: handleRemoteAction });

  // Broadcast stage state to remotes whenever state changes
  useEffect(() => {
    if (isRemoteRoute) return;
    broadcastStageState({
      isSpinning: isWheelSpinning,
      showWinnerModal,
      winningWord: winningSlice?.text || null,
      winningCronica: winningSlice?.cronica || null,
      currentWheelName: activeWheel.name,
      timerDuration: activeWheel.timerDuration || (activeWheel.group === 'elementary' ? 30 : 40),
      timeLeft: showWinnerModal
        ? modalTimerState.timeLeft
        : (activeWheel.timerDuration || (activeWheel.group === 'elementary' ? 30 : 40)),
      isTimerRunning: showWinnerModal ? modalTimerState.isRunning : false,
      currentSlide,
      isFullscreen,
      winnersData,
    });
  }, [
    isRemoteRoute,
    isWheelSpinning,
    showWinnerModal,
    winningSlice?.text,
    winningSlice?.cronica,
    activeWheel.name,
    activeWheel.timerDuration,
    modalTimerState.timeLeft,
    modalTimerState.isRunning,
    currentSlide,
    isFullscreen,
    winnersData,
    broadcastStageState,
  ]);

  // Keyboard shortcut Ctrl+Enter to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isWheelSpinning) {
          handleSpinStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Dev tools actions:
  // 1. Revert all wheels to factory defaults (with user-saved custom default template support)
  const handleRevertAllWheels = () => {
    try {
      const customDefault = localStorage.getItem('salto_angel_factory_default_wheels');
      if (customDefault) {
        const parsed = JSON.parse(customDefault);
        const isLegacyUppercase = Array.isArray(parsed) && parsed.some((w: any) =>
          w.slices?.some((s: any) => s.text === 'MARACAIBO')
        );
        if (isLegacyUppercase) {
          localStorage.removeItem('salto_angel_factory_default_wheels');
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map(sanitizeWheel);
          setWheels(sanitized);
          setActiveWheelId(sanitized[0].id);
          return;
        }
      }
    } catch {}
    setWheels(INITIAL_WHEELS);
    setActiveWheelId(INITIAL_WHEELS[0].id);
  };

  // 1b. Save current wheels as the new factory default template
  const handleSaveAsNewDefault = async () => {
    try {
      localStorage.setItem('salto_angel_factory_default_wheels', JSON.stringify(wheels));
      await fetch('/api/wheels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheels }),
      });
      return true;
    } catch {
      return false;
    }
  };

  // 2. Remove all wheels (leaves 1 clean starter wheel for testing)
  const handleRemoveAllWheels = () => {
    const starterWheel: WheelConfig = {
      id: `wheel-starter-${Date.now()}`,
      name: 'Starter Wheel',
      role: '1st',
      group: 'elementary',
      grade: '1st',
      place: '1st',
      spinDuration: 6,
      timerDuration: 30,
      slices: [
        { id: `s-starter-1`, text: 'START', color: '#FBBF24', enabled: true, weight: 1 },
        { id: `s-starter-2`, text: 'TEST', color: '#60A5FA', enabled: true, weight: 1 },
      ],
    };
    setWheels([starterWheel]);
    setActiveWheelId(starterWheel.id);
  };

  // 3. Randomize wheels: shuffles words across wheels or slice colors/order
  const handleRandomizeWheels = () => {
    setWheels((prev) =>
      prev.map((w) => {
        const shuffled = [...w.slices]
          .map((s, idx) => ({
            ...s,
            color: PASTEL_PALETTE[(idx + Math.floor(Math.random() * PASTEL_PALETTE.length)) % PASTEL_PALETTE.length],
          }))
          .sort(() => Math.random() - 0.5);
        return {
          ...w,
          slices: shuffled,
        };
      })
    );
  };

  // 4. Replace all wheels with an entire array (e.g. from JSON import or Analyzer)
  const handleReplaceAllWheels = (newWheels: WheelConfig[]) => {
    if (newWheels.length === 0) return;
    const sanitized = newWheels.map(sanitizeWheel);
    setWheels(sanitized);
    setActiveWheelId(sanitized[0].id);
  };

  // 5. Replace words in existing wheels
  const handleReplaceWordsInExistingWheels = (updatedWheels: WheelConfig[]) => {
    setWheels(updatedWheels.map(sanitizeWheel));
  };

  // 6. Test celebration modal trigger
  const handleTriggerTestCelebration = (customWord?: string) => {
    const testSlice: WheelSlice = {
      id: `test-winner-${Date.now()}`,
      text: customWord || activeWheel.slices[0]?.text || 'CHAMPION',
      color: activeWheel.slices[0]?.color || '#FBBF24',
    };
    setWinningSlice(testSlice);
    setShowWinnerModal(true);
  };

  // 7. Reset cloud and local storage
  const handleResetCloudStorage = async () => {
    try {
      localStorage.removeItem('salto_angel_wheels_2026_v9');
      localStorage.removeItem('salto_angel_wheels_2026_v8');
      localStorage.removeItem('salto_angel_wheels_2026_v7');
      localStorage.removeItem('salto_angel_wheels_2026_v6');
      localStorage.removeItem('salto_angel_wheels_2026_v4');
      localStorage.removeItem('salto_angel_factory_default_wheels');
      await fetch('/api/wheels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheels: INITIAL_WHEELS }),
      });
      setWheels(INITIAL_WHEELS);
      setActiveWheelId(INITIAL_WHEELS[0].id);
    } catch {
      // Ignore
    }
  };

  // Save current Stage Presentation base URL so remote links can return safely without 404
  useEffect(() => {
    if (!isRemoteRoute && typeof window !== 'undefined') {
      const stageBase = window.location.href
        .split('?')[0]
        .split('#')[0]
        .replace(/\/remote(\/index\.html|\.html)?\/?$/, '')
        .replace(/\/$/, '') + '/';
      try {
        localStorage.setItem('salto_angel_stage_base_url', stageBase);
      } catch {}
    }
  }, [isRemoteRoute]);

  // Route B: Backstage Mobile Remote view (/remote or ?view=remote)
  if (isRemoteRoute) {
    const cleanBase = typeof window !== 'undefined'
      ? window.location.pathname.replace(/\/remote(\/index\.html|\.html)?\/?$/, '').replace(/\/$/, '')
      : '';
    const stagePath = cleanBase ? `${cleanBase}/` : '/';

    return (
      <RemoteControl
        onReturnToStage={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', stagePath);
            setIsRemoteRoute(false);
          }
        }}
        onSpinWheel={() => {
          // Auto switch to wheel slide in the background on this remote device without leaving remote menu
          setCurrentMode('presentation');
          setCurrentSlide(1);
        }}
        onPushWinners={(data) => {
          // Update the presentation deck to Podium slide in the background without leaving remote controls
          setWinnersData(data);
          setCurrentMode('presentation');
          setCurrentSlide(2);
        }}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Hover Navigation Bar (Reveals on hover, allows instant view swap) */}
      <TopGeniallyBar
        currentMode={currentMode}
        onSwitchMode={setCurrentMode}
        activeWheelName={activeWheel.name}
        wheels={wheels}
        activeWheelId={activeWheelId}
        onSelectWheel={handleSelectWheel}
        soundSettings={soundSettings}
        onUpdateSoundSettings={setSoundSettings}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenRemoteModal={() => setShowRemoteModal(true)}
        contestLanguage={contestLanguage}
        onSwitchContestLanguage={handleSwitchContestLanguage}
      />

      {/* Main View: Presentation Deck vs. Wheel Creator Studio */}
      {currentMode === 'presentation' ? (
        <>
          <PresentationDeck
            currentSlide={currentSlide}
            onSetSlide={setCurrentSlide}
            activeWheel={activeWheel}
            isWheelSpinning={isWheelSpinning}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
            onStopSpin={handleSpinStop}
            winnersData={winnersData}
            podiumAnimationKey={podiumAnimationKey}
          />

          {/* Bottom Genially Navigation Bar */}
          <BottomGeniallyBar
            currentSlide={currentSlide}
            totalSlides={activeWheel.language === 'es' ? 2 : 3}
            onPrevSlide={() => {
              if (currentSlide > 0) {
                setCurrentSlide((currentSlide - 1) as PresentationSlideId);
              }
            }}
            onNextSlide={() => {
              const maxSlide = activeWheel.language === 'es' ? 1 : 2;
              if (currentSlide < maxSlide) {
                setCurrentSlide((currentSlide + 1) as PresentationSlideId);
              }
            }}
            onGoToSlide={setCurrentSlide}
            soundSettings={soundSettings}
            onUpdateSoundSettings={setSoundSettings}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            slideTitles={
              activeWheel.language === 'es'
                ? ['Concurso de Deletreo', 'Ruleta Interactiva']
                : SLIDE_TITLES
            }
          />
        </>
      ) : (
        <WheelCreatorStudio
          wheels={wheels}
          activeWheelId={activeWheelId}
          onSelectWheel={handleSelectWheel}
          onUpdateWheel={handleUpdateWheel}
          onCreateWheel={handleCreateWheel}
          onDeleteWheel={handleDeleteWheel}
          onReturnToDeck={() => setCurrentMode('presentation')}
          isSpinning={isWheelSpinning}
          onSpinStart={handleSpinStart}
          onSpinEnd={handleSpinEnd}
          soundSettings={soundSettings}
          onUpdateSoundSettings={setSoundSettings}
          onOpenDocumentAnalyzer={() => setShowDocumentAnalyzer(true)}
          onRevertAllWheels={handleRevertAllWheels}
          onRemoveAllWheels={handleRemoveAllWheels}
          onRandomizeWheels={handleRandomizeWheels}
          onReplaceAllWheels={handleReplaceAllWheels}
          onTriggerTestCelebration={handleTriggerTestCelebration}
          onResetCloudStorage={handleResetCloudStorage}
          onSaveAsNewDefault={handleSaveAsNewDefault}
        />
      )}

      {/* Winner Celebration Modal */}
      {showWinnerModal && winningSlice && (
        <WinnerModal
          key={`winner-${activeWheel.id}-${winningSlice.id}`}
          isOpen={showWinnerModal}
          word={winningSlice.text}
          cronica={winningSlice.cronica}
          sliceColor={winningSlice.color}
          timerDuration={activeWheel.timerDuration ?? (activeWheel.group === 'elementary' ? 30 : 40)}
          timerActionSignal={remoteTimerSignal}
          onTimerTick={(timeLeft, isRunning) => {
            setModalTimerState({ timeLeft, isRunning });
          }}
          onDurationChange={handleWheelTimerChange}
          onClose={() => {
            setShowWinnerModal(false);
            setWinningSlice(null);
            const savedDuration = activeWheel.timerDuration ?? (activeWheel.group === 'elementary' ? 30 : 40);
            setModalTimerState({
              timeLeft: savedDuration,
              isRunning: false,
            });
          }}
          onRemoveWord={handleRemoveWinningWord}
          onStartTimer={handleStartModalTimer}
        />
      )}

      {/* Document Analyzer & Wheel Generator Modal */}
      <DocumentAnalyzerModal
        isOpen={showDocumentAnalyzer}
        onClose={() => setShowDocumentAnalyzer(false)}
        onAppendWheels={handleAppendWheels}
        existingWheels={wheels}
        onReplaceWordsInExistingWheels={handleReplaceWordsInExistingWheels}
        onReplaceAllWheels={handleReplaceAllWheels}
      />

      {/* Stage Remote QR Code Modal */}
      <RemoteQRCodeModal
        isOpen={showRemoteModal}
        onClose={() => setShowRemoteModal(false)}
        onSwitchToRemote={() => {
          window.history.pushState({}, '', '/remote');
          setIsRemoteRoute(true);
          setShowRemoteModal(false);
        }}
      />
    </div>
  );
}
