import { ShellMark } from "./shell-mark";

export function Wordmark({
  strapline = false,
  className,
}: {
  strapline?: boolean;
  className?: string;
}) {
  return (
    <span className={`gap-sm flex items-center ${className ?? ""}`}>
      <ShellMark className="size-8 shrink-0 text-ochre" />
      <span className="flex flex-col">
        <span className="text-xl leading-none font-bold tracking-[0.16em] uppercase">
          The Way
        </span>
        {strapline ? (
          <span className="mt-xs text-xs leading-none">
            Our Camino. Our Journey.
          </span>
        ) : null}
      </span>
    </span>
  );
}
