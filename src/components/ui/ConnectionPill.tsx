import React from 'react';
import { Radio } from 'lucide-react';

interface ConnectionPillProps {
  isConnected: boolean;
  latency?: number | null;
  className?: string;
}

export const ConnectionPill: React.FC<ConnectionPillProps> = ({
  isConnected,
  latency,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        isConnected
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      } ${className}`}
    >
      <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
      <span>{isConnected ? (latency ? `Connected (${latency}ms)` : 'Connected') : 'Offline'}</span>
    </div>
  );
};
