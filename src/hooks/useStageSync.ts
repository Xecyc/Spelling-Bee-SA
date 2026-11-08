import { useEffect, useRef } from 'react';
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
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
  }
  return socketInstance;
}

export function useStageSync() {
  const socket = getSocket();
  const setIsConnected = useContestStore((s) => s.setIsConnected);
  const setLatency = useContestStore((s) => s.setLatency);
  const setWinnersData = useContestStore((s) => s.setWinnersData);
  const setCurrentSlide = useContestStore((s) => s.setCurrentSlide);
  const setCurrentMode = useContestStore((s) => s.setCurrentMode);
  const isRemoteRoute = useContestStore((s) => s.isRemoteRoute);

  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // 1. Persistent BroadcastChannel for static hosts (GitHub Pages) and multi-window sync
    if (typeof BroadcastChannel !== 'undefined' && !channelRef.current) {
      const channel = new BroadcastChannel('salto_angel_podium_channel');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const payload = event.data?.payload || event.data?.data;
        if (event.data?.type === 'show_winners' && payload) {
          if (!isRemoteRoute) {
            setWinnersData(payload);
            setCurrentMode('presentation');
            setCurrentSlide(2);
          }
        } else if (event.data?.type === 'clear_board' || event.data?.type === 'hide_winners') {
          if (!isRemoteRoute) {
            setWinnersData(null);
            setCurrentSlide(1);
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
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Socket.io Event Listeners
    const onConnect = () => {
      setIsConnected(true);
      socket.emit('ping', Date.now());
    };

    const onDisconnect = () => setIsConnected(false);
    const onConnectError = () => setIsConnected(false);

    const onShowWinners = (payload: WinnersData) => {
      // Remote operators stay in controls; TV audience screens switch to Podium Slide
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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('show_winners', onShowWinners);
    socket.on('hide_winners', onHideWinners);
    socket.on('pong', onPong);

    if (socket.connected) {
      setIsConnected(true);
    }

    // Ping interval for genuine latency & connection health check
    const pingTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', Date.now());
      }
    }, 10000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('show_winners', onShowWinners);
      socket.off('hide_winners', onHideWinners);
      socket.off('pong', onPong);
      clearInterval(pingTimer);
      window.removeEventListener('storage', handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [isRemoteRoute, setCurrentMode, setCurrentSlide, setIsConnected, setLatency, setWinnersData, socket]);

  const pushWinners = (payload: WinnersData) => {
    // 1. Emit to Socket.io backend
    socket.emit('push_winners', payload);

    // 2. Broadcast to open tabs
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'show_winners', payload });
    }

    // 3. LocalStorage fallback
    try {
      localStorage.setItem(
        'salto_angel_remote_winners',
        JSON.stringify({ type: 'show_winners', payload, ts: Date.now() })
      );
    } catch {}
  };

  const clearBoard = () => {
    socket.emit('clear_board');
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'clear_board' });
    }
    try {
      localStorage.setItem(
        'salto_angel_remote_winners',
        JSON.stringify({ type: 'clear_board', ts: Date.now() })
      );
    } catch {}
  };

  return { pushWinners, clearBoard, socket };
}
