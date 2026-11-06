import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { SoundSettings, PresentationSlideId } from '../types/presentation';
import { audioManager } from '../utils/audio';

interface BottomGeniallyBarProps {
  currentSlide: PresentationSlideId;
  totalSlides: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onGoToSlide: (slideIndex: PresentationSlideId) => void;
  soundSettings: SoundSettings;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  slideTitles: string[];
}

export const BottomGeniallyBar: React.FC<BottomGeniallyBarProps> = ({
  currentSlide,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  onGoToSlide,
  soundSettings,
  onUpdateSoundSettings,
  isFullscreen,
  onToggleFullscreen,
  slideTitles,
}) => {
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isBarHovered, setIsBarHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <>
      {/* Slide Thumbnails Drawer Modal */}
      {showThumbnails && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-extrabold text-sm tracking-wide">
                Slide Navigator ({totalSlides} Slides)
              </h4>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {slideTitles.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onGoToSlide(idx as PresentationSlideId);
                    setShowThumbnails(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentSlide === idx
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400 mb-1">
                    SLIDE {idx + 1}
                  </div>
                  <div className="text-xs font-bold truncate">{title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Pill (Genially style) - 100% hidden when not hovered */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-2"
        onMouseEnter={() => setIsBarHovered(true)}
        onMouseLeave={() => setIsBarHovered(false)}
      >
        {/* Invisible hover trigger strip at the very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-auto cursor-pointer" />

        <div
          className={`transition-all duration-300 ease-out transform flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 border border-white/20 shadow-2xl backdrop-blur-md ${
            isBarHovered || isTouchDevice
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-full scale-95 pointer-events-none'
          }`}
        >
          {/* Previous Slide Button */}
          <button
            onClick={onPrevSlide}
            disabled={currentSlide === 0}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Slide Counter (e.g., 2 / 4) */}
          <div className="px-1.5 sm:px-2 text-white font-mono text-xs font-bold tracking-wider select-none">
            {currentSlide + 1} / {totalSlides}
          </div>

          {/* Next Slide Button */}
          <button
            onClick={onNextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5 sm:mx-1" />

          {/* Thumbnails Navigator Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="p-1 rounded-full text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
            title="Slide Thumbnails"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundSettings.enabled;
              onUpdateSoundSettings({ ...soundSettings, enabled: next });
              audioManager.setMuted(!next);
            }}
            className="p-1 rounded-full text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
            title={soundSettings.enabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundSettings.enabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1 rounded-full text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
