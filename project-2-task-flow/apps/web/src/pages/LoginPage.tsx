import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from '../components/ui/HexGrid';

export function LoginPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6">
      <HexGrid />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-3xl neon-glow text-neon-cyan hover:text-neon-cyan/80 transition-colors">
            TASKFLOW
          </Link>
          <p className="text-neon-magenta text-xs tracking-[0.2em] uppercase font-display mt-2">
            [ INIT_SESSION ]
          </p>
        </div>

        <form onSubmit={handleSubmit} className="terminal-box space-y-6">
          <div>
            <label htmlFor="email" className="block text-terminal-green text-xs tracking-widest uppercase mb-2">
              Email // COMMS_CHANNEL
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="operator@domain.net"
              className="w-full bg-deep-purple border border-grid-line text-neon-cyan px-4 py-3 text-sm outline-none transition-colors focus:neon-border placeholder:text-grid-line"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-terminal-green text-xs tracking-widest uppercase mb-2">
              Password // ACCESS_CODE
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
              className="w-full bg-deep-purple border border-grid-line text-neon-cyan px-4 py-3 text-sm outline-none transition-colors focus:neon-border placeholder:text-grid-line"
            />
          </div>

          {error && (
            <p className="text-neon-magenta text-xs tracking-wider">
              ERROR: {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full neon-border bg-abyss px-8 py-3 font-display text-sm tracking-widest uppercase text-neon-cyan transition-all duration-300 hover:bg-neon-cyan hover:text-void-black disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? 'AUTHENTICATING...' : '> AUTHENTICATE'}
          </button>

          <p className="text-center text-grid-line text-xs tracking-wider">
            NO_CREDENTIALS?{' '}
            <Link to="/signup" className="text-neon-magenta hover:text-neon-cyan transition-colors">
              REGISTER_NODE
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}