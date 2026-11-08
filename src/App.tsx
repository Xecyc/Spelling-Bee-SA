import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  WheelConfig,
  WheelSlice,
  WheelRole,
  PresentationSlideId,
  SoundSettings,
  WinnersData,
} from './types/presentation';
import { INITIAL_WHEELS, PASTEL_PALETTE } from './utils/defaultData';
import { audioManager } from './utils/audio';
import { PresentationDeck } from './components/PresentationDeck';
import { WheelCreatorStudio } from './components/WheelCreatorStudio';
import { TopGeniallyBar } from './components/TopGeniallyBar';
import { BottomGeniallyBar } from './components/BottomGeniallyBar';
import { WinnerModal } from './components/WinnerModal';
import { DocumentAnalyzerModal } from './components/DocumentAnalyzerModal';
import { RemoteControl } from './components/RemoteControl';
import { RemoteQRCodeModal } from './components/RemoteQRCodeModal';

const SLIDE_TITLES = [
  'Welcome & Title',
  'Interactive Wheel & Timer',
  'Winner Podium',
];

// CRITICAL: Connect to the dynamic origin, not localhost or a hardcoded domain.
// Use useMemo or place outside the component if appropriate to prevent infinite reconnects.
const socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
  transports: ['websocket', 'polling']
});

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
  // Mode: Presentation Deck vs. Wheel Studio
  const [currentMode, setCurrentMode] = useState<'presentation' | 'studio'>('presentation');

  // Presentation Slide index: 0, 1, 2
  const [currentSlide, setCurrentSlide] = useState<PresentationSlideId>(0);

  // Wheels state with localStorage persistence
  const [wheels, setWheels] = useState<WheelConfig[]>(() => {
    try {
      const saved = localStorage.getItem('salto_angel_wheels_2026_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 10 &&
          parsed.some((w) => w.group === 'high_school')
        ) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_WHEELS;
  });

  // Active wheel id
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

  // Route B: Mobile Remote backstage check (/remote, ?view=remote, #remote, etc.)
  const [isRemoteRoute, setIsRemoteRoute] = useState<boolean>(checkIsRemotePath);

  // Keep route synced on back/forward browser navigation or pushState/hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      setIsRemoteRoute(checkIsRemotePath());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Remote Controlled Winner Podium State
  const [winnersData, setWinnersData] = useState<WinnersData | null>(null);
  const [showRemoteModal, setShowRemoteModal] = useState<boolean>(false);

  // Wheel spin state
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [winningSlice, setWinningSlice] = useState<WheelSlice | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [autoStartTimerTrigger, setAutoStartTimerTrigger] = useState<number>(0);
  const [showDocumentAnalyzer, setShowDocumentAnalyzer] = useState(false);

  // Socket.io & BroadcastChannel integration for Stage Display: Listen to remote control events
  useEffect(() => {
    if (isRemoteRoute) return;

    const handleShowWinners = (data: WinnersData) => {
      if (data) {
        setWinnersData(data);
        setCurrentMode('presentation');
        setCurrentSlide(2);
      }
    };

    const handleHideWinners = () => {
      setWinnersData(null);
      setCurrentSlide(1);
    };

    socket.on('show_winners', handleShowWinners);
    socket.on('hide_winners', handleHideWinners);

    // Cross-tab BroadcastChannel fallback for GitHub Pages and static deployments
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('salto_angel_podium_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'show_winners' && event.data?.data) {
            handleShowWinners(event.data.data);
          } else if (event.data?.type === 'hide_winners') {
            handleHideWinners();
          }
        };
      }
    } catch {
      // Ignore
    }

    // localStorage storage event fallback for cross-tab updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'salto_angel_remote_winners' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === 'show_winners' && parsed.data) {
            handleShowWinners(parsed.data);
          } else if (parsed.type === 'hide_winners') {
            handleHideWinners();
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      socket.off('show_winners', handleShowWinners);
      socket.off('hide_winners', handleHideWinners);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [isRemoteRoute]);

  // Load shared wheels from server on mount (syncs across multiple PCs)
  useEffect(() => {
    if (isRemoteRoute) return;
    fetch('/api/wheels')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.wheels) && data.wheels.length > 0) {
          setWheels(data.wheels);
          localStorage.setItem('salto_angel_wheels_2026_v7', JSON.stringify(data.wheels));
        }
      })
      .catch(() => {
        // Offline or dev server fallback
      });
  }, []);

  // Save wheels to localStorage and shared server endpoint
  useEffect(() => {
    try {
      localStorage.setItem('salto_angel_wheels_2026_v7', JSON.stringify(wheels));
      fetch('/api/wheels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheels }),
      }).catch(() => {});
    } catch {
      // Ignore storage errors
    }
  }, [wheels]);

  // Append newly analyzed wheels
  const handleAppendWheels = (newWheels: WheelConfig[]) => {
    setWheels((prev) => [...prev, ...newWheels]);
    if (newWheels.length > 0) {
      setActiveWheelId(newWheels[0].id);
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Find active wheel
  const activeWheel = wheels.find((w) => w.id === activeWheelId) || wheels[0] || INITIAL_WHEELS[0];

  // Update a wheel
  const handleUpdateWheel = (updated: WheelConfig) => {
    setWheels((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // Create a new wheel
  const handleCreateWheel = (role: WheelRole, name: string) => {
    const defaultTimer = role === '1st' ? 40 : 20;
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

  // Spin lifecycle
  const handleSpinStart = () => {
    if (isWheelSpinning) return;
    setIsWheelSpinning(true);
    setWinningSlice(null);
    setShowWinnerModal(false);
  };

  const handleSpinEnd = (slice: WheelSlice) => {
    setIsWheelSpinning(false);
    setWinningSlice(slice);
    setShowWinnerModal(true);
  };

  // Remove winning word from current wheel
  const handleRemoveWinningWord = () => {
    if (!winningSlice) return;
    setWheels((prev) =>
      prev.map((w) => {
        if (w.id === activeWheel.id) {
          return {
            ...w,
            slices: w.slices.filter((s) => s.id !== winningSlice.id),
          };
        }
        return w;
      })
    );
    setWinningSlice(null);
    setShowWinnerModal(false);
  };

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
  // 1. Revert all wheels to factory defaults (INITIAL_WHEELS)
  const handleRevertAllWheels = () => {
    setWheels(INITIAL_WHEELS);
    setActiveWheelId(INITIAL_WHEELS[0].id);
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
      timerDuration: 40,
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
    setWheels(newWheels);
    setActiveWheelId(newWheels[0].id);
  };

  // 5. Replace words in existing wheels
  const handleReplaceWordsInExistingWheels = (updatedWheels: WheelConfig[]) => {
    setWheels(updatedWheels);
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
      localStorage.removeItem('salto_angel_wheels_2026_v7');
      localStorage.removeItem('salto_angel_wheels_2026_v6');
      localStorage.removeItem('salto_angel_wheels_2026_v4');
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

  // Route B: Backstage Mobile Remote view (/remote)
  if (isRemoteRoute) {
    return <RemoteControl />;
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
        onSelectWheel={setActiveWheelId}
        soundSettings={soundSettings}
        onUpdateSoundSettings={setSoundSettings}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenRemoteModal={() => setShowRemoteModal(true)}
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
            autoStartTimerTrigger={autoStartTimerTrigger}
            winnersData={winnersData}
          />

          {/* Bottom Genially Navigation Bar */}
          <BottomGeniallyBar
            currentSlide={currentSlide}
            totalSlides={3}
            onPrevSlide={() => {
              if (currentSlide > 0) {
                setCurrentSlide((currentSlide - 1) as PresentationSlideId);
              }
            }}
            onNextSlide={() => {
              if (currentSlide < 2) {
                setCurrentSlide((currentSlide + 1) as PresentationSlideId);
              }
            }}
            onGoToSlide={setCurrentSlide}
            soundSettings={soundSettings}
            onUpdateSoundSettings={setSoundSettings}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            slideTitles={SLIDE_TITLES}
          />
        </>
      ) : (
        <WheelCreatorStudio
          wheels={wheels}
          activeWheelId={activeWheelId}
          onSelectWheel={setActiveWheelId}
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
        />
      )}

      {/* Winner Celebration Modal */}
      {showWinnerModal && winningSlice && (
        <WinnerModal
          key={`winner-${activeWheel.id}-${winningSlice.id}`}
          isOpen={showWinnerModal}
          word={winningSlice.text}
          sliceColor={winningSlice.color}
          timerDuration={activeWheel.timerDuration ?? 40}
          onClose={() => setShowWinnerModal(false)}
          onRemoveWord={handleRemoveWinningWord}
          onStartTimer={() => {
            setAutoStartTimerTrigger((prev) => prev + 1);
            // If in studio, switch back to slide 1 (the wheel slide)
            if (currentMode === 'studio') {
              setCurrentMode('presentation');
              setCurrentSlide(1);
            }
          }}
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
