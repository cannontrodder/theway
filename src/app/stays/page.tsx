import type { Metadata } from "next";
import Link from "next/link";

import { BedIcon } from "@/components/bed-icon";
import { StatusChip } from "@/components/status-chip";
import {
  formatLongDateSpan,
  formatLongWeekdayDate,
  nightAnchorId,
  placeName,
  sentence,
  spellOutCount,
  stagePath,
} from "@/lib/display";
import type { Accommodation } from "@/lib/trip";
import { stageEndingAt, trip } from "@/lib/trip";

export const metadata: Metadata = {
  title: "Where we sleep — The Way",
  description: `Every night of the trip, ${formatLongDateSpan(trip.summary.startDate, trip.summary.endDate)}, by date and town. No property is chosen for any night yet.`,
};

function Night({ night }: { night: Accommodation }) {
  const stage = stageEndingAt(night);

  return (
    <li
      id={nightAnchorId(night)}
      data-testid="stay-night"
      className="border-border rounded-medium px-md py-md gap-sm bg-white flex scroll-mt-md flex-col border"
    >
      <div className="gap-sm flex flex-wrap items-center">
        <BedIcon className="text-muted size-5 shrink-0" />
        <span className="text-muted mr-auto text-xs tracking-[0.08em] uppercase">
          {formatLongWeekdayDate(night.weekday, night.date)}
        </span>
        <StatusChip status={night.status} className="text-muted" />
      </div>

      <h3 className="font-display text-2xl leading-tight">
        {placeName(night.location)}
      </h3>

      <p
        data-testid="stay-property"
        className="text-muted text-sm font-semibold"
      >
        No property chosen yet
      </p>

      {night.notes ? (
        <p className="prose-body max-w-[52ch]">
          {sentence(night.notes)}
        </p>
      ) : null}

      {stage ? (
        <p className="gap-sm prose-body flex flex-wrap items-baseline">
          <span className="text-muted">
            The Overnight at the end of this walking day.
          </span>
          <Link
            href={stagePath(stage)}
            data-testid="stay-stage-link"
            className="tap-target shrink-0 font-semibold whitespace-nowrap underline"
          >
            Stage {stage.number} →
          </Link>
        </p>
      ) : null}
    </li>
  );
}

export default function StaysPage() {
  const nights = trip.accommodation;

  return (
    <main className="px-md py-lg gap-lg mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="gap-sm flex flex-col">
        <p className="text-muted text-xs tracking-[0.08em] uppercase">
          {spellOutCount(nights.length)} nights away
        </p>
        <h1 className="font-display text-3xl leading-tight">Where we sleep</h1>
        <p className="prose-body max-w-[44ch]">
          No property is chosen for any night yet. Each night below names its
          date and its town, and carries the Status that says how settled it is.
        </p>
      </div>

      <ol className="gap-md flex flex-col">
        {nights.map((night) => (
          <Night key={night.date} night={night} />
        ))}
      </ol>

      <nav aria-label="Elsewhere" className="gap-sm flex flex-wrap">
        <Link
          href="/travel/"
          className="border-border rounded-medium px-md tap-target border text-sm"
        >
          Flights and buses
        </Link>
        <Link
          href="/itinerary/"
          className="border-border rounded-medium px-md tap-target border text-sm"
        >
          Full itinerary
        </Link>
      </nav>
    </main>
  );
}
