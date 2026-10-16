// A side-on race car facing right, 120 × 48, for the dark mode switch.
export const CAR_WIDTH = 120;
export const CAR_HEIGHT = 48;

export function Car({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 48"
      width={CAR_WIDTH}
      height={CAR_HEIGHT}
      className={className}
      aria-hidden
    >
      <path
        d="M6 36 L12 24 L38 19 L56 8 L82 8 L97 20 L114 24 L117 36 Z"
        fill="#e11d48"
      />
      <path d="M60 12 L80 12 L90 20 L54 20 Z" fill="#bae6fd" />
      <rect x="12" y="27" width="104" height="3" fill="#fafafa" />
      <rect x="2" y="16" width="10" height="4" rx="1" fill="#171717" />
      <rect x="6" y="20" width="3" height="6" fill="#171717" />
      <rect x="110" y="26" width="6" height="4" rx="1" fill="#fde047" />
      {[30, 94].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={37} r={9} fill="#171717" />
          <circle cx={cx} cy={37} r={4} fill="#a3a3a3" />
        </g>
      ))}
    </svg>
  );
}
