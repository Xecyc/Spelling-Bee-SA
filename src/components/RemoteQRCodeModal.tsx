import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Trophy, Smartphone } from 'lucide-react';

interface RemoteQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRemote?: () => void;
}

export const RemoteQRCodeModal: React.FC<RemoteQRCodeModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRemote,
}) => {
  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const remoteUrl = `${origin}/remote`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0B1120]/90 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-sm mx-auto w-full text-center flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Gold Trophy Icon centered above title */}
        <Trophy className="w-8 h-8 text-yellow-400 mb-3" />

        {/* Title */}
        <h2 className="text-white font-bold tracking-widest uppercase text-base mb-6">
          STAGE REMOTE
        </h2>

        {/* QR Code Container wrapped in clean white padding box */}
        <div className="bg-white p-3 rounded-xl shadow-lg mx-auto">
          <QRCodeSVG
            value={remoteUrl}
            size={180}
            level="M"
            includeMargin={false}
            className="w-44 h-44"
          />
        </div>

        {/* Subtle direct link */}
        <a
          href="/remote"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-white/40 hover:text-yellow-400 transition-colors mt-4 truncate max-w-xs block select-all"
          title="Click to open remote in new tab"
        >
          {remoteUrl}
        </a>

        {/* Switch to Remote View button for testing on desktop */}
        {onSwitchToRemote && (
          <button
            type="button"
            onClick={onSwitchToRemote}
            className="bg-white/5 border border-white/15 text-white/90 hover:bg-white/10 hover:text-white transition-colors rounded-lg py-2.5 mt-5 w-full text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
            <span>Switch to Remote View on this Screen</span>
          </button>
        )}

        {/* Single elegant button at the bottom to close the modal */}
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border border-white/20 text-white hover:bg-white/10 transition-colors rounded-lg py-2.5 mt-2.5 w-full text-sm font-semibold tracking-wide cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
