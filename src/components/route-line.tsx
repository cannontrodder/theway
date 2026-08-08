export function RouteLine({ className }: { className?: string }) {
  return (
    <svg
      data-testid="route-line"
      viewBox="0 0 320 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M12 100 C 70 92, 88 60, 140 56 S 220 40, 308 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="9 7"
        strokeLinecap="round"
      />
      {[
        [12, 100],
        [140, 56],
        [308, 20],
      ].map(([x, y]) => (
        <circle key={`${x}`} cx={x} cy={y} r="4.5" fill="currentColor" />
      ))}
    </svg>
  );
}
