import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from '../components/ui/HexGrid';
import { NeonCard } from '../components/ui/NeonCard';

export function DashboardPage() {
  const { user, profile, signOut } = useAuth();

  return (
    <main className="relative min-h-screen">
      <HexGrid />

      <header className="relative z-10 border-b border-grid-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-lg neon-glow text-neon-cyan">
            TASKFLOW
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-grid-line tracking-wider">
              {profile?.display_name ?? user?.email}
            </span>
            <button
              onClick={signOut}
              className="text-xs text-neon-magenta tracking-widest uppercase font-display hover:text-neon-cyan transition-colors"
            >
              &gt; DISCONNECT
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-neon-magenta text-xs tracking-[0.3em] uppercase font-display mb-2">
            [ OPERATOR_CONSOLE ]
          </p>
          <h1 className="font-display text-3xl text-neon-cyan">
            Welcome, {profile?.display_name ?? 'Operator'}
          </h1>
          <p className="text-terminal-green text-sm mt-2 opacity-60">
            User ID: {user?.id.slice(0, 8)}... | Email: {user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <NeonCard>
            <p className="text-neon-magenta text-3xl font-display mb-1">0</p>
            <p className="text-xs text-terminal-green tracking-wider uppercase">Projects</p>
          </NeonCard>
          <NeonCard>
            <p className="text-neon-cyan text-3xl font-display mb-1">0</p>
            <p className="text-xs text-terminal-green tracking-wider uppercase">Tasks</p>
          </NeonCard>
          <NeonCard>
            <p className="text-electric-blue text-3xl font-display mb-1">0</p>
            <p className="text-xs text-terminal-green tracking-wider uppercase">Completed</p>
          </NeonCard>
        </div>

          <Link to="/projects" className="terminal-box text-center py-16 block hover:border-neon-cyan transition-colors">
            <p className="text-grid-line text-sm tracking-wider mb-4">
              {'// NO_ACTIVE_PROJECTS'}
            </p>
            <p className="text-neon-cyan text-xs tracking-widest uppercase font-display">
              &gt; BROWSE_PROJECTS
            </p>
          </Link>
      </section>
    </main>
  );
}