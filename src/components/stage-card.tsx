import Link from "next/link";

import { formatDistanceKm, formatWeekdayDate, placeName } from "@/lib/display";
import type { Stage } from "@/lib/trip";

import { BedIcon } from "./bed-icon";
import { ImageSlot } from "./image-slot";
import { StatusChip } from "./status-chip";

export function stagePath(stage: Stage): string {
  return `/day/${stage.number}/`;
}

export function stageRoute(stage: Stage): string {
  return `${placeName(stage.startsAt)} → ${placeName(stage.finishesAt)}`;
}

export function StageCard({ stage }: { stage: Stage }) {
  return (
    <li
      data-testid="stage-card"
      className="border-border bg-white rounded-medium w-[78%] shrink-0 snap-start overflow-hidden border sm:w-auto"
    >
      <Link href={stagePath(stage)} className="flex h-full flex-col no-underline">
        <div className="relative">
          <ImageSlot className="h-28 w-full" />
          <span className="bg-ink text-white size-8 top-sm left-sm absolute grid place-items-center rounded-full text-sm font-semibold">
            {stage.number}
          </span>
        </div>

        <div className="gap-sm p-md flex flex-1 flex-col">
          <div className="gap-sm flex items-center">
            <span className="text-muted text-xs tracking-[0.08em] whitespace-nowrap uppercase">
              {formatWeekdayDate(stage.weekday, stage.date)}
            </span>
            <StatusChip status={stage.status} className="text-muted ml-auto" />
          </div>

          <p className="font-display text-lg leading-tight">{stageRoute(stage)}</p>

          <p className="gap-sm flex flex-wrap items-center text-sm">
            <span className="font-semibold">
              {formatDistanceKm(stage.distanceKm)}
            </span>
            <span className="border-border rounded-small px-xs text-muted border text-xs whitespace-nowrap">
              {stage.difficulty}
            </span>
          </p>

          <p className="gap-xs text-muted mt-auto flex items-center text-sm">
            <BedIcon className="size-4 shrink-0" />
            {placeName(stage.overnight)}
          </p>
        </div>
      </Link>
    </li>
  );
}
