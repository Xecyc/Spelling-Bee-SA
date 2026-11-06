import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PresentationSlideId, WheelConfig, WheelSlice } from '../types/presentation';
import { WheelCanvas } from './WheelCanvas';
import { StopwatchTimer } from './StopwatchTimer';
import { audioManager } from '../utils/audio';

interface PresentationDeckProps {
  currentSlide: PresentationSlideId;
  onSetSlide: (slide: PresentationSlideId) => void;
  activeWheel: WheelConfig;
  onSelectWheelRole: (role: '1st' | '2nd' | '3rd') => void;
  isWheelSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (slice: WheelSlice) => void;
  autoStartTimerTrigger: number;
  onOpenStudio: () => void;
}

export const PresentationDeck: React.FC<PresentationDeckProps> = ({
  currentSlide,
  onSetSlide,
  activeWheel,
  onSelectWheelRole,
  isWheelSpinning,
  onSpinStart,
  onSpinEnd,
  autoStartTimerTrigger,
  onOpenStudio,
}) => {
  const [leftArrowHovered, setLeftArrowHovered] = useState(false);
  const [rightArrowHovered, setRightArrowHovered] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' && currentSlide < 3) {
        onSetSlide((currentSlide + 1) as PresentationSlideId);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        onSetSlide((currentSlide - 1) as PresentationSlideId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, onSetSlide]);

  const goToPrev = () => {
    if (currentSlide > 0) {
      onSetSlide((currentSlide - 1) as PresentationSlideId);
    }
  };

  const goToNext = () => {
    if (currentSlide < 3) {
      onSetSlide((currentSlide + 1) as PresentationSlideId);
    }
  };

  const handleSelectTiebreaker = (role: '1st' | '2nd' | '3rd') => {
    audioManager.playTick(1.2);
    onSelectWheelRole(role);
    onSetSlide(2);
  };

  const triggerCelebrationConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#F87171'],
    });
    audioManager.playFanfare();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#061229] flex items-center justify-center select-none">
      {/* 1. Left Auto-hiding Hover Navigation Arrow (100% hidden when not hovered) */}
      {currentSlide > 0 && (
        <div
          className="fixed left-0 top-0 bottom-0 w-20 z-40 flex items-center justify-start pl-4 cursor-pointer"
          onMouseEnter={() => setLeftArrowHovered(true)}
          onMouseLeave={() => setLeftArrowHovered(false)}
          onClick={goToPrev}
          role="button"
          aria-label="Previous Slide"
        >
          <div
            className={`w-12 h-12 rounded-full bg-slate-900/90 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 transform ${
              leftArrowHovered
                ? 'opacity-100 translate-x-0 scale-110 pointer-events-auto'
                : 'opacity-0 -translate-x-full pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* 2. Right Auto-hiding Hover Navigation Arrow (100% hidden when not hovered) */}
      {currentSlide < 3 && (
        <div
          className="fixed right-0 top-0 bottom-0 w-20 z-40 flex items-center justify-end pr-4 cursor-pointer"
          onMouseEnter={() => setRightArrowHovered(true)}
          onMouseLeave={() => setRightArrowHovered(false)}
          onClick={goToNext}
          role="button"
          aria-label="Next Slide"
        >
          <div
            className={`w-12 h-12 rounded-full bg-slate-900/90 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 transform ${
              rightArrowHovered
                ? 'opacity-100 translate-x-0 scale-110 pointer-events-auto'
                : 'opacity-0 translate-x-full pointer-events-none'
            }`}
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* 3. Responsive 16:9 Slide Stage */}
      <div className="relative aspect-video w-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] shadow-2xl overflow-hidden select-none bg-[#071739]">
        {/* SLIDE 0: Title Slide (Image 2) */}
        {currentSlide === 0 && (
          <div className="relative w-full h-full animate-in fade-in duration-300">
            <img
              src="/assets/aistudio/image_b5f00fc8.png"
              alt="Salto Ángel Spelling Bee Elementary 2026"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          </div>
        )}

        {/* SLIDE 1: "It's a Tie!" Interactive Hub (Image 4) - Pure links without animations */}
        {currentSlide === 1 && (
          <div className="relative w-full h-full animate-in fade-in duration-300">
            {/* The exact slide image as the base */}
            <img
              src="/assets/aistudio/image_9aadae19.png"
              alt="It's a Tie! 1st, 2nd, 3rd Place Tiebreaker Selector"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Direct Link Hotspot for 1st Place */}
            <div
              className="absolute cursor-pointer"
              style={{
                left: '26%',
                top: '49%',
                width: '16%',
                height: '35%',
              }}
              onClick={() => handleSelectTiebreaker('1st')}
              title="1st Place Tiebreaker"
              role="button"
              tabIndex={0}
            />

            {/* Direct Link Hotspot for 2nd Place */}
            <div
              className="absolute cursor-pointer"
              style={{
                left: '43%',
                top: '49%',
                width: '17%',
                height: '35%',
              }}
              onClick={() => handleSelectTiebreaker('2nd')}
              title="2nd Place Tiebreaker"
              role="button"
              tabIndex={0}
            />

            {/* Direct Link Hotspot for 3rd Place */}
            <div
              className="absolute cursor-pointer"
              style={{
                left: '62%',
                top: '49%',
                width: '24%',
                height: '35%',
              }}
              onClick={() => handleSelectTiebreaker('3rd')}
              title="3rd Place Tiebreaker"
              role="button"
              tabIndex={0}
            />
          </div>
        )}

        {/* SLIDE 2: Interactive Wheel & Stopwatch Timer */}
        {currentSlide === 2 && (
          <div className="relative w-full h-full animate-in fade-in duration-300 overflow-hidden">
            {/* The new clean background without static wheel/timer */}
            <img
              src="/assets/aistudio/Gemini_Generated_Image_wxqydhwxqydhwxqy__1__ed331ba7.jpg"
              alt="Salto Ángel Wheel of Names Challenge"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* The Real Interactive Wheel Component in the center */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: '50%',
                top: '43%',
                height: '68%',
                maxHeight: 'calc(100% - 95px)',
                aspectRatio: '1 / 1',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <WheelCanvas
                slices={activeWheel.slices}
                isSpinning={isWheelSpinning}
                onSpinStart={onSpinStart}
                onSpinEnd={onSpinEnd}
                pointerPosition="top"
              />
            </div>

            {/* The Real Interactive Stopwatch Timer in the middle */}
            <div
              className="absolute z-20 flex items-center justify-center pointer-events-auto"
              style={{
                left: '50%',
                top: '88%',
                width: 'clamp(260px, 28%, 340px)',
                height: 'clamp(52px, 11%, 66px)',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <StopwatchTimer
                initialSeconds={40}
                autoStartTrigger={autoStartTimerTrigger}
              />
            </div>
          </div>
        )}

        {/* SLIDE 3: Champion Celebration (Image 5) */}
        {currentSlide === 3 && (
          <div
            className="relative w-full h-full cursor-pointer animate-in fade-in duration-300"
            onClick={triggerCelebrationConfetti}
            title="Click to celebrate!"
          >
            <img
              src="/assets/aistudio/image_d2ab69fa.png"
              alt="Spelling Bee Elementary 2026 Champion Celebration"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Interactive Celebration Action Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetSlide(1);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs tracking-wider uppercase shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Return to Tiebreakers</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudio();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-950/80 hover:bg-slate-950 text-amber-300 border border-amber-400/40 font-bold text-xs tracking-wider uppercase shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Wheel Studio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
