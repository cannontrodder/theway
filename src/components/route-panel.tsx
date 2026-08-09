import Link from "next/link";

import { placeName } from "@/lib/display";
import { trip } from "@/lib/trip";

import { MapAttribution } from "./map-attribution";
import { RouteLegend } from "./route-legend";
import { RouteMap } from "./route-map";
import { RouteSketch } from "./route-sketch";

export const INDICATIVE_LABEL = "Indicative — real track to come";

export function IndicativeNotice({ className }: { className?: string }) {
  return (
    <p
      data-testid="indicative-label"
      className={`border-border rounded-small px-xs py-xs text-muted bg-white border text-xs font-semibold tracking-[0.06em] uppercase ${className ?? ""}`}
    >
      {INDICATIVE_LABEL}
    </p>
  );
}

export function RouteMapFrame({
  interactive,
  followsTheHash = false,
  className,
}: {
  interactive: boolean;
  followsTheHash?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`border-border rounded-medium bg-paper relative overflow-hidden border ${className ?? ""}`}
    >
      <RouteSketch className="absolute inset-0 m-auto max-h-full w-full" />
      <div className="absolute inset-0">
        <RouteMap interactive={interactive} followsTheHash={followsTheHash} />
      </div>
      <IndicativeNotice className="top-sm left-sm absolute z-10" />
    </div>
  );
}

export function RoutePanel() {
  const { summary } = trip;

  return (
    <section
      aria-label="The route"
      className="px-md py-lg gap-md mx-auto flex w-full max-w-5xl flex-col"
    >
      <div className="gap-sm flex items-start">
        <div className="gap-xs mr-auto flex flex-col">
          <h2 className="font-display text-xl tracking-[0.06em] uppercase">
            The route
          </h2>
          <p className="text-muted prose-body max-w-[36ch]">
            {placeName(summary.startsAt)} to {placeName(summary.finishesAt)} via
            the {placeName(summary.route)}
          </p>
        </div>

        <Link
          href="/map/"
          className="tap-target shrink-0 text-sm font-semibold whitespace-nowrap underline"
        >
          Open map →
        </Link>
      </div>

      <RouteMapFrame interactive={false} className="h-56 w-full sm:h-72" />

      <RouteLegend linked={false} />
      <MapAttribution />
    </section>
  );
}
