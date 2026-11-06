import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WheelSlice } from '../types/presentation';
import { audioManager } from '../utils/audio';

interface WheelCanvasProps {
  slices: WheelSlice[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (slice: WheelSlice) => void;
  pointerPosition?: 'top' | 'right';
  size?: number; // Canvas display size in pixels
  showCenterText?: boolean;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  slices,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  pointerPosition = 'top',
  size = 520,
  showCenterText = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const lastSliceIndexRef = useRef<number>(-1);
  const [flipperAngle, setFlipperAngle] = useState(0);

  const numSlices = Math.max(1, slices.length);
  const sliceAngle = (2 * Math.PI) / numSlices;

  // The pointer angle in radians relative to center:
  // Top pointer is at -PI / 2 (or 3PI/2)
  // Right pointer is at 0
  const pointerAngle = pointerPosition === 'top' ? -Math.PI / 2 : 0;

  // Draw wheel on canvas
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 2;

    // Outer shadow / rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();

    // Outer border ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 1, 0, 2 * Math.PI);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.restore();

    // Slices
    for (let i = 0; i < numSlices; i++) {
      const slice = slices[i];
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = slice?.color || '#cbd5e1';
      ctx.fill();

      // Hairline slice dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = numSlices > 35 ? 1 : 1.5;
      ctx.stroke();

      // Text along the slice
      if (slice?.text) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);

        // Optimal font scaling based on slice count and text length
        const baseFontSize = numSlices > 36 ? 10 : numSlices > 24 ? 12 : numSlices > 14 ? 13 : 15;
        const fontScale = radius / 240;
        const fontSize = Math.max(8, Math.round(baseFontSize * fontScale));

        ctx.font = `700 ${fontSize}px 'Outfit', sans-serif`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Add subtle shadow for legibility
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 2;

        const maxTextWidth = radius * 0.72;
        const truncatedText = slice.text.length > 15 ? slice.text.slice(0, 14) + '…' : slice.text;
        ctx.fillText(truncatedText, radius - 16, 0, maxTextWidth);

        ctx.restore();
      }

      ctx.restore();
    }

    // Inner center hub
    const hubRadius = radius * 0.22;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center hub icon / text
    if (showCenterText) {
      ctx.font = `800 ${Math.round(13 * (radius / 240))}px 'Outfit', sans-serif`;
      ctx.fillStyle = isSpinning ? '#94a3b8' : '#0284c7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isSpinning ? 'SPINNING' : 'SPIN', centerX, centerY);
    }

    ctx.restore();
    ctx.restore();
  }, [slices, numSlices, sliceAngle, showCenterText, isSpinning]);

  // Initial and reactive redraw with resize support
  useEffect(() => {
    drawWheel(currentAngleRef.current);

    const handleResize = () => {
      drawWheel(currentAngleRef.current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  // Physics animation loop
  useEffect(() => {
    if (!isSpinning) {
      setFlipperAngle(0);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    // Determine target rotations: 5 to 8 full rotations + randomized slice target
    const fullSpins = 5 + Math.random() * 3;
    const extraOffset = Math.random() * Math.PI * 2;
    const totalRotation = fullSpins * Math.PI * 2 + extraOffset;
    const startAngle = currentAngleRef.current;
    const targetAngle = startAngle + totalRotation;

    // Spin duration in ms (between 5500ms and 7000ms)
    const duration = 6000;
    const startTime = performance.now();

    // Cubic-bezier deceleration function
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3.4);

    let lastTickTime = 0;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);

      const angle = startAngle + totalRotation * easedProgress;
      currentAngleRef.current = angle;
      drawWheel(angle);

      // Calculate which slice currently crosses the pointer
      // Normalized angle relative to pointer
      const normalizedAngle = (angle - pointerAngle) % (2 * Math.PI);
      const positiveAngle = (2 * Math.PI - (normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle)) % (2 * Math.PI);
      const currentSliceIdx = Math.floor(positiveAngle / sliceAngle) % numSlices;

      if (currentSliceIdx !== lastSliceIndexRef.current) {
        lastSliceIndexRef.current = currentSliceIdx;
        const speedFactor = 1 - progress;
        if (now - lastTickTime > 30) {
          audioManager.playTick(speedFactor);
          lastTickTime = now;
        }

        // Subtle flipper deflection during spin only
        setFlipperAngle(pointerPosition === 'top' ? (Math.random() > 0.5 ? 8 : -8) : -10);
        setTimeout(() => setFlipperAngle(0), 35);
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(frame);
      } else {
        // Spin finished!
        setFlipperAngle(0);
        currentAngleRef.current = targetAngle;
        drawWheel(targetAngle);

        const finalNormalized = (targetAngle - pointerAngle) % (2 * Math.PI);
        const finalPositive = (2 * Math.PI - (finalNormalized < 0 ? finalNormalized + 2 * Math.PI : finalNormalized)) % (2 * Math.PI);
        const winningIdx = Math.floor(finalPositive / sliceAngle) % numSlices;
        const winningSlice = slices[winningIdx] || slices[0];

        onSpinEnd(winningSlice);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(frame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isSpinning, drawWheel, numSlices, onSpinEnd, pointerAngle, pointerPosition, sliceAngle, slices]);

  // Handle spin click
  const handleWheelClick = () => {
    if (isSpinning) return;
    onSpinStart();
  };

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none group w-full h-full aspect-square"
      style={size ? { maxWidth: size, maxHeight: size } : undefined}
      onClick={handleWheelClick}
      role="button"
      tabIndex={0}
      aria-label="Interactive Wheel of Names. Click to spin."
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isSpinning) {
          e.preventDefault();
          onSpinStart();
        }
      }}
    >
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
      />

      {/* Pointer / Flipper Indicator */}
      {pointerPosition === 'top' ? (
        <div
          className="absolute -top-3.5 left-1/2 z-30 pointer-events-none transition-transform duration-75"
          style={{
            transform: `translateX(-50%) rotate(${isSpinning ? flipperAngle : 0}deg)`,
            transformOrigin: '22px 10px',
          }}
        >
          {/* Top Pointer needle - perfectly centered */}
          <svg width="44" height="48" viewBox="0 0 44 48" fill="none" className="drop-shadow-md">
            <polygon
              points="6,4 38,4 22,44"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="12" r="5" fill="#f8fafc" />
          </svg>
        </div>
      ) : (
        <div
          className="absolute right-0 top-1/2 z-30 pointer-events-none transition-transform duration-75"
          style={{
            transform: `translateY(-50%) translateX(8px) rotate(${isSpinning ? flipperAngle : 0}deg)`,
            transformOrigin: '36px 22px',
          }}
        >
          {/* Right Pointer needle (Image 1 style) */}
          <svg width="48" height="44" viewBox="0 0 48 44" fill="none" className="drop-shadow-md">
            <polygon
              points="44,6 44,38 4,22"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="36" cy="22" r="5" fill="#f8fafc" />
          </svg>
        </div>
      )}

      {/* Hover Instruction Overlay when idle */}
      {!isSpinning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-slate-900/85 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg border border-white/20">
            Click to spin
          </div>
        </div>
      )}
    </div>
  );
};
