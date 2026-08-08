import { trip } from "@/lib/trip";

import { StageCard } from "./stage-card";

export function WalkingDays() {
  return (
    <section
      aria-label="Walking days"
      className="px-md py-lg mx-auto w-full max-w-5xl"
    >
      <h2 className="font-display mb-md text-xl tracking-[0.06em] uppercase">
        Walking days
      </h2>

      <ul
        data-testid="stage-card-scroller"
        className="gap-md flex snap-x snap-mandatory overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3 xl:grid-cols-5"
      >
        {trip.stages.map((stage) => (
          <StageCard key={stage.number} stage={stage} />
        ))}
      </ul>
    </section>
  );
}
