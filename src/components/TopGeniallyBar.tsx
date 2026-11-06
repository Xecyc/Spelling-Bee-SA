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
  activeWheelName,
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
  }, [activeWheelId, activeWheel]);

  // Close dropdown on Escape key
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
      {/* Discrete Hover Arrow-Down Dropdown Menu at Top-Center */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Hover Arrow Tab - ONLY arrow icon, ZERO words */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-6 flex items-center justify-center rounded-b-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-amber-400 border-x border-b border-white/20 shadow-md backdrop-blur-md transition-all cursor-pointer"
          title="Menu & View Switcher"
          aria-label="View Switcher Menu"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Modal (Reveals on hover) */}
        {isOpen && (
          <div className="mt-1 w-84 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 text-white text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header info */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span>Switch View & Wheel</span>
              <span className="text-amber-400 font-mono truncate max-w-[150px]">
                {activeWheel.group === 'elementary'
                  ? `Elementary · ${activeWheel.name}`
                  : activeWheel.name}
              </span>
            </div>

            {/* Mode Switching Options */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <button
                onClick={() => {
                  onSwitchMode('presentation');
                  setIsOpen(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-colors cursor-pointer text-xs ${
                  currentMode === 'presentation'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Slides</span>
              </button>

              <button
                onClick={() => {
                  onSwitchMode('studio');
                  setIsOpen(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-colors cursor-pointer text-xs ${
                  currentMode === 'studio'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Disc className="w-3.5 h-3.5 text-amber-400" />
                <span>Studio</span>
              </button>
            </div>

            {/* Quick Tiebreaker Wheel Selection */}
            <div className="border-t border-slate-800 pt-2">
              {/* Group Tabs: Elementary vs High School */}
              <div className="flex items-center p-0.5 bg-slate-800/90 rounded-lg mb-2">
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
                  className={`flex-1 py-1 text-center font-bold text-[11px] rounded-md transition-all cursor-pointer ${
                    selectedGroup === 'elementary'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
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
                  className={`flex-1 py-1 text-center font-bold text-[11px] rounded-md transition-all cursor-pointer ${
                    selectedGroup === 'high_school'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  High School
                </button>
              </div>

              {selectedGroup === 'elementary' ? (
                <div className="space-y-1.5">
                  {/* Grade sub-selector: Clicking immediately switches to that grade's wheel */}
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
                        className={`py-1 text-center rounded font-bold text-[10px] transition-colors cursor-pointer ${
                          selectedGrade === grade
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>

                  {/* 1st Place vs 2nd/3rd Place (without redundant timer text) */}
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
                          className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer border ${
                            is1stActive
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
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
                          className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer border ${
                            is2nd3rdActive
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          2nd/3rd Place
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* High School round selector (without redundant timer text) */
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
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer border ${
                          is1stActive
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                            : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
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
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer border ${
                          is2nd3rdActive
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                            : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        2nd/3rd Place
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Toolbar Settings */}
            <div className="pt-2 border-t border-slate-800 mt-2 flex items-center justify-between px-1">
              <button
                onClick={() => {
                  const next = !soundSettings.enabled;
                  onUpdateSoundSettings({ ...soundSettings, enabled: next });
                  audioManager.setMuted(!next);
                }}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-[11px]"
              >
                {soundSettings.enabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>{soundSettings.enabled ? 'Sound On' : 'Muted'}</span>
              </button>

              <button
                onClick={onToggleFullscreen}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-[11px]"
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
