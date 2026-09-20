/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Patch rAF and unhandledrejection at module level to catch Mapbox GL internal projection & image_manager errors
if (typeof window !== "undefined") {
  // Suppress all Mapbox GL internal TypeErrors inside animation frames
  const _raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb: FrameRequestCallback) =>
    _raf((t: number) => {
      try {
        cb(t);
      } catch (e: any) {
        const msg: string = e?.message ?? "";
        const stack: string = e?.stack ?? "";
        const isMapboxInternal =
          msg.includes("reading 'get'") ||
          msg.includes("applyProjectionUpdate") ||
          msg.includes("DEM") ||
          stack.includes("image_manager") ||
          stack.includes("load_sprite") ||
          stack.includes("mapbox-gl");
        if (isMapboxInternal) return;
        throw e;
      }
    });

  // Catch unhandled Promise rejections from Mapbox sprite loading
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (!reason) return;
    const msg: string = reason.message ?? "";
    const stack: string = reason.stack ?? "";
    if (
      msg.includes("reading 'get'") ||
      msg.includes("applyProjectionUpdate") ||
      stack.includes("image_manager") ||
      stack.includes("load_sprite") ||
      stack.includes("mapbox-gl")
    ) {
      event.preventDefault();
    }
  });

  // Swallow synchronous Mapbox GL errors from load_sprite and image_manager
  window.addEventListener("error", (event) => {
    const stack: string = event.error?.stack ?? event.filename ?? "";
    if (
      stack.includes("mapbox-gl") ||
      stack.includes("load_sprite") ||
      stack.includes("image_manager")
    ) {
      event.preventDefault();
    }
  });
}

import { useEffect, useRef, useState, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  RotateCcw,
  Expand,
  Navigation,
  Crosshair,
  Layers,
  X,
  MapPin,
  Share2,
  Loader2,
  Search,
  Plane,
  Compass,
  ExternalLink,
  Car,
  Sparkles,
  Navigation2,
  ArrowRight,
  TrendingUp,
  Check,
  Building2,
  Landmark,
  Trees,
  Milestone,
  Clock,
  Route,
} from "lucide-react";

import { Contact } from "@/types/chat";
import { ChatManager } from "@/lib/api";
import BlackCarModal from "@/components/lobby/BlackCarModal";
import { airports as globalAirports } from "@/utils/mock-data/airports";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Patch Mapbox GL prototype to prevent _updateProjection from throwing when style sprites or DEM load
if (typeof window !== "undefined" && mapboxgl && mapboxgl.Map) {
  try {
    const proto = mapboxgl.Map.prototype as any;
    if (proto._updateProjection && !proto._flydnaPatchedProj) {
      proto._flydnaPatchedProj = true;
      const orig = proto._updateProjection;
      proto._updateProjection = function (...args: any[]) {
        try {
          if (!this || !this.transform || !this.transform.projection) return;
          return orig.apply(this, args);
        } catch (e) {
          return;
        }
      };
    }
    // Also patch style to prevent image_manager .get() crash
    if (proto.getStyle && !proto._flydnaPatchedStyle) {
      proto._flydnaPatchedStyle = true;
    }
  } catch (e) {}
}

import { mapboxTransformRequest } from "@/lib/mapbox";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

if (
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
) {
  mapboxgl.baseApiUrl = `${window.location.origin}/api/mapbox-proxy`;
}

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export type AirportItem = {
  name: string;
  code: string;
  type: "Commercial" | "Private";
  lat: number;
  lng: number;
};

const STATE_AIRPORTS: Record<string, AirportItem[]> = {
  GA: [
    {
      name: "Hartsfield-Jackson Atlanta Intl (ATL)",
      code: "ATL",
      type: "Commercial",
      lat: 33.6407,
      lng: -84.4277,
    },
    {
      name: "Savannah/Hilton Head Intl (SAV)",
      code: "SAV",
      type: "Commercial",
      lat: 32.1275,
      lng: -81.2021,
    },
    {
      name: "Augusta Regional (AGS)",
      code: "AGS",
      type: "Commercial",
      lat: 33.3699,
      lng: -81.9644,
    },
    {
      name: "DeKalb-Peachtree (PDK)",
      code: "PDK",
      type: "Private",
      lat: 33.876,
      lng: -84.302,
    },
    {
      name: "Gwinnett County Briscoe (LZU)",
      code: "LZU",
      type: "Private",
      lat: 33.9781,
      lng: -83.9622,
    },
    {
      name: "Fulton County Executive (FTY)",
      code: "FTY",
      type: "Private",
      lat: 33.7791,
      lng: -84.5213,
    },
    {
      name: "Cobb County McCollum (RYY)",
      code: "RYY",
      type: "Private",
      lat: 34.0131,
      lng: -84.5986,
    },
  ],
  NY: [
    {
      name: "John F. Kennedy Intl (JFK)",
      code: "JFK",
      type: "Commercial",
      lat: 40.6413,
      lng: -73.7781,
    },
    {
      name: "LaGuardia Airport (LGA)",
      code: "LGA",
      type: "Commercial",
      lat: 40.7769,
      lng: -73.874,
    },
    {
      name: "Buffalo Niagara Intl (BUF)",
      code: "BUF",
      type: "Commercial",
      lat: 42.9405,
      lng: -78.7322,
    },
    {
      name: "Westchester County (HPN)",
      code: "HPN",
      type: "Private",
      lat: 41.0669,
      lng: -73.7075,
    },
    {
      name: "Republic Airport (FRG)",
      code: "FRG",
      type: "Private",
      lat: 40.7289,
      lng: -73.4133,
    },
    {
      name: "Teterboro Airport (TEB)",
      code: "TEB",
      type: "Private",
      lat: 40.8501,
      lng: -74.0608,
    },
  ],
  FL: [
    {
      name: "Miami International (MIA)",
      code: "MIA",
      type: "Commercial",
      lat: 25.7959,
      lng: -80.287,
    },
    {
      name: "Orlando International (MCO)",
      code: "MCO",
      type: "Commercial",
      lat: 28.4281,
      lng: -81.309,
    },
    {
      name: "Fort Lauderdale-Hollywood (FLL)",
      code: "FLL",
      type: "Commercial",
      lat: 26.0742,
      lng: -80.1506,
    },
    {
      name: "Tampa International (TPA)",
      code: "TPA",
      type: "Commercial",
      lat: 27.9755,
      lng: -82.5332,
    },
    {
      name: "Fort Lauderdale Executive (FXE)",
      code: "FXE",
      type: "Private",
      lat: 26.1972,
      lng: -80.1707,
    },
    {
      name: "Orlando Executive (ORL)",
      code: "ORL",
      type: "Private",
      lat: 28.5455,
      lng: -81.3329,
    },
    {
      name: "Miami Opa-locka Executive (OPF)",
      code: "OPF",
      type: "Private",
      lat: 25.9036,
      lng: -80.2783,
    },
  ],
  CA: [
    {
      name: "Los Angeles Intl (LAX)",
      code: "LAX",
      type: "Commercial",
      lat: 33.9416,
      lng: -118.4085,
    },
    {
      name: "San Francisco Intl (SFO)",
      code: "SFO",
      type: "Commercial",
      lat: 37.6213,
      lng: -122.379,
    },
    {
      name: "San Diego Intl (SAN)",
      code: "SAN",
      type: "Commercial",
      lat: 32.7338,
      lng: -117.1933,
    },
    {
      name: "Van Nuys Private Jet (VNY)",
      code: "VNY",
      type: "Private",
      lat: 34.2098,
      lng: -118.489,
    },
    {
      name: "Santa Monica Municipal (SMO)",
      code: "SMO",
      type: "Private",
      lat: 34.0158,
      lng: -118.4513,
    },
    {
      name: "John Wayne Orange County (SNA)",
      code: "SNA",
      type: "Private",
      lat: 33.6762,
      lng: -117.8675,
    },
  ],
  TX: [
    {
      name: "Dallas/Fort Worth Intl (DFW)",
      code: "DFW",
      type: "Commercial",
      lat: 32.8998,
      lng: -97.0403,
    },
    {
      name: "Houston George Bush (IAH)",
      code: "IAH",
      type: "Commercial",
      lat: 29.9902,
      lng: -95.3368,
    },
    {
      name: "Austin-Bergstrom Intl (AUS)",
      code: "AUS",
      type: "Commercial",
      lat: 30.1945,
      lng: -97.6699,
    },
    {
      name: "Dallas Love Field (DAL)",
      code: "DAL",
      type: "Private",
      lat: 32.8481,
      lng: -96.8512,
    },
    {
      name: "William P. Hobby (HOU)",
      code: "HOU",
      type: "Private",
      lat: 29.6454,
      lng: -95.2789,
    },
    {
      name: "Addison Airport (ADS)",
      code: "ADS",
      type: "Private",
      lat: 32.9686,
      lng: -96.8364,
    },
  ],
};

type MapPanelProps = {
  selectedContact: Contact | null;
  onSelect?: (id: string) => void;
  isDarkMode?: boolean;
};

export default function MapPanel({
  selectedContact,
  onSelect,
  isDarkMode,
}: MapPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const airportMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const activeAirportsRef = useRef<AirportItem[] | null>(null);
  const renderAirportMarkersRef = useRef<
    ((airports: AirportItem[]) => void) | null
  >(null);
  const [activePopup, setActivePopup] = useState<
    "navigation" | "layers" | null
  >(null);
  const [isLiveBoxExpanded, setIsLiveBoxExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"blueprint" | "satellite">(
    "blueprint",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [realLocations, setRealLocations] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = JSON.parse(
          localStorage.getItem("flydna_last_pos") || "null",
        );
        if (
          cached &&
          typeof cached.lat === "number" &&
          typeof cached.lng === "number"
        ) {
          return cached;
        }
      } catch {}
    }
    return null;
  });
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [plottedDestination, setPlottedDestination] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [travelMode, setTravelMode] = useState<
    "walking" | "driving" | "flying"
  >("driving");
  const plottedDestinationRef = useRef<{
    lat: number;
    lng: number;
    name: string;
    geometry: any;
  } | null>(null);
  const [selectedAirport, setSelectedAirport] = useState<{
    name: string;
    type: "Commercial" | "Private";
    lat: number;
    lng: number;
    distance?: string;
    bearing?: string;
  } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<{
    name: string;
    lat: number;
    lng: number;
    distance?: string;
    bearing?: string;
    miles?: number;
    category?: string | null;
    address?: string | null;
  } | null>(null);
  const [isBlackCarModalOpen, setIsBlackCarModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const lastCenteredContactIdRef = useRef<string | null>(null);

  const fetchMapLocations = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("flydna_token")
          : null;
      if (!token) return;
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const res = await fetch(`${apiBase}/api/user/map-locations`, {
        headers: { Authorization: `Bearer ${token}`, "auth-token": token },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.data) setRealLocations(data.data);
    } catch {}
  };

  const fallbackToProfileCity = async () => {
    try {
      const userStr =
        typeof window !== "undefined"
          ? localStorage.getItem("flydna_user") ||
            localStorage.getItem("flydna_profile")
          : null;
      let city = "Atlanta, GA";
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed.city || parsed.profileCity) {
          city = `${parsed.city || parsed.profileCity}, ${parsed.state || parsed.profileState || "GA"}`;
        }
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      );
      const data = await res.json();
      if (data && data[0]) {
        setUserLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      } else {
        {
          let lk = null;
          try {
            lk = JSON.parse(localStorage.getItem("flydna_last_pos") || "null");
          } catch {}
          setUserLocation(lk && lk.lat ? lk : { lat: 33.749, lng: -84.388 });
        }
      }
    } catch {
      {
        let lk = null;
        try {
          lk = JSON.parse(localStorage.getItem("flydna_last_pos") || "null");
        } catch {}
        setUserLocation(lk && lk.lat ? lk : { lat: 33.749, lng: -84.388 });
      }
    }
  };

  useEffect(() => {
    fetchMapLocations();
    const interval = setInterval(fetchMapLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic contacts list synced with ChatManager
  const [contactsList, setContactsList] = useState<Contact[]>([]);

  // Deterministic numeric hash from a string id, used to seed pseudo-coordinates
  const hashId = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  const DUBAI_HQ = { lat: 25.2048, lng: 55.2708 };

  // Load GPS Tracking & Stealth Mode preferences
  useEffect(() => {
    const handleStorage = () => {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("flydna_pref_toggles")
          : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setOnlineStatus(parsed.privacyMode !== false);
          setGpsEnabled(parsed.gpsTracking !== false);
          fetchMapLocations();
        } catch {}
      } else {
        setOnlineStatus(true);
        setGpsEnabled(true);
      }
    };
    handleStorage();
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const getGpsLocationState = (): boolean => gpsEnabled;

  const getStealthModeState = (): boolean => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("flydna_pref_toggles");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.privacyMode === true; // defaults to false
        }
      } catch {}
    }
    return false;
  };

  const contactCoords = useMemo(() => {
    const coords: Record<string, [number, number]> = {};
    const stealthActive = getStealthModeState(); // true if privacyMode is enabled

    // Official AI contacts get fixed Dubai HQ coordinates
    contactsList.forEach((contact) => {
      if (contact.isOfficial) {
        const seed = hashId(contact.id);
        const seedLat = Math.sin(seed * 8923) * 0.02;
        const seedLng = Math.cos(seed * 4312) * 0.02;
        coords[contact.id] = [55.2708 + seedLng, 25.2048 + seedLat];
      }
    });

    // Real users get coordinates from API
    realLocations.forEach((loc: any) => {
      if (loc.isSelf && stealthActive) return; // Hide self if stealth mode is active
      const key = loc.isSelf ? "__self__" : loc.userId;
      coords[key] = [loc.lng, loc.lat];
    });

    return coords;
  }, [contactsList, realLocations, onlineStatus]);

  // Subscribe to ChatManager and preferences events
  useEffect(() => {
    const sync = () => {
      setContactsList([...ChatManager.getContacts()]);
    };
    sync();
    const unsubscribe = ChatManager.subscribe(sync);

    const handlePrefsChange = () => {
      sync();
    };
    window.addEventListener("flydna-preferences-changed", handlePrefsChange);

    const handlePlotMapLocation = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.lat && detail.lng) {
        setPlottedDestination({ lat: detail.lat, lng: detail.lng });
        setSelectedDestination({
          name: detail.name || "Target Location",
          lat: detail.lat,
          lng: detail.lng,
          category: detail.category || null,
          address: detail.address || null,
        });
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [detail.lng, detail.lat],
            zoom: 14,
            duration: 1500,
          });
        }
      }
    };
    window.addEventListener("flydna-plot-map-location", handlePlotMapLocation);

    return () => {
      unsubscribe();
      window.removeEventListener(
        "flydna-preferences-changed",
        handlePrefsChange,
      );
      window.removeEventListener(
        "flydna-plot-map-location",
        handlePlotMapLocation,
      );
    };
  }, []);

  // Customize standard mapbox styles for blueprint theme
  const customizeMapStyle = (map: mapboxgl.Map) => {
    if (!map || !mapRef.current) return;
    try {
      const style = map.getStyle();
      if (!style || !style.layers) return;

      style.layers.forEach((layer) => {
        try {
          const keepLabel =
            layer.id.includes("settlement-major-label") ||
            layer.id.includes("settlement-minor-label") ||
            layer.id.includes("state-label");
          if (keepLabel) {
            map.setLayoutProperty(layer.id, "visibility", "visible");
            map.setPaintProperty(layer.id, "text-color", "#64748b");
            map.setPaintProperty(layer.id, "text-halo-color", "#020817");
            map.setPaintProperty(layer.id, "text-halo-width", 1.2);
          } else if (
            layer.type === "symbol" ||
            layer.id.includes("label") ||
            layer.id.includes("text")
          ) {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }

          if (
            layer.id.includes("poi") ||
            layer.id.includes("landmark") ||
            layer.id.includes("transit") ||
            layer.id.includes("place-")
          ) {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }

          if (layer.id.includes("building")) {
            if (layer.type === "fill" || layer.type === "fill-extrusion") {
              map.setPaintProperty(layer.id, "fill-opacity", 0.05);
              map.setPaintProperty(layer.id, "fill-color", "#020617");
            } else {
              map.setLayoutProperty(layer.id, "visibility", "none");
            }
          }

          if (layer.id === "background") {
            map.setPaintProperty(
              layer.id,
              "background-color",
              isDarkMode ? "#020817" : "#e0d5c8",
            );
          }

          if (
            (layer.id.includes("land") ||
              layer.id.includes("structure") ||
              layer.id.includes("natural")) &&
            layer.type === "fill"
          ) {
            map.setPaintProperty(
              layer.id,
              "fill-color",
              isDarkMode ? "#020617" : "#ebdcd0",
            );
          }

          if (layer.id.includes("water") && layer.type === "fill") {
            map.setPaintProperty(
              layer.id,
              "fill-color",
              isDarkMode ? "#03152E" : "#93c5fd",
            );
          }

          if (
            layer.id.includes("road") ||
            layer.id.includes("bridge") ||
            layer.id.includes("tunnel")
          ) {
            if (layer.type === "line") {
              const isCasing =
                layer.id.includes("casing") || layer.id.includes("outline");
              const isMajor =
                layer.id.includes("motorway") ||
                layer.id.includes("trunk") ||
                layer.id.includes("primary") ||
                layer.id.includes("secondary") ||
                layer.id.includes("expressway");

              if (isCasing) {
                map.setPaintProperty(
                  layer.id,
                  "line-color",
                  "rgba(0, 191, 255, 0.3)",
                );
              } else {
                map.setPaintProperty(
                  layer.id,
                  "line-color",
                  isMajor ? "#00BFFF" : "#0A84FF",
                );
              }
            }
          }
        } catch {
          // Ignore style settings unsupported by certain layers
        }
      });
    } catch (e) {}
  };

  // Initialize Mapbox map (once on mount or style mode change)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Detect user current location on mount and center map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          try {
            localStorage.setItem("flydna_last_pos", JSON.stringify(liveLoc));
          } catch {}
          setUserLocation(liveLoc);
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [liveLoc.lng, liveLoc.lat],
              zoom: 14,
              duration: 1200,
            });
          }
        },
        async () => {
          await fallbackToProfileCity();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      );
    } else if (!userLocation) {
      fallbackToProfileCity();
    }

    const DEFAULT_MAPBOX_TOKEN =
      "pk.eyJ1IjoiaDJvMjYiLCJhIjoiY210NGtibms3MWR2cTJ4cTV1dzNobzUwMiJ9.x4ynmPnKAP8zv0olbb5qBg";
    const token = (
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      MAPBOX_TOKEN ||
      DEFAULT_MAPBOX_TOKEN
    ).trim();
    if (!token || !token.startsWith("pk.")) {
      console.warn(
        "[MapPanel] Mapbox token missing or invalid. Skipping map rendering.",
      );
      return;
    }
    mapboxgl.accessToken = token;

    // Determine initial center from userLocation or cached pos
    let initialCenter: [number, number] = [-84.388, 33.749]; // Atlanta fallback instead of NYC
    if (userLocation) {
      initialCenter = [userLocation.lng, userLocation.lat];
    } else {
      try {
        const cached = JSON.parse(
          localStorage.getItem("flydna_last_pos") || "null",
        );
        if (
          cached &&
          typeof cached.lng === "number" &&
          typeof cached.lat === "number"
        ) {
          initialCenter = [cached.lng, cached.lat];
        }
      } catch {}
    }

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: isDarkMode
          ? "mapbox://styles/mapbox/dark-v11"
          : "mapbox://styles/mapbox/light-v11",
        center: initialCenter,
        zoom: 13.5,
        pitch: 45,
        attributionControl: false,
        transformRequest: mapboxTransformRequest,
      });
      mapRef.current = map;
    } catch (err) {
      console.error("Mapbox GL failed to initialize:", err);
      return;
    }

    const restoreRouteLine = () => {
      if (!map || !mapRef.current) return;
      try {
        if (
          plottedDestinationRef.current &&
          plottedDestinationRef.current.geometry
        ) {
          if (map.getSource("routing-line")) map.removeSource("routing-line");
          map.addSource("routing-line", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: plottedDestinationRef.current.geometry,
            },
          });
          if (map.getLayer("routing-line")) map.removeLayer("routing-line");
          map.addLayer({
            id: "routing-line",
            type: "line",
            source: "routing-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#22d3ee",
              "line-width": 5,
              "line-opacity": 0.85,
            },
          });
        }
      } catch (e) {}
    };

    const handleStyleLoad = () => {
      if (!mapRef.current) return;
      try {
        if (mapStyle === "blueprint") {
          customizeMapStyle(map);
        }
        restoreRouteLine();
      } catch (e) {}
    };

    const handleLoad = () => {
      if (!mapRef.current) return;
      try {
        if (mapStyle === "blueprint") {
          customizeMapStyle(map);
        }
        restoreRouteLine();
        setMapLoaded(true);
      } catch (e) {}
    };

    const updateZoomLevel = () => {
      if (!mapContainerRef.current || !mapRef.current) return;
      const z = mapRef.current.getZoom();
      let level = "high";
      if (z < 6.5) level = "ultra-low";
      else if (z < 10) level = "low";
      else if (z < 12.8) level = "mid";
      mapContainerRef.current.setAttribute("data-zoom", level);

      // Dynamically re-cluster airport markers if active
      if (
        activeAirportsRef.current &&
        activeAirportsRef.current.length > 0 &&
        renderAirportMarkersRef.current
      ) {
        renderAirportMarkersRef.current(activeAirportsRef.current);
      }
    };

    map.on("zoom", updateZoomLevel);
    map.on("zoomend", updateZoomLevel);
    map.on("move", updateZoomLevel);
    map.on("style.load", handleStyleLoad);
    map.on("load", () => {
      handleLoad();
      updateZoomLevel();
    });
    map.on("error", (e) => {
      const err = e?.error as any;
      if (err?.status === 403 || err?.message?.includes("Forbidden")) {
        console.warn("[MapPanel] Mapbox tile warning (handled):", err?.message);
      }
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        try {
          if (mapRef.current) map.resize();
        } catch (e) {}
      }, 100);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      setMapLoaded(false);
      try {
        map.off("style.load", handleStyleLoad);
        map.off("load", handleLoad);
      } catch (e) {}
      if (mapRef.current) {
        mapRef.current = null;
        try {
          map.remove();
        } catch (e) {}
      }
      if (destinationMarkerRef.current) {
        try {
          destinationMarkerRef.current.remove();
        } catch (e) {}
        destinationMarkerRef.current = null;
      }
      airportMarkersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch (e) {}
      });
      airportMarkersRef.current = [];
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch (e) {}
        userMarkerRef.current = null;
      }
    };
  }, [isDarkMode]);

  // Smart-Board AI Mini-Map Interactivity Handler: listens for AI plotted locations and flies camera + drops neon pin
  useEffect(() => {
    const handlePlotLocation = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (
        !detail ||
        typeof detail.lat !== "number" ||
        typeof detail.lng !== "number"
      )
        return;

      const map = mapRef.current;
      if (!map) return;

      const name = detail.name || "Target Destination";
      const lat = detail.lat;
      const lng = detail.lng;

      // 1. Cinematic Smart-Board 3D FlyTo Animation
      try {
        map.resize();
        map.flyTo({
          center: [lng, lat],
          zoom: 16.2,
          pitch: 58,
          bearing: -18,
          duration: 2200,
          essential: true,
        });
      } catch (err) {
        console.warn("[MapPanel] flyTo execution error:", err);
      }

      // 2. Clear existing destination marker
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }

      // 3. Create high-tech Tactical Holographic Venue Pin Marker
      const el = document.createElement("div");
      el.className =
        "destination-marker group flex flex-col items-center select-none cursor-pointer pointer-events-auto";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <!-- Staggered Neon Target Ping -->
          <div class="marker-beacon-ping absolute inset-0 rounded-full bg-rose-500/30 animate-ping" style="animation-duration: 2s;"></div>
          <div class="marker-beacon-ping absolute -inset-1 rounded-full border border-dashed border-rose-400/70 animate-spin" style="animation-duration: 14s;"></div>
          
          <!-- Core Holographic Disc -->
          <div class="marker-disc relative rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-400 p-[2px] shadow-[0_0_20px_rgba(244,63,94,0.85)] flex items-center justify-center group-hover:scale-115 transition-transform duration-200">
            <div class="grid place-items-center rounded-[10px] bg-[#06111f] w-full h-full text-rose-300 font-black">
              <svg class="marker-svg-icon text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Sleek Floating Venue Tag -->
        <div class="marker-pill-label mt-1 whitespace-nowrap flex items-center gap-1 rounded-full bg-[#06111f]/95 border border-rose-500/50 shadow-[0_4px_12px_rgba(0,0,0,0.7)] backdrop-blur-md max-w-[130px] pointer-events-none transition-all duration-200">
          <span class="marker-dot size-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,1)] animate-pulse shrink-0"></span>
          <span class="marker-title font-black text-rose-200 uppercase tracking-wider truncate">${name}</span>
        </div>
      `;

      el.addEventListener("click", () => {
        map.flyTo({ center: [lng, lat], zoom: 17, pitch: 60, duration: 1000 });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      destinationMarkerRef.current = marker;

      // Update state and ref so map camera stays locked on AI plotted venue
      plottedDestinationRef.current = { lat, lng, name, geometry: null };
      setPlottedDestination({ lat, lng });

      let miles: number | undefined;
      let distStr: string | undefined;
      let bearStr: string | undefined;

      if (userLocation) {
        miles = getHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng,
        );
        distStr = `${miles.toFixed(1)} miles`;
        bearStr = getCompassDirection(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng,
        );

        try {
          const geojson: any = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [userLocation.lng, userLocation.lat],
                [lng, lat],
              ],
            },
          };

          if (map.getLayer("routing-line")) map.removeLayer("routing-line");
          if (map.getSource("routing-line")) map.removeSource("routing-line");

          map.addSource("routing-line", {
            type: "geojson",
            data: geojson,
          });

          map.addLayer({
            id: "routing-line",
            type: "line",
            source: "routing-line",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#00F0FF",
              "line-width": 4,
              "line-dasharray": [2, 1],
            },
          });
        } catch (e) {}
      }

      const lowerName = name.toLowerCase();
      let category = "EVENT ARENA & STADIUM";
      if (lowerName.includes("stadium") || lowerName.includes("arena")) {
        category = "BASKETBALL STADIUM";
      } else if (lowerName.includes("market") || lowerName.includes("shop")) {
        category = "SHOPPING & ENTERTAINMENT";
      } else if (
        lowerName.includes("restaurant") ||
        lowerName.includes("optimist")
      ) {
        category = "FINE DINING";
      }

      setSelectedDestination({
        name,
        lat,
        lng,
        distance: distStr,
        bearing: bearStr,
        miles,
        category,
        address: name,
      });
    };

    window.addEventListener("flydna-plot-map-location", handlePlotLocation);
    return () =>
      window.removeEventListener(
        "flydna-plot-map-location",
        handlePlotLocation,
      );
  }, [mapLoaded]);

  // Manage pulsing user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    // Get user avatar or fallback to initials
    const userStr =
      typeof window !== "undefined"
        ? localStorage.getItem("flydna_user") ||
          localStorage.getItem("flydna_profile")
        : null;
    let avatarUrl = "";
    let initials = "U";
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed.avatarUrl) avatarUrl = parsed.avatarUrl;
        if (parsed.name) {
          initials = parsed.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2);
        }
      } catch {}
    }

    const avatarHtml = avatarUrl
      ? `<img src="${avatarUrl}" alt="You" class="w-full h-full object-cover rounded-full" />`
      : `<div class="grid place-items-center rounded-full bg-[#06111f] w-full h-full text-xs font-black text-cyan-300">${initials}</div>`;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement("div");
      el.className =
        "user-marker group flex flex-col items-center select-none cursor-pointer pointer-events-auto";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <!-- Staggered Dual Cyan Radar Waves -->
          <div class="marker-beacon-ping absolute inset-0 rounded-full bg-cyan-400/25 animate-ping" style="animation-duration: 2.4s;"></div>
          <div class="marker-beacon-ping absolute -inset-1 rounded-full border border-dashed border-cyan-400/60 animate-spin" style="animation-duration: 14s;"></div>

          <!-- Inner Core Avatar Container -->
          <div class="marker-disc relative rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-blue-600 p-[2px] shadow-[0_0_20px_rgba(34,211,238,0.9)] z-20 group-hover:scale-115 transition-transform duration-200 flex items-center justify-center">
            <div class="grid place-items-center rounded-full bg-[#06111f] w-full h-full overflow-hidden">
              ${avatarHtml}
            </div>
            <!-- Live Beacon Pulse Indicator -->
            <span class="absolute -top-0.5 -right-0.5 flex size-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full size-2.5 bg-emerald-500 border border-[#06111f]"></span>
            </span>
          </div>
        </div>

        <!-- Cyber Floating Telemetry Tag -->
        <div class="marker-pill-label mt-1 whitespace-nowrap flex items-center gap-1 rounded-full bg-[#06111f]/95 border border-cyan-400/50 shadow-[0_4px_12px_rgba(0,0,0,0.7)] backdrop-blur-md pointer-events-none transition-all duration-200">
          <span class="marker-dot size-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,1)] animate-pulse shrink-0"></span>
          <span class="marker-title font-black text-cyan-200 uppercase tracking-wider">YOU</span>
          <span class="marker-sub-label font-bold text-cyan-400/80 shrink-0">• LIVE</span>
        </div>
      `;

      el.addEventListener("click", () => {
        map.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 14,
          duration: 1200,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);

      userMarkerRef.current = marker;
    }
  }, [userLocation, mapLoaded]);

  // Handle marker creation & updates reactively
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const userGpsEnabled = getGpsLocationState();
    const userStealthEnabled = getStealthModeState();

    contactsList.forEach((contact) => {
      const coords = contactCoords[contact.id];
      if (!coords) return;
      // Skip invisible/stealth contacts from other users
      if (contact.id !== "__self__" && (contact as any).isInvisible) return;

      const seed = hashId(contact.id);
      const isSelf = contact.id === "__self__";
      if (isSelf) return; // Skip duplicate self rendering since we have the dedicated pulsing bubble
      const gpsEnabled = isSelf ? userGpsEnabled : seed % 3 !== 0;
      // stealthActive = user chose to go OFFLINE (privacyMode toggle is OFF)
      const stealthActive = false; // No stealth badge needed anymore
      // Hide self when online status is OFF
      if (isSelf && !userStealthEnabled) return;
      // Hide others who are invisible
      if (!isSelf && (contact as any).isInvisible) return;
      const isPrivate = seed % 2 === 0;

      const markerEl = document.createElement("div");
      markerEl.className =
        "contact-marker group flex flex-col items-center select-none cursor-pointer pointer-events-auto relative";

      const initials = contact.name
        ? contact.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
        : "AM";

      const safeAvatarUrl = contact.avatarUrl
        ? contact.avatarUrl.replace(/"/g, "&quot;")
        : null;
      const avatarInner = safeAvatarUrl
        ? `<img src="${safeAvatarUrl}" alt="${contact.name}" class="w-full h-full rounded-full object-cover transition duration-300 " />`
        : `<div class="grid place-items-center rounded-full bg-[#06111f] w-full h-full text-base font-bold text-white shadow-inner border border-white/10 ">${initials}</div>`;

      // Fallback Airport code
      let airportLabel = "";
      if (!gpsEnabled) {
        if (contact.isOfficial) {
          airportLabel = isPrivate ? "DWC" : "DXB";
        } else {
          airportLabel = isPrivate ? "TEB" : "JFK";
        }
      }

      const isOfficial = contact.isOfficial;

      // Status indicator badge
      let statusBadge = "";
      if (isOfficial) {
        statusBadge = `
          <span class="absolute -top-0.5 -right-0.5 flex items-center justify-center size-3.5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-[7.5px] shadow-[0_0_8px_rgba(245,158,11,0.8)] border border-amber-200 z-20">
            ★
          </span>
        `;
      } else if (airportLabel) {
        statusBadge = `
          <span class="absolute -top-0.5 -right-0.5 px-1 py-0.2 text-[7px] font-black text-slate-950 bg-cyan-400 border border-slate-950 rounded tracking-wider shadow-[0_0_8px_rgba(34,211,238,0.7)] animate-pulse z-20">
            ${airportLabel}
          </span>
        `;
      } else {
        statusBadge = `
          <span class="absolute bottom-0 right-0 flex size-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${contact.accent ? contact.accent.replace("bg-", "bg-") : "bg-emerald-400"} opacity-75"></span>
            <span class="relative inline-flex rounded-full size-2.5 ${contact.accent || "bg-emerald-400"} border border-[#06111f] shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
          </span>
        `;
      }

      const ringGradient = isOfficial
        ? "from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_16px_rgba(245,158,11,0.7)]"
        : `${contact.color || "from-cyan-400 via-sky-400 to-blue-600"} shadow-[0_0_14px_rgba(34,211,238,0.6)]`;

      const subLabel = isOfficial
        ? "HQ"
        : !gpsEnabled
          ? airportLabel || "Off"
          : contact.status || "Active";

      markerEl.innerHTML = `
        <div class="relative flex items-center justify-center">
          <!-- Avatar Frame -->
          <div class="marker-disc marker-ring relative rounded-full bg-gradient-to-tr ${ringGradient} p-[2px] shadow-lg transition-transform duration-200 group-hover:scale-115 flex items-center justify-center">
            <div class="grid place-items-center rounded-full bg-[#06111f] w-full h-full overflow-hidden">
              ${avatarInner}
            </div>
          </div>
          ${statusBadge}
        </div>

        <!-- Futuristic Holographic Name Pill -->
        <div class="marker-pill-label mt-1 whitespace-nowrap flex items-center gap-1 rounded-full bg-[#06111f]/95 border ${isOfficial ? "border-amber-400/50 text-amber-300" : "border-white/20 text-white"} shadow-[0_4px_12px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-200 pointer-events-none">
          <span class="marker-dot size-1.5 rounded-full ${isOfficial ? "bg-amber-400" : contact.accent || "bg-emerald-400"} animate-pulse shrink-0"></span>
          <span class="marker-title font-bold tracking-tight truncate max-w-[65px]">
            ${contact.name.split(" ")[0]}
          </span>
          <span class="marker-sub-label font-semibold text-slate-400 uppercase tracking-widest opacity-80 shrink-0">
            • ${subLabel}
          </span>
        </div>
      `;

      markerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isSelf) return; // Do not open chat when clicking 'You'
        if (onSelect) {
          onSelect(contact.id);
        }
      });

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current[contact.id] = marker;
    });

    updateActiveMarkerHighlight();
  }, [contactsList, contactCoords, mapLoaded, onlineStatus, realLocations]);

  // Dynamically toggle map style on theme switch
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapStyle === "blueprint") {
      mapRef.current.setStyle(
        isDarkMode
          ? "mapbox://styles/mapbox/dark-v11"
          : "mapbox://styles/mapbox/light-v11",
      );
    }
  }, [isDarkMode, mapStyle]);

  // Update highlight state of markers dynamically when selection changes
  const updateActiveMarkerHighlight = () => {
    contactsList.forEach((contact) => {
      const marker = markersRef.current[contact.id];
      if (marker) {
        const el = marker.getElement();
        const ring = el.querySelector(".marker-ring");
        if (ring) {
          if (selectedContact && contact.id === selectedContact.id) {
            ring.classList.add(
              "shadow-[0_0_25px_rgba(0,229,255,0.85)]",
              "ring-2",
              "ring-cyan-400",
            );
          } else {
            ring.classList.remove(
              "shadow-[0_0_25px_rgba(0,229,255,0.85)]",
              "ring-2",
              "ring-cyan-400",
            );
          }
        }
      }
    });
  };

  // Trigger active marker updates when selected contact ID updates
  useEffect(() => {
    updateActiveMarkerHighlight();

    if (!mapRef.current || !selectedContact) {
      lastCenteredContactIdRef.current = null;
      return;
    }
    // Center on the contact once; afterwards the user can pan/zoom freely during chat
    if (lastCenteredContactIdRef.current === selectedContact.id) return;
    if (plottedDestinationRef.current) return; // live plot owns the camera; refresh icon restores follow
    const coords = contactCoords[selectedContact.id];
    if (coords) {
      mapRef.current.flyTo({
        center: coords,
        zoom: 14.5,
        duration: 1500,
      });
      lastCenteredContactIdRef.current = selectedContact.id;
    }
  }, [selectedContact?.id, contactCoords]);

  // Handle zooming
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleClearDestination = () => {
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    const m = mapRef.current;
    if (m) {
      if (m.getLayer("routing-line")) m.removeLayer("routing-line");
      if (m.getSource("routing-line")) m.removeSource("routing-line");
    }
    setRouteInfo(null);
    setPlottedDestination(null);
    plottedDestinationRef.current = null;
    setSelectedDestination(null);
  };

  // Fullscreen toggle helper
  const handleFullscreenToggle = () => {
    const container = panelRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  // Center on Me callback (Locate / GPS Tracking)
  const handleCenterOnMe = () => {
    // 1. If location is already known, fly immediately with 0ms delay!
    const activeLoc =
      userLocation ||
      (() => {
        try {
          const cached = JSON.parse(
            localStorage.getItem("flydna_last_pos") || "null",
          );
          if (
            cached &&
            typeof cached.lat === "number" &&
            typeof cached.lng === "number"
          )
            return cached;
        } catch {}
        return null;
      })();

    if (activeLoc && mapRef.current) {
      mapRef.current.flyTo({
        center: [activeLoc.lng, activeLoc.lat],
        zoom: 15,
        pitch: 45,
        bearing: 0,
        duration: 1000,
      });
    }

    // 2. Refresh or acquire precise GPS in the background
    if (typeof window !== "undefined" && navigator.geolocation) {
      if (!activeLoc) {
        setIsLocating(true);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const liveLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(liveLoc);
          try {
            localStorage.setItem("flydna_last_pos", JSON.stringify(liveLoc));
          } catch {}
          if (!activeLoc && mapRef.current) {
            mapRef.current.flyTo({
              center: [liveLoc.lng, liveLoc.lat],
              zoom: 15,
              pitch: 45,
              bearing: 0,
              duration: 1000,
            });
          }
        },
        () => {
          setIsLocating(false);
          if (!activeLoc) {
            fallbackToProfileCity();
          }
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
      );
    }
  };

  // Follow Contact callback
  const handleFollowContact = () => {
    if (!selectedContact) return;
    const coords = contactCoords[selectedContact.id];
    if (coords) {
      mapRef.current?.flyTo({
        center: coords,
        zoom: 14,
        pitch: 45,
        bearing: 0,
        duration: 1500,
      });
    }
  };

  // Reset Tilt
  const handleResetTilt = () => {
    mapRef.current?.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });
  };

  const handleStyleChange = (style: "blueprint" | "satellite") => {
    if (!mapRef.current) return;
    setMapStyle(style);
    if (style === "satellite") {
      mapRef.current.setStyle("mapbox://styles/mapbox/satellite-streets-v12");
    } else {
      mapRef.current.setStyle(
        isDarkMode
          ? "mapbox://styles/mapbox/dark-v11"
          : "mapbox://styles/mapbox/light-v11",
      );
    }
  };

  const handleSetDestination = async (
    lat: number,
    lng: number,
    addressName: string,
    icon?: string | null,
    category?: string | null,
    address?: string | null,
  ) => {
    if (!mapRef.current) return;

    // Clear existing destination marker if any
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    // Clear airport markers
    airportMarkersRef.current.forEach((m) => m.remove());
    airportMarkersRef.current = [];

    // Clear routing line from map
    const map = mapRef.current;
    if (map.getLayer("routing-line")) map.removeLayer("routing-line");
    if (map.getSource("routing-line")) map.removeSource("routing-line");

    setRouteInfo(null);
    setSelectedDestination(null);
    setPlottedDestination({ lat, lng });
    plottedDestinationRef.current = {
      lat,
      lng,
      name: addressName,
      geometry: null,
    };

    // Create custom destination marker element
    const el = document.createElement("div");
    el.className =
      "destination-marker group flex flex-col items-center select-none cursor-pointer pointer-events-auto";
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <!-- Staggered Neon Target Ping -->
        <div class="marker-beacon-ping absolute inset-0 rounded-full bg-rose-500/30 animate-ping" style="animation-duration: 2s;"></div>
        <div class="marker-beacon-ping absolute -inset-1 rounded-full border border-dashed border-rose-400/70 animate-spin" style="animation-duration: 14s;"></div>
        
        <!-- Core Holographic Disc -->
        <div class="marker-disc relative rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-400 p-[2px] shadow-[0_0_22px_rgba(244,63,94,0.9)] flex items-center justify-center group-hover:scale-115 transition-transform duration-200">
          <div class="grid place-items-center rounded-[10px] bg-[#06111f] w-full h-full text-rose-300 font-black">
            ${
              icon
                ? `<img src="${icon}" class="marker-svg-icon object-contain" alt="" />`
                : `
              <svg class="marker-svg-icon text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            `
            }
          </div>
        </div>
      </div>

      <!-- Sleek Floating Venue Tag -->
      <div class="marker-pill-label mt-1 whitespace-nowrap flex items-center gap-1 rounded-full bg-[#06111f]/95 border border-rose-500/50 shadow-[0_4px_12px_rgba(0,0,0,0.7)] backdrop-blur-md max-w-[140px] pointer-events-none transition-all duration-200">
        <span class="marker-dot size-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,1)] animate-pulse shrink-0"></span>
        <span class="marker-title font-black text-rose-200 uppercase tracking-wider truncate">${addressName}</span>
      </div>
    `;

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      let distStr: string | undefined;
      let bearStr: string | undefined;
      let miles: number | undefined;
      if (userLocation) {
        miles = getHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng,
        );
        distStr = `${miles.toFixed(1)} miles`;
        bearStr = getCompassDirection(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng,
        );
      }
      setSelectedAirport(null);
      setSelectedDestination({
        name: addressName,
        lat,
        lng,
        distance: distStr,
        bearing: bearStr,
        miles,
        category: category ?? null,
        address: address ?? null,
      });
    });
    destinationMarkerRef.current = marker;

    // Calculate routing path if userLocation coordinates are present
    if (userLocation) {
      // Calculate direct distance (Haversine formula) to decide travel mode
      const R = 3958.8; // Earth radius in miles
      const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
      const dLon = ((lng - userLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const directDistMiles = R * c;

      if (directDistMiles > 250) {
        // Flight Journey Mode
        setTravelMode("flying");
        setRouteInfo({
          distance: `${directDistMiles.toFixed(1)} miles`,
          duration: `${Math.round((directDistMiles / 500) * 60)} mins (Flight)`,
        });

        // Straight flight path line
        const flightGeometry: any = {
          type: "LineString",
          coordinates: [
            [userLocation.lng, userLocation.lat],
            [lng, lat],
          ],
        };
        plottedDestinationRef.current.geometry = flightGeometry;

        map.addSource("routing-line", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: flightGeometry,
          },
        });

        map.addLayer({
          id: "routing-line",
          type: "line",
          source: "routing-line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#c084fc", // Premium purple for flights
            "line-width": 4,
            "line-dasharray": [2, 2], // Dashed line styling
            "line-opacity": 0.8,
          },
        });

        // Fit map bounds
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([userLocation.lng, userLocation.lat]);
        bounds.extend([lng, lat]);
        map.fitBounds(bounds, {
          padding: 80,
          duration: 1500,
        });
        return;
      }

      // Walking or Driving mode
      try {
        const mode = directDistMiles < 1.5 ? "walking" : "driving";
        setTravelMode(mode);

        const routeRes = await fetch(
          `https://router.project-osrm.org/route/v1/${mode === "walking" ? "foot" : "driving"}/${userLocation.lng},${userLocation.lat};${lng},${lat}?overview=full&geometries=geojson`,
        );
        const routeData = await routeRes.json();

        if (routeData && routeData.routes && routeData.routes[0]) {
          const route = routeData.routes[0];
          const distMiles = (route.distance * 0.000621371).toFixed(1);
          const durationMins = Math.round(route.duration / 60);

          setRouteInfo({
            distance: `${distMiles} miles`,
            duration: `${durationMins} mins`,
          });

          plottedDestinationRef.current.geometry = route.geometry;

          // Draw the route line vector
          map.addSource("routing-line", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: route.geometry,
            },
          });

          map.addLayer({
            id: "routing-line",
            type: "line",
            source: "routing-line",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": mode === "walking" ? "#10b981" : "#22d3ee", // green for walking, cyan for driving
              "line-width": 5,
              "line-opacity": 0.85,
            },
          });

          // Zoom and fit bounds to center the journey
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([userLocation.lng, userLocation.lat]);
          bounds.extend([lng, lat]);
          map.fitBounds(bounds, {
            padding: 80,
            duration: 1500,
          });
          return;
        }
      } catch (err) {
        console.error("OSRM Route calculation failed:", err);
      }
    }

    // Fallback: Centering map on the destination marker directly
    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      pitch: 45,
      bearing: 0,
      duration: 1500,
    });
  };

  const getHaversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
  };

  const getCompassDirection = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): string => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    const normalizedBearing = (bearing + 360) % 360;

    const directions = [
      { label: "N", min: 337.5, max: 22.5 },
      { label: "NE", min: 22.5, max: 67.5 },
      { label: "E", min: 67.5, max: 112.5 },
      { label: "SE", min: 112.5, max: 157.5 },
      { label: "S", min: 157.5, max: 202.5 },
      { label: "SW", min: 202.5, max: 247.5 },
      { label: "W", min: 247.5, max: 292.5 },
      { label: "NW", min: 292.5, max: 337.5 },
    ];

    const found = directions.find((d) => {
      if (d.label === "N") {
        return normalizedBearing >= d.min || normalizedBearing < d.max;
      }
      return normalizedBearing >= d.min && normalizedBearing < d.max;
    });

    return `${Math.round(normalizedBearing)}° ${found ? found.label : ""}`;
  };

  const AIRPORT_CARRIERS: Record<string, string> = {
    ATL: "DL",
    SAV: "DL",
    AGS: "DL",
    JFK: "DL",
    LGA: "DL",
    BUF: "WN",
    MIA: "AA",
    MCO: "WN",
    FLL: "B6",
    TPA: "WN",
    LAX: "AA",
    SFO: "UA",
    SAN: "AS",
    DFW: "AA",
    IAH: "UA",
    AUS: "WN",
  };

  const renderAirportMarkers = (airports: AirportItem[]) => {
    renderAirportMarkersRef.current = renderAirportMarkers;
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    airportMarkersRef.current.forEach((m) => {
      try {
        m.remove();
      } catch (e) {}
    });
    airportMarkersRef.current = [];

    // Screen pixel distance clustering
    const clusterRadius = 54;
    const clusters: {
      center: [number, number];
      items: typeof airports;
      pixel: { x: number; y: number };
    }[] = [];

    airports.forEach((airport) => {
      const p = map.project([airport.lng, airport.lat]);
      let added = false;
      for (const cl of clusters) {
        const dx = cl.pixel.x - p.x;
        const dy = cl.pixel.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < clusterRadius) {
          cl.items.push(airport);
          const totalLng = cl.items.reduce((s, it) => s + it.lng, 0);
          const totalLat = cl.items.reduce((s, it) => s + it.lat, 0);
          cl.center = [totalLng / cl.items.length, totalLat / cl.items.length];
          cl.pixel = map.project(cl.center);
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push({
          center: [airport.lng, airport.lat],
          items: [airport],
          pixel: p,
        });
      }
    });

    clusters.forEach((cluster) => {
      if (cluster.items.length > 1) {
        // Multi-Airport Number Cluster Badge
        const count = cluster.items.length;
        const el = document.createElement("div");
        el.className =
          "cluster-marker airport-marker group flex flex-col items-center select-none cursor-pointer pointer-events-auto animate-fade-in";
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <!-- Staggered Cyan/Amber Aura Ping -->
            <div class="marker-beacon-ping absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" style="animation-duration: 2.4s;"></div>
            <div class="marker-beacon-ping absolute -inset-1 rounded-full border border-dashed border-cyan-400/60 animate-spin" style="animation-duration: 12s;"></div>
            
            <!-- Number Disc -->
            <div class="marker-disc relative rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-blue-600 p-[2px] shadow-[0_0_22px_rgba(34,211,238,0.95)] flex items-center justify-center group-hover:scale-115 transition-transform duration-200">
              <div class="cluster-number grid place-items-center rounded-full bg-[#06111f] w-full h-full text-cyan-200 font-black tracking-tight">
                ${count}
              </div>
            </div>
          </div>

          <!-- Micro Pill Tag for Cluster on High Zoom or Hover -->
          <div class="marker-pill-label mt-1 whitespace-nowrap flex items-center gap-1 rounded-full bg-[#06111f]/95 border border-cyan-400/50 shadow-[0_4px_12px_rgba(0,0,0,0.7)] backdrop-blur-md pointer-events-none transition-all duration-200">
            <span class="marker-dot size-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,1)] animate-pulse shrink-0"></span>
            <span class="marker-title font-black uppercase tracking-wider text-cyan-300">${count} AIRPORTS</span>
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const b = new mapboxgl.LngLatBounds();
          cluster.items.forEach((it) => b.extend([it.lng, it.lat]));
          map.fitBounds(b, { padding: 90, maxZoom: 14.5, duration: 1000 });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(cluster.center)
          .addTo(map);

        airportMarkersRef.current.push(marker);
      } else {
        // Single Airport Marker
        const airport = cluster.items[0];
        const isCommercial = airport.type === "Commercial";
        const iataMatch = airport.name.match(/\(([A-Z]{3})\)/);
        const iata =
          airport.code ||
          (iataMatch ? iataMatch[1] : airport.name.split(" ")[0]);
        const carrier = iata ? AIRPORT_CARRIERS[iata] : "";

        let visualContent = "";
        if (isCommercial && carrier) {
          visualContent = `<img src="https://airlines-api.logostream.dev/airlines/iata/${carrier}?key=FREE-FC14E261-FC2E-4281-9248-3ECB35A13CEF" alt="${carrier}" class="w-full h-full rounded-full object-contain p-0.5 bg-[#06111f]" />`;
        } else if (isCommercial) {
          visualContent = `
            <svg class="marker-svg-icon text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.5 13.5l-8.5-5V2.5C13 1.67 12.33 1 11.5 1S10 1.67 10 2.5v6l-8.5 5c-.28.16-.5.47-.5.8v1.2c0 .41.38.72.78.63L10 14.5V19l-2.5 1.5v1.5l4-1 4 1v-1.5L13 19v-4.5l8.22 1.63c.4.09.78-.22.78-.63v-1.2c0-.33-.22-.64-.5-.8z"/>
            </svg>
          `;
        } else {
          visualContent = `
            <svg class="marker-svg-icon text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 15.5l-9-4V3c0-.83-.67-1.5-1.5-1.5S10 2.17 10 3v8.5l-9 4c-.55.25-.75.85-.5 1.35.18.36.54.58.94.55L10 16v4.5l-2.2 1.65c-.25.19-.36.51-.28.81.08.3.33.52.64.54l3.34-.67 3.34.67c.31-.02.56-.24.64-.54.08-.3-.03-.62-.28-.81L13 20.5V16l8.56 1.45c.4.03.76-.19.94-.55.25-.5.05-1.1-.5-1.4z"/>
            </svg>
          `;
        }

        const ringGrad = isCommercial
          ? "from-cyan-400 via-sky-400 to-blue-600 shadow-[0_0_16px_rgba(34,211,238,0.75)]"
          : "from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_18px_rgba(245,158,11,0.85)]";

        const tagBorder = isCommercial
          ? "border-cyan-400/50 text-cyan-200"
          : "border-amber-400/50 text-amber-200";
        const tagDot = isCommercial
          ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,1)]"
          : "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,1)]";

        const el = document.createElement("div");
        el.className =
          "airport-marker group flex flex-col items-center select-none cursor-pointer pointer-events-auto animate-fade-in";
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <!-- Outer Beacon Aura -->
            <div class="marker-beacon-ping absolute inset-0 rounded-full ${isCommercial ? "bg-cyan-400/25" : "bg-amber-400/25"} animate-ping" style="animation-duration: 3s;"></div>

            <!-- Disc Container -->
            <div class="marker-disc relative rounded-full bg-gradient-to-tr ${ringGrad} p-[2px] z-20 group-hover:scale-115 transition-transform duration-200 flex items-center justify-center">
              <div class="grid place-items-center rounded-full bg-[#06111f] w-full h-full overflow-hidden">
                ${visualContent}
              </div>
            </div>
          </div>

          <!-- Floating Holographic Airport Badge Under Icon -->
          <div class="marker-pill-label mt-1 whitespace-nowrap flex items-center gap-1 rounded-full bg-[#06111f]/95 border ${tagBorder} shadow-[0_4px_12px_rgba(0,0,0,0.7)] backdrop-blur-md pointer-events-none transition-all duration-200">
            <span class="marker-dot size-1.5 rounded-full ${tagDot} shrink-0"></span>
            <span class="marker-title font-black uppercase tracking-wider">${iata}</span>
            <span class="marker-sub-label font-bold text-slate-300 opacity-90 shrink-0">• ${isCommercial ? "Hub" : "Private"}</span>
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const baseLoc = userLocation || { lat: 33.6407, lng: -84.4277 };
          const distanceVal = getHaversineDistance(
            baseLoc.lat,
            baseLoc.lng,
            airport.lat,
            airport.lng,
          );
          const bearingVal = getCompassDirection(
            baseLoc.lat,
            baseLoc.lng,
            airport.lat,
            airport.lng,
          );

          setSelectedAirport({
            name: airport.name,
            type: airport.type,
            lat: airport.lat,
            lng: airport.lng,
            distance: `${distanceVal.toFixed(1)} miles`,
            bearing: bearingVal,
          });

          if (map) {
            const lineGeojson = {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [baseLoc.lng, baseLoc.lat],
                  [airport.lng, airport.lat],
                ],
              },
            };

            if (map.getSource("user-airport-line")) {
              (
                map.getSource("user-airport-line") as mapboxgl.GeoJSONSource
              ).setData(lineGeojson as any);
            } else {
              map.addSource("user-airport-line", {
                type: "geojson",
                data: lineGeojson as any,
              });

              map.addLayer({
                id: "user-airport-line",
                type: "line",
                source: "user-airport-line",
                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                },
                paint: {
                  "line-color": isCommercial ? "#22d3ee" : "#f59e0b",
                  "line-width": 4,
                  "line-dasharray": [2, 2],
                  "line-opacity": 0.85,
                },
              });
            }

            const fitBoundsObj = new mapboxgl.LngLatBounds();
            fitBoundsObj.extend([baseLoc.lng, baseLoc.lat]);
            fitBoundsObj.extend([airport.lng, airport.lat]);
            map.fitBounds(fitBoundsObj, {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              maxZoom: 11.5,
              duration: 1500,
            });
          }
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([airport.lng, airport.lat])
          .addTo(map);

        airportMarkersRef.current.push(marker);
      }
    });
  };

  const handleClearAirportRoute = () => {
    setSelectedAirport(null);
    activeAirportsRef.current = null;
    const map = mapRef.current;
    if (map) {
      if (map.getLayer("user-airport-line"))
        map.removeLayer("user-airport-line");
      if (map.getSource("user-airport-line"))
        map.removeSource("user-airport-line");
    }
    // Clear airport markers from the map completely
    airportMarkersRef.current.forEach((m) => {
      try {
        m.remove();
      } catch (e) {}
    });
    airportMarkersRef.current = [];
  };

  const handleViewAirports = async () => {
    if (!mapRef.current) return;

    // Clear existing destination marker if any
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    const refLoc =
      userLocation ||
      (mapRef.current
        ? {
            lat: mapRef.current.getCenter().lat,
            lng: mapRef.current.getCenter().lng,
          }
        : { lat: 33.749, lng: -84.388 });

    const candidateList: (AirportItem & { distance: number })[] = [];

    // 1. Fetch comprehensive local & regional aerodromes from Overpass API (municipal, regional, executive, private, and international airfields)
    try {
      const overpassQuery = `[out:json][timeout:5];(node["aeroway"~"aerodrome|airfield|airstrip"](around:100000,${refLoc.lat},${refLoc.lng});way["aeroway"~"aerodrome|airfield|airstrip"](around:100000,${refLoc.lat},${refLoc.lng}););out center 40;`;
      const overpassRes = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
        { signal: AbortSignal.timeout(4500) },
      );
      if (overpassRes.ok) {
        const overpassJson = await overpassRes.json();
        const elements = Array.isArray(overpassJson?.elements)
          ? overpassJson.elements
          : [];
        elements.forEach((el: any) => {
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (typeof lat !== "number" || typeof lng !== "number") return;
          const tags = el.tags || {};
          const name =
            tags.name ||
            tags["name:en"] ||
            tags.description ||
            tags["official_name"] ||
            "Regional Airfield";
          const code =
            tags.iata ||
            tags.icao ||
            tags.faa ||
            tags["ref"] ||
            (name.match(/\b([A-Z]{3,4})\b/)?.[1] ??
              name.slice(0, 3).toUpperCase());
          const isPrivate =
            tags.access === "private" ||
            tags["aerodrome:type"] === "private" ||
            tags["aerodrome:type"] === "military" ||
            name.toLowerCase().includes("executive") ||
            name.toLowerCase().includes("private") ||
            name.toLowerCase().includes("airstrip") ||
            name.toLowerCase().includes("airfield") ||
            name.toLowerCase().includes("club");

          const d = getHaversineDistance(refLoc.lat, refLoc.lng, lat, lng);
          candidateList.push({
            name: code && !name.includes(code) ? `${name} (${code})` : name,
            code: code.toUpperCase(),
            type: isPrivate ? "Private" : "Commercial",
            lat,
            lng,
            distance: d,
          });
        });
      }
    } catch (err) {
      console.warn("Overpass airport query:", err);
    }

    // 2. Query Mapbox Geocoding POI in parallel for nearby airports
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (token) {
      try {
        const mbRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/airport.json?access_token=${token}&limit=10&types=poi&proximity=${refLoc.lng},${refLoc.lat}&language=en`,
        );
        if (mbRes.ok) {
          const mbJson = await mbRes.json();
          const features = Array.isArray(mbJson?.features)
            ? mbJson.features
            : [];
          features.forEach((f: any) => {
            const [lng, lat] = f.center;
            const d = getHaversineDistance(refLoc.lat, refLoc.lng, lat, lng);
            const name = f.text || f.place_name?.split(",")[0] || "Airport";
            const iataMatch = (f.place_name || f.text || "").match(
              /\b([A-Z]{3})\b/,
            );
            const code = iataMatch
              ? iataMatch[1]
              : name.slice(0, 3).toUpperCase();
            const isPrivate =
              name.toLowerCase().includes("executive") ||
              name.toLowerCase().includes("private") ||
              name.toLowerCase().includes("airfield") ||
              name.toLowerCase().includes("airstrip") ||
              name.toLowerCase().includes("municipal");
            candidateList.push({
              name: f.place_name?.split(",").slice(0, 2).join(",") || name,
              code,
              type: isPrivate ? "Private" : "Commercial",
              lat,
              lng,
              distance: d,
            });
          });
        }
      } catch (err) {
        console.warn("Mapbox airport geocoding fetch error:", err);
      }
    }

    // 3. Add local/state dataset airports within range (250 miles)
    Object.values(STATE_AIRPORTS).forEach((list) => {
      list.forEach((item) => {
        const d = getHaversineDistance(
          refLoc.lat,
          refLoc.lng,
          item.lat,
          item.lng,
        );
        if (d < 250) {
          candidateList.push({
            ...item,
            distance: d,
          });
        }
      });
    });

    globalAirports.forEach((item) => {
      const [lng, lat] = item.coordinates;
      const d = getHaversineDistance(refLoc.lat, refLoc.lng, lat, lng);
      if (d < 250) {
        candidateList.push({
          name: `${item.airport} (${item.code})`,
          code: item.code,
          type: "Commercial",
          lat,
          lng,
          distance: d,
        });
      }
    });

    // 4. Sort strictly by proximity to user
    candidateList.sort((a, b) => a.distance - b.distance);

    // 5. Deduplicate (within 1.5 miles or duplicate code) and keep all nearby airports up to 35
    const uniqueAirports: AirportItem[] = [];
    for (const apt of candidateList) {
      if (uniqueAirports.length >= 35) break;
      const isDuplicate = uniqueAirports.some(
        (existing) =>
          (apt.code && apt.code.length >= 3 && existing.code === apt.code) ||
          getHaversineDistance(existing.lat, existing.lng, apt.lat, apt.lng) <
            1.5,
      );
      if (!isDuplicate) {
        uniqueAirports.push({
          name: apt.name,
          code: apt.code,
          type: apt.type,
          lat: apt.lat,
          lng: apt.lng,
        });
      }
    }

    const finalAirports =
      uniqueAirports.length > 0 ? uniqueAirports : candidateList.slice(0, 10);
    activeAirportsRef.current = finalAirports;
    renderAirportMarkers(finalAirports);

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([refLoc.lng, refLoc.lat]);
    finalAirports.forEach((airport) =>
      bounds.extend([airport.lng, airport.lat]),
    );

    // Fit map bounds smoothly to encompass all surrounding nearby airports
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 12.5,
        duration: 1500,
      });
    }
  };

  return (
    <section
      ref={panelRef}
      className={`glass-panel-heavy relative overflow-hidden rounded-[26px] shadow-[0_15px_35px_rgba(0,0,0,0.3)] w-full ${
        isFullscreen
          ? "h-screen rounded-none z-50 fixed inset-0"
          : "min-h-[300px] 2xl:min-h-[370px] h-full"
      }`}
    >
      {/* Dynamic Marker Zoom Scaling Styles */}
      <style>{`
        /* Smooth transitions for marker elements during zoom changes */
        .marker-disc, .marker-svg-icon, .marker-pill-label, .marker-title, .marker-sub-label, .marker-dot, .cluster-number {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Default: Hide icon titles/labels when zoomed out so ONLY the icon is displayed */
        .marker-pill-label {
          display: none !important;
        }

        /* Hover tooltip: Reveal title when hovering over any marker at any zoom */
        .group:hover > .marker-pill-label,
        .airport-marker:hover .marker-pill-label,
        .contact-marker:hover .marker-pill-label,
        .user-marker:hover .marker-pill-label,
        .destination-marker:hover .marker-pill-label {
          display: flex !important;
          animation: fadeIn 0.15s ease-out;
        }

        /* High Zoom (zoom >= 12.8: detailed view -> large crisp icons and titles) */
        [data-zoom="high"] .marker-pill-label {
          display: flex !important;
          padding: 3px 10px !important;
          margin-top: 5px !important;
        }
        [data-zoom="high"] .marker-disc {
          width: 52px !important;
          height: 52px !important;
        }
        [data-zoom="high"] .marker-svg-icon {
          width: 30px !important;
          height: 30px !important;
        }
        [data-zoom="high"] .marker-title {
          font-size: 10px !important;
        }
        [data-zoom="high"] .marker-sub-label {
          display: inline !important;
          font-size: 8.5px !important;
        }
        [data-zoom="high"] .marker-dot {
          width: 6px !important;
          height: 6px !important;
        }
        [data-zoom="high"] .cluster-number {
          font-size: 18px !important;
        }

        /* Mid Zoom (9.5 <= zoom < 12.8: prominent, spacious icons) */
        [data-zoom="mid"] .marker-disc {
          width: 44px !important;
          height: 44px !important;
        }
        [data-zoom="mid"] .marker-svg-icon {
          width: 25px !important;
          height: 25px !important;
        }
        [data-zoom="mid"] .cluster-number {
          font-size: 15px !important;
        }

        /* Low Zoom (6.0 <= zoom < 9.5: comfortable readable size) */
        [data-zoom="low"] .marker-disc {
          width: 36px !important;
          height: 36px !important;
        }
        [data-zoom="low"] .marker-svg-icon {
          width: 20px !important;
          height: 20px !important;
        }
        [data-zoom="low"] .marker-beacon-ping {
          display: none !important;
        }
        [data-zoom="low"] .cluster-number {
          font-size: 13px !important;
        }

        /* Ultra Low Zoom (zoom < 6.0: compact nationwide radar markers) */
        [data-zoom="ultra-low"] .marker-disc {
          width: 28px !important;
          height: 28px !important;
        }
        [data-zoom="ultra-low"] .marker-svg-icon {
          width: 15px !important;
          height: 15px !important;
        }
        [data-zoom="ultra-low"] .marker-beacon-ping {
          display: none !important;
        }
        [data-zoom="ultra-low"] .cluster-number {
          font-size: 11px !important;
        }

        /* Number Cluster Badge Styles */
        .cluster-marker {
          cursor: pointer;
        }
      `}</style>

      {/* Mapbox container div */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          filter: isDarkMode
            ? "none"
            : "sepia(1) saturate(0.9) hue-rotate(-10deg) brightness(0.7) contrast(1.3)",
        }}
      />

      {/* Floating Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <MapControls
          activePopup={activePopup}
          setActivePopup={setActivePopup}
          onStyleChange={handleStyleChange}
          currentStyle={mapStyle}
          onCenterOnMe={handleCenterOnMe}
          onFollowContact={handleFollowContact}
          onResetTilt={handleResetTilt}
          onSetDestination={handleSetDestination}
          onViewAirports={handleViewAirports}
          userLocation={userLocation}
          routeInfo={routeInfo}
          plottedDestination={plottedDestination}
          travelMode={travelMode}
          onlineStatus={onlineStatus}
          gpsEnabled={getGpsLocationState()}
          isLocating={isLocating}
        />

        {/* Live friends tracker card (Top-Right) */}
        {(() => {
          const onlineFriends = contactsList.filter(
            (c: Contact) =>
              !c.isOfficial &&
              (c.status === "Online" || c.status === "Typing..."),
          );
          const hasOnline = onlineFriends.length > 0;

          return (
            <div
              onClick={() => setIsLiveBoxExpanded(!isLiveBoxExpanded)}
              className="glass-panel-light pointer-events-auto absolute top-5 right-5 z-20 flex flex-col min-w-[200px] rounded-2xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.2)] select-none cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center gap-3.5 px-4 py-2">
                <span
                  className={`size-3 rounded-full ${
                    hasOnline
                      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse"
                      : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                  }`}
                />
                <div>
                  <div className="text-sm font-bold tracking-tight text-white leading-tight">
                    Live
                  </div>
                  <div className="text-[11px] font-medium text-slate-300">
                    {hasOnline
                      ? `${onlineFriends.length} friends online`
                      : "No friends online"}
                  </div>
                </div>
                {isLiveBoxExpanded ? (
                  <ChevronUp className="ml-auto text-slate-300" size={15} />
                ) : (
                  <ChevronDown className="ml-auto text-slate-300" size={15} />
                )}
              </div>

              <AnimatePresence>
                {isLiveBoxExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/10 bg-[#06111f]/80 backdrop-blur-md rounded-b-2xl"
                  >
                    <div className="px-4 py-2.5 flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {hasOnline ? (
                        onlineFriends.map((contact: Contact, idx: number) => {
                          const isMe = contact.id === "__self__";
                          return (
                            <div
                              key={`${contact.id}-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation(); // Avoid closing the panel
                                if (isMe) return;
                                if (onSelect) {
                                  onSelect(contact.id);
                                }
                              }}
                              className={`flex items-center gap-2.5 py-1 px-1.5 rounded-lg transition-colors duration-150 ${
                                isMe
                                  ? "cursor-default"
                                  : "cursor-pointer hover:bg-white/5"
                              }`}
                            >
                              <span
                                className={`size-2 rounded-full ${contact.accent || "bg-emerald-400"}`}
                              />
                              <span className="text-xs font-semibold text-slate-200 truncate">
                                {isMe ? "You (Noah Smith)" : contact.name}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-2 text-center text-xs text-slate-400 font-medium">
                          No active friends online
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Bottom map operations */}
        <div className="absolute bottom-5 right-5 flex items-center gap-2.5 pointer-events-auto z-30">
          <AnimatePresence>
            {plottedDestination && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={handleClearDestination}
                title="Clear plotted destination & reset radar route"
                className="glass-panel-light glass-sheen grid size-12 place-items-center rounded-2xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/40 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition active:scale-90 cursor-pointer"
              >
                <RotateCcw size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="glass-panel-light flex overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
            <button
              onClick={handleZoomOut}
              className="glass-sheen grid size-12 place-items-center text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-90 cursor-pointer"
            >
              <Minus size={20} />
            </button>
            <button
              onClick={handleZoomIn}
              className="glass-sheen grid size-12 place-items-center border-l border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-90 cursor-pointer"
            >
              <Plus size={20} />
            </button>
          </div>

          <button
            onClick={handleFullscreenToggle}
            className="glass-panel-light glass-sheen grid size-12 place-items-center rounded-2xl text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition active:scale-90 cursor-pointer"
          >
            <Expand size={18} />
          </button>
        </div>
        {/* Selected Destination Floating Info Card */}
        <AnimatePresence>
          {selectedDestination && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
              exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="glass-panel-heavy pointer-events-auto absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col w-[320px] md:w-[380px] border border-[#8b7357]/40 dark:border-rose-400/30 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-4 bg-[#efe6d3]/95 dark:bg-transparent text-[#2a1e12] dark:text-white backdrop-blur-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#5a4028] dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    🛰️ Radar Linked:{" "}
                    {selectedDestination.category ?? "Destination"}
                  </span>
                  <h4 className="text-sm font-black text-[#2a1e12] dark:text-white leading-snug mt-0.5 max-w-[240px] md:max-w-[280px]">
                    {selectedDestination.name}
                  </h4>
                  {selectedDestination.address && (
                    <span className="text-[9px] font-semibold text-[#6b5a45] dark:text-slate-400 mt-0.5 max-w-[240px] md:max-w-[280px] leading-tight">
                      📍 {selectedDestination.address}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition active:scale-90 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-black/10 dark:border-white/10 pt-2.5 mb-3.5">
                <div className="flex flex-col bg-[#3b2a1a]/5 dark:bg-white/5 border border-[#3b2a1a]/10 dark:border-white/5 rounded-xl p-2 px-3 text-center">
                  <span className="text-[9px] font-bold text-[#6b5a45] dark:text-slate-400 uppercase tracking-wider">
                    Radar Distance
                  </span>
                  <span className="text-sm font-black text-[#3b2a1a] dark:text-rose-300 mt-0.5">
                    {selectedDestination.distance ?? "—"}
                  </span>
                </div>
                <div className="flex flex-col bg-[#3b2a1a]/5 dark:bg-white/5 border border-[#3b2a1a]/10 dark:border-white/5 rounded-xl p-2 px-3 text-center">
                  <span className="text-[9px] font-bold text-[#6b5a45] dark:text-slate-400 uppercase tracking-wider">
                    Compass Bearing
                  </span>
                  <span className="text-sm font-black text-[#3b2a1a] dark:text-rose-300 mt-0.5">
                    {selectedDestination.bearing ?? "—"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBlackCarModalOpen(true)}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-[#5a4028] to-[#3b2a1a] dark:from-rose-500 dark:to-red-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-white uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
                >
                  Black Car
                </button>
                <button
                  onClick={() => {
                    try {
                      sessionStorage.setItem(
                        "charter_origin_context",
                        JSON.stringify({ dest: selectedDestination.name }),
                      );
                    } catch {}
                    window.location.href = "/travel/search/private?from=PDK";
                  }}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-white uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.25)] cursor-pointer whitespace-nowrap"
                >
                  ✈️ Charter
                </button>
                {[
                  "stadium",
                  "arena",
                  "theater",
                  "theatre",
                  "music venue",
                  "concert",
                  "amphitheater",
                ].some((k) =>
                  (selectedDestination.category || "")
                    .toLowerCase()
                    .includes(k),
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("flydna-open-seating-chart", {
                          detail: {
                            event: {
                              name: selectedDestination.name,
                              venue: selectedDestination.name,
                              city:
                                selectedDestination.address
                                  ?.split(",")?.[1]
                                  ?.trim() || "Atlanta",
                              category:
                                selectedDestination.category || "Live Event",
                            },
                          },
                        }),
                      );
                    }}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-slate-950 uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer whitespace-nowrap"
                  >
                    Get Tickets
                  </button>
                )}
                {["hotel", "resort", "inn", "suites", "lodging"].some((k) =>
                  (selectedDestination.category || "")
                    .toLowerCase()
                    .includes(k),
                ) && (
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("flydna-concierge-request", {
                          detail: {
                            venue: selectedDestination.name,
                            address: selectedDestination.address || "",
                            intent: "book a room",
                          },
                        }),
                      )
                    }
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-slate-950 uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer whitespace-nowrap"
                  >
                    Book a Room
                  </button>
                )}
                {["night club", "nightclub", "lounge", "nightlife"].some((k) =>
                  (selectedDestination.category || "")
                    .toLowerCase()
                    .includes(k),
                ) && (
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("flydna-concierge-request", {
                          detail: {
                            venue: selectedDestination.name,
                            address: selectedDestination.address || "",
                            intent: "reserve a VIP section",
                          },
                        }),
                      )
                    }
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-slate-950 uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer whitespace-nowrap"
                  >
                    Reserve Section
                  </button>
                )}
                {(() => {
                  const cat = (
                    selectedDestination.category || ""
                  ).toLowerCase();
                  const nm = (selectedDestination.name || "").toLowerCase();
                  const isFastFood =
                    [
                      "fast food",
                      "quick service",
                      "burger joint",
                      "chicken",
                      "fried chicken",
                      "hot dog",
                      "pizza delivery",
                    ].some((k) => cat.includes(k)) ||
                    [
                      "mcdonald",
                      "wendy",
                      "burger king",
                      "chick-fil-a",
                      "popeyes",
                      "taco bell",
                      "kfc",
                      "subway",
                      "chipotle",
                      "five guys",
                      "sonic",
                      "jack in the box",
                      "whataburger",
                      "wingstop",
                      "zaxby",
                      "panda express",
                      "raising cane",
                      "in-n-out",
                      "shake shack",
                      "arby",
                      "domino",
                      "papa john",
                      "pizza hut",
                      "little caesars",
                      "jersey mike",
                      "jimmy john",
                      "firehouse sub",
                      "checkers",
                      "rally",
                      "white castle",
                      "culver",
                      "del taco",
                      "church's chicken",
                      "bojangles",
                      "el pollo loco",
                      "cook out",
                      "krystal",
                      "waffle house",
                    ].some((k) => nm.includes(k));
                  return isFastFood;
                })() && (
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("flydna-concierge-request", {
                          detail: {
                            venue: selectedDestination.name,
                            address: selectedDestination.address || "",
                            intent: "place an order",
                          },
                        }),
                      )
                    }
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-slate-950 uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer whitespace-nowrap"
                  >
                    Place Order
                  </button>
                )}
                {(() => {
                  const cat = (
                    selectedDestination.category || ""
                  ).toLowerCase();
                  const nm = (selectedDestination.name || "").toLowerCase();
                  const isFastFood =
                    [
                      "fast food",
                      "quick service",
                      "burger joint",
                      "chicken",
                      "fried chicken",
                      "hot dog",
                      "pizza delivery",
                    ].some((k) => cat.includes(k)) ||
                    [
                      "mcdonald",
                      "wendy",
                      "burger king",
                      "chick-fil-a",
                      "popeyes",
                      "taco bell",
                      "kfc",
                      "subway",
                      "chipotle",
                      "five guys",
                      "sonic",
                      "jack in the box",
                      "whataburger",
                      "wingstop",
                      "zaxby",
                      "panda express",
                      "raising cane",
                      "in-n-out",
                      "shake shack",
                      "arby",
                      "domino",
                      "papa john",
                      "pizza hut",
                      "little caesars",
                      "jersey mike",
                      "jimmy john",
                      "firehouse sub",
                      "checkers",
                      "rally",
                      "white castle",
                      "culver",
                      "del taco",
                      "church's chicken",
                      "bojangles",
                      "el pollo loco",
                      "cook out",
                      "krystal",
                      "waffle house",
                    ].some((k) => nm.includes(k));
                  return !isFastFood;
                })() &&
                  [
                    "restaurant",
                    "steakhouse",
                    "pizzeria",
                    "diner",
                    "bbq",
                    "cafe",
                    "caf\u00e9",
                    "bakery",
                    "seafood",
                    "sushi",
                    "taco",
                    "wings",
                  ].some((k) =>
                    (selectedDestination.category || "")
                      .toLowerCase()
                      .includes(k),
                  ) && (
                    <button
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("flydna-concierge-request", {
                            detail: {
                              venue: selectedDestination.name,
                              address: selectedDestination.address || "",
                              intent: "reserve a table",
                            },
                          }),
                        )
                      }
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-slate-950 uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer whitespace-nowrap"
                    >
                      Reserve Table
                    </button>
                  )}
                {(selectedDestination.miles ?? 0) > 150 && (
                  <a
                    href="/travel/search/flight"
                    className="flex-1 py-2 px-3 border border-white/10 rounded-xl hover:bg-white/5 active:scale-95 transition text-xs font-black text-slate-300 uppercase tracking-wider text-center cursor-pointer"
                  >
                    Book Flight
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Selected Airport Floating Info Card */}
        <AnimatePresence>
          {selectedAirport && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
              exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
              className="glass-panel-heavy pointer-events-auto absolute bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col w-[320px] md:w-[380px] border border-amber-400/30 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-4 text-white backdrop-blur-md"
            >
              {/* Header */}

              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    🛰️ Radar Linked: {selectedAirport?.type || "Airport"}
                  </span>
                  <h4 className="text-sm font-black text-[#2a1e12] dark:text-white leading-snug mt-0.5 max-w-[240px] md:max-w-[280px]">
                    {selectedAirport?.name || "Target Airport"}
                  </h4>
                </div>
                <button
                  onClick={handleClearAirportRoute}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition active:scale-90 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 border-t border-black/10 dark:border-white/10 pt-2.5 mb-3.5">
                <div className="flex flex-col bg-[#3b2a1a]/5 dark:bg-white/5 border border-[#3b2a1a]/10 dark:border-white/5 rounded-xl p-2 px-3 text-center">
                  <span className="text-[9px] font-bold text-[#6b5a45] dark:text-slate-400 uppercase tracking-wider">
                    Radar Distance
                  </span>
                  <span className="text-sm font-black text-amber-300 mt-0.5">
                    {selectedAirport?.distance || "Direct"}
                  </span>
                </div>
                <div className="flex flex-col bg-[#3b2a1a]/5 dark:bg-white/5 border border-[#3b2a1a]/10 dark:border-white/5 rounded-xl p-2 px-3 text-center">
                  <span className="text-[9px] font-bold text-[#6b5a45] dark:text-slate-400 uppercase tracking-wider">
                    Compass Bearing
                  </span>
                  <span className="text-sm font-black text-amber-300 mt-0.5">
                    {selectedAirport?.bearing || "0° N"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBlackCarModalOpen(true)}
                  className="flex-1 py-2 px-3 border border-white/10 rounded-xl hover:bg-white/5 active:scale-95 transition text-xs font-black text-slate-300 uppercase tracking-wider text-center cursor-pointer"
                >
                  Black Car
                </button>
                <a
                  href={(() => {
                    const match = (selectedAirport?.name || "").match(
                      /\(([A-Z0-9]{3,4})\)/,
                    );
                    const basePath =
                      selectedAirport?.type === "Commercial"
                        ? "/travel/search/flight"
                        : "/travel/search/private";
                    return match ? `${basePath}?from=${match[1]}` : basePath;
                  })()}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 active:scale-95 transition text-xs font-black text-slate-950 uppercase tracking-wider text-center rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer flex items-center justify-center gap-1 truncate"
                >
                  {selectedAirport?.type === "Commercial"
                    ? "Book Flight"
                    : "Book Jet Charter"}
                </a>
                <button
                  onClick={() => {
                    const text = `✈️ FlyDnA Trip Share: ${selectedAirport?.name || "Target Airport"} (${selectedAirport?.type || "Commercial"} Airport - ${selectedAirport?.distance || "Direct"})`;
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator
                        .share({
                          title: "FlyDnA Trip Share",
                          text,
                          url: window.location.href,
                        })
                        .catch(() => {});
                    } else if (typeof navigator !== "undefined") {
                      navigator.clipboard.writeText(text);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("flydna-new-notification", {
                            detail: {
                              message: "✈️ Trip details copied to clipboard!",
                            },
                          }),
                        );
                      }
                    }
                  }}
                  className="p-2.5 border border-cyan-400/30 bg-cyan-500/10 rounded-xl hover:bg-cyan-500/20 active:scale-95 transition text-cyan-300 flex items-center justify-center cursor-pointer shrink-0"
                  title="Share Trip"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BlackCarModal
          isOpen={isBlackCarModalOpen}
          onClose={() => setIsBlackCarModalOpen(false)}
          destinationName={
            selectedDestination?.name ||
            selectedAirport?.name ||
            "State Farm Arena"
          }
          destinationAddress={
            selectedDestination?.address ||
            selectedAirport?.name ||
            "State Farm Arena, Downtown Atlanta, GA"
          }
          distanceMiles={
            selectedDestination?.distance ||
            selectedAirport?.distance ||
            "29.9 miles"
          }
        />
      </div>
    </section>
  );
}

type MapControlsProps = {
  activePopup: "navigation" | "layers" | null;
  setActivePopup: (popup: "navigation" | "layers" | null) => void;
  onStyleChange: (style: "blueprint" | "satellite") => void;
  currentStyle: "blueprint" | "satellite";
  onCenterOnMe: () => void;
  onFollowContact: () => void;
  onResetTilt: () => void;
  onSetDestination: (
    lat: number,
    lng: number,
    name: string,
    icon?: string | null,
    category?: string | null,
    address?: string | null,
  ) => void;
  onViewAirports: () => void;
  userLocation: { lat: number; lng: number } | null;
  routeInfo: { distance: string; duration: string } | null;
  plottedDestination: { lat: number; lng: number } | null;
  travelMode: "walking" | "driving" | "flying";
  onlineStatus: boolean;
  gpsEnabled: boolean;
  isLocating?: boolean;
};

const POPULAR_DESTINATIONS = [
  {
    name: "ATL Airport",
    query: "Hartsfield-Jackson Atlanta International Airport",
    icon: Plane,
  },
  {
    name: "State Farm Arena",
    query: "State Farm Arena Atlanta",
    icon: Landmark,
  },
  {
    name: "Mercedes-Benz Stadium",
    query: "Mercedes-Benz Stadium Atlanta",
    icon: Building2,
  },
  {
    name: "Buckhead Village",
    query: "Buckhead Village District Atlanta",
    icon: Building2,
  },
  { name: "Piedmont Park", query: "Piedmont Park Atlanta", icon: Trees },
];

function MapControls({
  activePopup,
  setActivePopup,
  onStyleChange,
  currentStyle,
  onCenterOnMe,
  onFollowContact,
  onResetTilt,
  onSetDestination,
  onViewAirports,
  userLocation,
  routeInfo,
  plottedDestination,
  travelMode,
  onlineStatus,
  gpsEnabled,
  isLocating = false,
}: MapControlsProps) {
  // Auto-collapse the nav card the moment a destination pin lands
  const prevPlotRef = useRef<string | null>(null);
  useEffect(() => {
    const key = plottedDestination
      ? `${plottedDestination.lat},${plottedDestination.lng}`
      : null;
    if (key && key !== prevPlotRef.current) {
      setActivePopup(null);
    }
    prevPlotRef.current = key;
  }, [plottedDestination]);

  const [destinationInput, setDestinationInput] = useState("");
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [destError, setDestError] = useState<string | null>(null);
  const [venueResults, setVenueResults] = useState<any[]>([]);

  useEffect(() => {
    if (activePopup !== "navigation") {
      setDestinationInput("");
      setDestError(null);
      setVenueResults([]);
    }
  }, [activePopup]);

  const handleSearchVenue = async (queryText?: string) => {
    const query = (
      queryText !== undefined ? queryText : destinationInput
    ).trim();
    if (!query) return;
    if (queryText !== undefined) {
      setDestinationInput(queryText);
    }
    setIsSearchingDest(true);
    setDestError(null);
    setVenueResults([]);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const locBias = userLocation
        ? `&lat=${userLocation.lat}&lng=${userLocation.lng}`
        : "";
      let plotted = false;

      // 1. Try backend venue search (Foursquare)
      try {
        const vres = await fetch(
          `${apiBase}/api/v1/venues/search?q=${encodeURIComponent(query)}${locBias}`,
        );
        if (vres.ok) {
          const vjson = await vres.json();
          const list = (Array.isArray(vjson?.data) ? vjson.data : []).filter(
            (x: any) => typeof x.lat === "number" && typeof x.lng === "number",
          );
          if (list.length >= 2) {
            setVenueResults(list);
            plotted = true;
          } else if (list.length === 1) {
            const v = list[0];
            onSetDestination(
              v.lat,
              v.lng,
              v.name || query,
              v.icon || null,
              v.category || null,
              v.address || null,
            );
            plotted = true;
          }
        }
      } catch {}

      // 2. Fall back to Mapbox Geocoding API
      if (!plotted) {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (token) {
          const refLoc = userLocation || {
            lat: 33.749,
            lng: -84.388,
          };
          const proximity = `&proximity=${refLoc.lng},${refLoc.lat}`;
          const mbRes = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=10&types=poi,address,place${proximity}&language=en`,
          );
          const mbJson = await mbRes.json();
          const features = Array.isArray(mbJson?.features)
            ? mbJson.features
            : [];
          if (features.length >= 2) {
            const list = features.map((f: any) => {
              const [lng, lat] = f.center;
              const category =
                f.properties?.category || f.place_type?.[0] || "Place";
              const distM = Math.round(
                Math.sqrt(
                  Math.pow((lat - refLoc.lat) * 111320, 2) +
                    Math.pow(
                      (lng - refLoc.lng) *
                        111320 *
                        Math.cos((refLoc.lat * Math.PI) / 180),
                      2,
                    ),
                ),
              );
              return {
                lat,
                lng,
                name: f.text || f.place_name?.split(",")[0] || query,
                category,
                address: f.place_name || null,
                distance: distM,
                icon: null,
              };
            });
            list.sort(
              (a: any, b: any) =>
                (a.distance ?? 999999) - (b.distance ?? 999999),
            );
            setVenueResults(list);
            plotted = true;
          } else if (features.length === 1) {
            const f = features[0];
            const [lng, lat] = f.center;
            onSetDestination(
              lat,
              lng,
              f.text || query,
              null,
              f.place_type?.[0] || null,
              f.place_name || null,
            );
            plotted = true;
          }
        }
      }

      if (!plotted) {
        setDestError("No locations found near your area.");
      }
    } catch {
      setDestError("Error locating address. Check internet connection.");
    } finally {
      setIsSearchingDest(false);
    }
  };

  const controls = [
    {
      id: "navigation" as const,
      icon: Navigation2,
      title: "Navigation & Telemetry",
    },
    {
      id: "crosshair" as const,
      icon: Crosshair,
      title: "Live GPS Tracking",
    },
    {
      id: "layers" as const,
      icon: Layers,
      title: "Radar Map Layers",
      options: [
        { label: "Satellite Hybrid", action: () => onStyleChange("satellite") },
        { label: "Vector Blueprint", action: () => onStyleChange("blueprint") },
      ],
    },
  ];

  const hasRightColumn = Boolean(venueResults.length > 0 || routeInfo);

  return (
    <>
      {activePopup && (
        <div
          className="fixed inset-0 z-20 pointer-events-auto"
          onClick={() => setActivePopup(null)}
        />
      )}
      <div className="absolute left-5 top-5 z-30 flex flex-col gap-3 pointer-events-auto">
        {controls.map((item) => {
          const Icon = item.icon;
          const isOpen = item.id !== "crosshair" && activePopup === item.id;
          const isNav = item.id === "navigation";

          return (
            <div key={item.id} className="relative">
              {/* Trigger Button */}
              <button
                onClick={() => {
                  if (item.id === "crosshair") {
                    onCenterOnMe();
                    setActivePopup(null);
                  } else {
                    setActivePopup(isOpen ? null : item.id);
                  }
                }}
                disabled={item.id === "crosshair" && isLocating}
                className={`glass-panel-light glass-sheen size-14 grid place-items-center rounded-2xl text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition active:scale-90 cursor-pointer relative z-30 ${
                  isOpen
                    ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    : ""
                } ${item.id === "crosshair" && isLocating ? "opacity-80 cursor-wait" : ""}`}
                title={
                  item.id === "crosshair" && isLocating
                    ? "Acquiring live location..."
                    : item.title
                }
              >
                {item.id === "crosshair" && isLocating ? (
                  <Loader2 size={20} className="animate-spin text-cyan-400" />
                ) : isOpen ? (
                  <X size={20} />
                ) : (
                  <Icon size={20} />
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.96, x: -8 }}
                    transition={{ type: "spring", stiffness: 440, damping: 32 }}
                    style={{
                      transformOrigin: "top left",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                    className={`absolute left-16 top-0 flex flex-col sm:flex-row gap-2.5 z-30 pointer-events-auto max-w-[calc(100vw-5.5rem)] scrollbar-none [&::-webkit-scrollbar]:hidden`}
                  >
                    {/* Primary Left Column: Search & Quick Targets */}
                    <div
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                      className={`${
                        isNav
                          ? "w-[270px] sm:w-[290px] max-h-[calc(100vh-8rem)] sm:max-h-[420px]"
                          : "w-[230px] max-h-[320px]"
                      } overflow-y-auto overflow-x-hidden flex flex-col glass-panel-heavy border border-cyan-400/30 bg-[#06111f]/96 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.15)] rounded-2xl p-3.5 text-white scrollbar-none [&::-webkit-scrollbar]:hidden`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-lg bg-cyan-500/10 border border-cyan-400/30 grid place-items-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                            <Icon size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-xs tracking-wide text-white uppercase flex items-center gap-1.5">
                              {isNav ? "Navigation" : item.title}
                              <span className="inline-block size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            </span>
                            {isNav && (
                              <span className="text-[9px] text-cyan-400/70 font-semibold tracking-wider">
                                RADAR SEARCH
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setActivePopup(null)}
                          className="size-6 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center transition cursor-pointer border border-white/5"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* Content */}
                      <div
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                        className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden"
                      >
                        {isNav ? (
                          <div className="flex flex-col gap-2.5 text-left">
                            {/* Search Input Container */}
                            <div className="flex flex-col gap-2">
                              <div className="relative flex items-center">
                                <Search
                                  size={14}
                                  className="absolute left-3 text-cyan-400 pointer-events-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Search venue, airport..."
                                  value={destinationInput}
                                  onChange={(e) => {
                                    setDestinationInput(e.target.value);
                                    setDestError(null);
                                    if (!e.target.value) setVenueResults([]);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSearchVenue();
                                    }
                                  }}
                                  className="w-full bg-[#0a182c]/80 border border-cyan-500/30 hover:border-cyan-400/60 focus:border-cyan-400 rounded-xl pl-8 pr-7 py-2 text-xs text-white outline-none placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition"
                                />
                                {destinationInput && (
                                  <button
                                    onClick={() => {
                                      setDestinationInput("");
                                      setVenueResults([]);
                                      setDestError(null);
                                    }}
                                    className="absolute right-2 size-4 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-slate-300 hover:text-white transition cursor-pointer"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>

                              {/* Error message */}
                              {destError && (
                                <div className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-semibold flex items-center gap-1">
                                  <span>{destError}</span>
                                </div>
                              )}

                              {/* Action Plot Button */}
                              <button
                                onClick={() => handleSearchVenue()}
                                disabled={
                                  isSearchingDest || !destinationInput.trim()
                                }
                                className="w-full py-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 via-cyan-400/30 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400 text-cyan-200 hover:text-white active:scale-[0.98] transition font-black text-[11px] uppercase tracking-wider text-center cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                {isSearchingDest ? (
                                  <>
                                    <Loader2
                                      size={13}
                                      className="animate-spin text-cyan-400"
                                    />
                                    <span>Scanning...</span>
                                  </>
                                ) : (
                                  <>
                                    <Navigation2
                                      size={13}
                                      className="fill-current"
                                    />
                                    <span>Plot on Map</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Popular Hubs & State Airports Chips */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                <TrendingUp
                                  size={10}
                                  className="text-cyan-400"
                                />
                                Quick Targets:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                <button
                                  onClick={() => {
                                    onViewAirports();
                                    setActivePopup(null);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 text-cyan-300 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <Plane size={11} className="text-cyan-400" />
                                  <span>Nearby Airports</span>
                                </button>
                                {POPULAR_DESTINATIONS.map((pop, popIdx) => {
                                  const PopIcon = pop.icon;
                                  return (
                                    <button
                                      key={popIdx}
                                      onClick={() =>
                                        handleSearchVenue(pop.query)
                                      }
                                      className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-slate-300 hover:text-white transition text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                                    >
                                      <PopIcon
                                        size={11}
                                        className="text-cyan-400"
                                      />
                                      <span>{pop.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          item.options?.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => {
                                opt.action();
                                setActivePopup(null);
                              }}
                              className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                                (opt.label === "Satellite Hybrid" &&
                                  currentStyle === "satellite") ||
                                (opt.label === "Vector Blueprint" &&
                                  currentStyle === "blueprint")
                                  ? "text-cyan-300 bg-cyan-500/15 border border-cyan-400/30"
                                  : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {((opt.label === "Satellite Hybrid" &&
                                currentStyle === "satellite") ||
                                (opt.label === "Vector Blueprint" &&
                                  currentStyle === "blueprint")) && (
                                <Check size={13} className="text-cyan-400" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Secondary Right Column: Search Results & Live Route Telemetry */}
                    <AnimatePresence>
                      {hasRightColumn && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -10, scale: 0.96 }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 30,
                          }}
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                          className="w-[270px] sm:w-[300px] max-h-[calc(100vh-8rem)] sm:max-h-[420px] overflow-y-auto flex flex-col glass-panel-heavy border border-cyan-400/30 bg-[#06111f]/96 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.15)] rounded-2xl p-3 text-white scrollbar-none [&::-webkit-scrollbar]:hidden"
                        >
                          {/* Search Results in Right Column */}
                          {venueResults.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                                  <MapPin size={12} />
                                  Locations ({venueResults.length})
                                </span>
                                <button
                                  onClick={() => setVenueResults([])}
                                  className="size-5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center transition cursor-pointer"
                                  title="Dismiss results"
                                >
                                  <X size={11} />
                                </button>
                              </div>

                              <div
                                style={{
                                  scrollbarWidth: "none",
                                  msOverflowStyle: "none",
                                }}
                                className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden"
                              >
                                {venueResults.map((v: any) => (
                                  <button
                                    key={v.fsqId || v.name + v.lat}
                                    onClick={() => {
                                      onSetDestination(
                                        v.lat,
                                        v.lng,
                                        v.name,
                                        v.icon || null,
                                        v.category || null,
                                        v.address || null,
                                      );
                                      setVenueResults([]);
                                      setDestinationInput("");
                                    }}
                                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0b1b30]/80 border border-white/10 hover:border-cyan-400 hover:bg-cyan-500/15 transition text-left cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="size-6 rounded-md bg-cyan-500/10 border border-cyan-400/20 grid place-items-center shrink-0">
                                        {v.icon ? (
                                          <img
                                            src={v.icon}
                                            alt=""
                                            className="w-3.5 h-3.5 rounded shrink-0"
                                          />
                                        ) : (
                                          <MapPin
                                            size={12}
                                            className="text-cyan-400"
                                          />
                                        )}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold text-white group-hover:text-cyan-200 truncate">
                                          {v.name}
                                        </span>
                                        <span className="text-[8px] text-slate-400 truncate">
                                          {v.category || "Target"}
                                          {v.address ? ` • ${v.address}` : ""}
                                        </span>
                                      </div>
                                    </div>
                                    {typeof v.distance === "number" && (
                                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-[8px] font-black text-cyan-300">
                                        {(v.distance * 0.000621371).toFixed(1)}{" "}
                                        mi
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Active Route Telemetry in Right Column */}
                          {routeInfo && (
                            <div className="flex flex-col gap-2 mt-1 border-t border-white/10 pt-2 text-left">
                              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                                  <Route size={12} className="text-cyan-400" />
                                  Active Route Telemetry
                                </span>
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 tracking-wider">
                                  {travelMode}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-0.5">
                                <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                                  <div className="text-[8px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                    <Milestone size={10} />
                                    Distance
                                  </div>
                                  <div className="text-xs font-black text-white mt-0.5">
                                    {routeInfo.distance}
                                  </div>
                                </div>
                                <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                                  <div className="text-[8px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                    <Clock size={10} />
                                    Est. Time
                                  </div>
                                  <div className="text-xs font-black text-cyan-300 mt-0.5">
                                    {routeInfo.duration}
                                  </div>
                                </div>
                              </div>

                              {/* Deep-link GPS Launchers */}
                              <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                                <a
                                  href={
                                    userLocation && plottedDestination
                                      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${plottedDestination.lat},${plottedDestination.lng}`
                                      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationInput || "Atlanta, GA")}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="py-1.5 px-1 text-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 text-emerald-300 font-bold text-[10px] tracking-tight transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink size={11} />
                                  <span>Google Maps</span>
                                </a>
                                <a
                                  href={
                                    plottedDestination
                                      ? `https://waze.com/ul?ll=${plottedDestination.lat},${plottedDestination.lng}&navigate=yes`
                                      : `https://waze.com/ul?q=${encodeURIComponent(destinationInput || "Atlanta, GA")}&navigate=yes`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="py-1.5 px-1 text-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-300 font-bold text-[10px] tracking-tight transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink size={11} />
                                  <span>Waze GPS</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
}
