import { HeadlineFigures } from "@/components/headline-figures";
import { Highlights } from "@/components/highlights";
import { HomepageHero } from "@/components/homepage-hero";
import { JourneyAtAGlance } from "@/components/journey-at-a-glance";
import { OpenItemsPanel } from "@/components/open-items-panel";
import { RoutePanel } from "@/components/route-panel";
import { UpNext } from "@/components/up-next";
import { WalkingDays } from "@/components/walking-days";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HomepageHero />
      <HeadlineFigures />
      <JourneyAtAGlance />
      <WalkingDays />
      <RoutePanel />

      <div className="px-md pb-lg gap-md mx-auto grid w-full max-w-5xl grid-cols-1 items-start lg:grid-cols-3">
        <UpNext />
        <OpenItemsPanel />
        <Highlights />
      </div>
    </main>
  );
}
