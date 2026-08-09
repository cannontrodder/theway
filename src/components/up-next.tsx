import Link from "next/link";

import {
  formatDistanceKm,
  formatLongWeekdayDate,
  placeName,
  sentence,
  stagePath,
  stageRoute,
} from "@/lib/display";
import { firstStage, trip } from "@/lib/trip";

import { BedIcon } from "./bed-icon";
import { BootIcon } from "./mode-icon";
import { StatusChip } from "./status-chip";

export function UpNext() {
  const stage = firstStage();
  const note = stage.mainRisk ?? stage.planningReason;

  return (
    <section
      aria-label="Up next"
      data-testid="up-next"
      className="border-border rounded-medium bg-white px-md py-md gap-sm flex flex-col border"
    >
      <div className="gap-sm flex flex-wrap items-center">
        <h2 className="font-display mr-auto text-base tracking-[0.06em] uppercase">
          Up next
        </h2>
        <StatusChip
          status={stage.status}
          className="text-muted"
          testId="up-next-status"
        />
      </div>

      <p className="text-muted text-xs tracking-[0.08em] uppercase">
        Stage {stage.number} of {trip.summary.walkingDays} ·{" "}
        {formatLongWeekdayDate(stage.weekday, stage.date)}
      </p>

      <p className="font-display text-2xl leading-tight">{stageRoute(stage)}</p>

      <ul className="gap-sm flex flex-wrap items-center text-sm">
        <li className="gap-xs flex items-center">
          <BootIcon className="text-muted size-4 shrink-0" />
          <span className="font-semibold">
            {formatDistanceKm(stage.distanceKm)}
          </span>
        </li>
        <li className="border-border rounded-small px-xs text-muted border text-xs whitespace-nowrap">
          {stage.difficulty}
        </li>
        <li className="gap-xs text-muted flex items-center">
          <BedIcon className="size-4 shrink-0" />
          {placeName(stage.overnight)}
        </li>
      </ul>

      {stage.preWalkTransport ? (
        <p data-testid="up-next-transport" className="text-sm font-semibold">
          {sentence(stage.preWalkTransport)} first.
        </p>
      ) : null}

      {note ? (
        <p data-testid="up-next-note" className="max-w-[44ch] text-sm leading-relaxed">
          {sentence(note)}
        </p>
      ) : null}

      <p>
        <Link
          href={stagePath(stage)}
          data-testid="up-next-link"
          className="bg-olive text-white rounded-medium px-md py-sm mt-xs inline-flex min-h-11 items-center text-sm font-semibold no-underline"
        >
          View Stage {stage.number} →
        </Link>
      </p>
    </section>
  );
}
