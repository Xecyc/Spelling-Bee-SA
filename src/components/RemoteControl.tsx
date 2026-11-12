import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Loader2,
  Square,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { audioManager } from '../utils/audio';
import { useStageSync, StageSyncState } from '../hooks/useStageSync';
import { useContestStore } from '../store';
import type { DeliveryResult } from '../utils/remoteProtocol';
import {
  getSessionTimerDuration,
  setSessionTimerDuration,
  resetSessionTimerDuration,
  DEFAULT_TIMER_SECONDS,
} from '../utils/timerSession';

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
  const latency = useContestStore((s) => s.latency);
  const stagesOnline = useContestStore((s) => s.stagesOnline);

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
    timerDuration: getSessionTimerDuration(),
  });

  const remoteSpinTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accordion drop-down menus
  const [isRouletteOpen, setIsRouletteOpen] = useState(true);
  const [isSlidesOpen, setIsSlidesOpen] = useState(false);
  const [isPodiumOpen, setIsPodiumOpen] = useState(false);

  const [stageReturnUrl, setStageReturnUrl] = useState<string>('/');

  const handleStageState = useCallback((newState: StageSyncState) => {
    setStageState((prev) => {
      // Sync live timer state from stage display if provided
      if (typeof newState.timeLeft === 'number') {
        setRemoteSecondsRemaining(newState.timeLeft);
      }
      if (typeof newState.isTimerRunning === 'boolean') {
        setIsRemoteTimerRunning(newState.isTimerRunning);
      }
      if (typeof newState.timerDuration === 'number') {
        setSessionTimerDuration(newState.timerDuration);
      }
      if (typeof newState.currentSlide === 'number') {
        setRemoteSlide(newState.currentSlide);
      }
      // Only reset seconds if a new winning word arrived from stage
      if (newState.winningWord && newState.winningWord !== prev.winningWord) {
        setIsRemoteTimerRunning(false);
        setRemoteSecondsRemaining(newState.timerDuration || prev.timerDuration || getSessionTimerDuration());
      } else if (
        typeof newState.timerDuration === 'number' &&
        newState.timerDuration !== prev.timerDuration &&
        !prev.winningWord &&
        typeof newState.timeLeft !== 'number'
      ) {
        setRemoteSecondsRemaining(newState.timerDuration);
      }
      return { ...prev, ...newState };
    });

    if (newState.winnersData) {
      setWinners({
        first: newState.winnersData.first || '',
        second: newState.winnersData.second || '',
        third: newState.winnersData.third || '',
      });
    }
  }, []);

  const {
    pushWinners,
    clearBoard,
    spinWheel,
    stopSpin,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerDuration,
    removeWord,
    closeModal,
    setSlide,
    toggleFullscreen,
    requestStageState,
  } = useStageSync({
    onStageState: handleStageState,
  });

  const contestLanguage = useContestStore((s) => s.contestLanguage);
  const isSpanish =
    contestLanguage === 'es' ||
    stageState.currentWheelName?.toLowerCase().includes('primaria') ||
    stageState.currentWheelName?.toLowerCase().includes('grado');
  const totalSlides = isSpanish ? 2 : 3;
  const [remoteSlide, setRemoteSlide] = useState<number>(() => {
    return typeof stageState.currentSlide === 'number' ? stageState.currentSlide : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const isStageFullscreen = Boolean(stageState.isFullscreen);

  const slideTitles = isSpanish
    ? ['Concurso de Deletreo', 'Ruleta Interactiva']
    : [
        'Welcome / Cover',
        'Roulette Wheel',
        'Winner Podium',
      ];

  const [remoteSecondsRemaining, setRemoteSecondsRemaining] = useState<number>(getSessionTimerDuration());
  const [isRemoteTimerRunning, setIsRemoteTimerRunning] = useState<boolean>(false);
  const [spinCooldown, setSpinCooldown] = useState<boolean>(false);

  // Editable timer state for remote
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editTimerValue, setEditTimerValue] = useState(String(getSessionTimerDuration()));
  const timerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditingTimer) {
      timerInputRef.current?.focus();
      timerInputRef.current?.select();
    }
  }, [isEditingTimer]);

  // Every tap reports back: delivered / delivered-but-nobody-is-listening / not delivered.
  const [notice, setNotice] = useState<{ kind: 'ok' | 'warn' | 'error'; text: string } | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((kind: 'ok' | 'warn' | 'error', text: string) => {
    setNotice({ kind, text });
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), kind === 'ok' ? 1800 : 5000);
  }, []);

  /** Sends one command and tells the operator what happened. Resolves true if the server accepted it. */
  const dispatch = useCallback(
    async (label: string, action: () => Promise<DeliveryResult>): Promise<boolean> => {
      const result = await action();
      if (!result.ok) {
        showNotice('error', `${label} was NOT sent. ${result.error ?? 'Unknown error'}. Check the Wi-Fi and try again.`);
        return false;
      }
      if (result.stages === 0) {
        showNotice('warn', `${label} sent, but no stage screen is open. Open the stage page on the PC.`);
        return true;
      }
      showNotice('ok', `${label} sent`);
      return true;
    },
    [showNotice]
  );

  const commitTimerEdit = useCallback(() => {
    setIsEditingTimer(false);
    const clean = editTimerValue.trim().replace(/\D/g, '');
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 600) {
      setRemoteSecondsRemaining(parsed);
      setSessionTimerDuration(parsed);
      setStageState((prev) => ({ ...prev, timerDuration: parsed }));
      setEditTimerValue(String(parsed));
      void dispatch(`Set timer to ${parsed}s`, () => setTimerDuration(parsed));
    } else {
      setEditTimerValue(String(remoteSecondsRemaining > 0 ? remoteSecondsRemaining : stageState.timerDuration || getSessionTimerDuration()));
    }
  }, [dispatch, editTimerValue, remoteSecondsRemaining, setTimerDuration, stageState.timerDuration]);

  const handleTimerNumberClick = () => {
    if (!isRemoteTimerRunning) {
      setEditTimerValue(String(remoteSecondsRemaining > 0 ? remoteSecondsRemaining : stageState.timerDuration || getSessionTimerDuration()));
      setIsEditingTimer(true);
    }
  };

  const handlePrevSlide = () => {
    if (remoteSlide > 0) {
      const next = remoteSlide - 1;
      setRemoteSlide(next);
      void dispatch(`Slide ${next + 1}`, () => setSlide(next));
    }
  };

  const handleNextSlide = () => {
    if (remoteSlide < totalSlides - 1) {
      const next = remoteSlide + 1;
      setRemoteSlide(next);
      void dispatch(`Slide ${next + 1}`, () => setSlide(next));
    }
  };

  const handleGoToSlide = (idx: number) => {
    setRemoteSlide(idx);
    void dispatch(`Slide ${idx + 1}`, () => setSlide(idx));
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioManager.setMuted(next);
    showNotice('ok', next ? 'Stage Audio Muted' : 'Stage Audio Active');
  };

  const handleToggleStageFullscreen = () => {
    void dispatch('Toggle stage fullscreen', toggleFullscreen);
  };

  // Live remote countdown ticker
  useEffect(() => {
    if (!isRemoteTimerRunning) return;
    const interval = setInterval(() => {
      setRemoteSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsRemoteTimerRunning(false);
          audioManager.playTimerFinished();
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

  const lastSpinTimeRef = React.useRef<number>(0);

  // Auto-reset spinning state watchdog on remote (never stays stuck on true)
  useEffect(() => {
    if (stageState.isSpinning) {
      const timer = setTimeout(() => {
        setStageState((prev) => ({ ...prev, isSpinning: false }));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [stageState.isSpinning]);

  // Action: STRICTLY Spin Wheel (never sends stop_spin, 2-second local debounce)
  const handleSpinClick = async () => {
    const now = Date.now();
    // 2-second local debounce/cooldown solely to prevent accidental double-taps
    if (now - lastSpinTimeRef.current < 2000) return;
    lastSpinTimeRef.current = now;

    setSpinCooldown(true);
    setTimeout(() => {
      setSpinCooldown(false);
    }, 2000);

    setIsRemoteTimerRunning(false);
    setStageState((prev) => ({ ...prev, isSpinning: true }));

    // 8.0s fail-safe watchdog timer on remote: guarantees button unlocks even if network drops
    if (remoteSpinTimeoutRef.current) clearTimeout(remoteSpinTimeoutRef.current);
    remoteSpinTimeoutRef.current = setTimeout(() => {
      setStageState((prev) => ({ ...prev, isSpinning: false }));
    }, 8000);

    const delivered = await dispatch('Spin wheel', spinWheel);
    if (!delivered) {
      // Nothing is spinning on stage, so do not pretend it is: unlock the button right away.
      if (remoteSpinTimeoutRef.current) clearTimeout(remoteSpinTimeoutRef.current);
      remoteSpinTimeoutRef.current = null;
      lastSpinTimeRef.current = 0;
      setSpinCooldown(false);
      setStageState((prev) => ({ ...prev, isSpinning: false }));
      return;
    }
    setRemoteSlide(1);
    if (onSpinWheel) {
      onSpinWheel();
    }
  };

  // Action: Separate Stop Spin / Emergency Stop
  const handleStopSpinClick = () => {
    if (remoteSpinTimeoutRef.current) {
      clearTimeout(remoteSpinTimeoutRef.current);
      remoteSpinTimeoutRef.current = null;
    }
    void dispatch('Stop spin', stopSpin);
    setStageState((prev) => ({ ...prev, isSpinning: false }));
  };

  // Action: Start Countdown Timer
  const handleStartTimerClick = () => {
    if (isEditingTimer) {
      commitTimerEdit();
    }
    if (remoteSecondsRemaining <= 0) {
      setRemoteSecondsRemaining(stageState.timerDuration || getSessionTimerDuration());
    }
    setIsRemoteTimerRunning(true);
    void dispatch('Start timer', startTimer).then((ok) => {
      if (!ok) setIsRemoteTimerRunning(false);
    });
  };

  // Action: Pause Countdown Timer
  const handlePauseTimerClick = () => {
    setIsRemoteTimerRunning(false);
    void dispatch('Stop timer', pauseTimer);
  };

  // Action: Reset Countdown Timer
  const handleResetTimerClick = () => {
    setIsRemoteTimerRunning(false);
    const saved = getSessionTimerDuration();
    setRemoteSecondsRemaining(saved);
    setStageState((prev) => ({ ...prev, timerDuration: saved }));
    setEditTimerValue(String(saved));
    setIsEditingTimer(false);
    void dispatch('Reset timer', resetTimer);
  };

  // Action: Remove current winning word from wheel
  const handleRemoveWordClick = () => {
    setIsRemoteTimerRunning(false);
    setRemoteSecondsRemaining(stageState.timerDuration || getSessionTimerDuration());
    void dispatch('Remove word', removeWord);
  };

  // Action: Close winner announcement modal
  const handleCloseModalClick = () => {
    setIsRemoteTimerRunning(false);
    setRemoteSecondsRemaining(stageState.timerDuration || getSessionTimerDuration());
    void dispatch('Close', closeModal);
  };

  // Action: Clear podium board
  const handleClearBoard = () => {
    setWinners({ first: '', second: '', third: '' });
    void dispatch('Clear board', clearBoard);
  };

  // Action: Push winners to auditorium screen
  const handlePushWinners = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      first: winners.first.trim(),
      second: winners.second.trim(),
      third: winners.third.trim(),
    };

    if (!payload.first && !payload.second && !payload.third) {
      showNotice('warn', 'Type at least one name before pushing to the stage.');
      return;
    }

    void dispatch('Push to stage', () => pushWinners(payload)).then((ok) => {
      if (ok) {
        setRemoteSlide(2);
        if (onPushWinners) onPushWinners(payload);
      }
    });
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
    <div className="bg-[#121418] text-white min-h-screen p-3.5 sm:p-5 pb-6 max-w-sm sm:max-w-md mx-auto flex flex-col justify-between font-sans select-none relative">
      <div className="space-y-3">
        {!isConnected && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <span>
              Can&apos;t reach the stage server. Make sure this phone is on the <b>same Wi-Fi</b> as the PC and
              that the app is running there (<code>npm run dev</code>).
            </span>
          </div>
        )}
        {isConnected && stagesOnline === 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-100">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
            <span>No stage screen is open. On the PC, open the stage page and keep it in the foreground.</span>
          </div>
        )}
        {/* Header: Strictly 'Stage Remote' only (school name and online/offline pill removed) */}
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Stage Remote</h1>
            <span
              role="img"
              aria-label={isConnected ? (stagesOnline === 0 ? 'Server reachable, no stage open' : 'Connected') : 'Offline'}
              title={
                isConnected
                  ? stagesOnline === 0
                    ? 'Server reachable, but no stage screen is open'
                    : `Connected${latency ? ` (${latency} ms)` : ''}`
                  : 'Cannot reach the stage server'
              }
              className={`w-2.5 h-2.5 rounded-full ${
                !isConnected ? 'bg-rose-500' : stagesOnline === 0 ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
              }`}
            />
          </div>
          {stageState.currentWheelName && (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md truncate max-w-[160px]">
              {stageState.currentWheelName}
            </span>
          )}
        </div>



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
              {/* Separate Spin and Stop Buttons */}
              <div className="flex items-center gap-2">
                {/* Primary Button: Strictly Spin Wheel */}
                <button
                  type="button"
                  onClick={handleSpinClick}
                  disabled={spinCooldown}
                  className={`flex-1 py-3.5 px-3 sm:px-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 ${
                    spinCooldown
                      ? 'bg-amber-400/70 text-[#061a3e]/80 cursor-wait'
                      : stageState.isSpinning
                      ? 'bg-amber-400 text-[#061a3e] shadow-amber-400/30 ring-2 ring-amber-300'
                      : 'bg-amber-400 hover:bg-amber-300 text-[#061a3e] hover:shadow-amber-400/20'
                  }`}
                >
                  <Disc className={`w-4 h-4 text-[#061a3e] ${stageState.isSpinning ? 'animate-spin' : ''}`} />
                  <span>{stageState.isSpinning ? 'Spinning...' : 'Spin Wheel'}</span>
                </button>

                {/* Secondary Button: Explicit Stop Spin / Emergency Stop */}
                <button
                  type="button"
                  onClick={handleStopSpinClick}
                  className="py-3.5 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 hover:border-rose-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
                  title="Stop Spin / Emergency Stop"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-rose-400 group-hover:text-white" />
                  <span>Stop Spin</span>
                </button>
              </div>

              {/* Word & Timer Stage Control Card - Exactly matches Winner Modal Menu */}
              <div className="p-4 rounded-2xl bg-[#061a3e] border border-blue-400/40 shadow-xl space-y-3.5 text-center">
                {/* Winning Word Display: Crisp solid golden-yellow with bold sans-serif */}
                <div className="py-1 px-2">
                  <span className="text-[10px] uppercase font-bold text-blue-200/70 tracking-widest block">
                    {stageState.winningWord ? 'Word Chosen On Stage' : 'Stage Word & Timer Menu'}
                  </span>
                  {stageState.winningCronica && (
                    <div className="mt-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-[#061a3e] font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-sm">
                        {stageState.winningCronica}
                      </span>
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-wider text-amber-400 uppercase select-all truncate my-1">
                    {stageState.winningWord || 'READY FOR WORD'}
                  </h2>
                </div>

                {/* Integrated Countdown Timer Display with playback/reset buttons */}
                <div className="flex items-center justify-center">
                  <div className="py-1.5 px-4 rounded-full border border-blue-400/30 inline-flex items-center justify-center gap-3 bg-transparent text-white shadow-xs">
                    {isEditingTimer ? (
                      <input
                        ref={timerInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editTimerValue}
                        onChange={(e) => setEditTimerValue(e.target.value)}
                        onBlur={commitTimerEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitTimerEdit();
                          else if (e.key === 'Escape') {
                            setIsEditingTimer(false);
                            setEditTimerValue(String(remoteSecondsRemaining > 0 ? remoteSecondsRemaining : stageState.timerDuration || getSessionTimerDuration()));
                          }
                        }}
                        className="w-12 sm:w-14 text-center font-mono font-bold text-base sm:text-lg tracking-wider text-white bg-transparent border-b border-amber-400 outline-none tabular-nums"
                        maxLength={3}
                      />
                    ) : (
                      <span
                        onClick={handleTimerNumberClick}
                        className={`font-mono font-bold text-base sm:text-lg tracking-wider text-white select-none tabular-nums transition-colors ${
                          !isRemoteTimerRunning ? 'cursor-pointer hover:text-amber-300' : ''
                        }`}
                        title={!isRemoteTimerRunning ? 'Click to type custom seconds' : undefined}
                      >
                        00:{String(remoteSecondsRemaining).padStart(2, '0')}
                      </span>
                    )}
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
                  {/* Primary Button ("Start timer" / "Pause Timer") */}
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
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start timer</span>
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
        {/* DROPDOWN 2: SLIDES CONTROLS                                              */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-[#1a1d24] border border-gray-800 overflow-hidden shadow-lg">
          {/* Accordion Toggle Header */}
          <button
            type="button"
            onClick={() => setIsSlidesOpen(!isSlidesOpen)}
            className="w-full px-3.5 py-2.5 bg-[#20242d] hover:bg-[#252a35] flex items-center justify-between transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Slides Controls
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                Slide {remoteSlide + 1} / {totalSlides}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isSlidesOpen ? 'rotate-180 text-sky-400' : ''
                }`}
              />
            </div>
          </button>

          {isSlidesOpen && (
            <div className="p-3.5 space-y-3 animate-in fade-in duration-150">
              {/* Genially-style Navigation Pill Bar inside card */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e1117] border border-gray-700/80 shadow-inner">
                {/* Previous Slide Button */}
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  disabled={remoteSlide <= 0}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Current Slide Display */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Current Slide</span>
                  <span className="font-mono font-black text-sm tracking-widest text-sky-400 tabular-nums">
                    {remoteSlide + 1} / {totalSlides}
                  </span>
                </div>

                {/* Next Slide Button */}
                <button
                  type="button"
                  onClick={handleNextSlide}
                  disabled={remoteSlide >= totalSlides - 1}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Next Slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-6 bg-gray-700 mx-1" />

                {/* Audio Mute/Unmute */}
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
                  title={isMuted ? 'Stage Audio Muted' : 'Stage Audio Active'}
                >
                  {!isMuted ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  )}
                </button>

                {/* Stage Fullscreen Button */}
                <button
                  type="button"
                  onClick={handleToggleStageFullscreen}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-sky-300 hover:bg-white/10 transition-colors cursor-pointer"
                  title={isStageFullscreen ? 'Exit Stage Fullscreen' : 'Stage Fullscreen'}
                >
                  {isStageFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-sky-400" />
                  )}
                </button>
              </div>

              {/* Quick Jump Slide Cards */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block px-1">
                  Jump to Slide
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {slideTitles.map((title, idx) => {
                    const isActive = remoteSlide === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleGoToSlide(idx)}
                        className={`w-full px-3 py-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold ring-1 ring-sky-400/40 shadow-sm'
                            : 'bg-[#252932] border-gray-700/80 text-gray-300 hover:bg-[#2b303b] hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black font-mono shrink-0 ${
                              isActive ? 'bg-sky-400 text-[#061a3e]' : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs truncate">{title}</span>
                        </div>
                        {isActive && (
                          <span className="text-[10px] uppercase font-bold text-sky-300 bg-sky-400/20 px-2 py-0.5 rounded-full shrink-0">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DROPDOWN 3: PODIUM MENU (English Mode Only)                              */}
        {/* ========================================================================= */}
        {!isSpanish && (
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
        )}
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-16 inset-x-4 max-w-sm mx-auto z-50 rounded-xl px-4 py-3 text-xs font-semibold shadow-2xl border ${
            notice.kind === 'ok'
              ? 'bg-emerald-600/90 border-emerald-400/50 text-white'
              : notice.kind === 'warn'
              ? 'bg-amber-500/95 border-amber-300 text-[#061a3e]'
              : 'bg-rose-600/95 border-rose-400 text-white'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Backstage footer note */}
      <div className="pt-4 text-center text-[11px] text-gray-500 border-t border-gray-800/60 mt-4 mb-2">
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
