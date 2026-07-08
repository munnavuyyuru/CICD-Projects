import type { ReactNode } from 'react';

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  magenta?: boolean;
}

export function NeonCard({ children, className = '', magenta }: NeonCardProps) {
  const borderClass = magenta ? 'neon-border-magenta' : 'neon-border';

  return (
    <div className={`glass-panel ${borderClass} animate-slide-up p-6 ${className}`}>
      {children}
    </div>
  );
}