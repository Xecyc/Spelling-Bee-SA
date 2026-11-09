import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, Play, Pause } from 'lucide-react';
import { StopwatchTimer } from './StopwatchTimer';
import { getSessionTimerDuration } from '../utils/timerSession';

export interface TimerActionSignal {
  type: 'start' | 'pause' | 'reset';
  ts: number;
}

interface WinnerModalProps {
  isOpen: boolean;
  word: string | null;
  sliceColor?: string;
  timerDuration?: number;
  onClose: () => void;
  onRemoveWord: () => void;
  onStartTimer: () => void;
  timerActionSignal?: TimerActionSignal | null;
  onTimerTick?: (timeLeft: number, isRunning: boolean) => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  word,
  sliceColor = '#FBBF24',
  timerDuration,
  onClose,
  onRemoveWord,
  onStartTimer,
  timerActionSignal,
  onTimerTick,
}) => {
  const initialDuration = timerDuration !== undefined ? timerDuration : getSessionTimerDuration();
  const [modalTimerTrigger, setModalTimerTrigger] = useState(0);
  // Bumped on a remote "reset" so the stopwatch is re-created at its full time (it keeps its own seconds).
  const [timerResetCount, setTimerResetCount] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSecondsRemaining, setCurrentSecondsRemaining] = useState<number>(initialDuration);
  const lastHandledSignalTsRef = React.useRef<number>(0);
  const onStartTimerRef = React.useRef(onStartTimer);
  const onTimerTickRef = React.useRef(onTimerTick);

  useEffect(() => {
    onStartTimerRef.current = onStartTimer;
    onTimerTickRef.current = onTimerTick;
  });

  const handleTimerTick = (seconds: number) => {
    setCurrentSecondsRemaining(seconds);
    onTimerTickRef.current?.(seconds, isTimerRunning);
  };

  const handleRunningChange = (running: boolean) => {
    setIsTimerRunning(running);
    onTimerTickRef.current?.(currentSecondsRemaining, running);
  };

  const handleDurationChange = (newSecs: number) => {
    setCurrentSecondsRemaining(newSecs);
    onTimerTickRef.current?.(newSecs, isTimerRunning);
  };

  // Sync external remote timer action signals (strictly one-shot execution per timestamp)
  useEffect(() => {
    if (!timerActionSignal || timerActionSignal.ts <= lastHandledSignalTsRef.current) return;
    lastHandledSignalTsRef.current = timerActionSignal.ts;

    if (timerActionSignal.type === 'start') {
      if (!hasStarted) {
        setModalTimerTrigger((prev) => prev + 1);
        setHasStarted(true);
      }
      setIsTimerRunning(true);
      onTimerTickRef.current?.(currentSecondsRemaining, true);
      if (onStartTimerRef.current) {
        onStartTimerRef.current();
      }
    } else if (timerActionSignal.type === 'pause') {
      setIsTimerRunning(false);
      onTimerTickRef.current?.(currentSecondsRemaining, false);
    } else if (timerActionSignal.type === 'reset') {
      const resetDuration = getSessionTimerDuration();
      setTimerResetCount((prev) => prev + 1);
      setIsTimerRunning(false);
      setHasStarted(false);
      setCurrentSecondsRemaining(resetDuration);
      onTimerTickRef.current?.(resetDuration, false);
    }
  }, [timerActionSignal, hasStarted, currentSecondsRemaining]);

  useEffect(() => {
    if (isOpen && word) {
      // Reset modal timer state when opened with a word, using session timer
      const duration = getSessionTimerDuration();
      setModalTimerTrigger(0);
      setTimerResetCount(0);
      setIsTimerRunning(false);
      setHasStarted(false);
      setCurrentSecondsRemaining(duration);
      onTimerTickRef.current?.(duration, false);
    }
  }, [isOpen, word]);

  if (!isOpen || !word) return null;

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      // Pause timer logic - no restart
      setIsTimerRunning(false);
    } else {
      // Start or Resume timer
      if (!hasStarted) {
        setModalTimerTrigger((prev) => prev + 1);
        setHasStarted(true);
      }
      setIsTimerRunning(true);
      onStartTimer();
    }
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
            key={`timer-${word}-${timerResetCount}`}
            initialSeconds={currentSecondsRemaining}
            autoStartTrigger={modalTimerTrigger}
            isRunning={isTimerRunning}
            onRunningChange={handleRunningChange}
            onTick={handleTimerTick}
            onDurationChange={handleDurationChange}
          />
        </div>

        {/* Action Buttons: Flat solid golden-yellow primary button, ghost secondary buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mt-4 w-full">
          <button
            onClick={handleToggleTimer}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#061a3e] font-black text-xs sm:text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer"
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Timer</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start timer</span>
              </>
            )}
          </button>

          <button
            onClick={onRemoveWord}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/50 hover:border-white font-bold text-xs sm:text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer"
            title="Remove this word from the wheel so it won't appear again"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
            <span>Remove Word</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/50 hover:border-white font-bold text-xs sm:text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
