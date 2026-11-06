import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PresentationSlideId, WheelConfig, WheelSlice } from '../types/presentation';
import { WheelCanvas } from './WheelCanvas';
import { StopwatchTimer } from './StopwatchTimer';

interface PresentationDeckProps {
  currentSlide: PresentationSlideId;
  onSetSlide: (slide: PresentationSlideId) => void;
  activeWheel: WheelConfig;
  isWheelSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (slice: WheelSlice) => void;
  autoStartTimerTrigger: number;
}

export const PresentationDeck: React.FC<PresentationDeckProps> = ({
  currentSlide,
  onSetSlide,
  activeWheel,
  isWheelSpinning,
  onSpinStart,
  onSpinEnd,
  autoStartTimerTrigger,
}) => {
  // Touch swipe support for mobile devices
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Detect horizontal swipe gesture
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX > 0 && currentSlide < 2) {
        goToNext();
      } else if (diffX < 0 && currentSlide > 0) {
        goToPrev();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' && currentSlide < 2) {
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
    if (currentSlide < 2) {
      onSetSlide((currentSlide + 1) as PresentationSlideId);
    }
  };

  const triggerCelebrationConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#F87171'],
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#061229] flex items-center justify-center select-none">
      {/* 1. Left Navigation Arrow - Circular button only, NOT covering whole Y axis */}
      {currentSlide > 0 && (
        <button
          onClick={goToPrev}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-70 hover:opacity-100"
          aria-label="Previous Slide"
          title="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* 2. Right Navigation Arrow - Circular button only, NOT covering whole Y axis */}
      {currentSlide < 2 && (
        <button
          onClick={goToNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-70 hover:opacity-100"
          aria-label="Next Slide"
          title="Next Slide"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* 3. Responsive 16:9 Slide Stage */}
      <div
        className="relative aspect-video w-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] shadow-2xl overflow-hidden select-none bg-[#071739]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* SLIDE 0: Title Slide (Dynamic Elementary vs High School) */}
        {currentSlide === 0 && (
          <div className="relative w-full h-full animate-in fade-in duration-300">
            <img
              src={
                activeWheel.group === 'high_school'
                  ? '/assets/aistudio/480b2e32-4249-44c9-83bd-7e91fc5cbdba_0097f3f2.jpg'
                  : '/assets/aistudio/image_b5f00fc8.png'
              }
              alt={
                activeWheel.group === 'high_school'
                  ? 'Salto Ángel Spelling Bee High School 2026'
                  : 'Salto Ángel Spelling Bee Elementary 2026'
              }
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          </div>
        )}

        {/* SLIDE 1: Interactive Wheel & Stopwatch Timer (Dynamic Elementary vs High School) */}
        {currentSlide === 1 && (
          <div className="relative w-full h-full animate-in fade-in duration-300 overflow-hidden">
            {/* Clean background without static wheel/timer */}
            <img
              src={
                activeWheel.group === 'high_school'
                  ? '/assets/aistudio/8d019f05-30e0-4935-904c-e42987682443_a0014e1b.jpg'
                  : '/assets/aistudio/Gemini_Generated_Image_wxqydhwxqydhwxqy__1__ed331ba7.jpg'
              }
              alt={
                activeWheel.group === 'high_school'
                  ? 'Salto Ángel High School Wheel Challenge'
                  : 'Salto Ángel Elementary Wheel Challenge'
              }
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Minimal Group & Wheel Header Indicator (Zero Bloat) */}
            <div
              className="absolute z-20 pointer-events-none select-none text-center"
              style={{
                left: '50%',
                top: '5%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="text-xs sm:text-sm md:text-base font-black tracking-wider text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] uppercase">
                {activeWheel.group === 'elementary'
                  ? `Elementary · ${activeWheel.name}`
                  : activeWheel.name}
              </div>
            </div>

            {/* The Real Interactive Wheel Component in the center */}
            <div
              className="absolute flex items-center justify-center touch-manipulation"
              style={{
                left: '50%',
                top: '43%',
                height: '68%',
                maxHeight: 'calc(100% - 90px)',
                aspectRatio: '1 / 1',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <WheelCanvas
                slices={activeWheel.slices}
                isSpinning={isWheelSpinning}
                onSpinStart={onSpinStart}
                onSpinEnd={onSpinEnd}
                pointerPosition="right"
              />
            </div>

            {/* The Real Interactive Stopwatch Timer in the middle */}
            <div
              className="absolute z-20 flex items-center justify-center pointer-events-auto touch-manipulation"
              style={{
                left: '50%',
                top: '88%',
                width: 'clamp(250px, 28%, 340px)',
                height: 'clamp(50px, 11%, 66px)',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <StopwatchTimer
                initialSeconds={activeWheel.timerDuration ?? 40}
                autoStartTrigger={autoStartTimerTrigger}
              />
            </div>
          </div>
        )}

        {/* SLIDE 2: Champion Celebration (Image 5) - Strictly without buttons */}
        {currentSlide === 2 && (
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
          </div>
        )}
      </div>
    </div>
  );
};
