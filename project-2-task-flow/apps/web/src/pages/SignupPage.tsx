import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from '../components/ui/HexGrid';

export function SignupPage() {
  const { user, loading: authLoading, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signUp(email, password, displayName);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <main className="relative min-h-screen flex items-center justify-center px-6">
        <HexGrid />
        <div className="relative z-10 w-full max-w-md text-center terminal-box">
          <p className="text-terminal-green font-display text-lg tracking-wider mb-4">
            NODE_REGISTERED
          </p>
          <p className="text-xs text-grid-line tracking-wider mb-6">
            {'Check your email for the confirmation link. If you don\'t see it, check your SPAM folder.'}
          </p>
          <Link
            to="/login"
            className="neon-border bg-abyss px-8 py-3 font-display text-sm tracking-widest uppercase text-neon-cyan transition-all duration-300 hover:bg-neon-cyan hover:text-void-black inline-block"
          >
            &gt; INIT_SESSION
          </Link>
        </div>
      </main>
    );
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
            [ NEW_OPERATOR ]
          </p>
        </div>

        <form onSubmit={handleSubmit} className="terminal-box space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-terminal-green text-xs tracking-widest uppercase mb-2">
              Name // OPERATOR_TAG
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={1}
              maxLength={50}
              placeholder="ne0n_r1d3r"
              className="w-full bg-deep-purple border border-grid-line text-neon-cyan px-4 py-3 text-sm outline-none transition-colors focus:neon-border placeholder:text-grid-line"
            />
          </div>

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
              minLength={6}
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
            className="w-full neon-border-magenta bg-abyss px-8 py-3 font-display text-sm tracking-widest uppercase text-neon-magenta transition-all duration-300 hover:bg-neon-magenta hover:text-void-black disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? 'REGISTERING...' : '> REGISTER_NODE'}
          </button>

          <p className="text-center text-grid-line text-xs tracking-wider">
            HAVE_CREDENTIALS?{' '}
            <Link to="/login" className="text-neon-cyan hover:text-neon-magenta transition-colors">
              INIT_SESSION
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}