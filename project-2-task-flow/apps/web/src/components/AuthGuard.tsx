import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HexGrid } from './ui/HexGrid';

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <HexGrid />
        <p className="relative z-10 text-neon-cyan animate-pulse text-sm tracking-widest uppercase font-display">
          DECRYPTING_SESSION...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}