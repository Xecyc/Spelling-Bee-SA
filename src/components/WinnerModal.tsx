import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trash2, CheckCircle2, Play } from 'lucide-react';
import { StopwatchTimer } from './StopwatchTimer';

interface WinnerModalProps {
  isOpen: boolean;
  word: string | null;
  sliceColor?: string;
  timerDuration?: number;
  onClose: () => void;
  onRemoveWord: () => void;
  onStartTimer: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  word,
  sliceColor = '#FBBF24',
  timerDuration = 40,
  onClose,
  onRemoveWord,
  onStartTimer,
}) => {
  const [modalTimerTrigger, setModalTimerTrigger] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (isOpen && word) {
      // Reset modal timer state when opened with a word
      setModalTimerTrigger(0);
      setIsTimerRunning(false);

      // Trigger confetti explosion (visual only, no sound)
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#A78BFA'],
      });

      // Secondary burst for celebration
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    }
  }, [isOpen, word]);

  if (!isOpen || !word) return null;

  const handleStartTimer = () => {
    setModalTimerTrigger((prev) => prev + 1);
    setIsTimerRunning(true);
    onStartTimer();
  };

  // Dynamic font sizing based on word length to always guarantee one single line
  const getWordFontSizeClass = (text: string) => {
    const len = text.length;
    if (len <= 6) return 'text-5xl sm:text-6xl';
    if (len <= 9) return 'text-4xl sm:text-5xl';
    if (len <= 12) return 'text-3xl sm:text-4xl';
    if (len <= 16) return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl sm:max-w-2xl my-auto bg-[#061a3e] rounded-3xl p-8 sm:p-12 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col items-center justify-center"
        style={{ margin: 'auto' }}
      >
        {/* Winning Word Display: Crisp, solid golden-yellow with bold sans-serif, no glow */}
        <div className="my-3 py-2 px-4 w-full flex items-center justify-center overflow-hidden">
          <h2
            className={`${getWordFontSizeClass(word)} font-sans font-black tracking-wider text-amber-400 whitespace-nowrap select-all uppercase`}
          >
            {word}
          </h2>
        </div>

        {/* Integrated Countdown Timer on the Window */}
        <div className="my-5 flex items-center justify-center h-14 sm:h-16 w-full max-w-[280px] sm:max-w-[320px]">
          <StopwatchTimer
            key={`timer-${word}-${timerDuration}`}
            initialSeconds={timerDuration}
            autoStartTrigger={modalTimerTrigger}
          />
        </div>

        {/* Action Buttons: Flat solid golden-yellow primary button, ghost secondary buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-4 w-full">
          <button
            onClick={handleStartTimer}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#061a3e] font-black text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isTimerRunning ? `Restart ${timerDuration}s Timer` : `Start ${timerDuration}s Timer`}</span>
          </button>

          <button
            onClick={onRemoveWord}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/50 hover:border-white font-bold text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer"
            title="Remove this word from the wheel so it won't appear again"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>Remove Word</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/50 hover:border-white font-bold text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
