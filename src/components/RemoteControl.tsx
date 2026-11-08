import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Radio, CheckCircle2, RotateCcw, Send, ExternalLink } from 'lucide-react';

interface WinnersState {
  first: string;
  second: string;
  third: string;
}

export const RemoteControl: React.FC = () => {
  const [winners, setWinners] = useState<WinnersState>({
    first: '',
    second: '',
    third: '',
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.io server (uses current host/port or origin)
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen to updates from server or other remotes
    socket.on('show_winners', (data: WinnersState) => {
      if (data) {
        setWinners({
          first: data.first || '',
          second: data.second || '',
          third: data.third || '',
        });
      }
    });

    socket.on('hide_winners', () => {
      // Board cleared
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleClearBoard = () => {
    setWinners({ first: '', second: '', third: '' });
    if (socketRef.current) {
      socketRef.current.emit('clear_board');
    }
    setLastAction('Board cleared on stage');
    setTimeout(() => setLastAction(null), 3000);
  };

  const handlePushWinners = (e: React.FormEvent) => {
    e.preventDefault();
    if (socketRef.current) {
      socketRef.current.emit('push_winners', {
        first: winners.first.trim(),
        second: winners.second.trim(),
        third: winners.third.trim(),
      });
    }
    setLastAction('Winners pushed to stage!');
    setTimeout(() => setLastAction(null), 3500);
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
        <a
          href="/"
          className="inline-flex items-center gap-1 mt-2 text-gray-400 hover:text-white transition"
        >
          <span>Open Stage Display</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
