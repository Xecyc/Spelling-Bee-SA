import { useRef, useCallback } from 'react';
import { easeOutQuint } from '../utils/canvas/easing';

export interface PhysicsState {
  angle: number;
  isSpinning: boolean;
  startTime: number;
  duration: number;
  targetAngle: number;
  initialAngle: number;
}

export function useWheelPhysics(onSpinEnd: (winningIndex: number) => void) {
  const physicsRef = useRef<PhysicsState>({
    angle: 0,
    isSpinning: false,
    startTime: 0,
    duration: 6000,
    targetAngle: 0,
    initialAngle: 0,
  });

  const animFrameRef = useRef<number | null>(null);

  const startSpin = useCallback(
    (totalSlices: number, onTick?: (pegIndex: number) => void) => {
      if (physicsRef.current.isSpinning) return;

      const extraRounds = 5 + Math.floor(Math.random() * 4);
      const randomStop = Math.random() * (Math.PI * 2);
      const targetAngle = physicsRef.current.angle + extraRounds * Math.PI * 2 + randomStop;

      physicsRef.current = {
        angle: physicsRef.current.angle % (Math.PI * 2),
        isSpinning: true,
        startTime: performance.now(),
        duration: 6500,
        targetAngle,
        initialAngle: physicsRef.current.angle % (Math.PI * 2),
      };

      let lastPegIndex = -1;

      const tick = (now: number) => {
        const elapsed = now - physicsRef.current.startTime;
        const progress = Math.min(elapsed / physicsRef.current.duration, 1);
        const easedProgress = easeOutQuint(progress);

        physicsRef.current.angle =
          physicsRef.current.initialAngle +
          (physicsRef.current.targetAngle - physicsRef.current.initialAngle) * easedProgress;

        // Peg audio tick detection without React state updates
        if (onTick && totalSlices > 0) {
          const sliceAngle = (Math.PI * 2) / totalSlices;
          const currentPegIndex = Math.floor(physicsRef.current.angle / sliceAngle);
          if (currentPegIndex !== lastPegIndex) {
            lastPegIndex = currentPegIndex;
            onTick(currentPegIndex);
          }
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          physicsRef.current.isSpinning = false;
          // Calculate winning slice index at needle position (right edge: angle 0)
          const normalizedAngle =
            (Math.PI * 2 - (physicsRef.current.angle % (Math.PI * 2))) % (Math.PI * 2);
          const sliceAngle = (Math.PI * 2) / totalSlices;
          const winnerIndex = Math.floor(normalizedAngle / sliceAngle) % totalSlices;
          onSpinEnd(winnerIndex);
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);
    },
    [onSpinEnd]
  );

  const stopSpin = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    physicsRef.current.isSpinning = false;
  }, []);

  return { physicsRef, startSpin, stopSpin, animFrameRef };
}
