import { formatWeekdayDate, stagePath, stageRoute } from "@/lib/display";
import { stageColour } from "@/lib/route";
import { trip } from "@/lib/trip";
import Link from "next/link";

export function RouteLegend({ linked }: { linked: boolean }) {
  return (
    <ul
      data-testid="route-legend"
      aria-label="One colour per walking day"
      className="gap-x-md gap-y-xs flex flex-wrap justify-between sm:justify-start"
    >
      {trip.stages.map((stage) => {
        const swatch = (
          <>
            <span
              data-testid={`legend-swatch-${stage.number}`}
              aria-hidden="true"
              className="h-[3px] w-6 shrink-0 rounded-full"
              style={{ backgroundColor: stageColour(stage.number) }}
            />
            <span>Stage {stage.number}</span>
          </>
        );

        return (
          <li key={stage.number} className="text-sm">
            {linked ? (
              <Link
                href={stagePath(stage)}
                aria-label={`Stage ${stage.number}: ${stageRoute(stage)}, ${formatWeekdayDate(stage.weekday, stage.date)}`}
                className="gap-xs tap-target no-underline"
              >
                {swatch}
              </Link>
            ) : (
              <span className="gap-xs flex items-center">{swatch}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
