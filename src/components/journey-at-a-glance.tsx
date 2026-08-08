import Link from "next/link";

import {
  ITINERARY_PATH,
  formatApproxDistanceKm,
  formatDayAndMonth,
  formatDayAndMonthSpan,
  placeName,
} from "@/lib/display";
import type { JourneyPlace, JourneyTransfer, JourneyWalk } from "@/lib/journey";
import { journeySteps } from "@/lib/journey";

import { ModeIcon } from "./mode-icon";
import { StatusChip } from "./status-chip";

const STEP = "grid grid-cols-[24px_1fr] items-center sm:row-span-3 sm:grid-cols-1 sm:grid-rows-subgrid";
const RAIL = "row-span-2 grid w-6 place-items-center self-stretch sm:row-span-1 sm:row-start-2 sm:w-full sm:self-auto";
const ABOVE = "py-xs gap-sm flex flex-wrap items-center sm:row-start-1 sm:flex-col sm:gap-xs sm:justify-end sm:py-0 sm:text-center";
const BELOW = "gap-sm flex items-baseline sm:row-start-3 sm:flex-col sm:items-center sm:gap-0 sm:text-center";

function PlaceStep({ place }: { place: JourneyPlace }) {
  return (
    <li data-testid="journey-place" className={STEP}>
      <span className={RAIL}>
        <span aria-hidden="true" className="bg-ink size-[9px] rounded-full" />
      </span>
      <span className={ABOVE} />
      <span className={`${BELOW} px-sm sm:pt-xs`}>
        <span className="text-sm font-semibold whitespace-nowrap">
          {placeName(place.name)}
        </span>
        <span className="text-muted text-xs whitespace-nowrap">
          {formatDayAndMonth(place.date)}
        </span>
      </span>
    </li>
  );
}

function WalkStep({ leg }: { leg: JourneyWalk }) {
  return (
    <li data-testid="journey-walk" className={`${STEP} sm:min-w-52`}>
      <span className={RAIL}>
        <span
          aria-hidden="true"
          className="border-ink min-h-14 w-0 self-stretch border-l-2 sm:h-0 sm:min-h-0 sm:w-full sm:self-auto sm:border-l-0 sm:border-t-2"
        />
      </span>
      <span className={ABOVE}>
        <ModeIcon mode={leg.mode} className="size-6 shrink-0" />
        <span className="gap-xs flex flex-col sm:items-center">
          <span className="font-display text-base leading-tight whitespace-nowrap sm:text-lg">
            {leg.walkingDays}-day Camino
          </span>
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatDayAndMonthSpan(leg.startDate, leg.endDate)} ·{" "}
            {formatApproxDistanceKm(leg.distanceKm)}
          </span>
        </span>
        <StatusChip status={leg.status} className="text-muted" />
      </span>
      <span className={BELOW} />
    </li>
  );
}

function TransferStep({ leg }: { leg: JourneyTransfer }) {
  return (
    <li data-testid="journey-leg" className={`${STEP} text-muted`}>
      <span className={RAIL}>
        <span
          aria-hidden="true"
          className="border-border min-h-8 w-0 self-stretch border-l border-dashed sm:h-0 sm:min-h-0 sm:w-full sm:self-auto sm:border-l-0 sm:border-t sm:border-dashed"
        />
      </span>
      <span className={`${ABOVE} px-sm`}>
        <ModeIcon mode={leg.mode} className="size-4 shrink-0" />
        <span className="text-xs leading-tight whitespace-nowrap">{leg.mode}</span>
        <StatusChip status={leg.status} />
      </span>
      <span className={BELOW} />
    </li>
  );
}

export function JourneyAtAGlance() {
  return (
    <section
      aria-label="The journey at a glance"
      className="px-md py-lg gap-md border-border mx-auto flex w-full max-w-5xl flex-col border-b"
    >
      <div className="gap-sm flex items-baseline">
        <h2 className="font-display mr-auto text-lg tracking-[0.06em] uppercase sm:text-xl">
          The journey at a glance
        </h2>
        <Link
          href={ITINERARY_PATH}
          className="py-sm shrink-0 text-sm font-semibold whitespace-nowrap underline"
        >
          Full itinerary →
        </Link>
      </div>

      <ol
        data-testid="journey-chain"
        className="flex flex-col sm:grid sm:grid-flow-col sm:grid-rows-[1fr_auto_auto]"
      >
        {journeySteps().map((step, index) => {
          if (step.step === "place") return <PlaceStep key={index} place={step} />;
          if (step.mode === "Walk") return <WalkStep key={index} leg={step} />;
          return <TransferStep key={index} leg={step} />;
        })}
      </ol>
    </section>
  );
}
