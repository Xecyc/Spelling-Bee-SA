import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PresentationSlideId, WheelConfig, WheelSlice, WinnersData } from '../types/presentation';
import { WheelCanvas } from './WheelCanvas';
import { PodiumSlide } from './PodiumSlide';

interface PresentationDeckProps {
  currentSlide: PresentationSlideId;
  onSetSlide: (slide: PresentationSlideId) => void;
  activeWheel: WheelConfig;
  isWheelSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (slice: WheelSlice) => void;
  onStopSpin?: () => void;
  winnersData?: WinnersData | null;
  podiumAnimationKey?: number | string;
}

export const PresentationDeck: React.FC<PresentationDeckProps> = ({
  currentSlide,
  onSetSlide,
  activeWheel,
  isWheelSpinning,
  onSpinStart,
  onSpinEnd,
  onStopSpin,
  winnersData,
  podiumAnimationKey,
}) => {
  // Touch swipe support for mobile devices
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const isSpanishMode = activeWheel.language === 'es';
  const maxSlideIndex = isSpanishMode ? 1 : 2;

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Detect horizontal swipe gesture
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX > 0 && currentSlide < maxSlideIndex) {
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
      if (e.key === 'ArrowRight' && currentSlide < maxSlideIndex) {
        onSetSlide((currentSlide + 1) as PresentationSlideId);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        onSetSlide((currentSlide - 1) as PresentationSlideId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, maxSlideIndex, onSetSlide]);

  const goToPrev = () => {
    if (currentSlide > 0) {
      onSetSlide((currentSlide - 1) as PresentationSlideId);
    }
  };

  const goToNext = () => {
    if (currentSlide < maxSlideIndex) {
      onSetSlide((currentSlide + 1) as PresentationSlideId);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#061229] flex items-center justify-center select-none">
      {/* 1. Left Navigation Arrow with Transparent Hover-Zone */}
      {currentSlide > 0 && (
        <div
          className="fixed left-0 top-0 bottom-0 w-24 z-40 flex items-center justify-start pl-4 group pointer-events-auto"
          title="Hover to reveal previous slide button"
        >
          <button
            onClick={goToPrev}
            style={{ transition: 'opacity 0.3s ease, transform 0.2s ease, background-color 0.2s ease' }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#061a3e]/90 hover:bg-amber-400 text-blue-100 hover:text-[#061a3e] border border-blue-400/30 shadow-2xl backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Previous Slide"
            title="Previous Slide"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 2. Right Navigation Arrow with Transparent Hover-Zone */}
      {currentSlide < maxSlideIndex && (
        <div
          className="fixed right-0 top-0 bottom-0 w-24 z-40 flex items-center justify-end pr-4 group pointer-events-auto"
          title="Hover to reveal next slide button"
        >
          <button
            onClick={goToNext}
            style={{ transition: 'opacity 0.3s ease, transform 0.2s ease, background-color 0.2s ease' }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#061a3e]/90 hover:bg-amber-400 text-blue-100 hover:text-[#061a3e] border border-blue-400/30 shadow-2xl backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Next Slide"
            title="Next Slide"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 3. Responsive 16:9 Slide Stage */}
      <div
        className="relative aspect-video w-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] shadow-2xl overflow-hidden select-none bg-[#071739]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* SLIDE 0: Title Slide (Dynamic Elementary vs High School) */}
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            currentSlide === 0 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <img
            src={
              isSpanishMode
                ? `${import.meta.env.BASE_URL}assets/aistudio/image_5d551975.png`
                : activeWheel.group === 'high_school'
                ? `${import.meta.env.BASE_URL}assets/backgrounds/hs-welcome.jpg`
                : `${import.meta.env.BASE_URL}assets/backgrounds/elementary-welcome.png`
            }
            alt={
              isSpanishMode
                ? 'Salto Ángel Concurso de Deletreo Primaria 2026'
                : activeWheel.group === 'high_school'
                ? 'Salto Ángel Spelling Bee High School 2026'
                : 'Salto Ángel Spelling Bee Elementary 2026'
            }
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        </div>

        {/* SLIDE 1: Interactive Wheel & Stopwatch Timer (Dynamic Elementary vs High School) */}
        {/* Permanently mounted so WheelCanvas physics and rotation runs in background across all slides */}
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 overflow-hidden ${
            currentSlide === 1 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Clean background without static wheel/timer */}
          <img
            src={
              isSpanishMode
                ? `${import.meta.env.BASE_URL}assets/aistudio/image_a510c802.png`
                : activeWheel.group === 'high_school'
                ? `${import.meta.env.BASE_URL}assets/backgrounds/hs-wheel.jpg`
                : `${import.meta.env.BASE_URL}assets/backgrounds/elementary-wheel.jpg`
            }
            alt={
              isSpanishMode
                ? 'Salto Ángel Concurso de Deletreo Primaria 2026 - Ruleta'
                : activeWheel.group === 'high_school'
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
              {(() => {
                if (isSpanishMode) {
                  return 'PRIMARIA, 4TO A 6TO GRADO';
                }
                const isGeneral =
                  activeWheel.role === 'general' ||
                  activeWheel.place === 'general' ||
                  activeWheel.name.toLowerCase().includes('general');

                const cleanName = isGeneral
                  ? activeWheel.name.replace(/\s*[-–—]?\s*general\s*/gi, '').trim()
                  : activeWheel.name;

                return activeWheel.group === 'elementary'
                  ? `Elementary · ${cleanName}`
                  : cleanName || activeWheel.name;
              })()}
            </div>
          </div>

          {/* The Real Interactive Wheel Component in the center - Enlarged */}
          <div
            className="absolute flex items-center justify-center touch-manipulation"
            style={{
              left: '50%',
              top: '52%',
              height: '84%',
              maxHeight: 'calc(100% - 44px)',
              aspectRatio: '1 / 1',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <WheelCanvas
              slices={activeWheel.slices}
              isSpinning={isWheelSpinning}
              onSpinStart={onSpinStart}
              onSpinEnd={onSpinEnd}
              onStopSpin={onStopSpin}
              pointerPosition="right"
            />
          </div>
        </div>

        {/* SLIDE 2 / 3: Remote Controlled Winner Podium (English Mode Only) */}
        {!isSpanishMode && (
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              (currentSlide === 2 || currentSlide === 3)
                ? 'opacity-100 z-10 pointer-events-auto'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <PodiumSlide
              key={podiumAnimationKey || 'podium-slide'}
              isActive={currentSlide === 2 || currentSlide === 3}
              winners={winnersData || { first: '', second: '', third: '' }}
              backgroundUrl={
                activeWheel.group === 'high_school'
                  ? `${import.meta.env.BASE_URL}assets/backgrounds/hs-podium.jpg`
                  : `${import.meta.env.BASE_URL}assets/backgrounds/elementary-podium.png`
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
