import type { ReactNode } from 'react';

interface GlitchTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  magenta?: boolean;
}

export function GlitchText({ children, as: Tag = 'h2', className = '', magenta }: GlitchTextProps) {
  const glowClass = magenta ? 'neon-glow-magenta' : 'neon-glow';

  return (
    <Tag
      className={`font-display animate-glitch relative ${glowClass} ${className}`}
      data-text={typeof children === 'string' ? children : undefined}
    >
      {children}
      <style>{`
        [data-text]::before,
        [data-text]::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
        }
        [data-text]::before {
          animation: glitch-layer-1 2s infinite;
          color: ${magenta ? '#ff006e' : '#00ffcc'};
          z-index: -1;
        }
        [data-text]::after {
          animation: glitch-layer-2 3s infinite;
          color: ${magenta ? '#0077ff' : '#ff006e'};
          z-index: -2;
        }
        @keyframes glitch-layer-1 {
          0%, 100% { clip-path: inset(0 0 98% 0); transform: translate(0); }
          20% { clip-path: inset(20% 0 60% 0); transform: translate(-3px, 1px); }
          40% { clip-path: inset(50% 0 30% 0); transform: translate(3px, -2px); }
          60% { clip-path: inset(80% 0 10% 0); transform: translate(-2px, -1px); }
        }
        @keyframes glitch-layer-2 {
          0%, 100% { clip-path: inset(98% 0 0 0); transform: translate(0); }
          25% { clip-path: inset(40% 0 40% 0); transform: translate(2px, 2px); }
          50% { clip-path: inset(10% 0 70% 0); transform: translate(-3px, -1px); }
          75% { clip-path: inset(60% 0 20% 0); transform: translate(1px, -2px); }
        }
      `}</style>
    </Tag>
  );
}