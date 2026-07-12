import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from '../components/ui/HexGrid';
import { NeonCard } from '../components/ui/NeonCard';
import { apiClient } from '../lib/api';

interface DashboardStats {
  projectCount: number;
  taskCount: number;
  completedCount: number;
}

interface ActivityEventWithAuthor {
  id: string;
  project_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  display_name: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentActivity: ActivityEventWithAuthor[];
}

export function DashboardPage() {
  const { user, profile, signOut } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<DashboardResponse>('/api/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const hasProjects = (stats?.projectCount ?? 0) > 0;

  return (
    <main className="relative min-h-screen">
      <HexGrid />

      <header className="relative z-10 border-b border-grid-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-lg neon-glow text-neon-cyan">
            TASKFLOW
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/projects"
              className="text-xs text-neon-cyan tracking-widest uppercase font-display hover:text-terminal-green transition-colors"
            >
              &gt; PROJECTS
            </Link>
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

        {loading && (
          <p className="text-terminal-green text-sm animate-pulse mb-12">
            {'// LOADING_CONSOLE_DATA...'}
          </p>
        )}

        {!loading && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <NeonCard>
                <p className="text-neon-magenta text-3xl font-display mb-1">
                  {stats.projectCount}
                </p>
                <p className="text-xs text-terminal-green tracking-wider uppercase">
                  Projects
                </p>
              </NeonCard>
              <NeonCard>
                <p className="text-neon-cyan text-3xl font-display mb-1">
                  {stats.taskCount}
                </p>
                <p className="text-xs text-terminal-green tracking-wider uppercase">
                  Tasks
                </p>
              </NeonCard>
              <NeonCard>
                <p className="text-electric-blue text-3xl font-display mb-1">
                  {stats.completedCount}
                </p>
                <p className="text-xs text-terminal-green tracking-wider uppercase">
                  Completed
                </p>
              </NeonCard>
            </div>

            {hasProjects && data!.recentActivity.length > 0 && (
              <div className="mt-16">
                <h2 className="font-display text-xl text-neon-cyan mb-6 tracking-wider">
                  {'>>'} ACTIVITY_FEED
                </h2>
                <div className="space-y-1">
                  {data!.recentActivity.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 py-2 border-b border-grid-line/30 text-xs">
                      <span className="text-grid-line shrink-0 font-mono">
                        {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-neon-magenta shrink-0 font-display tracking-wider">
                        {event.display_name}
                      </span>
                      <span className="text-grid-line">/</span>
                      <span className="text-terminal-green">
                        {event.action} {event.entity_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasProjects && (
              <Link to="/projects" className="terminal-box text-center py-16 block hover:border-neon-cyan transition-colors">
                <p className="text-grid-line text-sm tracking-wider mb-4">
                  {'// NO_ACTIVE_PROJECTS'}
                </p>
                <p className="text-neon-cyan text-xs tracking-widest uppercase font-display">
                  &gt; BROWSE_PROJECTS
                </p>
              </Link>
            )}
          </>
        )}
      </section>
    </main>
  );
}
