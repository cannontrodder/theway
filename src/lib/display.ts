const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ACCENTED_WORDS: Record<string, string> = {
  Logrono: "Logroño",
  Najera: "Nájera",
  Frances: "Francés",
  Ciruena: "Cirueña",
  Granon: "Grañón",
  Cardenuela: "Cardeñuela",
  Villafria: "Villafría",
};

const ACCENTED_WORDS_THAT_ARE_ALSO_ENGLISH: Record<string, string> = {
  Ages: "Agés",
  Rio: "Río",
};

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const EN_DASH = "–";

interface CalendarDate {
  day: number;
  monthIndex: number;
  year: number;
}

function parseIsoDate(isoDate: string): CalendarDate {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Expected an ISO date like 2026-10-04, got "${isoDate}".`);
  }
  return { day, monthIndex: month - 1, year };
}

export function placeName(raw: string): string {
  return raw.replace(
    /[A-Za-z]+/g,
    (word) =>
      ACCENTED_WORDS[word] ??
      ACCENTED_WORDS_THAT_ARE_ALSO_ENGLISH[word] ??
      word,
  );
}

export function sentence(raw: string): string {
  return raw.replace(/[A-Za-z]+/g, (word) => ACCENTED_WORDS[word] ?? word);
}

function formatSpan(
  startIsoDate: string,
  endIsoDate: string,
  months: string[],
): string {
  const start = parseIsoDate(startIsoDate);
  const end = parseIsoDate(endIsoDate);
  const endLabel = `${end.day} ${months[end.monthIndex]} ${end.year}`;

  if (start.monthIndex === end.monthIndex && start.year === end.year) {
    return `${start.day}${EN_DASH}${endLabel}`;
  }
  return `${start.day} ${months[start.monthIndex]} ${EN_DASH} ${endLabel}`;
}

export function formatDateSpan(startIsoDate: string, endIsoDate: string): string {
  return formatSpan(startIsoDate, endIsoDate, SHORT_MONTHS);
}

export function formatLongDateSpan(
  startIsoDate: string,
  endIsoDate: string,
): string {
  return formatSpan(startIsoDate, endIsoDate, LONG_MONTHS);
}

function shortWeekday(weekday: string): string {
  return weekday.slice(0, 3);
}

export function formatWeekdayDate(weekday: string, isoDate: string): string {
  const { day, monthIndex } = parseIsoDate(isoDate);
  return `${shortWeekday(weekday)} ${day} ${SHORT_MONTHS[monthIndex]}`;
}

export function formatWeekdayDateSpan(
  start: { weekday: string; date: string },
  end: { weekday: string; date: string },
): string {
  const startDate = parseIsoDate(start.date);
  const endDate = parseIsoDate(end.date);
  const endLabel = formatWeekdayDate(end.weekday, end.date);

  if (startDate.monthIndex === endDate.monthIndex && startDate.year === endDate.year) {
    return `${shortWeekday(start.weekday)} ${startDate.day} ${EN_DASH} ${endLabel}`;
  }
  return `${formatWeekdayDate(start.weekday, start.date)} ${EN_DASH} ${endLabel}`;
}

export function formatDistanceKm(distanceKm: number): string {
  return `${distanceKm} km`;
}

export function formatApproxDistanceKm(distanceKm: number): string {
  return `~${Math.round(distanceKm)} km`;
}

export function formatMonthAndYear(isoDate: string): string {
  const { monthIndex, year } = parseIsoDate(isoDate);
  return `${LONG_MONTHS[monthIndex]} ${year}`;
}

export function stagePath(stage: { number: number }): string {
  return `/day/${stage.number}/`;
}

export function stageRoute(stage: { startsAt: string; finishesAt: string }): string {
  return `${placeName(stage.startsAt)} → ${placeName(stage.finishesAt)}`;
}

export function spellOutCount(count: number): string {
  return NUMBER_WORDS[count] ?? String(count);
}
