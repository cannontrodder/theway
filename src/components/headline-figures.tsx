import {
  formatApproxDistanceKm,
  formatDateSpan,
  formatWeekdayDateSpan,
  placeName,
} from "@/lib/display";
import { trip } from "@/lib/trip";

import { StatusChip } from "./status-chip";

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.5c1.1 0 1.8 1.4 1.8 3.2v3.6l7.2 4.3v2.1l-7.2-2.2v3.6l2.6 1.9v1.8L12 19.6l-4.4 1.2v-1.8l2.6-1.9v-3.6L3 15.7v-2.1l7.2-4.3V5.7c0-1.8.7-3.2 1.8-3.2z" />
    </svg>
  );
}

function BootIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.5 3.5h4.2l.4 5.6 6.9 3.3a4.5 4.5 0 0 1 2.5 4v3.1H5.5z" />
      <path d="M5.5 16.5h13.8" />
      <path d="M9.9 9.1 12 11m.6-.4L14.7 12" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19c4 0 3-6 7-6s3-7 9-7" strokeDasharray="3 3" />
      <circle cx="4" cy="19" r="2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="6" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21.5s7-6.2 7-11.5a7 7 0 1 0-14 0c0 5.3 7 11.5 7 11.5z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function HeadlineFigures() {
  const { summary, stages } = trip;
  const firstStage = stages[0];
  const lastStage = stages[stages.length - 1];

  const figures = [
    {
      icon: <PlaneIcon className="size-6" />,
      value: formatDateSpan(summary.startDate, summary.endDate),
      detail: `${summary.durationDays} days`,
      status: summary.status,
    },
    {
      icon: <BootIcon className="size-6" />,
      value: `${summary.walkingDays} walking days`,
      detail: formatWeekdayDateSpan(firstStage, lastStage),
      status: summary.status,
    },
    {
      icon: <RouteIcon className="size-6" />,
      value: `${placeName(summary.startsAt)} → ${placeName(summary.finishesAt)}`,
      detail: placeName(summary.route),
      status: summary.status,
    },
    {
      icon: <PinIcon className="size-6" />,
      value: formatApproxDistanceKm(summary.totalDistanceKm),
      detail: "Walking distance",
      status: summary.distancesAre,
    },
  ];

  return (
    <section
      aria-label="Headline figures"
      className="bg-ink text-paper"
    >
      <ul className="mx-auto grid max-w-5xl grid-cols-2 sm:grid-cols-4">
        {figures.map((figure) => (
          <li
            key={figure.value}
            className="px-md py-md gap-xs border-blue flex flex-col items-center border-b border-r text-center last:border-r-0 sm:border-b-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r"
          >
            <span className="text-border">{figure.icon}</span>
            <span className="text-sm leading-tight font-semibold tracking-[0.08em]">
              {figure.value}
            </span>
            <span className="text-border text-xs leading-tight">
              {figure.detail}
            </span>
            <StatusChip status={figure.status} className="text-border mt-xs" />
          </li>
        ))}
      </ul>
    </section>
  );
}
