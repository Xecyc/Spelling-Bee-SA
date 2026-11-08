import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'podium' | 'modal' | 'panel';
  accent?: 'gold' | 'silver' | 'bronze' | 'blue';
}

const ACCENT_STYLES = {
  gold: 'border-yellow-400/40 shadow-[0_20px_50px_rgba(250,204,21,0.15)]',
  silver: 'border-slate-300/40 shadow-[0_20px_50px_rgba(203,213,225,0.15)]',
  bronze: 'border-amber-600/40 shadow-[0_20px_50px_rgba(217,119,6,0.15)]',
  blue: 'border-blue-400/30 shadow-[0_20px_50px_rgba(30,58,138,0.3)]',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  accent = 'blue',
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-[#061229]/85 backdrop-blur-md border rounded-2xl';
  return (
    <div
      className={`${baseClasses} ${ACCENT_STYLES[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
