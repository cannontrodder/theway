import { expect, test } from "@playwright/test";

import {
  formatApproxDistanceKm,
  formatDateSpan,
  formatLongDateSpan,
  formatMonthAndYear,
  formatWeekdayDate,
  formatWeekdayDateSpan,
  placeName,
  spellOutCount,
} from "../../src/lib/display";
import { trip } from "../../src/lib/trip";

test("place names get their Spanish diacritics back for display", () => {
  expect(placeName("Logrono")).toBe("Logroño");
  expect(placeName("Najera")).toBe("Nájera");
  expect(placeName("Camino Frances")).toBe("Camino Francés");
  expect(placeName("Ages")).toBe("Agés");
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
