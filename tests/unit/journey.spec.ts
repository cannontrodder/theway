import { expect, test } from "@playwright/test";

import { journeyLegs, journeyPlaces, journeySteps } from "../../src/lib/journey";
import { trip } from "../../src/lib/trip";

test("the chain runs Newcastle out to Newcastle home, with the Camino in the middle", () => {
  expect(journeyPlaces().map((place) => place.name)).toEqual([
    "Newcastle",
    "Amsterdam",
    "Bilbao",
    "Logrono",
    "Burgos",
    "Bilbao",
    "Amsterdam",
    "Newcastle",
  ]);
});

test("places and legs alternate, starting and ending on a place", () => {
  const steps = journeySteps();
  expect(steps[0].step).toBe("place");
  expect(steps[steps.length - 1].step).toBe("place");
  expect(steps.map((step) => step.step)).toEqual(
    steps.map((_, index) => (index % 2 === 0 ? "place" : "leg")),
  );
});

test("each leg leaves the place the leg before it arrived at", () => {
  const legs = journeyLegs();
  for (const [index, leg] of legs.entries()) {
    if (index === 0) continue;
    expect(leg.from).toBe(legs[index - 1].to);
  }
});

test("the modes distinguish flights, buses and the walk", () => {
  expect(journeyLegs().map((leg) => leg.mode)).toEqual([
    "Flight",
    "Flight",
    "Bus",
    "Walk",
    "Bus",
    "Flight",
    "Flight",
  ]);
});

test("every leg carries the Status the trip data gives it", () => {
  expect(journeyLegs().map((leg) => leg.status)).toEqual([
    "PLANNED",
    "PLANNED",
    "TO VERIFY",
    "PROPOSED",
    "TO VERIFY",
    "PLANNED",
    "PLANNED",
  ]);
});

test("the walking leg carries the whole walk's span, day count and distance", () => {
  const walk = journeyLegs().find((leg) => leg.mode === "Walk")!;
  expect(walk.from).toBe(trip.summary.startsAt);
  expect(walk.to).toBe(trip.summary.finishesAt);
  expect(walk.startDate).toBe(trip.summary.walkingStartDate);
  expect(walk.endDate).toBe(trip.summary.walkingFinishDate);
  expect(walk.walkingDays).toBe(trip.summary.walkingDays);
  expect(walk.distanceKm).toBe(trip.summary.totalDistanceKm);
});

test("each place carries the date the journey reaches it", () => {
  expect(journeyPlaces().map((place) => [place.name, place.date])).toEqual([
    ["Newcastle", "2026-10-04"],
    ["Amsterdam", "2026-10-04"],
    ["Bilbao", "2026-10-04"],
    ["Logrono", "2026-10-05"],
    ["Burgos", "2026-10-09"],
    ["Bilbao", "2026-10-10"],
    ["Amsterdam", "2026-10-11"],
    ["Newcastle", "2026-10-11"],
  ]);
});

test("the chain's dates never run backwards", () => {
  const dates = journeySteps().map((step) =>
    step.step === "place" ? step.date : step.startDate,
  );
  expect([...dates].sort()).toEqual(dates);
});

test("a flight through Amsterdam becomes two hops so the connection shows as a place", () => {
  const outbound = journeyLegs().slice(0, 2);
  expect(outbound.map((leg) => [leg.from, leg.to])).toEqual([
    ["Newcastle", "Amsterdam"],
    ["Amsterdam", "Bilbao"],
  ]);
  for (const leg of outbound) {
    expect(leg.mode).toBe("Flight");
    if (leg.mode === "Walk") continue;
    expect(leg.operator).toBe("KLM");
  }
});
