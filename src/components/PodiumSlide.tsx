import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WinnersData } from '../types/presentation';

export interface Winners {
  first: string;
  second: string;
  third: string;
}

const FourPointStar = ({ className, delay = 0 }: { className?: string; delay?: number | string }) => {
  const numericDelay = typeof delay === 'string' ? parseFloat(delay.replace(/[{}]/g, '')) || 0 : delay;

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      initial={{ scale: 0, rotate: -45, opacity: 0 }}
      animate={{
        scale: [0, 1.2, 0.9, 1.1, 1],
        rotate: [0, 15, -15, 0],
        opacity: [0, 1, 0.8, 1],
      }}
      transition={{
        delay: numericDelay,
        duration: 1.2,
        repeat: Infinity,
        repeatType: 'reverse',
        repeatDelay: 1.5,
      }}
    >
      <path d="M12 0 L14.8 9.2 L24 12 L14.8 14.8 L12 24 L9.2 14.8 L0 12 L9.2 9.2 Z" />
    </motion.svg>
  );
};

export interface PodiumSlideProps {
  winners?: Winners | WinnersData | null;
  backgroundUrl?: string;
}

export const PodiumSlide: React.FC<PodiumSlideProps> = ({
  winners,
  backgroundUrl = `${import.meta.env.BASE_URL}assets/image_d24fda.jpg`,
}) => {
  const safeWinners = winners || { first: '', second: '', third: '' };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#FACC15', '#F59E0B', '#FFFFFF', '#3B82F6', '#EF4444'],
        });
      } catch (e) {
        // Fallback if canvas-confetti is not installed
      }
    }, 3300);
    return () => clearTimeout(timer);
  }, [winners]);

  return (
    <div
      className="relative w-full h-full aspect-video flex flex-col items-center justify-end pb-8 bg-cover bg-center overflow-hidden select-none"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      {/* Full-Screen Subtle Vignette Overlay to unify background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#040B1A]/90 via-[#07132B]/55 to-transparent pointer-events-none z-0" />

      {/* Center Framed Stage Backdrop Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-[88%] max-w-5xl h-[72%] rounded-3xl bg-[#07132B]/85 backdrop-blur-md border-2 border-yellow-400/30 shadow-[0_25px_70px_rgba(0,0,0,0.85),inset_0_0_60px_rgba(30,58,138,0.35)] flex flex-col items-center justify-end px-8 pb-6 overflow-hidden"
      >
        {/* Ambient Center Spotlight Glow inside Stage Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.5, 0.35], scale: [0.8, 1.1, 1] }}
          transition={{ delay: 2.2, duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-8 w-[26rem] h-[26rem] rounded-full bg-yellow-400/20 blur-[80px] pointer-events-none z-0"
        />

        {/* Podium Columns Row */}
        <div className="relative z-10 flex items-end justify-center gap-6 md:gap-10 w-full max-w-4xl">
          {/* ================= 2ND PLACE (LEFT) ================= */}
          <div className="flex flex-col items-center flex-1 max-w-[280px]">
            {/* Floating Winner Name Card - Clean Name Only */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.7, type: 'spring', stiffness: 220, damping: 14 }}
              className="relative mb-4 w-full flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-11 h-11 -mb-4 z-20 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 border-2 border-white shadow-lg flex items-center justify-center"
              >
                <Award className="w-5 h-5 text-slate-800" />
              </motion.div>

              <div className="w-full min-w-[200px] px-5 pt-6 pb-4 rounded-2xl bg-gradient-to-b from-[#112240] to-[#0A192F] border-2 border-slate-300 shadow-[0_10px_25px_rgba(0,0,0,0.65)] text-center">
                <div className="text-xl md:text-2xl font-black text-white leading-tight break-words">
                  {safeWinners.second || '2nd Place'}
                </div>
              </div>
            </motion.div>

            {/* 2nd Place Pedestal Column */}
            <motion.div
              initial={{ y: 260, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 90, damping: 14 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-[106%] h-3.5 rounded-t-lg bg-gradient-to-r from-slate-300 via-white to-slate-300 shadow-[0_0_15px_rgba(226,232,240,0.4)] border-b-2 border-slate-500 z-10" />

              <div className="relative w-full h-40 bg-gradient-to-b from-[#1E3A8A] via-[#0F2557] to-[#081229] border-x-2 border-slate-300/60 shadow-2xl flex flex-col items-center justify-between py-4 overflow-hidden">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1/2 bg-gradient-to-b from-slate-200/15 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] tracking-wider">
                    2ND
                  </span>
                  <span className="text-xs font-bold tracking-[0.25em] text-slate-300/80 uppercase mt-1">
                    Place
                  </span>
                </div>

                <div className="w-3/4 h-1.5 rounded-full bg-slate-300/30" />
              </div>
            </motion.div>
          </div>

          {/* ================= 1ST PLACE (CENTER) ================= */}
          <div className="flex flex-col items-center flex-1 max-w-[330px] z-20 -mx-2">
            {/* Floating Winner Name Card - Clean Name Only */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 3.1, type: 'spring', stiffness: 200, damping: 12 }}
              className="relative mb-5 w-full flex flex-col items-center"
            >
              <FourPointStar className="w-6 h-6 text-yellow-300 absolute -top-5 -left-3 z-30 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" delay={3.3} />
              <FourPointStar className="w-5 h-5 text-yellow-300 absolute top-1 -right-4 z-30 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" delay={3.6} />

              <motion.div
                animate={{ y: [0, -6, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 -mb-5 z-20 rounded-full bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 border-2 border-yellow-100 shadow-[0_0_20px_rgba(250,204,21,0.8)] flex items-center justify-center"
              >
                <Trophy className="w-7 h-7 text-[#0A192F] fill-[#0A192F]" />
              </motion.div>

              <div className="w-full min-w-[240px] px-6 pt-7 pb-5 rounded-2xl bg-gradient-to-b from-[#172A45] via-[#0F223D] to-[#0A1526] border-[3px] border-yellow-400 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(250,204,21,0.4)] text-center relative overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ delay: 3.5, duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent skew-x-12 pointer-events-none"
                />
                <div className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-amber-400 leading-tight break-words drop-shadow-[0_2px_10px_rgba(250,204,21,0.4)]">
                  {safeWinners.first || '1st Place'}
                </div>
              </div>
            </motion.div>

            {/* 1st Place Pedestal Column */}
            <motion.div
              initial={{ y: 340, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2.3, type: 'spring', stiffness: 80, damping: 12 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-[108%] h-4 rounded-t-lg bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500 shadow-[0_0_20px_rgba(250,204,21,0.7)] border-b-2 border-amber-700 z-10" />

              <div className="relative w-full h-52 bg-gradient-to-b from-[#1D4ED8] via-[#1E3A8A] to-[#0A1526] border-x-[3px] border-yellow-400 shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between py-5 overflow-hidden">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2/3 bg-gradient-to-b from-yellow-400/25 via-yellow-400/5 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <Crown className="w-6 h-6 text-yellow-400 mb-1 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                  <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-600 drop-shadow-[0_5px_10px_rgba(0,0,0,0.75)] tracking-wider">
                    1ST
                  </span>
                  <span className="text-xs font-extrabold tracking-[0.3em] text-yellow-300 uppercase mt-1">
                    Place
                  </span>
                </div>

                <div className="w-4/5 flex flex-col gap-1.5 items-center">
                  <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent" />
                  <div className="w-2/3 h-1 rounded-full bg-yellow-400/40" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ================= 3RD PLACE (RIGHT) ================= */}
          <div className="flex flex-col items-center flex-1 max-w-[280px]">
            {/* Floating Winner Name Card - Clean Name Only */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 220, damping: 14 }}
              className="relative mb-4 w-full flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-11 h-11 -mb-4 z-20 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 border-2 border-amber-200 shadow-lg flex items-center justify-center"
              >
                <Medal className="w-5 h-5 text-amber-950" />
              </motion.div>

              <div className="w-full min-w-[200px] px-5 pt-6 pb-4 rounded-2xl bg-gradient-to-b from-[#112240] to-[#0A192F] border-2 border-amber-500/90 shadow-[0_10px_25px_rgba(0,0,0,0.65)] text-center">
                <div className="text-xl md:text-2xl font-black text-white leading-tight break-words">
                  {safeWinners.third || '3rd Place'}
                </div>
              </div>
            </motion.div>

            {/* 3rd Place Pedestal Column */}
            <motion.div
              initial={{ y: 220, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 90, damping: 14 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-[106%] h-3.5 rounded-t-lg bg-gradient-to-r from-amber-700 via-amber-300 to-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.4)] border-b-2 border-amber-900 z-10" />

              <div className="relative w-full h-32 bg-gradient-to-b from-[#1E3A8A] via-[#0F2557] to-[#081229] border-x-2 border-amber-500/60 shadow-2xl flex flex-col items-center justify-between py-3 overflow-hidden">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1/2 bg-gradient-to-b from-amber-500/15 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] tracking-wider">
                    3RD
                  </span>
                  <span className="text-xs font-bold tracking-[0.25em] text-amber-400/80 uppercase mt-0.5">
                    Place
                  </span>
                </div>

                <div className="w-3/4 h-1.5 rounded-full bg-amber-500/30" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stage Floor Reflection Line inside the frame */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-4xl h-1.5 rounded-full bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent shadow-[0_0_20px_rgba(250,204,21,0.8)] z-20"
        />
      </motion.div>
    </div>
  );
};
