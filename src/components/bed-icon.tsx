export function BedIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 18v-7h13a4 4 0 0 1 4 4v3" />
      <path d="M3 14.5h17" />
      <path d="M3 8v10M20.5 18v0" />
      <circle cx="7.5" cy="12" r="1.5" />
    </svg>
  );
}
