import type { Metadata } from "next";
import Link from "next/link";

import { MapAttribution } from "@/components/map-attribution";
import { RouteLegend } from "@/components/route-legend";
import { RouteMapFrame } from "@/components/route-panel";
import { StatusChip } from "@/components/status-chip";
import {
  formatApproxDistanceKm,
  formatWeekdayDateSpan,
  placeName,
  sentence,
  spellOutCount,
} from "@/lib/display";
import { trip } from "@/lib/trip";

const ROUTE_OPEN_ITEM = "Obtain authoritative Camino GPX or GeoJSON";

export const metadata: Metadata = {
  title: "The route map — The Way",
  description:
    "The whole Logroño to Burgos route, one colour per walking day. The line is indicative until we have a real Camino track.",
};

export default function MapPage() {
  const { summary, stages } = trip;
  const firstStage = stages[0];
  const lastStage = stages[stages.length - 1];
  const gpxStillOwed = trip.openItems.find((item) =>
    item.item.startsWith(ROUTE_OPEN_ITEM),
  );

  return (
    <main className="px-md py-lg gap-lg mx-auto flex w-full max-w-5xl flex-1 flex-col">
      <div className="gap-sm flex flex-col">
        <p className="gap-sm text-muted flex flex-wrap items-center text-xs tracking-[0.08em] uppercase">
          <span>
            {spellOutCount(summary.walkingDays)} walking days,{" "}
            {formatApproxDistanceKm(summary.totalDistanceKm)}
          </span>
          <span>{formatWeekdayDateSpan(firstStage, lastStage)}</span>
        </p>
        <h1 className="font-display text-3xl leading-tight">
          {placeName(summary.startsAt)} → {placeName(summary.finishesAt)}
        </h1>
        <p className="text-muted max-w-[52ch] text-sm leading-relaxed">
          The whole route on one map, {placeName(summary.route)} westwards. Tap a
          Stage&apos;s line or its end point to open that Stage.
        </p>
      </div>

      <RouteMapFrame
        interactive
        followsTheHash
        className="h-[60vh] max-h-[560px] min-h-[320px] w-full"
      />

      <RouteLegend linked />
      <MapAttribution />

      <section
        aria-label="How honest this line is"
        className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
      >
        <h2 className="font-display text-lg">
          The line is indicative, not navigable
        </h2>
        <p className="max-w-[60ch] text-sm leading-relaxed">
          Each day is drawn as straight dashes between the towns and villages it
          passes, so it shows the shape of the walk and nothing finer. It is not
          the signed Camino and it will not keep you on the path.
        </p>
        <p className="gap-sm flex flex-wrap items-center text-sm font-semibold">
          <span>{sentence(ROUTE_OPEN_ITEM)} for the whole route</span>
          {gpxStillOwed ? (
            <StatusChip status={gpxStillOwed.status} className="text-muted" />
          ) : null}
        </p>
        <p className="max-w-[60ch] text-sm leading-relaxed">
          {sentence(summary.navigationPolicy)}
        </p>
      </section>

      <nav aria-label="Zoom to a Stage" className="gap-sm flex flex-wrap">
        {stages.map((stage) => (
          <Link
            key={stage.number}
            href={`#stage-${stage.number}`}
            className="border-border rounded-medium px-md py-sm border text-sm"
          >
            Stage {stage.number}
          </Link>
        ))}
      </nav>
    </main>
  );
}
