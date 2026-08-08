import { expect, test } from "@playwright/test";

import {
  formatApproxDistanceKm,
  formatApproxTimeSpan,
  formatDateSpan,
  formatDayAndMonth,
  formatDayAndMonthSpan,
  formatLongWeekdayDate,
  formatRoute,
  formatDistanceKm,
  formatLongDateSpan,
  formatMonthAndYear,
  formatWeekdayDate,
  formatWeekdayDateSpan,
  placeName,
  sentence,
  spellOutCount,
  stagePath,
  stageRoute,
} from "../../src/lib/display";
import { trip } from "../../src/lib/trip";

test("place names get their Spanish diacritics back for display", () => {
  expect(placeName("Logrono")).toBe("Logroño");
  expect(placeName("Najera")).toBe("Nájera");
  expect(placeName("Camino Frances")).toBe("Camino Francés");
  expect(placeName("Ages")).toBe("Agés");
  expect(placeName("Ciruena")).toBe("Cirueña");
  expect(placeName("Granon")).toBe("Grañón");
  expect(placeName("Villamayor del Rio")).toBe("Villamayor del Río");
  expect(placeName("Cardenuela Riopico")).toBe("Cardeñuela Riopico");
  expect(placeName("Villafria")).toBe("Villafría");
});

test("a place name that only looks accented is left as it is", () => {
  expect(placeName("Viloria de Rioja")).toBe("Viloria de Rioja");
  expect(placeName("Orbaneja Riopico")).toBe("Orbaneja Riopico");
});

test("place names without diacritics pass through untouched", () => {
  expect(placeName("Burgos")).toBe("Burgos");
  expect(placeName("Santo Domingo de la Calzada")).toBe(
    "Santo Domingo de la Calzada",
  );
  expect(placeName("Newcastle upon Tyne")).toBe("Newcastle upon Tyne");
});

test("a date span inside one month names the month once", () => {
  expect(formatDateSpan("2026-10-04", "2026-10-11")).toBe("4–11 Oct 2026");
});

test("a date span crossing a month names both months", () => {
  expect(formatDateSpan("2026-09-28", "2026-10-04")).toBe("28 Sep – 4 Oct 2026");
});

test("the long date span spells the month out for the header", () => {
  expect(formatLongDateSpan("2026-10-04", "2026-10-11")).toBe(
    "4–11 October 2026",
  );
  expect(formatLongDateSpan("2026-09-28", "2026-10-04")).toBe(
    "28 September – 4 October 2026",
  );
});

test("a single date reads as weekday, day and month", () => {
  expect(formatWeekdayDate("Monday", "2026-10-05")).toBe("Mon 5 Oct");
});

test("a weekday span inside one month names the month once", () => {
  expect(
    formatWeekdayDateSpan(
      { weekday: "Monday", date: "2026-10-05" },
      { weekday: "Friday", date: "2026-10-09" },
    ),
  ).toBe("Mon 5 – Fri 9 Oct");
});

test("an approximate distance is rounded and carries a tilde", () => {
  expect(formatApproxDistanceKm(123.2)).toBe("~123 km");
  expect(formatApproxDistanceKm(28.7)).toBe("~29 km");
});

test("a sentence gets its place names accented without touching English words", () => {
  expect(sentence("Bus from Bilbao to Logrono")).toBe("Bus from Bilbao to Logroño");
  expect(
    sentence("The Montes de Oca section makes this more demanding than a flat 30 km day."),
  ).toBe("The Montes de Oca section makes this more demanding than a flat 30 km day.");
});

test("a sentence leaves alone the place names that are also English words", () => {
  expect(sentence("Ages ago we walked through Granon")).toBe(
    "Ages ago we walked through Grañón",
  );
  expect(sentence("Rio is a long way from Najera")).toBe(
    "Rio is a long way from Nájera",
  );
});

test("every sentence the Stage pages show survives the accenting unchanged in meaning", () => {
  for (const stage of trip.stages) {
    for (const prose of [
      stage.mainRisk,
      stage.terrainNote,
      stage.planningReason,
      stage.eveningPlan,
      stage.preWalkTransport,
    ]) {
      if (!prose) continue;
      expect(sentence(prose).length).toBe(prose.length);
    }
  }
});

test("a Stage's path and route read from the Stage itself", () => {
  expect(stagePath(trip.stages[0])).toBe("/day/1/");
  expect(stagePath(trip.stages[4])).toBe("/day/5/");
  expect(stageRoute(trip.stages[0])).toBe("Logroño → Nájera");
  expect(stageRoute(trip.stages[4])).toBe("Atapuerca → Burgos");
});

test("a stage distance keeps the tenth of a kilometre the data gives", () => {
  expect(formatDistanceKm(28.7)).toBe("28.7 km");
  expect(formatDistanceKm(20.2)).toBe("20.2 km");
  expect(formatDistanceKm(30)).toBe("30 km");
});

test("an itinerary Day heading names the weekday and month in full", () => {
  expect(formatLongWeekdayDate("Sunday", "2026-10-04")).toBe("Sunday 4 October");
  expect(formatLongWeekdayDate("Wednesday", "2026-10-07")).toBe(
    "Wednesday 7 October",
  );
});

test("a bare day and month drops the weekday for the journey chain", () => {
  expect(formatDayAndMonth("2026-10-04")).toBe("4 Oct");
  expect(formatDayAndMonth("2026-10-11")).toBe("11 Oct");
});

test("a day and month span inside one month names the month once", () => {
  expect(formatDayAndMonthSpan("2026-10-05", "2026-10-09")).toBe("5–9 Oct");
  expect(formatDayAndMonthSpan("2026-09-28", "2026-10-04")).toBe("28 Sep – 4 Oct");
});

test("an event route becomes accented place names joined by arrows", () => {
  expect(formatRoute("NCL -> AMS -> BIO")).toBe("NCL → AMS → BIO");
  expect(formatRoute("Bilbao -> Logrono")).toBe("Bilbao → Logroño");
  expect(formatRoute("Najera -> Santo Domingo de la Calzada")).toBe(
    "Nájera → Santo Domingo de la Calzada",
  );
});

test("approximate times read as a span, or as the one time the data holds", () => {
  expect(formatApproxTimeSpan("05:45", "11:15")).toBe("05:45–11:15 approx");
  expect(formatApproxTimeSpan("17:15", undefined)).toBe("17:15 approx");
  expect(formatApproxTimeSpan(undefined, "22:55")).toBe("22:55 approx");
  expect(formatApproxTimeSpan(undefined, undefined)).toBeUndefined();
});

test("a month and year read out in full", () => {
  expect(formatMonthAndYear("2026-10-04")).toBe("October 2026");
});

test("small counts spell out as words", () => {
  expect(spellOutCount(5)).toBe("five");
  expect(spellOutCount(8)).toBe("eight");
});

test("counts too large to spell out fall back to digits", () => {
  expect(spellOutCount(23)).toBe("23");
});

test("the formatters render the trip's own facts the way the homepage needs them", () => {
  const { summary } = trip;
  expect(formatDateSpan(summary.startDate, summary.endDate)).toBe(
    "4–11 Oct 2026",
  );
  expect(
    formatWeekdayDateSpan(trip.stages[0], trip.stages[trip.stages.length - 1]),
  ).toBe("Mon 5 – Fri 9 Oct");
  expect(formatApproxDistanceKm(summary.totalDistanceKm)).toBe("~123 km");
  expect(placeName(summary.startsAt)).toBe("Logroño");
  expect(placeName(summary.route)).toBe("Camino Francés");
  expect(spellOutCount(summary.walkingDays)).toBe("five");
  expect(formatMonthAndYear(summary.walkingStartDate)).toBe("October 2026");
});
