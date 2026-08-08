import { HeadlineFigures } from "@/components/headline-figures";
import { HomepageHero } from "@/components/homepage-hero";
import { JourneyAtAGlance } from "@/components/journey-at-a-glance";
import { RoutePanel } from "@/components/route-panel";
import { WalkingDays } from "@/components/walking-days";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HomepageHero />
      <HeadlineFigures />
      <JourneyAtAGlance />
      <WalkingDays />
      <RoutePanel />
    </main>
  );
}
