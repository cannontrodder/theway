import Link from "next/link";

import {
  formatDayAndMonthSpan,
  formatLongWeekdayDate,
  nightPath,
  placeName,
  sentence,
  stagePath,
} from "@/lib/display";
import type { StatusLabel } from "@/lib/trip";
import { trip } from "@/lib/trip";

import { ImageSlot } from "./image-slot";
import { LowerPanel } from "./lower-panel";
import { StatusChip } from "./status-chip";

interface Highlight {
  heading: string;
  when: string;
  prose: string;
  status: StatusLabel;
  href: string;
  linkLabel: string;
}

function highlights(): Highlight[] {
  const { fixedFinish, finalWeekend, stages, accommodation, summary } = trip;
  const finalStage = stages[stages.length - 1];
  const finalWeekendNight = accommodation.find(
    (night) => night.date === finalWeekend.startDate,
  );
  if (!finalWeekendNight) {
    throw new Error(
      `The final weekend starts on ${finalWeekend.startDate} but no night in the accommodation data falls then, so the highlight has nowhere to link.`,
    );
  }

  return [
    {
      heading: `${placeName(fixedFinish.location)} on the Friday`,
      when: formatLongWeekdayDate(fixedFinish.weekday, fixedFinish.date),
      prose: `${sentence(fixedFinish.eveningPlan)}. Walking into ${placeName(fixedFinish.location)} that day is settled, whatever else moves.`,
      status: fixedFinish.eveningPlanStatus,
      href: stagePath(finalStage),
      linkLabel: `Stage ${finalStage.number} →`,
    },
    {
      heading: `The weekend in ${placeName(finalWeekend.location)}`,
      when: formatDayAndMonthSpan(finalWeekend.startDate, finalWeekend.endDate),
      prose: `Saturday and Sunday in ${placeName(finalWeekend.location)} with the walking done, then the flight home to ${placeName(summary.originCity)}.`,
      status: finalWeekend.status,
      href: nightPath(finalWeekendNight),
      linkLabel: "That night →",
    },
  ];
}

export function Highlights() {
  return (
    <LowerPanel heading="Highlights" testId="highlights-panel">
      {highlights().map((highlight) => (
        <article
          key={highlight.heading}
          data-testid="highlight"
          className="border-border gap-sm py-sm flex items-start border-b last:border-b-0"
        >
          <ImageSlot className="rounded-small size-16 shrink-0" />

          <div className="gap-xs flex flex-col">
            <div className="gap-sm flex flex-wrap items-center">
              <h3 className="font-display mr-auto text-lg leading-tight">
                {highlight.heading}
              </h3>
              <StatusChip
                status={highlight.status}
                className="text-muted shrink-0"
                testId="highlight-status"
              />
            </div>

            <p className="text-muted text-xs tracking-[0.08em] uppercase">
              {highlight.when}
            </p>

            <p className="max-w-[40ch] text-sm leading-relaxed">
              {highlight.prose}
            </p>

            <Link
              href={highlight.href}
              data-testid="highlight-link"
              className="py-sm text-sm font-semibold underline"
            >
              {highlight.linkLabel}
            </Link>
          </div>
        </article>
      ))}
    </LowerPanel>
  );
}
