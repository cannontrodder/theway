import type { StatusLabel } from "@/lib/trip";

export function StatusChip({
  status,
  className,
}: {
  status: StatusLabel;
  className?: string;
}) {
  return (
    <span
      className={`rounded-small px-xs border border-current text-[0.625rem] leading-normal font-semibold tracking-[0.12em] uppercase ${className ?? ""}`}
    >
      {status}
    </span>
  );
}
