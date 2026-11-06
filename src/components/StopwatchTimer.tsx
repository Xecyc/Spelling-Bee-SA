import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface StopwatchTimerProps {
  initialSeconds?: number;
  autoStartTrigger?: number; // increments or changes when auto-start requested
  onTimeEnd?: () => void;
}

export const StopwatchTimer: React.FC<StopwatchTimerProps> = ({
  initialSeconds = 40,
  autoStartTrigger,
  onTimeEnd,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Sync when initialSeconds changes
  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setSecondsRemaining(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  // Handle auto-start trigger from winning word
  useEffect(() => {
    if (autoStartTrigger && autoStartTrigger > 0) {
      setSecondsRemaining(totalSeconds);
      setIsRunning(true);
    }
  }, [autoStartTrigger, totalSeconds]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            audioManager.playTimerFinished();
            if (onTimeEnd) onTimeEnd();
            setIsRunning(false);
            return 0;
          }
          if (prev <= 6) {
            audioManager.playTimerWarning();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeEnd]);

  const toggleRunning = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(totalSeconds);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(totalSeconds);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = secondsRemaining <= 5 && secondsRemaining > 0;
  const isExpired = secondsRemaining === 0;

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Exact opaque pill-shaped container matching Image 3 */}
      <div
        className={`w-full h-full flex items-center justify-between px-3 md:px-4 py-1.5 rounded-full border-2 shadow-2xl transition-all duration-200 select-none ${
          isExpired
            ? 'bg-rose-950 border-rose-500 text-rose-200 shadow-rose-900/60'
            : isWarning
            ? 'bg-amber-950 border-amber-500 text-amber-200 shadow-amber-900/60 animate-pulse'
            : 'bg-[#E5E9EC] border-[#CBD5E1] text-[#292E33] shadow-slate-900/40'
        }`}
      >
        {/* Stopwatch Icon Circle */}
        <div
          className={`h-[72%] aspect-square rounded-full flex items-center justify-center border transition-colors shrink-0 ${
            isExpired
              ? 'bg-rose-600 border-white text-white'
              : isWarning
              ? 'bg-amber-500 border-amber-200 text-slate-900'
              : 'bg-[#292E33] border-[#1E293B] text-white shadow-inner'
          }`}
          title="Spelling Bee Timer"
        >
          <Timer className="w-[55%] h-[55%] stroke-[2.2]" />
        </div>

        {/* Big Digital Numbers */}
        <div className="flex-1 flex items-center justify-center px-1">
          <span
            className={`font-mono font-black tracking-wider select-none tabular-nums text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-none ${
              isExpired
                ? 'text-rose-400'
                : isWarning
                ? 'text-amber-300'
                : 'text-[#292E33]'
            }`}
          >
            {formatTime(secondsRemaining)}
          </span>
        </div>

        {/* Controls Container: Two stacked circular red buttons */}
        <div className="flex flex-col gap-1 shrink-0 justify-center h-[82%]">
          {/* Red Play / Pause Button */}
          <button
            onClick={toggleRunning}
            className="h-[46%] aspect-square rounded-full bg-[#E82C4A] hover:bg-[#d02440] active:scale-90 text-white flex items-center justify-center shadow-xs transition-transform cursor-pointer"
            title={isRunning ? 'Pause Timer' : 'Start Timer'}
            aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? (
              <Pause className="w-[45%] h-[45%] fill-current" />
            ) : (
              <Play className="w-[45%] h-[45%] fill-current ml-[8%]" />
            )}
          </button>

          {/* Red Reset Button */}
          <button
            onClick={handleReset}
            className="h-[46%] aspect-square rounded-full bg-[#E82C4A] hover:bg-[#d02440] active:scale-90 text-white flex items-center justify-center shadow-xs transition-transform cursor-pointer"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-[45%] h-[45%] stroke-[2.6]" />
          </button>
        </div>
      </div>
    </div>
  );
};
