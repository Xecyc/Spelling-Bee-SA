import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WheelSlice } from '../types/presentation';
import { audioManager } from '../utils/audio';
import {
  getSliceTextColor,
  getBalancedSliceColor,
  VIBRANT_STAGE_PALETTE,
} from '../utils/palette.ts';

interface WheelCanvasProps {
  slices: WheelSlice[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (slice: WheelSlice) => void;
  pointerPosition?: 'top' | 'right';
  size?: number;
  showCenterText?: boolean;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  slices,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  pointerPosition = 'right',
  size,
  showCenterText = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelAngleRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const pointerDeflectionRef = useRef<number>(0);
  const pointerVelocityRef = useRef<number>(0);
  const lastSliceIdxRef = useRef<number>(-1);

  const activeSlices = slices.length > 0
    ? slices.filter((s) => s.enabled !== false && (s.text.trim() !== '' || s.image))
    : [{ id: 'ph-1', text: 'WORD 1', color: '#FACC15' }];

  const totalWeight = activeSlices.reduce((acc, s) => acc + (s.weight || 1), 0);

  // Compute slice angles with weights and balanced colors
  const computedSlices = React.useMemo(() => {
    let currentAngle = 0;
    return activeSlices.map((slice, idx) => {
      const weight = slice.weight || 1;
      const arc = (weight / totalWeight) * (Math.PI * 2);
      const color = slice.color || getBalancedSliceColor(idx, activeSlices.length, VIBRANT_STAGE_PALETTE);
      const res = {
        slice,
        index: idx,
        startAngle: currentAngle,
        endAngle: currentAngle + arc,
        arcAngle: arc,
        color,
      };
      currentAngle += arc;
      return res;
    });
  }, [activeSlices, totalWeight]);

  // Pointer angle relative to center: right is 0, top is -PI/2
  const pointerAngle = pointerPosition === 'top' ? -Math.PI / 2 : 0;

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
    const maxRadius = Math.min(centerX, centerY) - 24;

    // Outer glow / shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius + 3, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.restore();

    // Draw slices
    computedSlices.forEach((cs) => {
      const start = angle + cs.startAngle;
      const end = angle + cs.endAngle;
      const mid = start + cs.arcAngle / 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadius, start, end);
      ctx.closePath();
      ctx.fillStyle = cs.color;
      ctx.fill();

      // Hairline divider
      if (computedSlices.length > 1) {
        ctx.lineWidth = computedSlices.length > 40 ? 0.8 : 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.stroke();
      }

      // Slice label text
      const label = (cs.slice.text || '').trim();
      if (label) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(mid);

        // Strict unified text contrast logic (YIQ >= 95 -> #0F172A, else #FFFFFF)
        const textColor = getSliceTextColor(cs.color);
        ctx.fillStyle = textColor;

        // Clear any shadow or stroke that muddies the dark navy typography
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const hubR = maxRadius * 0.16;
        const outerPad = 16;
        const innerPad = hubR + 14;
        const availWidth = Math.max(25, maxRadius - outerPad - innerPad);

        const chord = 2 * (maxRadius * 0.72) * Math.sin(Math.min(Math.PI / 2, cs.arcAngle / 2));
        let fontSize = Math.min(20, chord * 0.52, maxRadius * 0.08);
        fontSize = Math.max(8.5, fontSize);

        ctx.font = `700 ${fontSize}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        let displayStr = label;
        if (ctx.measureText(displayStr).width > availWidth) {
          while (displayStr.length > 1 && ctx.measureText(displayStr + '…').width > availWidth) {
            displayStr = displayStr.slice(0, -1);
          }
          displayStr += '…';
        }

        ctx.fillText(displayStr, maxRadius - outerPad, 0);
        ctx.restore();
      }
    });

    // Outer metallic rim ring & peg studs
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    if (computedSlices.length <= 60 && computedSlices.length > 1) {
      computedSlices.forEach((cs) => {
        const a = angle + cs.startAngle;
        const px = centerX + Math.cos(a) * maxRadius;
        const py = centerY + Math.sin(a) * maxRadius;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#334155';
        ctx.stroke();
      });
    }
    ctx.restore();

    // Center Hub Cap
    const hubR = maxRadius * 0.16;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    if (showCenterText) {
      ctx.fillStyle = '#4f46e5';
      ctx.font = `800 ${Math.max(10, Math.round(hubR * 0.38))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isSpinning ? '•••' : 'SPIN', centerX, centerY);
    }
    ctx.restore();

    // Draw Spring-loaded Pointer Needle (Studio Version)
    if (pointerPosition === 'right') {
      const pivotX = centerX + maxRadius + 12;
      const pivotY = centerY;
      const pLen = 30;
      const pHalf = 12;

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(pointerDeflectionRef.current);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.moveTo(-pLen, 0);
      ctx.lineTo(4, -pHalf);
      ctx.arc(4, 0, pHalf, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-pLen, -pHalf, 10, pHalf);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#be123c');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(4, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    } else {
      // Top pointer with deflection
      const pivotX = centerX;
      const pivotY = centerY - maxRadius - 12;
      const pLen = 30;
      const pHalf = 12;

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(pointerDeflectionRef.current);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.moveTo(0, pLen);
      ctx.lineTo(-pHalf, -4);
      ctx.arc(0, -4, pHalf, Math.PI, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-pHalf, -pLen, pHalf, 10);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#be123c');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -4, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }, [computedSlices, pointerPosition, showCenterText, isSpinning]);

  // Initial and reactive redraw with resize support
  useEffect(() => {
    drawWheel(wheelAngleRef.current);
    const handleResize = () => drawWheel(wheelAngleRef.current);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  // Physics animation loop
  useEffect(() => {
    if (!isSpinning) {
      pointerDeflectionRef.current = 0;
      pointerVelocityRef.current = 0;
      // Idle slow spin
      const idleLoop = () => {
        wheelAngleRef.current = (wheelAngleRef.current + 0.0022) % (Math.PI * 2);
        drawWheel(wheelAngleRef.current);
        animFrameIdRef.current = requestAnimationFrame(idleLoop);
      };
      animFrameIdRef.current = requestAnimationFrame(idleLoop);
      return () => {
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      };
    }

    // Spin animation with quintic ease-out matching studio
    const fullSpins = 6 + Math.random() * 4;
    const randomOffset = Math.random() * Math.PI * 2;
    const totalRotation = fullSpins * Math.PI * 2 + randomOffset;
    const startAngle = wheelAngleRef.current;
    const targetAngle = startAngle + totalRotation;
    const duration = 6500;
    const startTime = performance.now();

    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 4.2);

    let lastTickTime = 0;

    const frame = (now: number) => {
      // Spring return physics for pointer flapper deflection
      if (
        Math.abs(pointerDeflectionRef.current) > 0.001 ||
        Math.abs(pointerVelocityRef.current) > 0.001
      ) {
        const springK = 0.28;
        const damping = 0.72;
        const force = -springK * pointerDeflectionRef.current;
        pointerVelocityRef.current = (pointerVelocityRef.current + force) * damping;
        pointerDeflectionRef.current += pointerVelocityRef.current;
      } else {
        pointerDeflectionRef.current = 0;
      }

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutQuint(progress);

      const angle = startAngle + totalRotation * eased;
      wheelAngleRef.current = angle;
      drawWheel(angle);

      // Calculate slice under pointer
      const twoPi = Math.PI * 2;
      const pointerRel = (twoPi - ((angle - pointerAngle) % twoPi)) % twoPi;
      let currentSliceIdx = 0;
      for (let i = 0; i < computedSlices.length; i++) {
        if (pointerRel >= computedSlices[i].startAngle && pointerRel < computedSlices[i].endAngle) {
          currentSliceIdx = i;
          break;
        }
      }

      if (currentSliceIdx !== lastSliceIdxRef.current) {
        lastSliceIdxRef.current = currentSliceIdx;
        const speedFactor = 1 - progress;
        if (now - lastTickTime > 30) {
          audioManager.playTick(speedFactor);
          lastTickTime = now;
        }
        pointerDeflectionRef.current = -0.42;
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(frame);
      } else {
        // Spin finished
        pointerDeflectionRef.current = 0;
        wheelAngleRef.current = targetAngle % (Math.PI * 2);
        drawWheel(wheelAngleRef.current);

        const finalRel = (twoPi - ((targetAngle - pointerAngle) % twoPi)) % twoPi;
        let winningSlice = computedSlices[0]?.slice;
        for (let i = 0; i < computedSlices.length; i++) {
          if (finalRel >= computedSlices[i].startAngle && finalRel < computedSlices[i].endAngle) {
            winningSlice = computedSlices[i].slice;
            break;
          }
        }
        onSpinEnd(winningSlice);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(frame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isSpinning, computedSlices, drawWheel, onSpinEnd, pointerAngle]);

  const handleWheelClick = () => {
    if (isSpinning) return;
    onSpinStart();
  };

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none group w-full h-full aspect-square touch-manipulation"
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
      <canvas
        ref={canvasRef}
        className="w-full h-full drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
      />
    </div>
  );
};
