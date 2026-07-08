import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from '../components/ui/HexGrid';
import type { Project } from '@taskflow/shared';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      const project = await apiClient<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <HexGrid />

      <header className="relative z-10 border-b border-grid-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/projects" className="font-display text-lg neon-glow text-neon-cyan">
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

      <section className="relative z-10 max-w-2xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-neon-magenta text-xs tracking-[0.3em] uppercase font-display mb-2">
            [ NEW_PROJECT ]
          </p>
          <h1 className="font-display text-3xl text-neon-cyan">Create Project</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-xs text-terminal-green tracking-widest uppercase mb-2 font-display">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full bg-abyss border border-grid-line px-4 py-3 text-neon-cyan text-sm outline-none transition-colors focus:border-neon-cyan placeholder:text-grid-line"
              placeholder="Enter project name..."
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs text-terminal-green tracking-widest uppercase mb-2 font-display">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full bg-abyss border border-grid-line px-4 py-3 text-neon-cyan text-sm outline-none transition-colors focus:border-neon-cyan placeholder:text-grid-line resize-none"
              placeholder="Optional description..."
            />
          </div>

          {error && (
            <p className="text-neon-magenta text-xs tracking-wider">{error}</p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="neon-border bg-abyss px-8 py-3 font-display text-sm tracking-widest uppercase text-neon-cyan transition-all duration-300 hover:bg-neon-cyan hover:text-void-black disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'CREATING...' : '> CREATE'}
            </button>
            <Link
              to="/projects"
              className="text-xs text-grid-line tracking-wider hover:text-neon-cyan transition-colors"
            >
              CANCEL
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
