import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BedIcon } from "@/components/bed-icon";
import { ImageSlot } from "@/components/image-slot";
import { StatusChip } from "@/components/status-chip";
import {
  formatDistanceKm,
  formatWeekdayDate,
  nightPath,
  placeName,
  sentence,
  stagePath,
  stageRoute,
} from "@/lib/display";
import type { StatusLabel } from "@/lib/trip";
import { findStage, overnightStay, trip } from "@/lib/trip";

export function generateStaticParams() {
  return trip.stages.map((stage) => ({ stage: String(stage.number) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}): Promise<Metadata> {
  const stage = findStage(Number((await params).stage));
  if (!stage) return { title: "The Way" };
  return {
    title: `Stage ${stage.number}: ${stageRoute(stage)} — The Way`,
    description: `${formatWeekdayDate(stage.weekday, stage.date)}, ${formatDistanceKm(stage.distanceKm)}, overnight in ${placeName(stage.overnight)}.`,
  };
}

function Figure({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: StatusLabel;
}) {
  return (
    <li className="border-border rounded-medium px-md py-sm gap-xs flex flex-col border">
      <span className="text-muted text-xs tracking-[0.08em] uppercase">
        {label}
      </span>
      <span className="gap-sm flex flex-wrap items-baseline">
        <span className="font-semibold">{value}</span>
        {status ? <StatusChip status={status} className="text-muted" /> : null}
      </span>
    </li>
  );
}

export default async function StagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const stage = findStage(Number((await params).stage));
  if (!stage) notFound();

  const stay = overnightStay(stage);
  const { fixedFinish, summary } = trip;
  const reachesTheFixedFinish = stage.finishesAt === fixedFinish.location;

  return (
    <main className="px-md py-lg gap-lg mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="gap-sm flex flex-col">
        <p className="gap-sm text-muted flex items-center text-xs tracking-[0.08em] uppercase">
          <span>
            Stage {stage.number} of {summary.walkingDays}
          </span>
          <span>{formatWeekdayDate(stage.weekday, stage.date)}</span>
          <StatusChip
            status={stage.status}
            className="ml-auto"
            testId="stage-status"
          />
        </p>
        <h1 className="font-display text-3xl leading-tight">
          {stageRoute(stage)}
        </h1>
      </div>

      <ImageSlot className="rounded-medium h-32 w-full sm:h-48" />

      <ul className="gap-sm grid grid-cols-2">
        <Figure
          label="Distance"
          value={formatDistanceKm(stage.distanceKm)}
          status={summary.distancesAre}
        />
        <Figure label="Difficulty" value={stage.difficulty} />
        <Figure label="Starts at" value={placeName(stage.startsAt)} />
        <Figure label="Finishes at" value={placeName(stage.finishesAt)} />
      </ul>

      {stage.preWalkTransport || stage.mainRisk ? (
        <section
          aria-label="Main risk"
          className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
        >
          <h2 className="font-display text-lg">Watch out for this one</h2>
          {stage.preWalkTransport ? (
            <p className="text-sm font-semibold">
              {sentence(stage.preWalkTransport)}
            </p>
          ) : null}
          {stage.mainRisk ? (
            <p className="max-w-[60ch] text-sm leading-relaxed">
              {sentence(stage.mainRisk)}
            </p>
          ) : null}
        </section>
      ) : null}

      {stage.terrainNote ? (
        <section
          aria-label="Terrain"
          className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
        >
          <h2 className="font-display text-lg">The ground underfoot</h2>
          <p className="max-w-[60ch] text-sm leading-relaxed">
            {sentence(stage.terrainNote)}
          </p>
        </section>
      ) : null}

      {reachesTheFixedFinish ? (
        <section
          aria-label="Fixed finish"
          data-testid="fixed-finish"
          className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
        >
          <h2 className="font-display text-lg">The finish itself is settled</h2>
          <p className="gap-sm flex flex-wrap items-center text-sm font-semibold">
            <span>
              {placeName(fixedFinish.location)} on{" "}
              {formatWeekdayDate(fixedFinish.weekday, fixedFinish.date)}
            </span>
            <StatusChip status={fixedFinish.status} className="text-muted" />
          </p>
          <p className="max-w-[60ch] text-sm leading-relaxed">
            The Stage that gets us there still reads{" "}
            <StatusChip status={stage.status} className="text-muted" />, but
            walking into {placeName(fixedFinish.location)} that day is not up for
            debate.
          </p>
        </section>
      ) : null}

      {stage.eveningPlan || stage.planningReason ? (
        <section
          aria-label="Evening plan"
          className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
        >
          <h2 className="font-display text-lg">That evening</h2>
          {stage.eveningPlan ? (
            <p className="gap-sm flex flex-wrap items-center text-sm font-semibold">
              <span>{sentence(stage.eveningPlan)}</span>
              <StatusChip
                status={
                  reachesTheFixedFinish
                    ? fixedFinish.eveningPlanStatus
                    : stage.status
                }
                className="text-muted"
              />
            </p>
          ) : null}
          {stage.planningReason ? (
            <p className="max-w-[60ch] text-sm leading-relaxed">
              {sentence(stage.planningReason)}
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Waypoints" className="gap-sm flex flex-col">
        <h2 className="font-display text-lg">Villages along the way</h2>
        <ol className="gap-sm flex flex-col">
          {stage.waypoints.map((waypoint) => (
            <li
              key={waypoint}
              className="gap-sm border-border py-sm flex items-center border-b text-sm last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="bg-olive size-2 shrink-0 rounded-full"
              />
              {placeName(waypoint)}
            </li>
          ))}
        </ol>
        <p className="text-muted text-xs">Passed through, not slept in.</p>
      </section>

      <section
        aria-label="Overnight"
        className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
      >
        <h2 className="font-display gap-sm flex items-center text-lg">
          <BedIcon className="size-5 shrink-0" />
          Overnight
        </h2>
        <p className="gap-sm flex flex-wrap items-center text-sm">
          <span className="font-semibold">{placeName(stage.overnight)}</span>
          <span className="text-muted">
            {formatWeekdayDate(stage.weekday, stage.date)}
          </span>
          {stay ? <StatusChip status={stay.status} className="text-muted" /> : null}
        </p>
        {stay?.notes ? (
          <p className="max-w-[60ch] text-sm leading-relaxed">
            {sentence(stay.notes)}
          </p>
        ) : null}
        {stay ? (
          <p>
            <Link
              href={nightPath(stay)}
              data-testid="stays-link"
              className="py-sm text-sm font-semibold underline"
            >
              This night on the Stays page →
            </Link>
          </p>
        ) : null}
      </section>

      <section
        aria-label="This Stage on the route map"
        className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
      >
        <h2 className="font-display text-lg">See it on the route map</h2>
        <p>
          <Link
            href={`/map/#stage-${stage.number}`}
            data-testid="route-map-link"
            className="py-sm text-sm font-semibold underline"
          >
            {stageRoute(stage)} on the route map
          </Link>
        </p>
        <p className="max-w-[60ch] text-muted text-xs leading-relaxed">
          The whole walk, one colour per day. The line is indicative, not a
          surveyed track.
        </p>
      </section>

      <section
        aria-label="Orientation maps"
        className="border-border rounded-medium px-md py-md gap-sm bg-white flex flex-col border"
      >
        <h2 className="font-display text-lg">On the map — orientation only</h2>
        <ul className="gap-sm flex flex-col">
          {stage.orientationMaps.map((map) => (
            <li key={map.url}>
              <a
                href={map.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-sm block text-sm underline"
              >
                {placeName(map.label)}
              </a>
            </li>
          ))}
        </ul>
        <p className="max-w-[60ch] text-muted text-xs leading-relaxed">
          {sentence(summary.orientationMapCaveat)}
        </p>
      </section>

      <nav aria-label="Other stages" className="gap-sm flex flex-wrap">
        {trip.stages
          .filter((other) => other.number !== stage.number)
          .map((other) => (
            <Link
              key={other.number}
              href={stagePath(other)}
              className="border-border rounded-medium px-md py-sm border text-sm"
            >
              Stage {other.number}
            </Link>
          ))}
        <Link
          href="/"
          className="border-border rounded-medium px-md py-sm border text-sm"
        >
          Overview
        </Link>
      </nav>
    </main>
  );
}
