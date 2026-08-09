import type { Metadata } from "next";
import Link from "next/link";

import { BedIcon } from "@/components/bed-icon";
import { ModeIcon } from "@/components/mode-icon";
import { StatusChip } from "@/components/status-chip";
import {
  formatApproxTimeSpan,
  formatDistanceKm,
  formatLongDateSpan,
  formatLongWeekdayDate,
  formatRoute,
  placeName,
  sentence,
  spellOutCount,
  stagePath,
} from "@/lib/display";
import type { JourneyMode } from "@/lib/journey";
import type { ItineraryDay, ItineraryEvent, Stage } from "@/lib/trip";
import { trip } from "@/lib/trip";

export const metadata: Metadata = {
  title: "The full itinerary — The Way",
  description: `Every day of the trip, ${formatLongDateSpan(trip.summary.startDate, trip.summary.endDate)}, door to door from ${placeName(trip.summary.originCity)} and back again, with each fact's Status.`,
};

const TRAVEL_MODES: JourneyMode[] = ["Flight", "Bus", "Walk"];

function travelModeOf(kind: string): JourneyMode | undefined {
  return TRAVEL_MODES.find((mode) => mode === kind);
}

function stageFor(day: ItineraryDay): Stage | undefined {
  return trip.stages.find((stage) => stage.date === day.date);
}

function eventHeading(event: ItineraryEvent): string {
  if (event.route) return formatRoute(event.route);
  if (event.location) return placeName(event.location);
  if (event.plan) return sentence(event.plan);
  return event.kind;
}

function eventNotes(event: ItineraryEvent): string[] {
  const notes: string[] = [];
  const times = formatApproxTimeSpan(
    event.departureTimeApprox,
    event.arrivalTimeApprox,
  );
  if (event.operator) notes.push(event.operator);
  if (times) notes.push(times);
  if (event.distanceKm) notes.push(formatDistanceKm(event.distanceKm));
  return notes;
}

function EventIcon({ event }: { event: ItineraryEvent }) {
  const mode = travelModeOf(event.kind);
  if (mode) return <ModeIcon mode={mode} className="size-5 shrink-0" />;
  if (event.kind === "Accommodation") return <BedIcon className="size-5 shrink-0" />;
  return (
    <span aria-hidden="true" className="bg-olive size-2 shrink-0 rounded-full" />
  );
}

function Event({ event }: { event: ItineraryEvent }) {
  const notes = eventNotes(event);

  return (
    <li
      data-testid="itinerary-event"
      className="border-border py-sm gap-sm flex items-start border-b last:border-b-0"
    >
      <span className="text-muted pt-xs w-5 shrink-0 grid place-items-center">
        <EventIcon event={event} />
      </span>

      <span className="gap-xs mr-auto flex flex-col">
        <span className="text-muted text-xs tracking-[0.08em] uppercase">
          {event.kind}
        </span>
        <span className="text-sm font-semibold">{eventHeading(event)}</span>
        {notes.length ? (
          <span className="text-muted text-xs">{notes.join(" · ")}</span>
        ) : null}
        {event.note ? (
          <span className="text-muted prose-body max-w-[52ch]">
            {sentence(event.note)}
          </span>
        ) : null}
      </span>

      <StatusChip status={event.status} className="text-muted mt-xs shrink-0" />
    </li>
  );
}

function FixedFinishNote() {
  const { fixedFinish } = trip;

  return (
    <p
      data-testid="fixed-finish"
      className="border-border mt-sm pt-sm gap-sm flex flex-wrap items-center border-t text-sm"
    >
      <span className="font-semibold">
        Walking into {placeName(fixedFinish.location)} today is settled, even
        though the Stage that gets us there is not
      </span>
      <StatusChip status={fixedFinish.status} className="text-muted" />
    </p>
  );
}

function Day({ day, index }: { day: ItineraryDay; index: number }) {
  const stage = stageFor(day);
  const reachesTheFixedFinish = day.date === trip.fixedFinish.date;

  return (
    <li
      data-testid="itinerary-day"
      className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
    >
      <div className="gap-sm flex flex-wrap items-baseline">
        <span className="text-muted text-xs tracking-[0.08em] uppercase">
          Day {index + 1} of {trip.summary.durationDays}
        </span>
        <span className="text-muted mr-auto text-xs tracking-[0.08em] uppercase">
          {day.category}
        </span>
        {stage ? (
          <Link
            href={stagePath(stage)}
            data-testid="itinerary-stage-link"
            className="tap-target shrink-0 text-xs font-semibold whitespace-nowrap underline"
          >
            Stage {stage.number} →
          </Link>
        ) : null}
      </div>

      <h3 className="font-display text-2xl leading-tight">
        {formatLongWeekdayDate(day.weekday, day.date)}
      </h3>

      <p className="prose-body max-w-[52ch]">
        {sentence(day.summary)}
      </p>

      <ul className="mt-xs flex flex-col">
        {day.events.map((event, eventIndex) => (
          <Event key={eventIndex} event={event} />
        ))}
      </ul>

      {reachesTheFixedFinish ? <FixedFinishNote /> : null}
    </li>
  );
}

export default function ItineraryPage() {
  const { summary } = trip;

  return (
    <main className="px-md py-lg gap-lg mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="gap-sm flex flex-col">
        <p className="gap-sm text-muted flex flex-wrap items-center text-xs tracking-[0.08em] uppercase">
          <span>
            {spellOutCount(summary.durationDays)} days,{" "}
            {spellOutCount(summary.walkingDays)} of them walking
          </span>
          <StatusChip status={summary.status} className="ml-auto" />
        </p>
        <h1 className="font-display text-3xl leading-tight">
          {formatLongDateSpan(summary.startDate, summary.endDate)}
        </h1>
        <p className="text-muted prose-body max-w-[52ch]">
          Door to door from {placeName(summary.originCity)} and back again. Every
          fact below carries its Status, so a provisional detail reads as
          provisional.
        </p>
      </div>

      <ol className="gap-md flex flex-col">
        {trip.itinerary.map((day, index) => (
          <Day key={day.date} day={day} index={index} />
        ))}
      </ol>

      <nav aria-label="Elsewhere" className="gap-sm flex flex-wrap">
        <Link
          href="/"
          className="border-border rounded-medium px-md tap-target border text-sm"
        >
          Overview
        </Link>
        <Link
          href="/map/"
          className="border-border rounded-medium px-md tap-target border text-sm"
        >
          Route map
        </Link>
      </nav>
    </main>
  );
}
