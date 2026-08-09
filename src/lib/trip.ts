import tripDataFile from "../data/trip-data.json";

export type StatusLabel =
  | "FIXED"
  | "BOOKED"
  | "PLANNED"
  | "PROPOSED"
  | "TO BOOK"
  | "TO VERIFY"
  | "TO DO"
  | "APPROX"
  | "OPTIONAL";

const STATUS_LABELS: Record<string, StatusLabel> = {
  fixed: "FIXED",
  booked: "BOOKED",
  planned_not_booked: "PLANNED",
  proposed: "PROPOSED",
  to_book: "TO BOOK",
  to_verify: "TO VERIFY",
  to_do: "TO DO",
  approximate: "APPROX",
  optional: "OPTIONAL",
};

const NOT_A_STATUS_BUT_READS_AS: Record<string, StatusLabel> = {
  proposed_with_fixed_finish: "PROPOSED",
};

const SUPERSEDED_KEY = "original_plan";

export interface TripSummary {
  name: string;
  route: string;
  startsAt: string;
  finishesAt: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  walkingStartDate: string;
  walkingFinishDate: string;
  walkingDays: number;
  totalDistanceKm: number;
  originCity: string;
  arrivalCity: string;
  departureCity: string;
  status: StatusLabel;
  distancesAre: StatusLabel;
  navigationPolicy: string;
  orientationMapCaveat: string;
}

export interface OrientationMapLink {
  label: string;
  url: string;
  caveat: string;
}

export interface Stage {
  number: number;
  date: string;
  weekday: string;
  startsAt: string;
  finishesAt: string;
  overnight: string;
  distanceKm: number;
  difficulty: string;
  waypoints: string[];
  status: StatusLabel;
  orientationMaps: OrientationMapLink[];
  preWalkTransport?: string;
  mainRisk?: string;
  terrainNote?: string;
  planningReason?: string;
  eveningPlan?: string;
}

export interface ItineraryEvent {
  kind: string;
  status: StatusLabel;
  route?: string;
  location?: string;
  operator?: string;
  distanceKm?: number;
  departureTimeApprox?: string;
  arrivalTimeApprox?: string;
  plan?: string;
  note?: string;
}

export interface ItineraryDay {
  date: string;
  weekday: string;
  category: string;
  summary: string;
  events: ItineraryEvent[];
}

export interface Accommodation {
  date: string;
  weekday: string;
  location: string;
  property: string | null;
  status: StatusLabel;
  notes?: string;
}

export interface TransportLeg {
  kind: string;
  date: string;
  weekday: string;
  from: string;
  to: string;
  via?: string;
  operator?: string;
  fromStation?: string;
  toStation?: string;
  departureTimeApprox?: string;
  arrivalTimeApprox?: string;
  durationEstimate?: string;
  status: StatusLabel;
  note?: string;
}

export interface OpenItem {
  item: string;
  status: StatusLabel;
  priority: string;
  reason?: string;
}

export interface FixedFinish {
  location: string;
  date: string;
  weekday: string;
  status: StatusLabel;
  eveningPlan: string;
  eveningPlanStatus: StatusLabel;
}

export interface FinalWeekend {
  location: string;
  startDate: string;
  endDate: string;
  weekdays: string[];
  status: StatusLabel;
}

export interface Trip {
  summary: TripSummary;
  fixedFinish: FixedFinish;
  finalWeekend: FinalWeekend;
  stages: Stage[];
  itinerary: ItineraryDay[];
  accommodation: Accommodation[];
  transport: TransportLeg[];
  openItems: OpenItem[];
}

interface RawStage {
  day_number: number;
  date: string;
  day: string;
  start: string;
  finish: string;
  distance_km_approx: number;
  difficulty_planning: string;
  status: string;
  waypoints: string[];
  overnight?: string;
  pre_walk_transport?: string;
  main_risk?: string;
  terrain_note?: string;
  planning_reason?: string;
  evening_plan?: string;
  google_maps_role: string;
  google_maps_url?: string;
  google_maps_segments?: {
    start: string;
    finish: string;
    url: string;
  }[];
}

interface RawFlight {
  date: string;
  day: string;
  airline: string;
  route: { from: string; to: string }[];
  status: string;
  departure_time_local_approx?: string;
  arrival_time_local_approx?: string;
  arrival_time_newcastle_approx?: string;
  verification_note?: string;
}

interface RawBus {
  date: string;
  day: string;
  mode: string;
  origin: string;
  destination: string;
  origin_station_likely?: string;
  destination_station_likely?: string;
  operator_likely?: string;
  duration_estimate?: string;
  status: string;
  important_note?: string;
  plan?: string;
}

interface RawTripData {
  fixed_requirements: {
    camino_finish: { location: string; date: string; status: string };
    friday_night: { location: string; date: string; plan: string; status: string };
    saturday_night: { location: string; date: string; status: string };
  };
  trip: {
    name: string;
    camino_route: string;
    walking_start: string;
    walking_finish: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    walking_start_date: string;
    walking_finish_date: string;
    walking_days: number;
    origin_city: string;
    arrival_city: string;
    departure_city: string;
    core_plan_status: string;
  };
  walking_plan: {
    total_distance_km_approx: number;
    stages: RawStage[];
  };
  walking_distance_summary: { values_are: string };
  navigation: { primary_policy: string; google_maps_warning: string };
  flights: { outbound: RawFlight; return: RawFlight };
  ground_transport: Record<string, RawBus>;
  accommodation_requirements: {
    date: string;
    day: string;
    location: string;
    property: string | null;
    status: string;
    notes?: string;
  }[];
  daily_itinerary: {
    date: string;
    day: string;
    category: string;
    summary: string;
    events: {
      type: string;
      status: string;
      route?: string;
      location?: string;
      airline?: string;
      operator_likely?: string;
      distance_km_approx?: number;
      departure_approx?: string;
      arrival_approx?: string;
      arrival_newcastle_approx?: string;
      plan?: string;
      difficulty_note?: string;
    }[];
  }[];
  open_items: { item: string; status: string; priority: string; reason?: string }[];
}

function toStatusLabel(raw: string): StatusLabel {
  const label = STATUS_LABELS[raw] ?? NOT_A_STATUS_BUT_READS_AS[raw];
  if (!label) {
    throw new Error(
      `Unrecognised status "${raw}" in trip-data.json. Add it to the certainty model in CONTEXT.md before using it.`,
    );
  }
  return label;
}

function rejectUnrecognisedStatuses(value: unknown, path: string) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectUnrecognisedStatuses(entry, `${path}[${index}]`));
    return;
  }
  if (value === null || typeof value !== "object") return;

  for (const [key, nested] of Object.entries(value)) {
    if (key === SUPERSEDED_KEY) continue;
    if (key === "status" && typeof nested === "string") toStatusLabel(nested);
    rejectUnrecognisedStatuses(nested, `${path}.${key}`);
  }
}

function weekdayOf(data: RawTripData, isoDate: string): string {
  const day = data.daily_itinerary.find((entry) => entry.date === isoDate);
  if (!day) {
    throw new Error(`No day in the itinerary falls on ${isoDate}.`);
  }
  return day.day;
}

function humanise(raw: string): string {
  const words = raw.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toWaypoints(stage: RawStage): string[] {
  return stage.waypoints.filter(
    (place) => place !== stage.start && place !== stage.finish,
  );
}

function toOrientationMaps(stage: RawStage, caveat: string): OrientationMapLink[] {
  if (stage.google_maps_role !== "orientation_only") {
    throw new Error(
      `Stage ${stage.day_number} maps are marked "${stage.google_maps_role}". Only orientation_only links may be shown.`,
    );
  }
  if (stage.google_maps_segments) {
    return stage.google_maps_segments.map((segment) => ({
      label: `${segment.start} to ${segment.finish}`,
      url: segment.url,
      caveat,
    }));
  }
  if (!stage.google_maps_url) {
    throw new Error(`Stage ${stage.day_number} has no orientation map link.`);
  }
  return [
    {
      label: `${stage.start} to ${stage.finish}`,
      url: stage.google_maps_url,
      caveat,
    },
  ];
}

function toFlightLeg(flight: RawFlight): TransportLeg {
  const firstHop = flight.route[0];
  const lastHop = flight.route[flight.route.length - 1];
  return {
    kind: "Flight",
    date: flight.date,
    weekday: flight.day,
    from: firstHop.from,
    to: lastHop.to,
    via: firstHop.to === lastHop.to ? undefined : firstHop.to,
    operator: flight.airline,
    departureTimeApprox: flight.departure_time_local_approx,
    arrivalTimeApprox:
      flight.arrival_time_local_approx ?? flight.arrival_time_newcastle_approx,
    status: toStatusLabel(flight.status),
    note: flight.verification_note,
  };
}

function toBusLeg(bus: RawBus): TransportLeg {
  return {
    kind: humanise(bus.mode),
    date: bus.date,
    weekday: bus.day,
    from: bus.origin,
    to: bus.destination,
    operator: bus.operator_likely,
    fromStation: bus.origin_station_likely,
    toStation: bus.destination_station_likely,
    durationEstimate: bus.duration_estimate,
    status: toStatusLabel(bus.status),
    note: bus.important_note ?? bus.plan,
  };
}

export function readTrip(rawData: unknown): Trip {
  rejectUnrecognisedStatuses(rawData, "trip-data.json");

  const data = rawData as RawTripData;
  const { trip, walking_plan, navigation } = data;
  const caveat = navigation.google_maps_warning;
  const { camino_finish, friday_night, saturday_night } = data.fixed_requirements;

  return {
    finalWeekend: {
      location: saturday_night.location,
      startDate: saturday_night.date,
      endDate: trip.end_date,
      weekdays: data.daily_itinerary
        .filter(
          (day) => day.date >= saturday_night.date && day.date <= trip.end_date,
        )
        .map((day) => day.day),
      status: toStatusLabel(saturday_night.status),
    },
    fixedFinish: {
      location: camino_finish.location,
      date: camino_finish.date,
      weekday: weekdayOf(data, camino_finish.date),
      status: toStatusLabel(camino_finish.status),
      eveningPlan: friday_night.plan,
      eveningPlanStatus: toStatusLabel(friday_night.status),
    },
    summary: {
      name: trip.name,
      route: trip.camino_route,
      startsAt: trip.walking_start,
      finishesAt: trip.walking_finish,
      startDate: trip.start_date,
      endDate: trip.end_date,
      durationDays: trip.duration_days,
      walkingStartDate: trip.walking_start_date,
      walkingFinishDate: trip.walking_finish_date,
      walkingDays: trip.walking_days,
      totalDistanceKm: walking_plan.total_distance_km_approx,
      originCity: trip.origin_city,
      arrivalCity: trip.arrival_city,
      departureCity: trip.departure_city,
      status: toStatusLabel(trip.core_plan_status),
      distancesAre: toStatusLabel(data.walking_distance_summary.values_are),
      navigationPolicy: navigation.primary_policy,
      orientationMapCaveat: caveat,
    },
    stages: [...walking_plan.stages]
      .sort((a, b) => a.day_number - b.day_number)
      .map((stage) => ({
        number: stage.day_number,
        date: stage.date,
        weekday: stage.day,
        startsAt: stage.start,
        finishesAt: stage.finish,
        overnight: stage.overnight ?? stage.finish,
        distanceKm: stage.distance_km_approx,
        difficulty: humanise(stage.difficulty_planning),
        waypoints: toWaypoints(stage),
        status: toStatusLabel(stage.status),
        orientationMaps: toOrientationMaps(stage, caveat),
        preWalkTransport: stage.pre_walk_transport,
        mainRisk: stage.main_risk,
        terrainNote: stage.terrain_note,
        planningReason: stage.planning_reason,
        eveningPlan: stage.evening_plan,
      })),
    itinerary: data.daily_itinerary.map((day) => ({
      date: day.date,
      weekday: day.day,
      category: humanise(day.category),
      summary: day.summary,
      events: day.events.map((event) => ({
        kind: humanise(event.type),
        status: toStatusLabel(event.status),
        route: event.route,
        location: event.location,
        operator: event.airline ?? event.operator_likely,
        distanceKm: event.distance_km_approx,
        departureTimeApprox: event.departure_approx,
        arrivalTimeApprox: event.arrival_approx ?? event.arrival_newcastle_approx,
        plan: event.plan,
        note: event.difficulty_note,
      })),
    })),
    accommodation: data.accommodation_requirements.map((night) => ({
      date: night.date,
      weekday: night.day,
      location: night.location,
      property: night.property,
      status: toStatusLabel(night.status),
      notes: night.notes,
    })),
    transport: [
      toFlightLeg(data.flights.outbound),
      ...Object.values(data.ground_transport).map(toBusLeg),
      toFlightLeg(data.flights.return),
    ].sort((a, b) => a.date.localeCompare(b.date)),
    openItems: data.open_items.map((item) => ({
      item: item.item,
      status: toStatusLabel(item.status),
      priority: item.priority,
      reason: item.reason,
    })),
  };
}

export const trip: Trip = readTrip(tripDataFile);

export function findStage(stageNumber: number): Stage | undefined {
  return trip.stages.find((stage) => stage.number === stageNumber);
}

function isTheOvernightOf(night: Accommodation, stage: Stage): boolean {
  return night.date === stage.date && night.location === stage.overnight;
}

export function overnightStay(stage: Stage): Accommodation | undefined {
  return trip.accommodation.find((night) => isTheOvernightOf(night, stage));
}

export function stageEndingAt(night: Accommodation): Stage | undefined {
  return trip.stages.find((stage) => isTheOvernightOf(night, stage));
}

export function firstStage(): Stage {
  return trip.stages[0];
}
