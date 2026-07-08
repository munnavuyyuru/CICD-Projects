import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from '../components/ui/HexGrid';
import { NeonCard } from '../components/ui/NeonCard';
import type { Project, Task } from '@taskflow/shared';

const STATUS_LABELS: Record<string, string> = {
  todo: 'TODO',
  in_progress: 'IN_PROGRESS',
  done: 'DONE',
};

const STATUS_COLORS: Record<string, string> = {
  todo: 'text-neon-magenta',
  in_progress: 'text-synthwave-orange',
  done: 'text-terminal-green',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'HIGH',
  2: 'MEDIUM',
  3: 'LOW',
};

type TaskStatus = 'todo' | 'in_progress' | 'done';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, signOut, user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [projectData, tasksData] = await Promise.all([
        apiClient<Project>(`/api/projects/${id}`),
        apiClient<Task[]>(`/api/tasks/project/${id}`),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const updated = await apiClient<Task>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      // ignore
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !id) return;

    try {
      const task = await apiClient<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ project_id: id, title: newTitle.trim() }),
      });
      setTasks((prev) => [...prev, task]);
      setNewTitle('');
    } catch {
      // ignore
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <HexGrid />
        <p className="relative z-10 text-neon-cyan animate-pulse text-sm tracking-widest uppercase font-display">
          LOADING_PROJECT...
        </p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <HexGrid />
        <div className="relative z-10 text-center">
          <p className="text-neon-magenta text-sm tracking-widest uppercase font-display mb-4">
            PROJECT_NOT_FOUND
          </p>
          <Link to="/projects" className="text-neon-cyan text-xs underline">
            &gt; BACK_TO_PROJECTS
          </Link>
        </div>
      </main>
    );
  }

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

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-neon-magenta text-xs tracking-[0.3em] uppercase font-display mb-2">
            [ PROJECT_DETAIL ]
          </p>
          <h1 className="font-display text-3xl text-neon-cyan">{project.name}</h1>
          {project.description && (
            <p className="text-terminal-green text-sm mt-2 opacity-60">{project.description}</p>
          )}
        </div>

        {error && (
          <p className="text-neon-magenta text-xs mb-4">{error}</p>
        )}

        <form onSubmit={handleCreateTask} className="flex gap-3 mb-12">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={500}
            placeholder="New task title..."
            className="flex-1 bg-abyss border border-grid-line px-4 py-3 text-neon-cyan text-sm outline-none transition-colors focus:border-neon-cyan placeholder:text-grid-line"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="neon-border bg-abyss px-6 py-3 font-display text-xs tracking-widest uppercase text-neon-cyan transition-all duration-300 hover:bg-neon-cyan hover:text-void-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &gt; ADD
          </button>
        </form>

        {tasks.length === 0 && (
          <div className="terminal-box text-center py-16">
            <p className="text-grid-line text-sm tracking-wider">
              {'// NO_TASKS_IN_THIS_PROJECT'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {tasks.map((task) => (
            <NeonCard key={task.id} className="flex items-center gap-4">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                className={`bg-abyss border border-grid-line px-2 py-1 text-xs font-display tracking-wider uppercase outline-none cursor-pointer ${STATUS_COLORS[task.status]}`}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              <div className="flex-1 min-w-0">
                <p className="text-neon-cyan text-sm truncate">{task.title}</p>
                {task.description && (
                  <p className="text-terminal-green text-xs opacity-40 truncate mt-0.5">{task.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-display tracking-wider ${task.priority === 1 ? 'text-neon-magenta' : task.priority === 2 ? 'text-synthwave-orange' : 'text-grid-line'}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
                {task.due_date && (
                  <span className="text-xs text-grid-line">{task.due_date}</span>
                )}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-xs text-neon-magenta hover:text-terminal-green transition-colors"
                  title="Delete task"
                >
                  [X]
                </button>
              </div>
            </NeonCard>
          ))}
        </div>
      </section>
    </main>
  );
}
