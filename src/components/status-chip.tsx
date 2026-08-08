import type { StatusLabel } from "@/lib/trip";

export function StatusChip({
  status,
  className,
  testId = "status-chip",
}: {
  status: StatusLabel;
  className?: string;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      className={`rounded-small px-xs border border-current text-[0.625rem] leading-normal font-semibold tracking-[0.12em] uppercase ${className ?? ""}`}
    >
      {status}
    </span>
  );
}
