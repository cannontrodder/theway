import { formatMonthAndYear, placeName, spellOutCount } from "@/lib/display";
import { trip } from "@/lib/trip";

import { ImageSlot } from "./image-slot";

export function HomepageHero() {
  const { summary } = trip;
  const sentence = `From ${placeName(summary.startsAt)} to ${placeName(summary.finishesAt)} over ${spellOutCount(summary.walkingDays)} days in ${formatMonthAndYear(summary.walkingStartDate)}. Two mates from County Durham walking west.`;

  return (
    <section aria-label="The Way" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-5xl sm:grid-cols-2 sm:items-stretch">
        <ImageSlot className="h-16 w-full xs:h-28 sm:order-2 sm:h-full sm:min-h-64" />

        <div className="px-md py-md gap-sm flex flex-col items-start sm:py-lg sm:order-1 sm:justify-center">
          <h1 className="font-display text-4xl leading-none tracking-[0.04em] uppercase sm:text-6xl">
            The Way
          </h1>

          <p className="gap-sm font-display flex items-center text-lg italic sm:text-xl">
            <span aria-hidden="true" className="bg-paper h-px w-8 shrink-0" />
            Our Camino. Our Journey.
          </p>

          <p className="prose-body max-w-[44ch]">{sentence}</p>
        </div>
      </div>
    </section>
  );
}
