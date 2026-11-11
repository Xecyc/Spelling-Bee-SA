import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Layers,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Disc,
  Trophy,
} from 'lucide-react';
import { SoundSettings, WheelConfig } from '../types/presentation';
import { audioManager } from '../utils/audio';

interface TopGeniallyBarProps {
  currentMode: 'presentation' | 'studio';
  onSwitchMode: (mode: 'presentation' | 'studio') => void;
  activeWheelName: string;
  wheels: WheelConfig[];
  activeWheelId: string;
  onSelectWheel: (wheelId: string) => void;
  soundSettings: SoundSettings;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenRemoteModal?: () => void;
}

export const TopGeniallyBar: React.FC<TopGeniallyBarProps> = ({
  currentMode,
  onSwitchMode,
  wheels,
  activeWheelId,
  onSelectWheel,
  soundSettings,
  onUpdateSoundSettings,
  isFullscreen,
  onToggleFullscreen,
  onOpenRemoteModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeWheel = wheels.find((w) => w.id === activeWheelId) || wheels[0];
  const [selectedGroup, setSelectedGroup] = useState<'elementary' | 'high_school'>(
    (activeWheel?.group as 'elementary' | 'high_school') || 'elementary'
  );

  // Clean determination if active wheel is Tiebreak vs General round
  const isCurrentTiebreak = Boolean(
    activeWheel?.role === 'tiebreak' ||
      activeWheel?.place === 'tiebreak' ||
      activeWheel?.place === '2nd_3rd' ||
      activeWheel?.name?.toLowerCase().includes('tiebreak')
  );

  const getInitialGrade = (wheel: WheelConfig | undefined): string => {
    if (!wheel || wheel.group === 'high_school') return '1st';
    if (wheel.grade && ['1st', '2nd', '3rd', '4th', '5th', '6th'].includes(wheel.grade)) {
      return wheel.grade;
    }
    if (wheel.grade === '4th - 6th' || (wheel.name && wheel.name.includes('4th-6th'))) {
      return '4th';
    }
    return '1st';
  };

  const [selectedGrade, setSelectedGrade] = useState<string>(() => getInitialGrade(activeWheel));

  // Sync group and grade with active wheel when it changes
  useEffect(() => {
    if (activeWheel) {
      if (activeWheel.group === 'high_school') {
        setSelectedGroup('high_school');
      } else {
        setSelectedGroup('elementary');
        if (
          activeWheel.grade &&
          ['1st', '2nd', '3rd', '4th', '5th', '6th'].includes(activeWheel.grade)
        ) {
          setSelectedGrade(activeWheel.grade);
        } else if (
          activeWheel.grade === '4th - 6th' ||
          (activeWheel.name && activeWheel.name.includes('4th-6th'))
        ) {
          setSelectedGrade((prev) => (['4th', '5th', '6th'].includes(prev) ? prev : '4th'));
        } else if (
          activeWheel.grade === '1st - 3rd' ||
          (activeWheel.name && activeWheel.name.includes('1st-3rd'))
        ) {
          setSelectedGrade((prev) => (['1st', '2nd', '3rd'].includes(prev) ? prev : '1st'));
        }
      }
    }
  }, [activeWheel]);

  const containerRef = useRef<HTMLDivElement>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearAutoHideTimer();
  };

  const handleMouseLeave = () => {
    clearAutoHideTimer();
    if (isOpen) {
      autoHideTimerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    }
  };

  // Click outside detection: immediately closes dropdown when clicking outside menu box
  useEffect(() => {
    if (!isOpen) {
      clearAutoHideTimer();
      return;
    }

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clearAutoHideTimer();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isOpen]);

  // Clean up auto-hide timer on unmount
  useEffect(() => {
    return () => clearAutoHideTimer();
  }, []);

  // Keyboard shortcut: Esc closes dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearAutoHideTimer();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleClick = () => {
    clearAutoHideTimer();
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Top Hover-Zone Container for Auto-Hiding the Dropdown Menu */}
      <div
        ref={containerRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center group pointer-events-auto"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Transparent Hover-Zone Wrapper (w-48 h-8) revealing the tab on hover */}
        <div className="w-48 h-7 flex items-start justify-center cursor-pointer">
          <button
            onClick={handleToggleClick}
            style={{ transition: 'opacity 0.3s ease, background-color 0.2s ease, transform 0.2s ease' }}
            className={`w-10 h-6 flex items-center justify-center rounded-b-xl bg-[#061a3e]/90 hover:bg-[#071f4c] text-blue-200 hover:text-amber-400 border-x border-b border-blue-400/30 shadow-lg backdrop-blur-md cursor-pointer ${
              isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
            title="Menu & View Switcher (Hover or Click)"
            aria-label="View Switcher Menu"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>
        </div>

        {/* Dropdown Menu Modal - Redesigned to Sober Presentation Navy & Golden-Yellow */}
        {isOpen && (
          <div className="mt-0.5 w-84 bg-[#061a3e] border border-blue-400/30 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 text-white text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Pure Solid White "SWITCH VIEW & WHEEL" */}
            <div className="flex items-center justify-between px-1 py-1 border-b border-blue-900/60 mb-2.5">
              <span className="font-display font-black text-xs text-white tracking-wider uppercase">
                Switch View & Wheel
              </span>
            </div>

            {/* Mode Switching Options: Golden-Yellow Active vs Minimal Navy Inactive */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <button
                onClick={() => {
                  onSwitchMode('presentation');
                  setIsOpen(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer font-black text-xs uppercase tracking-wide border ${
                  currentMode === 'presentation'
                    ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                    : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Slides</span>
              </button>

              <button
                onClick={() => {
                  onSwitchMode('studio');
                  setIsOpen(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer font-black text-xs uppercase tracking-wide border ${
                  currentMode === 'studio'
                    ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                    : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                }`}
              >
                <Disc className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Studio</span>
              </button>
            </div>

            {/* Quick Tiebreaker Wheel Selection */}
            <div className="border-t border-blue-900/60 pt-2.5">
              {/* Group Tabs: Elementary vs High School */}
              <div className="flex items-center p-0.5 bg-[#081f49] border border-blue-400/20 rounded-xl mb-2">
                <button
                  onClick={() => {
                    setSelectedGroup('elementary');
                    const isBlock1 = ['1st', '2nd', '3rd'].includes(selectedGrade);
                    if (isCurrentTiebreak) {
                      const target =
                        wheels.find(
                          (w) =>
                            w.group === 'elementary' &&
                            w.grade === selectedGrade &&
                            (w.role === 'tiebreak' || w.place === 'tiebreak' || w.name.toLowerCase().includes('tiebreak'))
                        ) ||
                        wheels.find(
                          (w) =>
                            w.group === 'elementary' &&
                            (w.role === 'tiebreak' || w.place === 'tiebreak' || w.name.toLowerCase().includes('tiebreak'))
                        );
                      if (target) onSelectWheel(target.id);
                    } else {
                      const target =
                        wheels.find(
                          (w) =>
                            w.group === 'elementary' &&
                            (w.role === 'general' || w.place === 'general') &&
                            (isBlock1 ? w.name.includes('1st-3rd') : w.name.includes('4th-6th'))
                        ) ||
                        wheels.find(
                          (w) =>
                            w.group === 'elementary' &&
                            (w.role === 'general' || w.place === 'general')
                        );
                      if (target) onSelectWheel(target.id);
                    }
                  }}
                  className={`flex-1 py-1.5 text-center font-black text-xs uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                    selectedGroup === 'elementary'
                      ? 'bg-amber-400 text-[#06152d] shadow-sm'
                      : 'text-blue-200/80 hover:text-white'
                  }`}
                >
                  Elementary
                </button>
                <button
                  onClick={() => {
                    setSelectedGroup('high_school');
                    if (isCurrentTiebreak) {
                      const target =
                        wheels.find(
                          (w) =>
                            w.group === 'high_school' &&
                            (w.role === 'tiebreak' || w.place === 'tiebreak' || w.name.toLowerCase().includes('tiebreak'))
                        ) || wheels.find((w) => w.group === 'high_school');
                      if (target) onSelectWheel(target.id);
                    } else {
                      const target =
                        wheels.find(
                          (w) =>
                            w.group === 'high_school' &&
                            (w.role === 'general' || w.place === 'general' || w.name.toLowerCase().includes('general'))
                        ) || wheels.find((w) => w.group === 'high_school');
                      if (target) onSelectWheel(target.id);
                    }
                  }}
                  className={`flex-1 py-1.5 text-center font-black text-xs uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                    selectedGroup === 'high_school'
                      ? 'bg-amber-400 text-[#06152d] shadow-sm'
                      : 'text-blue-200/80 hover:text-white'
                  }`}
                >
                  High School
                </button>
              </div>

              {selectedGroup === 'elementary' ? (
                <div className="space-y-2">
                  {/* Grade sub-selector */}
                  <div className="grid grid-cols-6 gap-1">
                    {(['1st', '2nd', '3rd', '4th', '5th', '6th'] as const).map((grade) => (
                      <button
                        key={grade}
                        onClick={() => {
                          setSelectedGrade(grade);
                          const isBlock1 = ['1st', '2nd', '3rd'].includes(grade);

                          if (isCurrentTiebreak) {
                            // If user is currently in Tiebreak mode, keep tiebreak active for this grade
                            const target =
                              wheels.find(
                                (w) =>
                                  w.group === 'elementary' &&
                                  w.grade === grade &&
                                  (w.role === 'tiebreak' || w.place === 'tiebreak' || w.name.toLowerCase().includes('tiebreak'))
                              ) || wheels.find((w) => w.group === 'elementary' && w.grade === grade);
                            if (target) onSelectWheel(target.id);
                          } else {
                            // Default General mode: select the block general wheel (General stays yellow, Tiebreak stays blue)
                            const target =
                              wheels.find(
                                (w) =>
                                  w.group === 'elementary' &&
                                  (w.role === 'general' || w.place === 'general') &&
                                  (isBlock1 ? w.name.includes('1st-3rd') : w.name.includes('4th-6th'))
                              ) ||
                              wheels.find(
                                (w) =>
                                  w.group === 'elementary' &&
                                  (w.role === 'general' || w.place === 'general')
                              );
                            if (target) onSelectWheel(target.id);
                          }
                        }}
                        className={`py-1.5 text-center rounded-lg font-black text-[11px] transition-all cursor-pointer border ${
                          selectedGrade === grade
                            ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-xs'
                            : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>

                  {/* General vs Tiebreak round buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* General Button: Active by default (yellow) */}
                    <button
                      onClick={() => {
                        const isBlock1 = ['1st', '2nd', '3rd'].includes(selectedGrade);
                        const wheelGeneral =
                          wheels.find(
                            (w) =>
                              w.group === 'elementary' &&
                              (w.role === 'general' || w.place === 'general') &&
                              (isBlock1 ? w.name.includes('1st-3rd') : w.name.includes('4th-6th'))
                          ) ||
                          wheels.find(
                            (w) =>
                              w.group === 'elementary' &&
                              (w.role === 'general' || w.place === 'general')
                          );
                        if (wheelGeneral) {
                          onSelectWheel(wheelGeneral.id);
                          setIsOpen(false);
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                        !isCurrentTiebreak
                          ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                      }`}
                    >
                      General
                    </button>

                    {/* Tiebreak Button: Inactive (blue) by default until selected */}
                    <button
                      onClick={() => {
                        const wheelTiebreak =
                          wheels.find(
                            (w) =>
                              w.group === 'elementary' &&
                              w.grade === selectedGrade &&
                              (w.role === 'tiebreak' || w.place === 'tiebreak' || w.name.toLowerCase().includes('tiebreak'))
                          ) ||
                          wheels.find(
                            (w) =>
                              w.group === 'elementary' &&
                              (w.role === 'tiebreak' || w.place === 'tiebreak' || w.name.toLowerCase().includes('tiebreak'))
                          );
                        if (wheelTiebreak) {
                          onSelectWheel(wheelTiebreak.id);
                          setIsOpen(false);
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                        isCurrentTiebreak
                          ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                      }`}
                    >
                      Tiebreak
                    </button>
                  </div>
                </div>
              ) : (
                /* High School round selector */
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  <button
                    onClick={() => {
                      const wheelHsGeneral =
                        wheels.find(
                          (w) =>
                            w.group === 'high_school' &&
                            (w.role === 'general' || w.place === 'general' || w.name.toLowerCase().includes('general'))
                        ) || wheels.find((w) => w.group === 'high_school');
                      if (wheelHsGeneral) {
                        onSelectWheel(wheelHsGeneral.id);
                        setIsOpen(false);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                      !isCurrentTiebreak
                        ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                        : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                    }`}
                  >
                    General
                  </button>

                  <button
                    onClick={() => {
                      const wheelHsTiebreak =
                        wheels.find(
                          (w) =>
                            w.group === 'high_school' &&
                            (w.role === 'tiebreak' || w.place === 'tiebreak' || w.name.toLowerCase().includes('tiebreak'))
                        ) || wheels.find((w) => w.group === 'high_school');
                      if (wheelHsTiebreak) {
                        onSelectWheel(wheelHsTiebreak.id);
                        setIsOpen(false);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                      isCurrentTiebreak
                        ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                        : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                    }`}
                  >
                    Tiebreak
                  </button>
                </div>
              )}
            </div>

            {/* Toolbar Settings (Sound and Fullscreen) */}
            <div className="pt-2.5 border-t border-blue-900/60 mt-2 flex items-center justify-between px-1">
              <button
                onClick={() => {
                  const next = !soundSettings.enabled;
                  onUpdateSoundSettings({ ...soundSettings, enabled: next });
                  audioManager.setMuted(!next);
                }}
                className="flex items-center gap-1.5 text-blue-200 hover:text-white py-1 px-2.5 rounded-lg hover:bg-[#0a2354] transition cursor-pointer text-xs font-bold"
              >
                {soundSettings.enabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>{soundSettings.enabled ? 'Sound On' : 'Muted'}</span>
              </button>

              {/* Podium Remote Trigger Button with Cup/Trophy icon between Sound and Fullscreen */}
              {onOpenRemoteModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenRemoteModal();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-[#0a2354] border border-amber-400/40 bg-amber-400/10 transition cursor-pointer"
                  title="Podium Remote Control"
                  aria-label="Podium Remote Control"
                >
                  <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                </button>
              )}

              <button
                onClick={onToggleFullscreen}
                className="flex items-center gap-1.5 text-blue-200 hover:text-white py-1 px-2.5 rounded-lg hover:bg-[#0a2354] transition cursor-pointer text-xs font-bold"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
