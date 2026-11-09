import React, { useState, useEffect, useCallback } from 'react';
import {
  Disc,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  X,
  Send,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Loader2,
  Square,
} from 'lucide-react';
import { useStageSync, StageSyncState, getSocket } from '../hooks/useStageSync';
import { useContestStore } from '../store';

interface WinnersState {
  first: string;
  second: string;
  third: string;
}

interface RemoteControlProps {
  onReturnToStage?: () => void;
  onPushWinners?: (data: WinnersState) => void;
  onSpinWheel?: () => void;
}

function computeStageReturnUrl(): string {
  if (typeof window === 'undefined') return '/';

  // 1. Query parameter ?from=
  try {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('from');
    if (fromParam) {
      const decoded = decodeURIComponent(fromParam);
      if (decoded.startsWith('http') || decoded.startsWith('/')) {
        return decoded;
      }
    }
  } catch {}

  // 2. Saved base URL from localStorage
  try {
    const saved = localStorage.getItem('salto_angel_stage_base_url');
    if (saved && !saved.includes('/remote') && !saved.includes('view=remote')) {
      return saved;
    }
  } catch {}

  // 3. Query string view=remote
  if (window.location.search.includes('view=remote') || window.location.search.includes('remote=')) {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('view');
      u.searchParams.delete('remote');
      return u.toString();
    } catch {}
  }

  // 4. If pathname ends with /remote
  const pathname = window.location.pathname.replace(/\/remote(\/index\.html|\.html)?\/?$/, '');
  if (pathname && pathname !== '/') {
    return `${window.location.origin}${pathname.endsWith('/') ? pathname : pathname + '/'}`;
  }

  // 5. Referrer fallback
  if (document.referrer && document.referrer.includes(window.location.hostname)) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.pathname && refUrl.pathname !== '/' && !refUrl.pathname.includes('/remote')) {
        return `${window.location.origin}${refUrl.pathname.endsWith('/') ? refUrl.pathname : refUrl.pathname + '/'}`;
      }
    } catch {}
  }

  return `${window.location.origin}/`;
}

export const RemoteControl: React.FC<RemoteControlProps> = ({
  onReturnToStage,
  onPushWinners,
  onSpinWheel,
}) => {
  const isConnected = useContestStore((s) => s.isConnected);

  const [winners, setWinners] = useState<WinnersState>({
    first: '',
    second: '',
    third: '',
  });

  const [stageState, setStageState] = useState<StageSyncState>({
    isSpinning: false,
    showWinnerModal: false,
    winningWord: null,
    currentWheelName: '',
    timerDuration: 40,
  });

  const remoteSpinTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accordion drop-down menus
  const [isRouletteOpen, setIsRouletteOpen] = useState(true);
  const [isPodiumOpen, setIsPodiumOpen] = useState(false);

  const [lastAction, setLastAction] = useState<string | null>(null);
  const [stageReturnUrl, setStageReturnUrl] = useState<string>('/');

  const showToast = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => {
      setLastAction((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleStageState = useCallback((newState: StageSyncState) => {
    setStageState((prev) => {
      // Only reset seconds if a new winning word arrived from stage
      if (newState.winningWord && newState.winningWord !== prev.winningWord) {
        setIsRemoteTimerRunning(false);
        setRemoteSecondsRemaining(newState.timerDuration || prev.timerDuration || 40);
      } else if (
        typeof newState.timerDuration === 'number' &&
        newState.timerDuration !== prev.timerDuration &&
        !prev.winningWord
      ) {
        setRemoteSecondsRemaining(newState.timerDuration);
      }
      return { ...prev, ...newState };
    });
  }, []);

  const {
    pushWinners,
    clearBoard,
    spinWheel,
    stopSpin,
    startTimer,
    pauseTimer,
    resetTimer,
    removeWord,
    closeModal,
    requestStageState,
  } = useStageSync({
    onStageState: handleStageState,
  });

  const [remoteSecondsRemaining, setRemoteSecondsRemaining] = useState<number>(40);
  const [isRemoteTimerRunning, setIsRemoteTimerRunning] = useState<boolean>(false);

  // Live remote countdown ticker
  useEffect(() => {
    if (!isRemoteTimerRunning) return;
    const interval = setInterval(() => {
      setRemoteSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsRemoteTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRemoteTimerRunning]);

  // Request stage state on mount and when phone screen wakes up
  useEffect(() => {
    setStageReturnUrl(computeStageReturnUrl());
    requestStageState();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestStageState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handleShowWinners = (data: WinnersState) => {
      if (data) {
        setWinners({
          first: data.first || '',
          second: data.second || '',
          third: data.third || '',
        });
      }
    };

    socket.on('show_winners', handleShowWinners);
    return () => {
      socket.off('show_winners', handleShowWinners);
    };
  }, []);

  const lastSpinClickTimeRef = React.useRef<number>(0);

  // Action: Spin or Stop the stage wheel
  const handleSpinClick = () => {
    const now = Date.now();
    if (now - lastSpinClickTimeRef.current < 450) return;
    lastSpinClickTimeRef.current = now;

    // Attempt socket reconnection if currently disconnected
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    if (stageState.isSpinning) {
      if (remoteSpinTimeoutRef.current) clearTimeout(remoteSpinTimeoutRef.current);
      stopSpin();
      setStageState((prev) => ({ ...prev, isSpinning: false }));
      showToast('Stopping wheel...');
      return;
    }

    setIsRemoteTimerRunning(false);
    setStageState((prev) => ({ ...prev, isSpinning: true }));

    // 7.5s fail-safe watchdog timer on remote: guarantees button unlocks even if network drops
    if (remoteSpinTimeoutRef.current) clearTimeout(remoteSpinTimeoutRef.current);
    remoteSpinTimeoutRef.current = setTimeout(() => {
      setStageState((prev) => ({ ...prev, isSpinning: false }));
    }, 7500);

    spinWheel();
    if (onSpinWheel) {
      onSpinWheel();
    }
    showToast('Wheel spun on stage!');
  };

  // Action: Start Countdown Timer
  const handleStartTimerClick = () => {
    if (remoteSecondsRemaining <= 0) {
      setRemoteSecondsRemaining(stageState.timerDuration || 40);
    }
    setIsRemoteTimerRunning(true);
    startTimer();
    showToast('Timer started on stage');
  };

  // Action: Pause Countdown Timer
  const handlePauseTimerClick = () => {
    setIsRemoteTimerRunning(false);
    pauseTimer();
    showToast('Timer paused on stage');
  };

  // Action: Reset Countdown Timer
  const handleResetTimerClick = () => {
    setIsRemoteTimerRunning(false);
    setRemoteSecondsRemaining(stageState.timerDuration || 40);
    resetTimer();
    showToast('Timer reset on stage');
  };

  // Action: Remove current winning word from wheel
  const handleRemoveWordClick = () => {
    setIsRemoteTimerRunning(false);
    setRemoteSecondsRemaining(stageState.timerDuration || 40);
    removeWord();
    showToast('Word removed from wheel');
  };

  // Action: Close winner announcement modal
  const handleCloseModalClick = () => {
    setIsRemoteTimerRunning(false);
    setRemoteSecondsRemaining(stageState.timerDuration || 40);
    closeModal();
    showToast('Closed modal on stage');
  };

  // Action: Clear podium board
  const handleClearBoard = () => {
    setWinners({ first: '', second: '', third: '' });
    clearBoard();
    showToast('Podium board cleared on stage');
  };

  // Action: Push winners to auditorium screen
  const handlePushWinners = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      first: winners.first.trim(),
      second: winners.second.trim(),
      third: winners.third.trim(),
    };

    pushWinners(payload);
    if (onPushWinners) {
      onPushWinners(payload);
    }
    showToast('Winners pushed to stage podium!');
  };

  const handleReturnClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onReturnToStage) {
      onReturnToStage();
      return;
    }
    if (window.opener) {
      window.close();
      return;
    }
    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.hostname)) {
      window.history.back();
      return;
    }
    window.location.href = stageReturnUrl;
  };

  const isWordModalActive = Boolean(stageState.showWinnerModal && stageState.winningWord);

  return (
    <div className="bg-[#121418] text-white min-h-screen p-3.5 sm:p-5 max-w-sm sm:max-w-md mx-auto flex flex-col justify-between font-sans select-none">
      <div className="space-y-3">
        {/* Header: Strictly 'Stage Remote' only (school name and online/offline pill removed) */}
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-gray-800">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Stage Remote</h1>
          {stageState.currentWheelName && (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md truncate max-w-[160px]">
              {stageState.currentWheelName}
            </span>
          )}
        </div>

        {/* Status Toast */}
        {lastAction && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{lastAction}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DROPDOWN 1: ROULETTE & TIMER CONTROLS                                    */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-[#1a1d24] border border-gray-800 overflow-hidden shadow-lg">
          {/* Accordion Toggle Header */}
          <button
            type="button"
            onClick={() => setIsRouletteOpen(!isRouletteOpen)}
            className="w-full px-3.5 py-2.5 bg-[#20242d] hover:bg-[#252a35] flex items-center justify-between transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Roulette & Timer Controls
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isWordModalActive ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-[#061a3e]">
                  Word Chosen
                </span>
              ) : stageState.isSpinning ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white">
                  Spinning
                </span>
              ) : null}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isRouletteOpen ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </div>
          </button>

          {isRouletteOpen && (
            <div className="p-3.5 space-y-3 animate-in fade-in duration-150">
              {/* Primary Spin / Stop Button */}
              <div>
                <button
                  type="button"
                  onClick={handleSpinClick}
                  className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 bg-amber-400 hover:bg-amber-300 text-[#061a3e] hover:shadow-amber-400/20 touch-manipulation"
                >
                  {stageState.isSpinning ? (
                    <>
                      <Square className="w-4 h-4 text-[#061a3e] fill-current" />
                      <span>Stop Spin</span>
                    </>
                  ) : (
                    <>
                      <Disc className="w-4 h-4 text-[#061a3e]" />
                      <span>Spin Wheel</span>
                    </>
                  )}
                </button>
              </div>

              {/* Word & Timer Stage Control Card - Exactly matches Winner Modal Menu */}
              <div className="p-4 rounded-2xl bg-[#061a3e] border border-blue-400/40 shadow-xl space-y-3.5 text-center">
                {/* Winning Word Display: Crisp solid golden-yellow with bold sans-serif */}
                <div className="py-1 px-2">
                  <span className="text-[10px] uppercase font-bold text-blue-200/70 tracking-widest block">
                    {stageState.winningWord ? 'Word Chosen On Stage' : 'Stage Word & Timer Menu'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-wider text-amber-400 uppercase select-all truncate my-1">
                    {stageState.winningWord || 'READY FOR WORD'}
                  </h2>
                </div>

                {/* Integrated Countdown Timer Display with playback/reset buttons */}
                <div className="flex items-center justify-center">
                  <div className="py-1.5 px-4 rounded-full border border-blue-400/30 inline-flex items-center justify-center gap-3 bg-transparent text-white shadow-xs">
                    <span className="font-mono font-bold text-base sm:text-lg tracking-wider text-white">
                      00:{String(remoteSecondsRemaining).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5 pl-2 border-l border-white/20">
                      <button
                        type="button"
                        onClick={isRemoteTimerRunning ? handlePauseTimerClick : handleStartTimerClick}
                        className="p-1 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                        title={isRemoteTimerRunning ? 'Pause Timer' : 'Start Timer'}
                      >
                        {isRemoteTimerRunning ? (
                          <Pause className="w-3.5 h-3.5 fill-current text-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current text-white" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetTimerClick}
                        className="p-1 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Flat solid golden-yellow primary button, ghost secondary buttons */}
                <div className="space-y-2 pt-1">
                  {/* Primary Button ("Start 40s Timer" / "Resume Timer" / "Pause Timer") */}
                  <button
                    type="button"
                    onClick={isRemoteTimerRunning ? handlePauseTimerClick : handleStartTimerClick}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#061a3e] font-black text-xs sm:text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isRemoteTimerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Timer</span>
                      </>
                    ) : remoteSecondsRemaining < (stageState.timerDuration || 40) && remoteSecondsRemaining > 0 ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Timer ({remoteSecondsRemaining}s)</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start {stageState.timerDuration || 40}s Timer</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Ghost Buttons: "Remove Word" and "Close" */}
                  <div className="flex items-center justify-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={handleRemoveWordClick}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/50 hover:border-white font-bold text-xs sm:text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      title="Remove this word from the wheel so it won't appear again"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                      <span>Remove Word</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseModalClick}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/50 hover:border-white font-bold text-xs sm:text-sm tracking-wide shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      title="Close word popup on stage"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DROPDOWN 2: PODIUM MENU                                                  */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-[#1a1d24] border border-gray-800 overflow-hidden shadow-lg">
          {/* Accordion Toggle Header */}
          <button
            type="button"
            onClick={() => setIsPodiumOpen(!isPodiumOpen)}
            className="w-full px-3.5 py-2.5 bg-[#20242d] hover:bg-[#252a35] flex items-center justify-between transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Podium Menu
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(winners.first || winners.second || winners.third) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300">
                  Ready
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isPodiumOpen ? 'rotate-180 text-yellow-400' : ''
                }`}
              />
            </div>
          </button>

          {isPodiumOpen && (
            <form onSubmit={handlePushWinners} className="p-3.5 space-y-2.5 animate-in fade-in duration-150">
              {/* 1st Place Input (champion text removed) */}
              <div>
                <label className="block text-[11px] font-bold text-yellow-400 uppercase tracking-wider mb-1">
                  1st Place
                </label>
                <input
                  type="text"
                  value={winners.first}
                  onChange={(e) => setWinners({ ...winners, first: e.target.value })}
                  placeholder="e.g. Sofia Rodriguez"
                  className="w-full py-2 px-3 rounded-lg bg-[#252932] border border-gray-700 focus:outline-none focus:border-yellow-400 text-xs text-white"
                />
              </div>

              {/* 2nd Place Input (runner-up text removed) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  2nd Place
                </label>
                <input
                  type="text"
                  value={winners.second}
                  onChange={(e) => setWinners({ ...winners, second: e.target.value })}
                  placeholder="e.g. Mateo Gonzalez"
                  className="w-full py-2 px-3 rounded-lg bg-[#252932] border border-gray-700 focus:outline-none focus:border-slate-300 text-xs text-white"
                />
              </div>

              {/* 3rd Place Input */}
              <div>
                <label className="block text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1">
                  3rd Place
                </label>
                <input
                  type="text"
                  value={winners.third}
                  onChange={(e) => setWinners({ ...winners, third: e.target.value })}
                  placeholder="e.g. Camila Perez"
                  className="w-full py-2 px-3 rounded-lg bg-[#252932] border border-gray-700 focus:outline-none focus:border-amber-500 text-xs text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={handleClearBoard}
                  className="py-2.5 px-3 rounded-xl bg-rose-600/15 text-rose-400 hover:bg-rose-600/25 border border-rose-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Board</span>
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Push to Stage</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Backstage footer note */}
      <div className="pt-4 text-center text-[11px] text-gray-500 border-t border-gray-800/60 mt-4">
        <a
          href={stageReturnUrl}
          onClick={handleReturnClick}
          className="inline-flex items-center gap-1 text-yellow-400/90 hover:text-yellow-300 transition cursor-pointer font-semibold"
          title={stageReturnUrl}
        >
          <span>Open Stage Display</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
