import type { Metadata } from "next";
import Link from "next/link";

import { ModeIcon } from "@/components/mode-icon";
import { StatusChip } from "@/components/status-chip";
import {
  formatApproxTimeSpan,
  formatDistanceKm,
  formatLegRoute,
  formatLongWeekdayDate,
  formatStations,
  nightPath,
  placeName,
  sentence,
  stagePath,
} from "@/lib/display";
import { journeyPlaces, transferMode } from "@/lib/journey";
import type { TransportLeg } from "@/lib/trip";
import { trip } from "@/lib/trip";

export const metadata: Metadata = {
  title: "Getting there and back — The Way",
  description: `The flights and buses between ${placeName(trip.summary.originCity)} and the Camino, each with its Status. Nothing is booked yet.`,
};

function stageAfter(leg: TransportLeg) {
  return trip.stages.find((stage) => stage.date === leg.date);
}

function nightAfter(leg: TransportLeg) {
  return trip.accommodation.find((night) => night.date === leg.date);
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <li className="gap-xs flex flex-col">
      <span className="text-muted text-xs tracking-[0.08em] uppercase">
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </li>
  );
}

function Leg({ leg }: { leg: TransportLeg }) {
  const mode = transferMode(leg.kind);
  const times = formatApproxTimeSpan(
    leg.departureTimeApprox,
    leg.arrivalTimeApprox,
  );
  const stations = formatStations(leg);
  const stage = stageAfter(leg);
  const night = nightAfter(leg);

  return (
    <li
      data-testid="travel-leg"
      className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
    >
      <div className="gap-sm flex flex-wrap items-center">
        <ModeIcon mode={mode} className="text-muted size-5 shrink-0" />
        <span className="text-muted text-xs tracking-[0.08em] uppercase">
          {leg.kind}
        </span>
        <span className="text-muted mr-auto text-xs tracking-[0.08em] uppercase">
          {formatLongWeekdayDate(leg.weekday, leg.date)}
        </span>
        <StatusChip
          status={leg.status}
          className="text-muted"
          testId="travel-leg-status"
        />
      </div>

      <h3 className="font-display text-2xl leading-tight">
        {formatLegRoute(leg)}
      </h3>

      <ul className="gap-sm grid grid-cols-1 sm:grid-cols-2">
        {leg.operator ? (
          <Detail
            label={leg.kind === "Bus" ? "Likely operator" : "Airline"}
            value={leg.operator}
          />
        ) : null}
        {times ? <Detail label="Times" value={times} /> : null}
        {leg.durationEstimate ? (
          <Detail label="Duration estimate" value={leg.durationEstimate} />
        ) : null}
        {stations ? <Detail label="Likely stations" value={stations} /> : null}
      </ul>

      {leg.note ? (
        <p className="max-w-[52ch] text-sm leading-relaxed">
          {sentence(leg.note)}
        </p>
      ) : null}

      {stage ? (
        <p className="gap-sm flex flex-wrap items-baseline text-sm">
          <span className="text-muted">
            The walking that follows is {formatDistanceKm(stage.distanceKm)}
          </span>
          <StatusChip status={trip.summary.distancesAre} className="text-muted" />
          <Link
            href={stagePath(stage)}
            className="shrink-0 font-semibold whitespace-nowrap underline"
          >
            Stage {stage.number} →
          </Link>
        </p>
      ) : null}

      {night ? (
        <p className="gap-sm flex flex-wrap items-baseline text-sm">
          <span className="text-muted">
            That night is in {placeName(night.location)}, no property chosen yet
          </span>
          <StatusChip status={night.status} className="text-muted" />
          <Link
            href={nightPath(night)}
            data-testid="travel-stays-link"
            className="shrink-0 font-semibold whitespace-nowrap underline"
          >
            That night →
          </Link>
        </p>
      ) : null}
    </li>
  );
}

export default function TravelPage() {
  const chain = journeyPlaces()
    .map((place) => placeName(place.name))
    .join(" → ");

  return (
    <main className="px-md py-lg gap-lg mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="gap-sm flex flex-col">
        <p className="text-muted text-xs tracking-[0.08em] uppercase">
          Getting there and back
        </p>
        <h1 className="font-display text-3xl leading-tight">
          Flights and buses
        </h1>
        <p className="max-w-[44ch] text-sm leading-relaxed">
          Nothing here is booked yet, so every leg carries the Status that says
          how settled it is.
        </p>
        <p className="text-muted max-w-[52ch] text-xs leading-relaxed">
          {chain}
        </p>
      </div>

      <ol className="gap-md flex flex-col">
        {trip.transport.map((leg) => (
          <Leg key={`${leg.date}-${leg.from}`} leg={leg} />
        ))}
      </ol>

      <nav aria-label="Elsewhere" className="gap-sm flex flex-wrap">
        <Link
          href="/stays/"
          className="border-border rounded-medium px-md py-sm border text-sm"
        >
          Where we sleep
        </Link>
        <Link
          href="/itinerary/"
          className="border-border rounded-medium px-md py-sm border text-sm"
        >
          Full itinerary
        </Link>
      </nav>
    </main>
  );
}
