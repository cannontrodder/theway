import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

import { readTrip, trip, type RawTripData } from "../../src/lib/trip";

const rawFile = JSON.parse(
  readFileSync("reference-material/trip-data.json", "utf8"),
) as RawTripData & Record<string, unknown>;

function withRawStatus(status: string) {
  const clone = JSON.parse(JSON.stringify(rawFile)) as RawTripData;
  clone.open_items[0].status = status;
  return clone;
}

test("the trip is built from reference-material/trip-data.json at build time", () => {
  expect(trip).toEqual(readTrip(rawFile));
  expect(trip.summary.startsAt).toBe(rawFile.trip.walking_start);
  expect(trip.summary.finishesAt).toBe(rawFile.trip.walking_finish);
  expect(trip.summary.startDate).toBe(rawFile.trip.start_date);
  expect(trip.summary.endDate).toBe(rawFile.trip.end_date);
  expect(trip.summary.durationDays).toBe(rawFile.trip.duration_days);
});

test("the public interface exposes the summary, Stages, itinerary, accommodation, transport and open items", () => {
  expect(Object.keys(trip).sort()).toEqual([
    "accommodation",
    "itinerary",
    "openItems",
    "stages",
    "summary",
    "transport",
  ]);
  expect(trip.stages).toHaveLength(5);
  expect(trip.itinerary).toHaveLength(rawFile.trip.duration_days);
  expect(trip.accommodation).toHaveLength(7);
  expect(trip.transport.length).toBeGreaterThanOrEqual(4);
  expect(trip.openItems.length).toBeGreaterThan(0);
});

test("every returned fact carries a display-ready Status label, never a raw key or lowercase status", () => {
  const labels = [
    "FIXED",
    "BOOKED",
    "PLANNED",
    "PROPOSED",
    "TO BOOK",
    "TO VERIFY",
    "TO DO",
    "APPROX",
    "OPTIONAL",
  ];

  const statuses = [
    trip.summary.status,
    trip.summary.distancesAre,
    ...trip.stages.map((stage) => stage.status),
    ...trip.itinerary.flatMap((day) => day.events.map((event) => event.status)),
    ...trip.accommodation.map((night) => night.status),
    ...trip.transport.map((leg) => leg.status),
    ...trip.openItems.map((item) => item.status),
  ];

  expect(statuses.length).toBeGreaterThan(30);
  for (const status of statuses) expect(labels).toContain(status);

  const serialised = JSON.stringify(trip);
  for (const rawKey of [
    "day_number",
    "distance_km_approx",
    "difficulty_planning",
    "google_maps_url",
    "google_maps_role",
    "accommodation_requirements",
    "planned_not_booked",
    "to_book",
    "to_verify",
    "to_do",
    "proposed_with_fixed_finish",
    "superseded",
  ]) {
    expect(serialised).not.toContain(rawKey);
  }
  expect(serialised).not.toMatch(/"(fixed|proposed|booked|approximate|optional)"/);
});

test("the nine Statuses map to the uppercase labels in CONTEXT.md", () => {
  const expected: [string, string][] = [
    ["fixed", "FIXED"],
    ["booked", "BOOKED"],
    ["planned_not_booked", "PLANNED"],
    ["proposed", "PROPOSED"],
    ["to_book", "TO BOOK"],
    ["to_verify", "TO VERIFY"],
    ["to_do", "TO DO"],
    ["approximate", "APPROX"],
    ["optional", "OPTIONAL"],
  ];

  for (const [raw, label] of expected) {
    expect(readTrip(withRawStatus(raw)).openItems[0].status).toBe(label);
  }
});

test("proposed_with_fixed_finish is not a Status and yields PROPOSED", () => {
  const dayFive = rawFile.walking_plan.stages.find(
    (stage) => stage.day_number === 5,
  )!;
  expect(dayFive.status).toBe("proposed_with_fixed_finish");

  const stageFive = trip.stages[4];
  expect(stageFive.number).toBe(5);
  expect(stageFive.status).toBe("PROPOSED");
  expect(stageFive.finishesAt).toBe("Burgos");

  const fridayWalk = trip.itinerary
    .find((day) => day.date === "2026-10-09")!
    .events.find((event) => event.kind === "Walk")!;
  expect(fridayWalk.status).toBe("PROPOSED");
});

test("superseded records are absent from every output", () => {
  expect(rawFile.original_plan).toBeDefined();
  expect((rawFile.original_plan as { status: string }).status).toBe("superseded");

  const serialised = JSON.stringify(trip);
  expect(serialised).not.toContain("superseded");
  expect(serialised).not.toContain("original_plan");
  expect(serialised).not.toContain("Logrono to Navarrete");
  expect(serialised).not.toContain("Granon to Ages");
  expect(trip.stages.map((stage) => stage.finishesAt)).not.toContain("Navarrete");
});

test("an unrecognised status value fails the build", () => {
  expect(() => readTrip(withRawStatus("probably_fine"))).toThrow(
    /Unrecognised status "probably_fine"/,
  );
  expect(() => readTrip(withRawStatus("FIXED"))).toThrow(/Unrecognised status/);
  expect(() => readTrip(withRawStatus("superseded"))).toThrow(
    /Unrecognised status/,
  );
});

test("the five Stages come back in day order with start, finish, distance, difficulty, Overnight and ordered Waypoints", () => {
  expect(trip.stages.map((stage) => stage.number)).toEqual([1, 2, 3, 4, 5]);
  expect(trip.stages.map((stage) => stage.date)).toEqual([
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
  ]);

  expect(
    trip.stages.map((stage) => [
      stage.startsAt,
      stage.finishesAt,
      stage.overnight,
      stage.distanceKm,
      stage.difficulty,
    ]),
  ).toEqual([
    ["Logrono", "Najera", "Najera", 28.7, "Long"],
    [
      "Najera",
      "Santo Domingo de la Calzada",
      "Santo Domingo de la Calzada",
      21.7,
      "Moderate",
    ],
    ["Santo Domingo de la Calzada", "Belorado", "Belorado", 22.7, "Moderate"],
    ["Belorado", "Atapuerca", "Atapuerca", 29.9, "Long and more demanding"],
    ["Atapuerca", "Burgos", "Burgos", 20.2, "Moderate"],
  ]);

  expect(trip.stages[0].waypoints).toEqual([
    "Logrono",
    "Navarrete",
    "Ventosa",
    "Najera",
  ]);
  expect(trip.stages[3].waypoints).toEqual([
    "Belorado",
    "Tosantos",
    "Villambistia",
    "Espinosa del Camino",
    "Villafranca Montes de Oca",
    "San Juan de Ortega",
    "Ages",
    "Atapuerca",
  ]);

  for (const stage of trip.stages) {
    expect(stage.waypoints[0]).toBe(stage.startsAt);
    expect(stage.waypoints[stage.waypoints.length - 1]).toBe(stage.finishesAt);
  }
});

test("Stage distances sum to the total stated in the data", () => {
  const summed = trip.stages.reduce((total, stage) => total + stage.distanceKm, 0);
  expect(Number(summed.toFixed(1))).toBe(123.2);
  expect(trip.summary.totalDistanceKm).toBe(123.2);
  expect(trip.summary.distancesAre).toBe("APPROX");
});

test("Google Maps links are orientation-only and carry that caveat", () => {
  const caveat = rawFile.navigation.google_maps_warning;
  expect(trip.summary.orientationMapCaveat).toBe(caveat);
  expect(trip.summary.navigationPolicy).toBe(rawFile.navigation.primary_policy);

  const links = trip.stages.flatMap((stage) => stage.orientationMaps);
  expect(links).toHaveLength(6);
  for (const link of links) {
    expect(link.url).toContain("google.com/maps");
    expect(link.caveat).toBe(caveat);
    expect(link.label).toMatch(/ to /);
  }

  expect(trip.stages[3].orientationMaps.map((link) => link.label)).toEqual([
    "Belorado to Villafranca Montes de Oca",
    "Villafranca Montes de Oca to Atapuerca",
  ]);
});

test("a map link that is not orientation-only fails the build", () => {
  const clone = JSON.parse(JSON.stringify(rawFile)) as RawTripData;
  clone.walking_plan.stages[0].google_maps_role = "navigation";
  expect(() => readTrip(clone)).toThrow(/Only orientation_only links/);
});

test("accommodation, transport and open items carry the facts pages need", () => {
  expect(trip.accommodation[0]).toEqual({
    date: "2026-10-04",
    day: "Sunday",
    location: "Bilbao",
    property: null,
    status: "TO BOOK",
    notes: "Arrival night after flying from Newcastle.",
  });

  expect(trip.transport.map((leg) => [leg.date, leg.kind, leg.from, leg.to])).toEqual([
    ["2026-10-04", "Flight", "Newcastle", "Bilbao"],
    ["2026-10-05", "Bus", "Bilbao", "Logrono"],
    ["2026-10-10", "Bus", "Burgos", "Bilbao"],
    ["2026-10-11", "Flight", "Bilbao", "Newcastle"],
  ]);
  expect(trip.transport[0].via).toBe("Amsterdam");
  expect(trip.transport[0].status).toBe("PLANNED");
  expect(trip.transport[1].status).toBe("TO VERIFY");

  expect(trip.openItems[0]).toEqual({
    item: "Book flights",
    status: "TO BOOK",
    priority: "high",
    reason: undefined,
  });
  expect(trip.openItems.map((item) => item.status)).toContain("TO DO");
});
