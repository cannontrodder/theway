import { STAYS_PATH, TRAVEL_PATH, stagePath } from "./display";
import type { JourneyMode } from "./journey";
import type { OpenItem, Stage } from "./trip";
import { trip } from "./trip";

export type OpenItemMode = JourneyMode | "Stay";

export interface OpenItemLink {
  path: string;
  mode: OpenItemMode;
}

export interface OpenItemGroup {
  priority: string;
  label: string;
  items: OpenItem[];
}

const PRIORITY_LABELS: Record<string, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

const PRIORITIES_IN_ORDER = ["high", "medium", "low"];

const STAY_WORDS = ["accommodation", "hotel", "hostel", "albergue"];
const FLIGHT_WORDS = ["flight", "airport", "airline"];
const BUS_WORDS = ["bus", "coach"];

function mentions(item: OpenItem, phrase: string): boolean {
  return new RegExp(`\\b${phrase}e?s?\\b`, "i").test(item.item);
}

function stageNamedIn(item: OpenItem): Stage | undefined {
  return trip.stages.find(
    (stage) => mentions(item, stage.startsAt) && mentions(item, stage.finishesAt),
  );
}

export function openItemLink(item: OpenItem): OpenItemLink | undefined {
  const stage = stageNamedIn(item);
  if (stage) return { path: stagePath(stage), mode: "Walk" };
  if (STAY_WORDS.some((word) => mentions(item, word))) {
    return { path: STAYS_PATH, mode: "Stay" };
  }
  if (FLIGHT_WORDS.some((word) => mentions(item, word))) {
    return { path: TRAVEL_PATH, mode: "Flight" };
  }
  if (BUS_WORDS.some((word) => mentions(item, word))) {
    return { path: TRAVEL_PATH, mode: "Bus" };
  }
  return undefined;
}

export function openItemGroups(): OpenItemGroup[] {
  const unplaceable = trip.openItems.find(
    (item) => !PRIORITIES_IN_ORDER.includes(item.priority),
  );
  if (unplaceable) {
    throw new Error(
      `Open item priority "${unplaceable.priority}" has no place in the running order. Add it before the data uses it.`,
    );
  }

  return PRIORITIES_IN_ORDER.map((priority) => ({
    priority,
    label: PRIORITY_LABELS[priority],
    items: trip.openItems.filter((item) => item.priority === priority),
  })).filter((group) => group.items.length > 0);
}
