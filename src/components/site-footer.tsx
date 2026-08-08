import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper mt-xxl">
      <div className="px-md py-xl gap-md mx-auto flex max-w-5xl flex-col items-start">
        <Wordmark strapline className="text-paper" />
        <p className="text-sm opacity-80">theway.cannontrodder.net</p>
      </div>
    </footer>
  );
}
