import React from 'react';

interface StageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold shadow-lg',
  secondary: 'bg-white/10 text-white hover:bg-white/15 border border-white/20 font-semibold',
  danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 font-semibold',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5 font-medium',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-2xl',
};

export const StageButton: React.FC<StageButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
