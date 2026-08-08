import { expect, test } from "@playwright/test";

import {
  placeAt,
  projectRoute,
  routeBounds,
  routePlaces,
  routeStops,
  stageColour,
  stageLines,
} from "../../src/lib/route";
import { trip } from "../../src/lib/trip";

test("every place on every Stage has a position", () => {
  for (const stage of trip.stages) {
    for (const place of [stage.startsAt, ...stage.waypoints, stage.finishesAt]) {
      expect(() => placeAt(place), `${place} on Stage ${stage.number}`).not.toThrow();
    }
  }
});

test("positions sit inside the Logroño to Burgos corridor", () => {
  for (const [name, [lon, lat]] of Object.entries(routePlaces.places)) {
    expect(lon, name).toBeGreaterThan(-4);
    expect(lon, name).toBeLessThan(-2);
    expect(lat, name).toBeGreaterThan(42);
    expect(lat, name).toBeLessThan(43);
  }
});

test("route-places states that it is not a Camino track", () => {
  expect(routePlaces.source).toContain("Not a Camino track");
  expect(routePlaces.source).toContain("OpenStreetMap");
});

test("a place a Stage does not touch has no position", () => {
  const stagePlaces = new Set(
    trip.stages.flatMap((stage) => [
      stage.startsAt,
      ...stage.waypoints,
      stage.finishesAt,
    ]),
  );
  for (const name of Object.keys(routePlaces.places)) {
    expect(stagePlaces, name).toContain(name);
  }
});

test("each Stage gets its own colour, in walking order", () => {
  const colours = trip.stages.map((stage) => stageColour(stage.number));
  expect(colours).toEqual(["#6B7F4E", "#2E5B7B", "#9A6A17", "#CF8E1C", "#0F1D34"]);
  expect(new Set(colours).size).toBe(trip.stages.length);
});

test("a Stage number with no colour is refused rather than drawn colourless", () => {
  expect(() => stageColour(trip.stages.length + 1)).toThrow(/one colour per walking day/);
});

test("a place with no position is refused rather than drawn at zero", () => {
  expect(() => placeAt("Timbuktu")).toThrow(/route-places\.json/);
});

test("each Stage line runs from its start through its Waypoints to its finish", () => {
  const lines = stageLines();
  expect(lines).toHaveLength(trip.stages.length);

  for (const line of lines) {
    expect(line.points).toHaveLength(line.stage.waypoints.length + 2);
    expect(line.points[0]).toEqual(placeAt(line.stage.startsAt));
    expect(line.points[line.points.length - 1]).toEqual(
      placeAt(line.stage.finishesAt),
    );
    expect(line.colour).toBe(stageColour(line.stage.number));
  }
});

test("consecutive Stage lines join up, so the route reads as one line", () => {
  const lines = stageLines();
  for (let index = 1; index < lines.length; index += 1) {
    const previous = lines[index - 1].points;
    expect(lines[index].points[0]).toEqual(previous[previous.length - 1]);
  }
});

test("the route runs westwards overall", () => {
  const lines = stageLines();
  const [firstLon] = lines[0].points[0];
  const lastLine = lines[lines.length - 1].points;
  const [lastLon] = lastLine[lastLine.length - 1];
  expect(lastLon).toBeLessThan(firstLon);
});

test("the stops are the start plus each Stage finish, and nothing else", () => {
  const stops = routeStops();
  expect(stops.map((stop) => stop.name)).toEqual([
    trip.stages[0].startsAt,
    ...trip.stages.map((stage) => stage.finishesAt),
  ]);
});

test("a Waypoint is not a stop, because we do not sleep there", () => {
  const stopNames = new Set(routeStops().map((stop) => stop.name));
  for (const stage of trip.stages) {
    for (const waypoint of stage.waypoints) {
      expect(stopNames, waypoint).not.toContain(waypoint);
    }
  }
});

test("every Stage finish carries the Stage that arrives there", () => {
  const arrivals = routeStops().filter((stop) => stop.arrivesOnStage);
  expect(arrivals.map((stop) => stop.arrivesOnStage!.number)).toEqual(
    trip.stages.map((stage) => stage.number),
  );
  for (const stop of arrivals) {
    expect(stop.colour).toBe(stageColour(stop.arrivesOnStage!.number));
  }
});

test("an Overnight is only marked where the Stage actually sleeps", () => {
  for (const stop of routeStops()) {
    const stage = stop.overnightOnStage;
    if (!stage) continue;
    expect(stage.overnight).toBe(stop.name);
  }
  const overnights = routeStops().filter((stop) => stop.overnightOnStage);
  expect(overnights.length).toBeGreaterThan(0);
});

test("the two bus transfers land on the stops they touch", () => {
  const buses = trip.transport.filter((leg) => leg.kind === "Bus");
  expect(buses).toHaveLength(2);

  const stops = routeStops();
  for (const bus of buses) {
    const touched = stops.filter((stop) => stop.transfers.includes(bus));
    expect(touched.length, `${bus.from} to ${bus.to}`).toBeGreaterThan(0);
    for (const stop of touched) {
      expect([bus.from, bus.to]).toContain(stop.name);
    }
  }
});

test("the bounds enclose every point on the route", () => {
  const bounds = routeBounds();
  for (const line of stageLines()) {
    for (const [lon, lat] of line.points) {
      expect(lon).toBeGreaterThanOrEqual(bounds.west);
      expect(lon).toBeLessThanOrEqual(bounds.east);
      expect(lat).toBeGreaterThanOrEqual(bounds.south);
      expect(lat).toBeLessThanOrEqual(bounds.north);
    }
  }
  expect(bounds.west).toBeLessThan(bounds.east);
  expect(bounds.south).toBeLessThan(bounds.north);
});

test("the projection keeps every point inside the drawing, clear of the edge", () => {
  const inset = 16;
  const projection = projectRoute(320, 160, inset);

  for (const line of stageLines()) {
    for (const point of line.points) {
      const [x, y] = projection.project(point);
      expect(x).toBeGreaterThanOrEqual(inset - 0.001);
      expect(x).toBeLessThanOrEqual(320 - inset + 0.001);
      expect(y).toBeGreaterThanOrEqual(inset - 0.001);
      expect(y).toBeLessThanOrEqual(160 - inset + 0.001);
    }
  }
});

test("the projection puts west on the left and north at the top", () => {
  const projection = projectRoute(320, 160, 16);
  const bounds = routeBounds();

  const [westX] = projection.project([bounds.west, bounds.south]);
  const [eastX] = projection.project([bounds.east, bounds.south]);
  expect(westX).toBeLessThan(eastX);

  const [, northY] = projection.project([bounds.west, bounds.north]);
  const [, southY] = projection.project([bounds.west, bounds.south]);
  expect(northY).toBeLessThan(southY);
});

test("the projection does not stretch the route out of shape", () => {
  const projection = projectRoute(320, 160, 16);
  const bounds = routeBounds();

  const [leftX, topY] = projection.project([bounds.west, bounds.north]);
  const [rightX, bottomY] = projection.project([bounds.east, bounds.south]);

  const midLatitude = (bounds.north + bounds.south) / 2;
  const kmPerDegreeLongitude = 111.32 * Math.cos((midLatitude * Math.PI) / 180);
  const widthKm = (bounds.east - bounds.west) * kmPerDegreeLongitude;
  const heightKm = (bounds.north - bounds.south) * 110.57;

  const drawnRatio = (rightX - leftX) / (bottomY - topY);
  const realRatio = widthKm / heightKm;
  expect(drawnRatio / realRatio).toBeGreaterThan(0.9);
  expect(drawnRatio / realRatio).toBeLessThan(1.1);
});
