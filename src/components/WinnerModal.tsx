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
    <div className="fixed inset-0 z-50 w-full h-full min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl sm:max-w-2xl my-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden flex flex-col items-center justify-center"
        style={{ margin: 'auto' }}
      >
        {/* Decorative background glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: sliceColor }}
        />

        {/* Clean Winning Word Display: Strictly on a single line */}
        <div className="my-2 py-2 px-2 w-full flex items-center justify-center overflow-hidden">
          <h2
            className={`${getWordFontSizeClass(word)} font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-md whitespace-nowrap select-all`}
            style={{
              textShadow: '0 4px 25px rgba(251, 191, 36, 0.5)',
            }}
          >
            {word}
          </h2>
        </div>

        {/* Integrated Countdown Timer on the Window */}
        <div className="my-3 flex items-center justify-center h-14 sm:h-16 w-full max-w-[280px] sm:max-w-[320px]">
          <StopwatchTimer
            initialSeconds={timerDuration}
            autoStartTrigger={modalTimerTrigger}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-3 w-full">
          <button
            onClick={handleStartTimer}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isTimerRunning ? `Restart ${timerDuration}s Timer` : `Start ${timerDuration}s Timer`}</span>
          </button>

          <button
            onClick={onRemoveWord}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/20 font-semibold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Remove this word from the wheel so it won't appear again"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Remove Word</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Keep & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
