import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from '../components/ui/HexGrid';
import { NeonCard } from '../components/ui/NeonCard';
import type { Project } from '@taskflow/shared';

export function ProjectsPage() {
  const { profile, signOut, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<Project[]>('/api/projects')
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="relative min-h-screen">
      <HexGrid />

      <header className="relative z-10 border-b border-grid-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="font-display text-lg neon-glow text-neon-cyan">
            TASKFLOW
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/projects/new"
              className="text-xs text-neon-cyan tracking-widest uppercase font-display hover:text-terminal-green transition-colors"
            >
              &gt; NEW_PROJECT
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
            [ PROJECT_INDEX ]
          </p>
          <h1 className="font-display text-3xl text-neon-cyan">Projects</h1>
        </div>

        {loading && (
          <p className="text-terminal-green text-sm animate-pulse">LOADING_PROJECTS...</p>
        )}

        {!loading && projects.length === 0 && (
          <div className="terminal-box text-center py-16">
            <p className="text-grid-line text-sm tracking-wider mb-4">
              {'// NO_PROJECTS_FOUND'}
            </p>
            <Link
              to="/projects/new"
              className="text-neon-cyan text-xs tracking-widest uppercase font-display hover:text-terminal-green transition-colors underline"
            >
              &gt; CREATE_FIRST_PROJECT
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <NeonCard className="h-full hover:border-neon-magenta transition-all duration-300">
                <h2 className="font-display text-lg text-neon-cyan mb-2 truncate">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="text-terminal-green text-xs opacity-60 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-grid-line tracking-wider">
                  created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </NeonCard>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
