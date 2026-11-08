import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Radio, CheckCircle2, RotateCcw, Send, ExternalLink } from 'lucide-react';

interface WinnersState {
  first: string;
  second: string;
  third: string;
}

// CRITICAL: Connect to the dynamic origin, not localhost or a hardcoded domain.
// Use useMemo or place outside the component if appropriate to prevent infinite reconnects.
const socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
  transports: ['websocket', 'polling']
});

interface RemoteControlProps {
  onReturnToStage?: () => void;
  onPushWinners?: (data: WinnersState) => void;
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

  // 2. Saved base URL from localStorage (saved whenever Stage presentation is viewed)
  try {
    const saved = localStorage.getItem('salto_angel_stage_base_url');
    if (saved && !saved.includes('/remote') && !saved.includes('view=remote')) {
      return saved;
    }
  } catch {}

  // 3. If currently at e.g. https://xecyc.github.io/my-repo/?view=remote
  if (window.location.search.includes('view=remote') || window.location.search.includes('remote=')) {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('view');
      u.searchParams.delete('remote');
      return u.toString();
    } catch {}
  }

  // 4. If pathname ends with /remote (e.g. /my-repo/remote)
  const pathname = window.location.pathname.replace(/\/remote(\/index\.html|\.html)?\/?$/, '');
  if (pathname && pathname !== '/') {
    return `${window.location.origin}${pathname.endsWith('/') ? pathname : pathname + '/'}`;
  }

  // 5. If document.referrer has a repository path on the same host
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

export const RemoteControl: React.FC<RemoteControlProps> = ({ onReturnToStage, onPushWinners }) => {
  const [winners, setWinners] = useState<WinnersState>({
    first: '',
    second: '',
    third: '',
  });

  const [isConnected, setIsConnected] = useState<boolean>(() => socket.connected);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [stageReturnUrl, setStageReturnUrl] = useState<string>('/');

  // Persistent BroadcastChannel reference
  const channelRef = React.useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    setStageReturnUrl(computeStageReturnUrl());
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      console.log('[Remote] Connected to stage server, socket id:', socket.id);
      setIsConnected(true);
    };

    const handleConnectError = (err: any) => {
      console.warn('[Remote] Socket connection error:', err?.message);
      setIsConnected(false);
    };

    const handleDisconnect = (reason: string) => {
      console.log('[Remote] Disconnected from stage server:', reason);
      setIsConnected(false);
    };

    const handleShowWinners = (data: WinnersState) => {
      if (data) {
        setWinners({
          first: data.first || '',
          second: data.second || '',
          third: data.third || '',
        });
      }
    };

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('show_winners', handleShowWinners);

    // Cross-tab broadcast channel for static environments like GitHub Pages
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('salto_angel_podium_channel');
        channelRef.current = channel;
        channel.onmessage = (event) => {
          if (event.data?.type === 'show_winners' && event.data?.data) {
            setWinners(event.data.data);
          }
        };
      }
    } catch {
      // Ignore
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('show_winners', handleShowWinners);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, []);

  const handleClearBoard = () => {
    setWinners({ first: '', second: '', third: '' });
    socket.emit('clear_board');

    // Cross-tab broadcast
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'hide_winners' });
      }
      localStorage.setItem('salto_angel_remote_winners', JSON.stringify({ type: 'hide_winners', ts: Date.now() }));
    } catch {
      // Ignore
    }

    setLastAction('Board cleared on stage');
    setTimeout(() => setLastAction(null), 3000);
  };

  const handlePushWinners = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      first: winners.first.trim(),
      second: winners.second.trim(),
      third: winners.third.trim(),
    };

    // 1. Send via WebSocket / Socket.io
    socket.emit('push_winners', payload);

    // 2. Broadcast via BroadcastChannel to all open browser tabs/windows
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'show_winners', data: payload });
      }
      localStorage.setItem('salto_angel_remote_winners', JSON.stringify({ type: 'show_winners', data: payload, ts: Date.now() }));
    } catch {
      // Ignore
    }

    // 3. Automatically send current user to podium slide if testing on same screen
    if (onPushWinners) {
      onPushWinners(payload);
    } else if (onReturnToStage) {
      onReturnToStage();
    }

    setLastAction('Winners pushed! Everyone redirected to Podium slide.');
    setTimeout(() => setLastAction(null), 3500);
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

  return (
    <div className="bg-[#191919] text-white min-h-screen p-6 max-w-md mx-auto flex flex-col justify-between font-sans">
      <div>
        {/* Header with Connection Status */}
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-gray-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Stage Remote</h1>
            <p className="text-xs text-gray-400 mt-0.5">U.E.P. Salto Ángel Spelling Bee 2026</p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
            <span>{isConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>

        {/* Status Toast */}
        {lastAction && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastAction}</span>
          </div>
        )}

        {/* Winner Form */}
        <form onSubmit={handlePushWinners} className="space-y-2">
          {/* 1st Place Input */}
          <div>
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
              1st Place (Champion)
            </label>
            <input
              type="text"
              value={winners.first}
              onChange={(e) => setWinners({ ...winners, first: e.target.value })}
              placeholder="e.g. Sofia Rodriguez"
              className="p-3 rounded bg-[#2B2D31] border border-gray-600 focus:outline-none focus:border-blue-500 w-full mb-4 text-sm"
              autoFocus
            />
          </div>

          {/* 2nd Place Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              2nd Place (Runner-up)
            </label>
            <input
              type="text"
              value={winners.second}
              onChange={(e) => setWinners({ ...winners, second: e.target.value })}
              placeholder="e.g. Mateo Gonzalez"
              className="p-3 rounded bg-[#2B2D31] border border-gray-600 focus:outline-none focus:border-blue-500 w-full mb-4 text-sm"
            />
          </div>

          {/* 3rd Place Input */}
          <div>
            <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-1.5">
              3rd Place
            </label>
            <input
              type="text"
              value={winners.third}
              onChange={(e) => setWinners({ ...winners, third: e.target.value })}
              placeholder="e.g. Camila Perez"
              className="p-3 rounded bg-[#2B2D31] border border-gray-600 focus:outline-none focus:border-blue-500 w-full mb-4 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            {/* Button 1 (Secondary): Clear Board */}
            <button
              type="button"
              onClick={handleClearBoard}
              className="bg-red-600/20 text-red-500 p-3 rounded font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-600/30 transition cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Board</span>
            </button>

            {/* Button 2 (Primary): Push to Stage */}
            <button
              type="submit"
              className="bg-blue-600 text-white p-3 rounded shadow-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 transition cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Push to Stage</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backstage footer note */}
      <div className="pt-8 text-center text-xs text-gray-500 border-t border-gray-800/60 mt-8">
        <p>Live control connected to stage auditorium</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <a
            href={stageReturnUrl}
            onClick={handleReturnClick}
            className="inline-flex items-center gap-1.5 text-yellow-400/90 hover:text-yellow-300 transition cursor-pointer"
            title={stageReturnUrl}
          >
            <span>Open Stage Display</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
