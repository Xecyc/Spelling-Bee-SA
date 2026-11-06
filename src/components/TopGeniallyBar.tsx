import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Layers,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Disc,
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
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeWheel = wheels.find((w) => w.id === activeWheelId) || wheels[0];
  const [selectedGroup, setSelectedGroup] = useState<'elementary' | 'high_school'>(
    (activeWheel?.group as 'elementary' | 'high_school') || 'elementary'
  );
  const [selectedGrade, setSelectedGrade] = useState<string>(
    activeWheel?.grade && activeWheel.grade !== 'High School' ? activeWheel.grade : '1st'
  );

  // Sync group and grade with active wheel when it changes
  useEffect(() => {
    if (activeWheel) {
      if (activeWheel.group === 'high_school') {
        setSelectedGroup('high_school');
      } else {
        setSelectedGroup('elementary');
        if (activeWheel.grade && activeWheel.grade !== 'High School') {
          setSelectedGrade(activeWheel.grade);
        }
      }
    }
  }, [activeWheel]);

  // Keyboard shortcut: Esc closes dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Top Hover-Zone Container for Auto-Hiding the Dropdown Menu */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center group pointer-events-auto"
        onMouseEnter={() => {}}
        onMouseLeave={() => {
          setIsOpen(false);
        }}
      >
        {/* Transparent Hover-Zone Wrapper (w-48 h-8) revealing the tab on hover */}
        <div className="w-48 h-7 flex items-start justify-center cursor-pointer">
          <button
            onClick={() => setIsOpen(!isOpen)}
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
            {/* Header: Pure Solid White "SWITCH VIEW & WHEEL" (Yellow breadcrumb removed) */}
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
                    const target =
                      wheels.find(
                        (w) =>
                          w.group === 'elementary' &&
                          w.grade === selectedGrade &&
                          (w.place === activeWheel.place || w.place === '1st')
                      ) ||
                      wheels.find(
                        (w) => w.group === 'elementary' && w.grade === selectedGrade
                      ) ||
                      wheels.find((w) => w.group === 'elementary');
                    if (target) {
                      onSelectWheel(target.id);
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
                    const target =
                      wheels.find(
                        (w) =>
                          w.group === 'high_school' &&
                          (w.place === activeWheel.place || w.place === '1st')
                      ) ||
                      wheels.find((w) => w.group === 'high_school');
                    if (target) {
                      onSelectWheel(target.id);
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
                          const target =
                            wheels.find(
                              (w) =>
                                w.group === 'elementary' &&
                                w.grade === grade &&
                                (w.place === activeWheel.place || w.place === '1st')
                            ) ||
                            wheels.find(
                              (w) => w.group === 'elementary' && w.grade === grade
                            );
                          if (target) {
                            onSelectWheel(target.id);
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

                  {/* 1st Place vs 2nd/3rd Place */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {(() => {
                      const wheel1st = wheels.find(
                        (w) => w.group === 'elementary' && w.grade === selectedGrade && w.place === '1st'
                      );
                      const is1stActive = wheel1st && wheel1st.id === activeWheelId;
                      return (
                        <button
                          onClick={() => {
                            if (wheel1st) {
                              onSelectWheel(wheel1st.id);
                              setIsOpen(false);
                            }
                          }}
                          className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                            is1stActive
                              ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                              : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                          }`}
                        >
                          1st Place
                        </button>
                      );
                    })()}

                    {(() => {
                      const wheel2nd3rd = wheels.find(
                        (w) => w.group === 'elementary' && w.grade === selectedGrade && w.place === '2nd_3rd'
                      );
                      const is2nd3rdActive = wheel2nd3rd && wheel2nd3rd.id === activeWheelId;
                      return (
                        <button
                          onClick={() => {
                            if (wheel2nd3rd) {
                              onSelectWheel(wheel2nd3rd.id);
                              setIsOpen(false);
                            }
                          }}
                          className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                            is2nd3rdActive
                              ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                              : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                          }`}
                        >
                          2nd/3rd Place
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* High School round selector */
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  {(() => {
                    const wheelHs1st = wheels.find(
                      (w) => w.group === 'high_school' && w.place === '1st'
                    );
                    const is1stActive = wheelHs1st && wheelHs1st.id === activeWheelId;
                    return (
                      <button
                        onClick={() => {
                          if (wheelHs1st) {
                            onSelectWheel(wheelHs1st.id);
                            setIsOpen(false);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                          is1stActive
                            ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                            : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                        }`}
                      >
                        1st Place
                      </button>
                    );
                  })()}

                  {(() => {
                    const wheelHs2nd3rd = wheels.find(
                      (w) => w.group === 'high_school' && w.place === '2nd_3rd'
                    );
                    const is2nd3rdActive = wheelHs2nd3rd && wheelHs2nd3rd.id === activeWheelId;
                    return (
                      <button
                        onClick={() => {
                          if (wheelHs2nd3rd) {
                            onSelectWheel(wheelHs2nd3rd.id);
                            setIsOpen(false);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-center font-black text-xs uppercase tracking-wide transition-all cursor-pointer border ${
                          is2nd3rdActive
                            ? 'bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20'
                            : 'bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:border-blue-400/40 hover:text-white'
                        }`}
                      >
                        2nd/3rd Place
                      </button>
                    );
                  })()}
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
