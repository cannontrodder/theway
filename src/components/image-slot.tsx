import { RouteLine } from "./route-line";

export function ImageSlot({ className }: { className?: string }) {
  return (
    <div
      data-testid="image-slot"
      className={`bg-olive text-paper overflow-hidden ${className ?? ""}`}
    >
      <RouteLine className="size-full" />
    </div>
  );
}
