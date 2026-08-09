import { expect, test } from "@playwright/test";

import { openItemGroups, openItemLink } from "../../src/lib/open-items";
import { trip } from "../../src/lib/trip";

function itemNamed(fragment: string) {
  const item = trip.openItems.find((open) => open.item.includes(fragment));
  if (!item) throw new Error(`No open item mentions "${fragment}".`);
  return item;
}

test("every open item lands in exactly one priority group, in order", () => {
  const groups = openItemGroups();
  expect(groups.map((group) => group.priority)).toEqual([
    "high",
    "medium",
    "low",
  ]);
  expect(groups.map((group) => group.label)).toEqual([
    "High priority",
    "Medium priority",
    "Low priority",
  ]);

  const grouped = groups.flatMap((group) => group.items);
  expect(grouped).toHaveLength(trip.openItems.length);
  expect(new Set(grouped).size).toBe(trip.openItems.length);
});

test("the groups keep the data's own order within a priority", () => {
  for (const group of openItemGroups()) {
    expect(group.items).toEqual(
      trip.openItems.filter((item) => item.priority === group.priority),
    );
  }
});

test("accommodation and hotel items link to the Stays page", () => {
  for (const fragment of [
    "Select and book Sunday Bilbao hotel",
    "Research and book Camino accommodation",
    "Choose central Burgos hotel",
    "Choose Bilbao hotel for Saturday",
  ]) {
    expect(openItemLink(itemNamed(fragment))).toEqual({
      path: "/stays/",
      mode: "Stay",
    });
  }
});

test("bus items link to the Travel page as a bus", () => {
  expect(openItemLink(itemNamed("bus timetable"))).toEqual({
    path: "/travel/",
    mode: "Bus",
  });
  expect(openItemLink(itemNamed("Burgos to Bilbao bus"))).toEqual({
    path: "/travel/",
    mode: "Bus",
  });
});

test("flight and airport items link to the Travel page as a flight", () => {
  expect(openItemLink(itemNamed("Book flights"))).toEqual({
    path: "/travel/",
    mode: "Flight",
  });
  expect(openItemLink(itemNamed("KLM flight numbers"))).toEqual({
    path: "/travel/",
    mode: "Flight",
  });
  expect(openItemLink(itemNamed("airport transfer"))).toEqual({
    path: "/travel/",
    mode: "Flight",
  });
});

test("an item naming both ends of a Stage links to that Stage page", () => {
  expect(openItemLink(itemNamed("Logrono to Najera is too long"))).toEqual({
    path: "/day/1/",
    mode: "Walk",
  });
  expect(openItemLink(itemNamed("Belorado to Atapuerca stage"))).toEqual({
    path: "/day/4/",
    mode: "Walk",
  });
});

test("an item with nowhere to point gets no link rather than a guessed one", () => {
  expect(openItemLink(itemNamed("elevation profiles"))).toBeUndefined();
  expect(openItemLink(itemNamed("sunrise, sunset"))).toBeUndefined();
});

test("a Stage match beats a keyword match, so a walking item never lands on Travel", () => {
  const busStageItem = itemNamed("Logrono to Najera is too long");
  expect(busStageItem.item).toContain("bus");
  expect(openItemLink(busStageItem)?.mode).toBe("Walk");
});

test("every open item still needs doing, so none of them reads as settled", () => {
  for (const item of trip.openItems) {
    expect(["TO BOOK", "TO VERIFY", "TO DO", "PROPOSED", "OPTIONAL"]).toContain(
      item.status,
    );
  }
});
