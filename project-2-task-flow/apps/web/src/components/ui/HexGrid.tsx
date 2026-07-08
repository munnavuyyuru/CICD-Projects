export function HexGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] animate-hex-rotate"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
      >
        <defs>
          <pattern id="hexgrid" width="60" height="103.923" patternUnits="userSpaceOnUse">
            <path
              d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z"
              fill="none"
              stroke="rgb(0,255,204)"
              strokeWidth="0.5"
            />
            <path
              d="M30 103.923 L60 121.243 L60 155.883 L30 173.203 L0 155.883 L0 121.243 Z"
              fill="none"
              stroke="rgb(0,255,204)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexgrid)" />
      </svg>
    </div>
  );
}