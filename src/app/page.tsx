import { HeadlineFigures } from "@/components/headline-figures";
import { HomepageHero } from "@/components/homepage-hero";
import { RoutePanel } from "@/components/route-panel";
import { WalkingDays } from "@/components/walking-days";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HomepageHero />
      <HeadlineFigures />
      <WalkingDays />
      <RoutePanel />
    </main>
  );
}
