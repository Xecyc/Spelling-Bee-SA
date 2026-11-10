import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { audioManager } from '../utils/audio';
import {
  DEFAULT_TIMER_SECONDS,
  getSessionTimerDuration,
  setSessionTimerDuration,
  resetSessionTimerDuration,
} from '../utils/timerSession';

interface StopwatchTimerProps {
  initialSeconds?: number;
  autoStartTrigger?: number; // increments or changes when auto-start requested
  isRunning?: boolean;
  onRunningChange?: (running: boolean) => void;
  onTimeEnd?: () => void;
  onTick?: (secondsRemaining: number) => void;
  onDurationChange?: (newSeconds: number) => void;
}

export const StopwatchTimer: React.FC<StopwatchTimerProps> = ({
  initialSeconds,
  autoStartTrigger,
  isRunning: controlledIsRunning,
  onRunningChange,
  onTimeEnd,
  onTick,
  onDurationChange,
}) => {
  const sessionInitial = getSessionTimerDuration();
  const effectiveInitial = initialSeconds !== undefined ? initialSeconds : sessionInitial;

  const [totalSeconds, setTotalSeconds] = useState(effectiveInitial);
  const [secondsRemaining, setSecondsRemaining] = useState(effectiveInitial);
  const [internalIsRunning, setInternalIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(effectiveInitial));

  const intervalRef = useRef<number | null>(null);
  const lastTriggerRef = useRef(autoStartTrigger || 0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isRunning = typeof controlledIsRunning === 'boolean' ? controlledIsRunning : internalIsRunning;

  const onRunningChangeRef = useRef(onRunningChange);
  const onTimeEndRef = useRef(onTimeEnd);
  const onTickRef = useRef(onTick);
  const onDurationChangeRef = useRef(onDurationChange);

  useEffect(() => {
    onRunningChangeRef.current = onRunningChange;
    onTimeEndRef.current = onTimeEnd;
    onTickRef.current = onTick;
    onDurationChangeRef.current = onDurationChange;
  });

  useEffect(() => {
    onTickRef.current?.(secondsRemaining);
  }, [secondsRemaining]);

  const setRunningState = (val: boolean) => {
    setInternalIsRunning(val);
    onRunningChangeRef.current?.(val);
  };

  // Sync with controlled prop if passed
  useEffect(() => {
    if (typeof controlledIsRunning === 'boolean') {
      setInternalIsRunning(controlledIsRunning);
    }
  }, [controlledIsRunning]);

  // Sync when initialSeconds changes (e.g. configured duration changed while stopped)
  const prevInitialSecondsRef = useRef(initialSeconds);
  useEffect(() => {
    if (initialSeconds !== undefined && initialSeconds !== prevInitialSecondsRef.current) {
      prevInitialSecondsRef.current = initialSeconds;
      setTotalSeconds(initialSeconds);
      if (!isRunning) {
        setSecondsRemaining(initialSeconds);
        setEditValue(String(initialSeconds));
      }
    }
  }, [initialSeconds, isRunning]);

  // Auto-focus and select text when editing begins
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Handle auto-start trigger only when explicitly incremented by user action
  useEffect(() => {
    if (autoStartTrigger && autoStartTrigger > 0 && autoStartTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = autoStartTrigger;
      setSecondsRemaining((prev) => (prev <= 0 ? totalSeconds : prev));
      setRunningState(true);
    } else if (typeof autoStartTrigger === 'number') {
      lastTriggerRef.current = autoStartTrigger;
    }
  }, [autoStartTrigger, totalSeconds]);

  // Timer interval
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          audioManager.playTimerFinished();
          onTimeEndRef.current?.();
          setInternalIsRunning(false);
          onRunningChangeRef.current?.(false);
          return 0;
        }
        if (prev <= 11) {
          audioManager.playTimerWarning();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const toggleRunning = () => {
    if (isEditing) {
      commitEdit();
    }
    if (secondsRemaining === 0) {
      setSecondsRemaining(totalSeconds);
      setRunningState(true);
    } else {
      setRunningState(!isRunning);
    }
  };

  // Reset restores countdown to the previously saved duration
  const handleReset = () => {
    setRunningState(false);
    const saved = getSessionTimerDuration();
    setTotalSeconds(saved);
    setSecondsRemaining(saved);
    setEditValue(String(saved));
    setIsEditing(false);
    onTickRef.current?.(saved);
  };

  const commitEdit = () => {
    setIsEditing(false);
    const clean = editValue.trim().replace(/\D/g, '');
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 600) {
      setTotalSeconds(parsed);
      setSecondsRemaining(parsed);
      setSessionTimerDuration(parsed);
      setEditValue(String(parsed));
      onDurationChangeRef.current?.(parsed);
      onTickRef.current?.(parsed);
    } else {
      setEditValue(String(totalSeconds));
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(String(totalSeconds));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = secondsRemaining <= 10 && secondsRemaining > 0;
  const isExpired = secondsRemaining === 0;

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Aesthetic minimalist timer widget matching presentation style */}
      <div
        className={`w-full h-full flex items-center justify-between px-3 md:px-4 py-1.5 rounded-full border transition-all duration-200 select-none ${
          isExpired
            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
            : isWarning
            ? 'bg-amber-950/40 border-amber-400/60 text-amber-200 animate-pulse'
            : 'bg-transparent border-white/40 text-white'
        }`}
      >
        {/* Stopwatch Icon Circle */}
        <div
          className={`h-[72%] aspect-square rounded-full flex items-center justify-center border transition-colors shrink-0 ${
            isExpired
              ? 'border-rose-400/60 text-rose-300 bg-transparent'
              : isWarning
              ? 'border-amber-400/60 text-amber-300 bg-transparent'
              : 'border-white/40 text-white bg-transparent'
          }`}
          title="Spelling Bee Timer"
        >
          <Timer className="w-[55%] h-[55%] stroke-[2.2]" />
        </div>

        {/* Big Digital Numbers with Inline Typing */}
        <div className="flex-1 flex items-center justify-center px-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              className="w-16 sm:w-20 md:w-24 text-center font-mono font-black tracking-wider text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-none bg-transparent text-white border-b-2 border-amber-400 outline-none tabular-nums"
              maxLength={3}
            />
          ) : (
            <span
              onClick={() => {
                if (!isRunning) {
                  setEditValue(String(secondsRemaining > 0 ? secondsRemaining : totalSeconds));
                  setIsEditing(true);
                }
              }}
              className={`font-mono font-black tracking-wider select-none tabular-nums text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-none transition-colors ${
                !isRunning ? 'cursor-pointer hover:text-amber-300' : ''
              } ${
                isExpired
                  ? 'text-rose-400'
                  : isWarning
                  ? 'text-amber-300'
                  : 'text-white'
              }`}
              title={!isRunning ? 'Click to type custom seconds' : undefined}
            >
              {formatTime(secondsRemaining)}
            </span>
          )}
        </div>

        {/* Controls Container: Two stacked circular solid white buttons */}
        <div className="flex flex-col gap-1 shrink-0 justify-center h-[82%]">
          {/* Solid White Play / Pause Button */}
          <button
            onClick={toggleRunning}
            className="h-[46%] aspect-square rounded-full bg-white hover:bg-slate-200 active:scale-90 text-[#061a3e] flex items-center justify-center transition-transform cursor-pointer shadow-none"
            title={isRunning ? 'Pause Timer' : 'Start Timer'}
            aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? (
              <Pause className="w-[45%] h-[45%] fill-current" />
            ) : (
              <Play className="w-[45%] h-[45%] fill-current ml-[8%]" />
            )}
          </button>

          {/* Solid White Reset Button */}
          <button
            onClick={handleReset}
            className="h-[46%] aspect-square rounded-full bg-white hover:bg-slate-200 active:scale-90 text-[#061a3e] flex items-center justify-center transition-transform cursor-pointer shadow-none"
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
