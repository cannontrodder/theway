"use client";

import type { LngLatBoundsLike, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { placeName, stagePath } from "@/lib/display";
import {
  LABEL_LAYERS_TO_HIDE,
  ROUTE_LAYER,
  ROUTE_SOURCE,
  STOP_LABEL_LAYER,
  STOP_SOURCE,
  TILE_STYLE_URL,
  mapWorkerUrl,
  stageLineCollection,
  stopLabelCollection,
} from "@/lib/map-style";
import type { LonLat, RouteStop } from "@/lib/route";
import { routeBounds, routeStops, stageLines } from "@/lib/route";

import "maplibre-gl/dist/maplibre-gl.css";

type Readiness = "loading" | "ready" | "unavailable";

function boundsAround(points: LonLat[]): LngLatBoundsLike {
  const longitudes = points.map(([lon]) => lon);
  const latitudes = points.map(([, lat]) => lat);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}

function wholeRouteBounds(): LngLatBoundsLike {
  const bounds = routeBounds();
  return [
    [bounds.west, bounds.south],
    [bounds.east, bounds.north],
  ];
}

function stageInTheHash(): number | null {
  const match = /^#stage-(\d+)$/.exec(window.location.hash);
  return match ? Number(match[1]) : null;
}

const BED_PATH =
  "M3 18v-7h13a4 4 0 0 1 4 4v3M3 14.5h17M3 8v10M20.5 18v0";
const BUS_PATH =
  "M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M4 12h16M7 19v1M17 19v1M4 16h16v3H4z";

function iconElement(path: string, testId: string): SVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("width", "12");
  icon.setAttribute("height", "12");
  icon.dataset.testid = testId;

  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute("d", path);
  shape.setAttribute("fill", "none");
  shape.setAttribute("class", "stroke-white");
  shape.setAttribute("stroke-width", "1.8");
  shape.setAttribute("stroke-linecap", "round");
  shape.setAttribute("stroke-linejoin", "round");
  icon.append(shape);

  return icon;
}

function markerElement(stop: RouteStop, interactive: boolean): HTMLElement {
  const stage = stop.arrivesOnStage;
  const label = placeName(stop.name);

  const badge = document.createElement("span");
  badge.className =
    "border-white grid size-7 place-items-center rounded-full border-2 shadow-sm";
  badge.style.backgroundColor = stop.colour;

  const icons = document.createElement("span");
  icons.className = "gap-[1px] flex items-center";
  if (stop.overnightOnStage) icons.append(iconElement(BED_PATH, "marker-bed"));
  if (stop.transfers.length > 0) icons.append(iconElement(BUS_PATH, "marker-bus"));
  badge.append(icons);

  const marker = document.createElement(stage && interactive ? "a" : "span");
  marker.className = "grid place-items-center";
  marker.dataset.testid = "route-stop";
  marker.dataset.stop = stop.name;
  if (stop.overnightOnStage) marker.dataset.overnight = "true";
  if (stop.transfers.length > 0) marker.dataset.transfer = "true";
  marker.append(badge);

  if (marker instanceof HTMLAnchorElement && stage) {
    marker.href = stagePath(stage);
    marker.setAttribute(
      "aria-label",
      `Stage ${stage.number}, finishing at ${label}`,
    );
    marker.className += " no-underline";
  } else {
    marker.title = label;
  }

  return marker;
}

export function RouteMap({
  interactive,
  followsTheHash = false,
}: {
  interactive: boolean;
  followsTheHash?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const router = useRouter();
  const [readiness, setReadiness] = useState<Readiness>("loading");

  const padding = interactive ? 56 : 30;

  useEffect(() => {
    const container = holder.current;
    if (!container) return;

    let map: MapLibreMap | undefined;
    let markers: Marker[] = [];
    let cancelled = false;
    let drawn = false;

    const fitTheHashedStage = (animate: boolean) => {
      const wanted = stageInTheHash();
      const line = stageLines().find(
        (candidate) => candidate.stage.number === wanted,
      );
      map?.fitBounds(line ? boundsAround(line.points) : wholeRouteBounds(), {
        padding,
        animate,
        duration: 600,
      });
    };

    const followHash = () => fitTheHashedStage(true);

    const start = async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled) return;

      maplibre.setWorkerUrl(mapWorkerUrl(maplibre.getVersion()));

      map = new maplibre.Map({
        container,
        style: TILE_STYLE_URL,
        bounds: wholeRouteBounds(),
        fitBoundsOptions: { padding, animate: false },
        attributionControl: false,
        maplibreLogo: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        rollEnabled: false,
        keyboard: interactive,
        scrollZoom: interactive,
        dragPan: interactive,
        doubleClickZoom: interactive,
        touchZoomRotate: interactive,
      });
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();

      map.on("error", () => {
        if (!cancelled && !drawn) setReadiness("unavailable");
      });

      map.on("load", () => {
        if (cancelled || !map) return;

        for (const layer of LABEL_LAYERS_TO_HIDE) {
          if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, "visibility", "none");
          }
        }

        const lines = stageLines();
        const stops = routeStops();

        map.addSource(ROUTE_SOURCE, {
          type: "geojson",
          data: stageLineCollection(lines, (line) => stagePath(line.stage)),
        });
        map.addSource(STOP_SOURCE, {
          type: "geojson",
          data: stopLabelCollection(stops, placeName, [
            stops[0].name,
            stops[stops.length - 1].name,
          ]),
        });
        map.addLayer({
          id: ROUTE_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["get", "colour"],
            "line-width": interactive ? 4 : 3,
            "line-dasharray": [2, 1.6],
          },
        });

        map.addLayer({
          id: STOP_LABEL_LAYER,
          type: "symbol",
          source: STOP_SOURCE,
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Bold"],
            "text-size": interactive ? 12 : 10,
            "text-variable-anchor": ["bottom", "top"],
            "text-radial-offset": 1.8,
            "text-justify": "auto",
            "text-max-width": 8,
            "text-padding": 4,
            "symbol-sort-key": ["get", "priority"],
          },
          paint: {
            "text-color": "#0F1D34",
            "text-halo-color": "#FAF9F5",
            "text-halo-width": 2,
          },
        });

        markers = stops.map((stop) =>
          new maplibre.Marker({
            element: markerElement(stop, interactive),
            anchor: "top",
            offset: [0, -12],
          })
            .setLngLat(stop.at)
            .addTo(map!),
        );

        if (followsTheHash) fitTheHashedStage(false);

        drawn = true;
        setReadiness("ready");
      });

      if (followsTheHash) window.addEventListener("hashchange", followHash);
      if (!interactive) return;

      map.on("click", ROUTE_LAYER, (event) => {
        const path = event.features?.[0]?.properties?.path;
        if (typeof path === "string" && path) router.push(path);
      });
      map.on("mouseenter", ROUTE_LAYER, () => {
        if (map) map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", ROUTE_LAYER, () => {
        if (map) map.getCanvas().style.cursor = "";
      });
    };

    void start().catch(() => {
      if (!cancelled) setReadiness("unavailable");
    });

    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", followHash);
      for (const marker of markers) marker.remove();
      map?.remove();
      mapRef.current = null;
    };
  }, [interactive, followsTheHash, padding, router]);

  const recentre = useCallback(() => {
    mapRef.current?.fitBounds(wholeRouteBounds(), { padding, duration: 600 });
  }, [padding]);

  return (
    <>
      <div
        ref={holder}
        data-testid="route-map"
        data-readiness={readiness}
        className={`size-full ${readiness === "ready" ? "" : "invisible"}`}
      />

      {interactive && readiness === "ready" ? (
        <div
          data-testid="map-controls"
          className="gap-xs right-sm bottom-sm absolute z-10 flex flex-col"
        >
          <MapButton label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
            <path d="M12 5v14M5 12h14" />
          </MapButton>
          <MapButton label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
            <path d="M5 12h14" />
          </MapButton>
          <MapButton label="Recentre on the whole route" onClick={recentre}>
            <path d="M3 17c3-6 6-9 9-9s6 3 9 9" />
            <circle cx="3" cy="17" r="1.6" />
            <circle cx="21" cy="17" r="1.6" />
          </MapButton>
        </div>
      ) : null}
    </>
  );
}

function MapButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="border-border rounded-medium bg-white text-ink size-11 grid place-items-center border shadow-sm"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
