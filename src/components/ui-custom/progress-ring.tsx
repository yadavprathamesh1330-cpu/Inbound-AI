export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 3,
  color = "#10b981",
  trackColor = "#e2e8f0",
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90 transform"
        style={{ width: size, height: size }}
        viewBox="0 0 36 36"
      >
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={color}
          strokeDasharray={`${value}, 100`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface">
        {label ?? `${Math.round(value)}%`}
      </span>
    </div>
  );
}
