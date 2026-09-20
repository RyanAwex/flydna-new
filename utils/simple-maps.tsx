/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "@vnedyalk0v/react19-simple-maps";
import type {
  Longitude,
  Latitude,
  Coordinates,
} from "@vnedyalk0v/react19-simple-maps";
import DirectFlightLine from "./DirectFlightLine";
import { useSearchStore } from "./states/useSearchStore";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function HeroMap({
  start,
  end,
}: {
  start?: [number, number];
  end?: [number, number];
} = {}) {
  const { departure, arrival } = useSearchStore();

  const mapStart = start || departure?.coordinates || null;
  const mapEnd = end || arrival?.coordinates || null;

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{
        scale: 125,
        center: [0 as unknown as Longitude, 30 as unknown as Latitude],
        rotate: [-10, 0, 0] as unknown as any, // This fixes the Russia split
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={geoUrl}>
        {({ geographies }: any) =>
          geographies
            .filter((geo: any) => geo.id !== "010")
            .map((geo: any, index: number) => (
              <Geography
                key={geo.rsmKey || geo.id || `geo-${index}`}
                geography={geo}
                fill="var(--surface-color)"
                stroke="var(--accent-primary)"
                style={{
                  default: { outline: "none" },
                  hover: { fill: "var(--accent-primary)", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
        }
      </Geographies>

      {mapStart && mapEnd && <DirectFlightLine start={mapStart} end={mapEnd} />}

      {mapStart && (
        <Marker coordinates={mapStart as unknown as Coordinates}>
          <circle r={2} fill="#ffffff" />
        </Marker>
      )}

      {mapEnd && (
        <Marker coordinates={mapEnd as unknown as Coordinates}>
          <circle r={2} fill="#ffffff" />
        </Marker>
      )}
    </ComposableMap>
  );
}
