import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useContestStore } from '../store';
import { WinnersData } from '../types/presentation';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    socketInstance = io(origin, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
  }
  return socketInstance;
}

export interface StageSyncState {
  isSpinning?: boolean;
  showWinnerModal?: boolean;
  winningWord?: string | null;
  currentWheelName?: string;
  timerDuration?: number;
  timeLeft?: number;
  isTimerRunning?: boolean;
  currentSlide?: number;
  winnersData?: WinnersData | null;
}

interface UseStageSyncOptions {
  onRemoteAction?: (action: string, data?: any) => void;
  onStageState?: (state: StageSyncState) => void;
}

export function useStageSync(options?: UseStageSyncOptions) {
  const socket = getSocket();
  const setIsConnected = useContestStore((s) => s.setIsConnected);
  const setLatency = useContestStore((s) => s.setLatency);
  const setWinnersData = useContestStore((s) => s.setWinnersData);
  const setCurrentSlide = useContestStore((s) => s.setCurrentSlide);
  const setCurrentMode = useContestStore((s) => s.setCurrentMode);
  const isRemoteRoute = useContestStore((s) => s.isRemoteRoute);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const onRemoteActionRef = useRef(options?.onRemoteAction);
  const onStageStateRef = useRef(options?.onStageState);

  useEffect(() => {
    onRemoteActionRef.current = options?.onRemoteAction;
    onStageStateRef.current = options?.onStageState;
  });

  useEffect(() => {
    // 1. Persistent BroadcastChannel for static hosts (GitHub Pages) and multi-window sync
    if (typeof BroadcastChannel !== 'undefined' && !channelRef.current) {
      const channel = new BroadcastChannel('salto_angel_podium_channel');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const payload = event.data?.payload || event.data?.data;
        const type = event.data?.type;

        if (type === 'show_winners' && payload) {
          if (!isRemoteRoute) {
            setWinnersData(payload);
            setCurrentMode('presentation');
            setCurrentSlide(2);
          }
        } else if (type === 'clear_board' || type === 'hide_winners') {
          if (!isRemoteRoute) {
            setWinnersData(null);
            setCurrentSlide(1);
          }
        } else if (type === 'stage_state' && payload) {
          if (onStageStateRef.current) {
            onStageStateRef.current(payload);
          }
        } else if (
          [
            'spin_wheel',
            'stop_spin',
            'start_timer',
            'stop_timer',
            'pause_timer',
            'reset_timer',
            'remove_word',
            'close_modal',
            'push_winners',
            'clear_winners',
            'clear_board',
            'set_slide',
          ].includes(type)
        ) {
          if (!isRemoteRoute && onRemoteActionRef.current) {
            onRemoteActionRef.current(type, payload);
          }
        }
      };
    }

    // 2. Storage event listener for cross-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'salto_angel_remote_winners' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const payload = parsed.payload || parsed.data;
          if (parsed.type === 'show_winners' && payload) {
            if (!isRemoteRoute) {
              setWinnersData(payload);
              setCurrentMode('presentation');
              setCurrentSlide(2);
            }
          } else if (parsed.type === 'clear_board' || parsed.type === 'hide_winners') {
            if (!isRemoteRoute) {
              setWinnersData(null);
              setCurrentSlide(1);
            }
          }
        } catch {}
      } else if (e.key === 'salto_angel_remote_action' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type && !isRemoteRoute && onRemoteActionRef.current) {
            onRemoteActionRef.current(parsed.type, parsed.payload);
          }
        } catch {}
      } else if (e.key === 'salto_angel_stage_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.state && onStageStateRef.current) {
            onStageStateRef.current(parsed.state);
          }
        } catch {}
      }
    };
    // Load immediate cached stage state from localStorage
    try {
      const saved = localStorage.getItem('salto_angel_stage_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.state && onStageStateRef.current) {
          onStageStateRef.current(parsed.state);
        }
      }
    } catch {}

    window.addEventListener('storage', handleStorage);

    // 3. Socket.io Event Listeners
    const onConnect = () => {
      setIsConnected(true);
      socket.emit('ping', Date.now());
      socket.emit('request_stage_state');
    };

    const onDisconnect = () => setIsConnected(false);
    const onConnectError = () => setIsConnected(false);

    const onShowWinners = (payload: WinnersData) => {
      if (!isRemoteRoute) {
        setWinnersData(payload);
        setCurrentMode('presentation');
        setCurrentSlide(2);
      }
    };

    const onHideWinners = () => {
      if (!isRemoteRoute) {
        setWinnersData(null);
        setCurrentSlide(1);
      }
    };

    const onPong = (startTime: number) => {
      if (startTime) {
        setLatency(Date.now() - startTime);
      }
    };

    const onStageState = (state: StageSyncState) => {
      if (onStageStateRef.current) {
        onStageStateRef.current(state);
      }
    };

    const onRemoteCommand = (action: string) => (data?: any) => {
      if (!isRemoteRoute && onRemoteActionRef.current) {
        onRemoteActionRef.current(action, data);
      }
    };

    const handleSpin = onRemoteCommand('spin_wheel');
    const handleStopSpin = onRemoteCommand('stop_spin');
    const handleStartTimer = onRemoteCommand('start_timer');
    const handleStopTimer = onRemoteCommand('stop_timer');
    const handlePauseTimer = onRemoteCommand('pause_timer');
    const handleResetTimer = onRemoteCommand('reset_timer');
    const handleRemoveWord = onRemoteCommand('remove_word');
    const handleCloseModal = onRemoteCommand('close_modal');
    const handlePushWinnersCmd = onRemoteCommand('push_winners');
    const handleClearWinnersCmd = onRemoteCommand('clear_winners');
    const handleClearBoardCmd = onRemoteCommand('clear_board');
    const handleSetSlide = onRemoteCommand('set_slide');
    const handleRemoteActionMsg = (data: any) => {
      if (data && !isRemoteRoute && onRemoteActionRef.current) {
        const type = data.type || data.action;
        const payload = data.payload !== undefined ? data.payload : data.data;
        if (type) {
          onRemoteActionRef.current(type, payload);
        }
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('show_winners', onShowWinners);
    socket.on('hide_winners', onHideWinners);
    socket.on('pong', onPong);
    socket.on('stage_state', onStageState);
    socket.on('remote_action', handleRemoteActionMsg);

    socket.on('spin_wheel', handleSpin);
    socket.on('stop_spin', handleStopSpin);
    socket.on('start_timer', handleStartTimer);
    socket.on('stop_timer', handleStopTimer);
    socket.on('pause_timer', handlePauseTimer);
    socket.on('reset_timer', handleResetTimer);
    socket.on('remove_word', handleRemoveWord);
    socket.on('close_modal', handleCloseModal);
    socket.on('push_winners', handlePushWinnersCmd);
    socket.on('clear_winners', handleClearWinnersCmd);
    socket.on('clear_board', handleClearBoardCmd);
    socket.on('set_slide', handleSetSlide);

    if (socket.connected) {
      setIsConnected(true);
    }

    const pingTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', Date.now());
      }
    }, 10000);

    // 4. Universal Server-Sent Events (SSE) & HTTP Relay (Guarantees Cloud Run & mobile delivery)
    let eventSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let lastSeenMsgId = 0;

    const handleRemoteMessage = (type: string, payload: any) => {
      if (type === 'show_winners' && payload) {
        if (!isRemoteRoute) {
          setWinnersData(payload);
          setCurrentMode('presentation');
          setCurrentSlide(2);
        }
      } else if (type === 'clear_board' || type === 'clear_winners' || type === 'hide_winners') {
        if (!isRemoteRoute) {
          setWinnersData(null);
          setCurrentSlide(1);
        }
      } else if (type === 'stage_state' && payload) {
        if (onStageStateRef.current) {
          onStageStateRef.current(payload);
        }
      } else if (
        [
          'spin_wheel',
          'stop_spin',
          'start_timer',
          'stop_timer',
          'pause_timer',
          'reset_timer',
          'remove_word',
          'close_modal',
          'push_winners',
          'clear_winners',
          'clear_board',
          'set_slide',
        ].includes(type)
      ) {
        if (!isRemoteRoute && onRemoteActionRef.current) {
          onRemoteActionRef.current(type, payload);
        }
      }
    };

    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource('/api/remote/events');
        eventSource.onmessage = (event) => {
          if (!event.data || event.data.startsWith(':')) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.id) lastSeenMsgId = Math.max(lastSeenMsgId, parsed.id);
            handleRemoteMessage(parsed.type, parsed.payload);
          } catch {}
        };
      } catch {}
    }

    // HTTP polling backup every 1.5s for environments where WebSocket or SSE is buffered
    pollInterval = setInterval(() => {
      fetch(`/api/remote/poll?since=${lastSeenMsgId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.messages) && data.messages.length > 0) {
            data.messages.forEach((m: any) => {
              lastSeenMsgId = Math.max(lastSeenMsgId, m.id);
              handleRemoteMessage(m.type, m.payload);
            });
          }
          if (data?.latestStageState && onStageStateRef.current) {
            onStageStateRef.current(data.latestStageState);
          }
        })
        .catch(() => {});
    }, 1500);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('show_winners', onShowWinners);
      socket.off('hide_winners', onHideWinners);
      socket.off('pong', onPong);
      socket.off('stage_state', onStageState);
      socket.off('remote_action', handleRemoteActionMsg);
      socket.off('spin_wheel', handleSpin);
      socket.off('stop_spin', handleStopSpin);
      socket.off('start_timer', handleStartTimer);
      socket.off('stop_timer', handleStopTimer);
      socket.off('pause_timer', handlePauseTimer);
      socket.off('reset_timer', handleResetTimer);
      socket.off('remove_word', handleRemoveWord);
      socket.off('close_modal', handleCloseModal);
      socket.off('push_winners', handlePushWinnersCmd);
      socket.off('clear_winners', handleClearWinnersCmd);
      socket.off('clear_board', handleClearBoardCmd);
      socket.off('set_slide', handleSetSlide);

      clearInterval(pingTimer);
      if (pollInterval) clearInterval(pollInterval);
      if (eventSource) eventSource.close();
      window.removeEventListener('storage', handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [isRemoteRoute, setCurrentMode, setCurrentSlide, setIsConnected, setLatency, setWinnersData, socket]);

  const lastBroadcastStateJsonRef = useRef<string>('');
  const lastBroadcastTimeRef = useRef<number>(0);

  const broadcastAction = useCallback((type: string, payload?: any) => {
    socket.emit('remote_action', { type, payload });
    socket.emit(type, payload);
    if (channelRef.current) {
      channelRef.current.postMessage({ type, payload });
    }
    try {
      localStorage.setItem('salto_angel_remote_action', JSON.stringify({ type, payload, ts: Date.now() }));
    } catch {}

    // HTTP POST fallback ensures instantaneous cross-device delivery through any proxy
    try {
      fetch('/api/remote/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      }).catch(() => {});
    } catch {}
  }, [socket]);

  const pushWinners = useCallback(
    (payload: WinnersData) => {
      broadcastAction('push_winners', payload);
      try {
        localStorage.setItem(
          'salto_angel_remote_winners',
          JSON.stringify({ type: 'show_winners', payload, ts: Date.now() })
        );
      } catch {}
    },
    [broadcastAction]
  );

  const clearWinners = useCallback(() => {
    broadcastAction('clear_winners');
    broadcastAction('clear_board');
    try {
      localStorage.setItem(
        'salto_angel_remote_winners',
        JSON.stringify({ type: 'clear_board', ts: Date.now() })
      );
    } catch {}
  }, [broadcastAction]);
  const clearBoard = clearWinners;

  const spinWheel = useCallback(() => broadcastAction('spin_wheel'), [broadcastAction]);
  const stopSpin = useCallback(() => broadcastAction('stop_spin'), [broadcastAction]);
  const startTimer = useCallback(() => broadcastAction('start_timer'), [broadcastAction]);
  const stopTimer = useCallback(() => {
    broadcastAction('stop_timer');
    broadcastAction('pause_timer');
  }, [broadcastAction]);
  const pauseTimer = stopTimer;
  const resetTimer = useCallback(() => broadcastAction('reset_timer'), [broadcastAction]);
  const removeWord = useCallback(() => broadcastAction('remove_word'), [broadcastAction]);
  const closeModal = useCallback(() => broadcastAction('close_modal'), [broadcastAction]);
  const setSlide = useCallback((slide: number) => broadcastAction('set_slide', slide), [broadcastAction]);

  const broadcastStageState = useCallback((state: StageSyncState) => {
    // 1. Deduplication: skip if state has not actually changed
    const stateJson = JSON.stringify(state);
    if (stateJson === lastBroadcastStateJsonRef.current) {
      return;
    }
    const now = Date.now();
    lastBroadcastTimeRef.current = now;
    lastBroadcastStateJsonRef.current = stateJson;

    socket.emit('sync_stage_state', state);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'stage_state', payload: state });
    }
    try {
      localStorage.setItem('salto_angel_stage_state', JSON.stringify({ state, ts: now }));
    } catch {}

    // HTTP stage state sync fallback
    try {
      fetch('/api/remote/stage-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      }).catch(() => {});
    } catch {}
  }, [socket]);

  const requestStageState = useCallback(() => {
    socket.emit('request_stage_state');
    try {
      fetch('/api/remote/stage-state')
        .then((res) => res.json())
        .then((data) => {
          if (data?.state && onStageStateRef.current) {
            onStageStateRef.current(data.state);
          }
          if (data?.winners && !isRemoteRoute) {
            setWinnersData(data.winners);
          }
        })
        .catch(() => {});
    } catch {}
  }, [isRemoteRoute, setWinnersData, socket]);

  return {
    pushWinners,
    clearWinners,
    clearBoard,
    spinWheel,
    stopSpin,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    removeWord,
    closeModal,
    setSlide,
    broadcastStageState,
    requestStageState,
    socket,
  };
}
