import routePlacesFile from "../data/route-places.json";

import type { Stage, TransportLeg } from "./trip";
import { trip } from "./trip";

export type LonLat = [number, number];

export interface RoutePlaces {
  source: string;
  places: Record<string, LonLat>;
}

export interface StageLine {
  stage: Stage;
  colour: string;
  points: LonLat[];
}

export interface RouteStop {
  name: string;
  at: LonLat;
  colour: string;
  arrivesOnStage?: Stage;
  overnightOnStage?: Stage;
  transfers: TransportLeg[];
}

export interface RouteBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const STAGE_COLOURS = ["#5F7245", "#2E5B7B", "#9A6A17", "#CF8E1C", "#0F1D34"];

function readRoutePlaces(raw: {
  source: string;
  places: Record<string, number[]>;
}): RoutePlaces {
  const places: Record<string, LonLat> = {};
  for (const [name, position] of Object.entries(raw.places)) {
    if (position.length !== 2) {
      throw new Error(
        `"${name}" in route-places.json needs exactly a longitude and a latitude, got ${position.length} numbers.`,
      );
    }
    places[name] = [position[0], position[1]];
  }
  return { source: raw.source, places };
}

export const routePlaces: RoutePlaces = readRoutePlaces(routePlacesFile);

export function stageColour(stageNumber: number): string {
  const colour = STAGE_COLOURS[stageNumber - 1];
  if (!colour) {
    throw new Error(
      `No colour for Stage ${stageNumber}. The map carries one colour per walking day, so add one.`,
    );
  }
  return colour;
}

export function placeAt(name: string): LonLat {
  const at = routePlaces.places[name];
  if (!at) {
    throw new Error(
      `No coordinates for "${name}" in route-places.json. Every place on a Stage needs a position before the map can draw it.`,
    );
  }
  return at;
}

function stagePlaceNames(stage: Stage): string[] {
  return [stage.startsAt, ...stage.waypoints, stage.finishesAt];
}

export function stageLines(): StageLine[] {
  return trip.stages.map((stage) => ({
    stage,
    colour: stageColour(stage.number),
    points: stagePlaceNames(stage).map(placeAt),
  }));
}

function busTransfersAt(name: string): TransportLeg[] {
  return trip.transport.filter(
    (leg) => leg.kind === "Bus" && (leg.from === name || leg.to === name),
  );
}

export function routeStops(): RouteStop[] {
  const firstStage = trip.stages[0];
  const stops: RouteStop[] = [
    {
      name: firstStage.startsAt,
      at: placeAt(firstStage.startsAt),
      colour: stageColour(firstStage.number),
      transfers: busTransfersAt(firstStage.startsAt),
    },
  ];

  for (const stage of trip.stages) {
    stops.push({
      name: stage.finishesAt,
      at: placeAt(stage.finishesAt),
      colour: stageColour(stage.number),
      arrivesOnStage: stage,
      overnightOnStage: stage.overnight === stage.finishesAt ? stage : undefined,
      transfers: busTransfersAt(stage.finishesAt),
    });
  }

  return stops;
}

export function routeBounds(): RouteBounds {
  const points = stageLines().flatMap((line) => line.points);
  const longitudes = points.map(([lon]) => lon);
  const latitudes = points.map(([, lat]) => lat);
  return {
    west: Math.min(...longitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    north: Math.max(...latitudes),
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function mercatorX(longitude: number): number {
  return toRadians(longitude);
}

function mercatorY(latitude: number): number {
  return Math.log(Math.tan(Math.PI / 4 + toRadians(latitude) / 2));
}

export interface Projection {
  width: number;
  height: number;
  project(at: LonLat): [number, number];
}

export function projectRoute(width: number, height: number, inset: number): Projection {
  const bounds = routeBounds();
  const left = mercatorX(bounds.west);
  const right = mercatorX(bounds.east);
  const top = mercatorY(bounds.north);
  const bottom = mercatorY(bounds.south);
  const drawableWidth = width - inset * 2;
  const drawableHeight = height - inset * 2;
  const scale = Math.min(
    drawableWidth / (right - left),
    drawableHeight / (top - bottom),
  );
  const offsetX = inset + (drawableWidth - (right - left) * scale) / 2;
  const offsetY = inset + (drawableHeight - (top - bottom) * scale) / 2;

  return {
    width,
    height,
    project([lon, lat]) {
      return [
        offsetX + (mercatorX(lon) - left) * scale,
        offsetY + (top - mercatorY(lat)) * scale,
      ];
    },
  };
}
