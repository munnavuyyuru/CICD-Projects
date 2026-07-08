export function ScanlineOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,255,204,0.02)] to-transparent animate-scanline" />
    </div>
  );
}