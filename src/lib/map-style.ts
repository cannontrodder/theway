import type { LonLat, StageLine } from "./route";

export const TILE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export function mapWorkerUrl(maplibreVersion: string): string {
  return `/maplibre/${maplibreVersion}/maplibre-gl-worker.mjs`;
}

export const TILE_ATTRIBUTION = [
  { label: "OpenFreeMap", url: "https://openfreemap.org" },
  { label: "OpenMapTiles", url: "https://www.openmaptiles.org/" },
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org/copyright" },
];

export const LABEL_LAYERS_TO_HIDE = [
  "label_other",
  "label_village",
  "label_town",
  "label_city",
  "label_city_capital",
  "label_state",
  "label_country_1",
  "label_country_2",
  "label_country_3",
  "waterway_line_label",
  "water_name_point_label",
  "water_name_line_label",
  "airport",
];

export const ROUTE_SOURCE = "route";
export const STOP_SOURCE = "stops";
export const ROUTE_LAYER = "route-line";
export const STOP_LABEL_LAYER = "stop-label";

export interface StageLineProperties {
  stage: number;
  colour: string;
  path: string;
}

export interface StageLineCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: { type: "LineString"; coordinates: LonLat[] };
    properties: StageLineProperties;
  }[];
}

export interface StopLabelCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: { type: "Point"; coordinates: LonLat };
    properties: { label: string; priority: number };
  }[];
}

export function stopLabelCollection(
  stops: { at: LonLat; name: string }[],
  labelOf: (name: string) => string,
  endsOfTheRoute: string[],
): StopLabelCollection {
  return {
    type: "FeatureCollection",
    features: stops.map((stop) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: stop.at },
      properties: {
        label: labelOf(stop.name),
        priority: endsOfTheRoute.includes(stop.name) ? 0 : 1,
      },
    })),
  };
}

export function stageLineCollection(
  lines: StageLine[],
  pathOf: (line: StageLine) => string,
): StageLineCollection {
  return {
    type: "FeatureCollection",
    features: lines.map((line) => ({
      type: "Feature",
      geometry: { type: "LineString", coordinates: line.points },
      properties: {
        stage: line.stage.number,
        colour: line.colour,
        path: pathOf(line),
      },
    })),
  };
}
