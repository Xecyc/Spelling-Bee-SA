import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Trophy, Smartphone, ExternalLink, AlertTriangle } from 'lucide-react';
import { resolveRemoteLink, type RemoteLink } from '../utils/remoteLink';

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
  const [link, setLink] = useState<RemoteLink | null>(null);
  const [chosen, setChosen] = useState(0);

  // Ask the server which address a PHONE can reach (never "localhost").
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLink(null);
    setChosen(0);
    resolveRemoteLink(window.location).then((resolved) => {
      if (!cancelled) setLink(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = link?.urls[chosen] ?? '';

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
        <div className="bg-white p-3.5 rounded-xl shadow-lg mx-auto w-[calc(12rem+1.75rem)] h-[calc(12rem+1.75rem)] flex items-center justify-center">
          {currentUrl ? (
            <QRCodeSVG value={currentUrl} size={200} level="M" includeMargin={false} className="w-48 h-48" />
          ) : (
            <span className="text-xs text-slate-500">Finding this PC&apos;s address…</span>
          )}
        </div>

        {link?.kind === 'ready' && (
          <p className="text-[11px] text-white/60 mt-3 leading-snug">
            Scan with your phone. The phone must be on the <b className="text-white/80">same Wi-Fi</b> as this PC.
            If Windows asks, allow Node.js on <b className="text-white/80">Private networks</b>.
          </p>
        )}
        {link?.kind === 'ready' && link.urls.length > 1 && (
          <div className="mt-2 text-[11px] text-white/60">
            <span>Won&apos;t open? Try another address: </span>
            {link.urls.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setChosen(index)}
                className={`mx-0.5 px-1.5 py-0.5 rounded border font-mono ${
                  index === chosen ? 'border-amber-400 text-amber-300' : 'border-white/20 text-white/60 hover:text-white'
                }`}
              >
                {new URL(url).hostname}
              </button>
            ))}
          </div>
        )}
        {link && link.kind !== 'ready' && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-left text-[11px] leading-snug text-amber-100">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
            {link.kind === 'static' ? (
              <span>
                This copy of the app is on <b>static hosting</b> (like GitHub Pages), so there is no server to connect
                your phone to the stage. To use the phone remote, run the app on the stage PC (
                <code>npm run dev</code>), open it there, and scan the code shown by <i>that</i> copy.
              </span>
            ) : (
              <span>
                The server could not find this PC&apos;s network address. Connect the PC to the Wi-Fi (or Ethernet)
                and open this window again.
              </span>
            )}
          </div>
        )}

        {/* Subtle dynamic link with external link icon */}
        <a
          href={currentUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-white/50 hover:text-yellow-400 transition-colors mt-4 break-all max-w-xs inline-flex items-center justify-center gap-1.5 select-all text-center underline decoration-white/20 hover:decoration-yellow-400"
          title="Click to open remote in new tab"
        >
          <span>{currentUrl}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>

        {/* Open Remote in New Tab for side-by-side desktop testing */}
        <a
          href={currentUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="bg-amber-400 hover:bg-amber-300 text-[#061a3e] transition-colors rounded-lg py-2.5 mt-5 w-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
        >
          <ExternalLink className="w-4 h-4 stroke-[2.5]" />
          <span>Open Remote in New Tab</span>
        </a>

        {/* Switch to Remote View button for testing on desktop */}
        {onSwitchToRemote && (
          <button
            type="button"
            onClick={onSwitchToRemote}
            className="bg-white/5 border border-white/15 text-white/90 hover:bg-white/10 hover:text-white transition-colors rounded-lg py-2 mt-2 w-full text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
            <span>Switch Entire Screen to Remote</span>
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
