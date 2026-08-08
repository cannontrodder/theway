import type { StatusLabel, TransportLeg } from "./trip";
import { trip } from "./trip";

export type JourneyMode = "Flight" | "Bus" | "Walk";

export interface JourneyPlace {
  step: "place";
  name: string;
  date: string;
}

interface LegSpan {
  step: "leg";
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  status: StatusLabel;
}

export interface JourneyTransfer extends LegSpan {
  mode: "Flight" | "Bus";
  operator?: string;
}

export interface JourneyWalk extends LegSpan {
  mode: "Walk";
  walkingDays: number;
  distanceKm: number;
}

export type JourneyLeg = JourneyTransfer | JourneyWalk;
export type JourneyStep = JourneyPlace | JourneyLeg;

function toTransferMode(kind: string): "Flight" | "Bus" {
  if (kind === "Flight" || kind === "Bus") return kind;
  throw new Error(
    `The journey chain has no icon for a "${kind}" leg. Add one before the data uses it.`,
  );
}

function hopsOf(leg: TransportLeg): [string, string][] {
  if (!leg.via) return [[leg.from, leg.to]];
  return [
    [leg.from, leg.via],
    [leg.via, leg.to],
  ];
}

function toTransfers(leg: TransportLeg): JourneyTransfer[] {
  return hopsOf(leg).map(([from, to]) => ({
    step: "leg" as const,
    mode: toTransferMode(leg.kind),
    from,
    to,
    startDate: leg.date,
    endDate: leg.date,
    status: leg.status,
    operator: leg.operator,
  }));
}

function walkingStatus(): StatusLabel {
  const statuses = new Set(trip.stages.map((stage) => stage.status));
  if (statuses.size !== 1) {
    throw new Error(
      `The Stages no longer share one Status (${[...statuses].join(", ")}), so the journey chain cannot state a single one.`,
    );
  }
  return [...statuses][0];
}

function toWalk(): JourneyWalk {
  const firstStage = trip.stages[0];
  const lastStage = trip.stages[trip.stages.length - 1];

  return {
    step: "leg",
    mode: "Walk",
    from: firstStage.startsAt,
    to: lastStage.finishesAt,
    startDate: firstStage.date,
    endDate: lastStage.date,
    status: walkingStatus(),
    walkingDays: trip.summary.walkingDays,
    distanceKm: trip.summary.totalDistanceKm,
  };
}

function legsInOrder(): JourneyLeg[] {
  const walk = toWalk();
  const transfers = trip.transport.flatMap(toTransfers);
  return [
    ...transfers.filter((leg) => leg.startDate <= walk.startDate),
    walk,
    ...transfers.filter((leg) => leg.startDate > walk.startDate),
  ];
}

export function journeySteps(): JourneyStep[] {
  const legs = legsInOrder();
  const steps: JourneyStep[] = [];
  let arrivedAt: string | undefined;

  for (const leg of legs) {
    if (arrivedAt === undefined) {
      steps.push({ step: "place", name: leg.from, date: leg.startDate });
    } else if (leg.from !== arrivedAt) {
      throw new Error(
        `The journey chain breaks: a leg leaves ${leg.from} but the one before it arrived in ${arrivedAt}.`,
      );
    }

    steps.push(leg, { step: "place", name: leg.to, date: leg.endDate });
    arrivedAt = leg.to;
  }

  return steps;
}

export function journeyPlaces(): JourneyPlace[] {
  return journeySteps().filter((step): step is JourneyPlace => step.step === "place");
}

export function journeyLegs(): JourneyLeg[] {
  return journeySteps().filter((step): step is JourneyLeg => step.step === "leg");
}
