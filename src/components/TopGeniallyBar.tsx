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
import { SoundSettings } from '../types/presentation';
import { audioManager } from '../utils/audio';

interface TopGeniallyBarProps {
  currentMode: 'presentation' | 'studio';
  onSwitchMode: (mode: 'presentation' | 'studio') => void;
  activeWheelName: string;
  onSelectWheelRole: (role: '1st' | '2nd' | '3rd') => void;
  soundSettings: SoundSettings;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const TopGeniallyBar: React.FC<TopGeniallyBarProps> = ({
  currentMode,
  onSwitchMode,
  activeWheelName,
  onSelectWheelRole,
  soundSettings,
  onUpdateSoundSettings,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
          <div className="mt-1 w-72 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-2.5 text-white text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header info */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>Switch View</span>
              <span className="text-amber-400 font-mono truncate max-w-[120px]">
                {activeWheelName}
              </span>
            </div>

            {/* Mode Switching Options */}
            <div className="space-y-1 py-1">
              <button
                onClick={() => {
                  onSwitchMode('presentation');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  currentMode === 'presentation'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Presentation Slides</span>
                </div>
                {currentMode === 'presentation' && (
                  <span className="text-[10px] font-black uppercase">Active</span>
                )}
              </button>

              <button
                onClick={() => {
                  onSwitchMode('studio');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  currentMode === 'studio'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Disc className="w-4 h-4 text-amber-400" />
                  <span>Wheel Creator Studio</span>
                </div>
                {currentMode === 'studio' && (
                  <span className="text-[10px] font-black uppercase">Active</span>
                )}
              </button>
            </div>

            {/* Quick Tiebreaker Wheel Selection */}
            <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-800 mt-1">
              Select Active Tiebreaker
            </div>
            <div className="grid grid-cols-3 gap-1 py-1">
              {(['1st', '2nd', '3rd'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onSelectWheelRole(role);
                    setIsOpen(false);
                  }}
                  className="py-1.5 px-1.5 text-center rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  {role} Place
                </button>
              ))}
            </div>

            {/* Toolbar Settings */}
            <div className="pt-2 border-t border-slate-800 mt-1 flex items-center justify-between px-1">
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
