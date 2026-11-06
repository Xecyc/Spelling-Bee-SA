import { useState, useEffect } from 'react';
import {
  WheelConfig,
  WheelSlice,
  WheelRole,
  PresentationSlideId,
  SoundSettings,
} from './types/presentation';
import { INITIAL_WHEELS } from './utils/defaultData';
import { audioManager } from './utils/audio';
import { PresentationDeck } from './components/PresentationDeck';
import { WheelCreatorStudio } from './components/WheelCreatorStudio';
import { TopGeniallyBar } from './components/TopGeniallyBar';
import { BottomGeniallyBar } from './components/BottomGeniallyBar';
import { WinnerModal } from './components/WinnerModal';

const SLIDE_TITLES = [
  'Welcome & Title',
  'Interactive Wheel & Timer',
  'Champion Celebration',
];

export default function App() {
  // Mode: Presentation Deck vs. Wheel Studio
  const [currentMode, setCurrentMode] = useState<'presentation' | 'studio'>('presentation');

  // Presentation Slide index: 0, 1, 2
  const [currentSlide, setCurrentSlide] = useState<PresentationSlideId>(0);

  // Wheels state with localStorage persistence
  const [wheels, setWheels] = useState<WheelConfig[]>(() => {
    try {
      const saved = localStorage.getItem('salto_angel_wheels_2026_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 14 &&
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

  // Wheel spin state
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [winningSlice, setWinningSlice] = useState<WheelSlice | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [autoStartTimerTrigger, setAutoStartTimerTrigger] = useState<number>(0);

  // Save wheels to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('salto_angel_wheels_2026_v4', JSON.stringify(wheels));
    } catch {
      // Ignore storage errors
    }
  }, [wheels]);

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
  const activeWheel = wheels.find((w) => w.id === activeWheelId) || wheels[0];

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
          onReturnToDeck={() => setCurrentMode('presentation')}
          isSpinning={isWheelSpinning}
          onSpinStart={handleSpinStart}
          onSpinEnd={handleSpinEnd}
          soundSettings={soundSettings}
          onUpdateSoundSettings={setSoundSettings}
        />
      )}

      {/* Winner Celebration Modal */}
      <WinnerModal
        isOpen={showWinnerModal}
        word={winningSlice?.text || null}
        sliceColor={winningSlice?.color}
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
    </div>
  );
}
