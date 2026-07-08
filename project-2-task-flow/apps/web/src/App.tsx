import { Outlet } from 'react-router-dom';
import { ScanlineOverlay } from './components/ui/ScanlineOverlay';

export function App() {
  return (
    <div className="data-grid-bg min-h-screen">
      <ScanlineOverlay />
      <Outlet />
    </div>
  );
}