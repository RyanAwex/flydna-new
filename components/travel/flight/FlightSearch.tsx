"use client";

import { ChevronDown, MapPin, PlaneLanding, PlaneTakeoff } from "lucide-react";
import React, { useState } from "react";
import { FlightRoute, flights, FilterItem } from "@/utils/mock-data/flights";
import { useSearchStore } from "@/utils/states/useSearchStore";
import Image from "next/image";
import Link from "next/link";

const mapDuffelOfferToUI = (offer: any): any => {
  const outboundSlice = offer.slices?.[0];
  const returnSlice = offer.slices?.[1];

  const mapSlice = (slice: any) => {
    if (!slice) return null;
    const firstSegment = slice.segments?.[0];
    const lastSegment = slice.segments?.[slice.segments.length - 1];

    const logo =
      firstSegment?.operating_carrier?.logo_symbol_url ||
      "/assets/airlines/fallback.png";
    const name = firstSegment?.operating_carrier?.name || "Airline";

    const formatTime = (isoString: string) => {
      if (!isoString) return "";
      try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "";
      }
    };

    const parseDuration = (isoDuration: string) => {
      if (!isoDuration) return "";
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (!match) return isoDuration;
      const hours = match[1] ? `${match[1]}h` : "";
      const minutes = match[2] ? ` ${match[2]}m` : "";
      return `${hours}${minutes}`.trim();
    };

    const stops =
      slice.segments.length === 1
        ? "Direct"
        : slice.segments.length === 2
          ? "1 Stop"
          : `${slice.segments.length - 1} Stops`;

    return {
      logo,
      name,
      dep: formatTime(firstSegment?.departing_at),
      depCode: firstSegment?.origin?.iata_code || "",
      arr: formatTime(lastSegment?.arriving_at),
      arrCode: lastSegment?.destination?.iata_code || "",
      dur: parseDuration(slice.duration || firstSegment?.duration),
      stops,
    };
  };

  const outbound = mapSlice(outboundSlice);
  const returnRoute = mapSlice(returnSlice);

  const cabinClass = outboundSlice?.segments?.[0]?.cabin_class || "economy";
  const formattedClass =
    cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1).replace("_", " ");

  return {
    id: offer.id,
    tag: offer.total_amount < 500 ? "Cheapest" : "Best",
    price: Math.round(parseFloat(offer.total_amount)),
    class: formattedClass,
    isDetails: true,
    outbound,
    return: returnRoute,
    amenities: ["Wifi", "Power Outlet", "Food Available"],
    info: {
      Baggage: offer.passenger_identity_documents_required
        ? "Passport Required"
        : "No Passport Required",
      Cabin: formattedClass,
      CheckIn: "Online Check-in",
    },
    rawOffer: offer,
  };
};

// --- Components ---
const FilterSection = ({
  title,
  items,
  isOpen,
  onToggle,
  children,
}: {
  title?: string;
  items?: FilterItem[];
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) => (
  <div className="mb-6">
    {title && (
      <h3
        onClick={onToggle}
        className="text-base font-semibold mb-3 flex justify-between items-center text-[var(--text-main)] cursor-pointer select-none hover:text-[var(--text-main)] transition-colors"
      >
        {title}
        <span
          className={`text-[var(--text-muted)] transition-transform duration-300 `}
        >
          <ChevronDown className={`${isOpen ? "rotate-180" : "rotate-0"}`} />
        </span>
      </h3>
    )}
    <div
      className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
    >
      {children
        ? children
        : items?.map((item, i) => (
            <label
              key={i}
              className="flex items-center justify-between text-sm text-[var(--text-muted)] cursor-pointer group"
            >
              <span className="flex items-center gap-2 group-hover:text-[var(--text-main)] transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="w-4 h-4 bg-[var(--surface-color)] border-[var(--glass-border)] rounded-sm accent-[var(--accent-primary)] cursor-pointer"
                />
                {item.label}
              </span>
              <span className="text-xs opacity-80 group-hover:text-[var(--text-main)] transition-colors">
                {item.value}
              </span>
            </label>
          ))}
    </div>
  </div>
);

const PriceSlider = () => {
  const steps = 10;
  const getPrice = (idx: number) => 100 + idx * 200;

  const [minIdx, setMinIdx] = useState(0);
  const [maxIdx, setMaxIdx] = useState(steps - 1);

  const minPercent = (minIdx / (steps - 1)) * 100;
  const maxPercent = (maxIdx / (steps - 1)) * 100;

  return (
    <div className="mb-5 px-1">
      <div className="flex justify-between text-xs text-[var(--text-muted)] mb-4 font-semibold">
        <span>Min Range</span>
        <span>Max Range</span>
      </div>

      <div className="flex justify-between text-sm font-bold mb-5 text-[var(--text-main)]">
        <span>${getPrice(minIdx)}</span>
        <span>${getPrice(maxIdx)}</span>
      </div>

      <div className="flex justify-between gap-1 mb-4">
        {Array.from({ length: steps }).map((_, i) => {
          const inRange = i >= minIdx && i <= maxIdx;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-300 ${
                inRange
                  ? "bg-[var(--accent-primary)] shadow-[var(--glow-primary)] h-6"
                  : "bg-[var(--surface-color)]/70 h-4"
              }`}
            ></div>
          );
        })}
      </div>

      {/* Track Line & Thumbs */}
      <div className="relative h-1 bg-[var(--surface-color)] rounded-full">
        {/* Active Track */}
        <div
          className="absolute h-full bg-[var(--accent-primary)] rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        ></div>

        {/* Sliders */}
        <input
          type="range"
          min="0"
          max={steps - 1}
          value={minIdx}
          onChange={(e) =>
            setMinIdx(Math.min(Number(e.target.value), maxIdx - 1))
          }
          className="absolute w-full -top-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--surface-color)]/95 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--accent-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab z-20"
        />
        <input
          type="range"
          min="0"
          max={steps - 1}
          value={maxIdx}
          onChange={(e) =>
            setMaxIdx(Math.max(Number(e.target.value), minIdx + 1))
          }
          className="absolute w-full -top-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--surface-color)]/95 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--accent-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab z-20"
        />
      </div>

      {/* Moving Price Labels */}
      <div className="relative w-full h-6 mt-4">
        <div
          className="absolute text-sm text-[var(--text-main)] transition-all duration-100"
          style={{
            left: `${minPercent}%`,
            transform: `translateX(-${minPercent}%)`,
          }}
        >
          ${getPrice(minIdx)}
        </div>
        <div
          className="absolute text-sm text-[var(--text-main)] transition-all duration-100"
          style={{
            left: `${maxPercent}%`,
            transform: `translateX(-${maxPercent}%)`,
          }}
        >
          ${getPrice(maxIdx)}
        </div>
      </div>
    </div>
  );
};

const TimeSlider = ({ label }: { label: string }) => {
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(24);

  const formatTime = (val: number) => {
    if (val === 24) return "11:59 pm";
    const ampm = val >= 12 ? "pm" : "am";
    const hour = val % 12 || 12;
    return `${hour}:00 ${ampm}`;
  };

  return (
    <div className="mb-5">
      <p className="text-sm text-[var(--text-muted)] mb-2">{label}</p>
      <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2">
        <span>{formatTime(minVal)}</span>
        <span>{formatTime(maxVal)}</span>
      </div>
      <div className="relative h-1.5 bg-gray-600 rounded-full flex items-center">
        <div
          className="absolute h-full bg-[var(--accent-primary)] rounded-full"
          style={{
            left: `${(minVal / 24) * 100}%`,
            width: `${((maxVal - minVal) / 24) * 100}%`,
          }}
        ></div>
        <input
          type="range"
          min="0"
          max="24"
          value={minVal}
          onChange={(e) =>
            setMinVal(Math.min(Number(e.target.value), maxVal - 1))
          }
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-[var(--surface-color)]/95 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab"
        />
        <input
          type="range"
          min="0"
          max="24"
          value={maxVal}
          onChange={(e) =>
            setMaxVal(Math.max(Number(e.target.value), minVal + 1))
          }
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-[var(--surface-color)]/95 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab"
        />
      </div>
    </div>
  );
};

const FlightRow = ({
  flight,
  isReturn = false,
}: {
  flight: FlightRoute;
  isReturn?: boolean;
}) => (
  <div className="flex flex-wrap md:flex-nowrap items-center justify-between py-2 pr-5 gap-y-4">
    <div className="flex flex-col justify-center items-center gap-3 w-1/2 md:w-[20%]">
      <Image
        alt="flight logo"
        src={flight.logo}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--text-main)] shrink-0 shadow-lg`}
        width={48}
        height={48}
        priority
      />
      <span className="font-semibold text-sm text-[var(--text-main)] truncate text-center">
        {flight.name}
      </span>
    </div>
    <div className="text-right w-1/2 md:w-[20%]">
      <p className="font-medium text-base text-[var(--text-main)]">
        {flight.dep}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{flight.depCode}</p>
    </div>
    <div className="flex flex-col items-center w-full md:w-[60%] px-4 order-last md:order-none">
      <p className="text-[12px] font-semibold text-[var(--text-main)] mb-1">
        {flight.dur}
      </p>
      <div className="w-full flex items-center">
        <span className="text-[var(--text-muted)] text-[10px]">
          {isReturn ? (
            <MapPin className="w-4 h-4 text-[var(--text-main)]" />
          ) : (
            <PlaneTakeoff className="w-4 h-4 text-[var(--text-main)]" />
          )}
        </span>
        <div className="w-full border-t border-dashed border-[var(--glass-border)] mx-1"></div>
        <span className="text-[var(--text-muted)] text-[10px]">
          {isReturn ? (
            <PlaneLanding className="w-4 h-4 text-[var(--text-main)]" />
          ) : (
            <MapPin className="w-4 h-4 text-[var(--text-main)]" />
          )}
        </span>
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">
        {flight.stops}
      </p>
    </div>
    <div className="text-left w-1/2 md:w-[20%] pl-0 md:pl-2">
      <p className="font-medium text-base text-[var(--text-main)]">
        {flight.arr}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{flight.arrCode}</p>
    </div>
  </div>
);

export default function InteractiveFlightSearch() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    stop: true,
    price: true,
    baggage: true,
    airlines: true,
    times: true,
    cabin: true,
    airports: true,
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpenSections({
          stop: false,
          price: false,
          baggage: false,
          airlines: false,
          times: false,
          cabin: false,
          airports: false,
        });
      } else {
        setOpenSections({
          stop: true,
          price: true,
          baggage: true,
          airlines: true,
          times: true,
          cabin: true,
          airports: true,
        });
      }
    };

    // Set initial state on mount
    handleResize();

    // Add listener for live resizing
    window.addEventListener("resize", handleResize);

    // Cleanup listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = (sec: string) =>
    setOpenSections((p) => ({ ...p, [sec]: !p[sec] }));

  const { offers, isSearching, searchError, setSelectedOffer } =
    useSearchStore();

  const [activeSort, setActiveSort] = useState("Cheapest");

  const dedupeOffers = (offs: any[]) => {
    const seen = new Map();
    for (const o of offs) {
      const seg = o.slices?.[0]?.segments?.[0];
      const key = [seg?.marketing_carrier?.iata_code, seg?.marketing_carrier_flight_number, seg?.departing_at, o.slices?.[0]?.segments?.length].join("|");
      const prev = seen.get(key);
      if (!prev || Number(o.total_amount) < Number(prev.total_amount)) seen.set(key, o);
    }
    return Array.from(seen.values());
  };
  const displayFlights =
    offers.length > 0 ? dedupeOffers(offers).map(mapDuffelOfferToUI) : flights;

  const sortOptions = [
    {
      name: "Cheapest",
      price:
        displayFlights.length > 0
          ? `$${Math.min(...displayFlights.map((f) => f.price))}`
          : "$400",
    },
    {
      name: "Best",
      price:
        displayFlights.length > 0
          ? `$${Math.round(displayFlights.reduce((acc, f) => acc + f.price, 0) / displayFlights.length)}`
          : "$500",
    },
    {
      name: "Quickest",
      price:
        displayFlights.length > 0
          ? `$${Math.max(...displayFlights.map((f) => f.price))}`
          : "$600",
    },
  ];

  const handleSortClick = (name: string) => {
    setActiveSort(name);
  };

  const [recentSearches, setRecentSearches] = useState<string[]>([
    "ATL ✈️ LAS",
    "JFK ✈️ LAX",
    "MIA ✈️ DXB",
  ]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("flydna_recent_searches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentSearches(parsed);
        }
      }
    } catch {}
  }, []);

  const handleChipClick = (route: string) => {
    window.dispatchEvent(new CustomEvent("flydna-new-notification", {
      detail: { message: `Relaunching saved search: ${route}` }
    }));
  };

  return (
    <div className="min-h-screen text-[var(--text-main)] p-4 md:p-6 flex flex-col gap-6 font-sans selection:bg-[var(--accent-primary)] selection:text-[var(--text-main)] z-20 my-20">
      {/* Saved Travel Search History Bar */}
      <div className="w-full p-4 rounded-2xl bg-[var(--surface-color)] backdrop-blur-xl border border-[var(--glass-border)] shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
            <span>🕒</span>
            <span>Saved Search History</span>
          </span>
          <span className="text-[10px] text-[var(--accent-primary)] font-bold">Quick Relaunch</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {recentSearches.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-xs font-semibold backdrop-blur-md shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>✈️</span>
              <span>{chip}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-80 flex-shrink-0 bg-[var(--surface-color)] rounded-2xl p-6 h-auto border border-[var(--glass-border)] shadow-xl">
        <FilterSection
          title="Stop"
          isOpen={openSections.stop}
          onToggle={() => toggle("stop")}
          items={[
            { label: "Direct", value: "$850", checked: true },
            { label: "1 Stop", value: "$640" },
            { label: "2+ Stop", value: "$480" },
          ]}
        />

        <FilterSection
          title="Price"
          isOpen={openSections.price}
          onToggle={() => toggle("price")}
        >
          <PriceSlider />
        </FilterSection>

        <FilterSection
          title="Baggage Allowance"
          isOpen={openSections.baggage}
          onToggle={() => toggle("baggage")}
          items={[
            { label: "25 KG", value: "1 Luggage" },
            { label: "30 KG", value: "2 Luggage", checked: true },
            { label: "40 KG", value: "3 Luggage" },
          ]}
        />

        <FilterSection
          title="Airlines"
          isOpen={openSections.airlines}
          onToggle={() => toggle("airlines")}
          items={[
            { label: "Delta Air Lines", value: "$350", checked: true },
            { label: "United Airlines", value: "$325" },
            { label: "American Airlines", value: "$290" },
            { label: "JetBlue Airways", value: "$240" },
            { label: "Southwest Airlines", value: "$190" },
            { label: "Frontier Airlines", value: "$120" },
          ]}
        />

        <FilterSection
          title="Flight Times"
          isOpen={openSections.times}
          onToggle={() => toggle("times")}
        >
          <TimeSlider label="Outbound from New York (JFK)" />
          <TimeSlider label="Depart from Tokyo (HND)" />
        </FilterSection>

        <FilterSection
          title="Cabin Class"
          isOpen={openSections.cabin}
          onToggle={() => toggle("cabin")}
          items={[
            { label: "Economy", value: "$550", checked: true },
            { label: "Premium", value: "$325" },
            { label: "Business", value: "$200" },
            { label: "First", value: "$450" },
          ]}
        />

        <FilterSection
          title="Airports"
          isOpen={openSections.airports}
          onToggle={() => toggle("airports")}
        >
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-5 cursor-pointer hover:text-[var(--text-main)]">
            <input
              type="checkbox"
              className="w-4 h-4 bg-[var(--surface-color)] border-[var(--glass-border)] rounded-sm accent-[var(--accent-primary)]"
            />
            Depart/return same
          </label>
          <div className="mb-5">
            <p className="text-sm text-[var(--text-main)] mb-3 font-semibold">
              Bangladesh
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "DAC - Hazrat Shahjalal...",
                  value: "$200",
                  checked: true,
                },
                { label: "CXB - Cox's Bazar Int...", value: "$325" },
                { label: "CGP - Shah Amanat Int...", value: "$550" },
              ].map((item, i) => (
                <label
                  key={`bd-${i}`}
                  className="flex items-center justify-between text-sm text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="w-4 h-4 accent-[var(--accent-primary)] rounded-sm bg-[var(--surface-color)] border-[var(--glass-border)]"
                    />
                    {item.label}
                  </span>
                  <span>{item.value}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--text-main)] mb-3 font-semibold">
              Japan
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "HND - Haneda Inter...",
                  value: "$200",
                  checked: true,
                },
                { label: "NRT - Narita Internati...", value: "$325" },
                { label: "KIX - Kansai Internati...", value: "$550" },
              ].map((item, i) => (
                <label
                  key={`jp-${i}`}
                  className="flex items-center justify-between text-sm text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="w-4 h-4 accent-[var(--accent-primary)] rounded-sm bg-[var(--surface-color)] border-[var(--glass-border)]"
                    />
                    {item.label}
                  </span>
                  <span>{item.value}</span>
                </label>
              ))}
            </div>
          </div>
        </FilterSection>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-5 h-auto">
        {/* Top Navigation */}
        <header className="bg-[var(--surface-color)] rounded-2xl p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 border border-[var(--glass-border)] shadow-md">
          <div className="flex gap-8 sm:gap-16 ml-0 sm:ml-4 overflow-x-auto w-full sm:w-auto hide-scrollbar">
            {sortOptions.map((opt) => {
              const isActive = activeSort === opt.name;
              return (
                <div
                  key={opt.name}
                  onClick={() => handleSortClick(opt.name)}
                  className={`pb-1 cursor-pointer shrink-0 transition-all ${
                    isActive
                      ? "border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  <p
                    className={`text-sm ${isActive ? "font-bold" : "font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                  >
                    {opt.name}
                  </p>
                  <p
                    className={`text-xs ${isActive ? "font-semibold" : "text-[var(--text-muted)] group-hover:text-[var(--text-muted)]"}`}
                  >
                    {opt.price}
                  </p>
                </div>
              );
            })}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-main)] bg-[var(--glass-bg)] hover:bg-[var(--surface-color)]/95/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all shrink-0 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-lg leading-none">≡</span> Other sort
          </button>
        </header>

        {/* Flight List */}
        <div className="flex flex-col gap-4">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface-color)] rounded-2xl border border-[var(--glass-border)] shadow-xl">
              <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mb-4" />
              <p className="text-[var(--text-muted)] font-medium">
                Fetching real-time flights from Duffel...
              </p>
            </div>
          ) : searchError ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[var(--surface-color)] rounded-2xl border border-red-500/30 shadow-xl px-6 text-center">
              <p className="text-red-400 font-semibold mb-2">Search Error</p>
              <p className="text-[var(--text-muted)] text-sm max-w-md">
                {searchError}
              </p>
            </div>
          ) : displayFlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface-color)] rounded-2xl border border-[var(--glass-border)] shadow-xl">
              <p className="text-[var(--text-muted)] font-medium">
                No flights found. Try adjusting your destinations or dates.
              </p>
            </div>
          ) : (
            displayFlights.map((flight) => (
              <div
                key={flight.id}
                className="bg-[var(--surface-color)] rounded-2xl p-4 sm:p-5 relative border border-transparent hover:border-[var(--accent-primary)]/30 hover:bg-[var(--surface-color)]/95 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(56,189,248,0.15)] transition-all duration-300 cursor-default group"
              >
                {flight.isDetails && (
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--glass-border)]/50">
                    <h2 className="text-lg font-semibold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors">
                      Details
                    </h2>
                    <span className="bg-[var(--surface-color)]/90 text-[var(--accent-primary)] text-[10px] px-3 py-1 rounded-full shadow-inner">
                      {flight.tag}
                    </span>
                  </div>
                )}

                <div className="flex flex-col xl:flex-row">
                  <div
                    className={`flex flex-col gap-4 w-full ${flight.isDetails ? "xl:w-[75%]" : "xl:w-[80%]"} xl:pr-6 ${!flight.isDetails && "xl:border-r border-[var(--glass-border)]/50 pb-4 xl:pb-0"}`}
                  >
                    {flight.outbound && <FlightRow flight={flight.outbound} />}
                    {flight.return && (
                      <FlightRow flight={flight.return} isReturn={true} />
                    )}

                    {flight.isDetails && flight.amenities && (
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-[var(--glass-border)]/50 text-xs text-[var(--text-muted)]">
                        {flight.amenities.map((item: string, idx: number) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1.5 font-medium"
                          >
                            <span className="text-[var(--accent-primary)]">
                              ✓
                            </span>{" "}
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex flex-row xl:flex-col items-center justify-between xl:justify-center w-full ${flight.isDetails ? "xl:w-[25%] xl:border-l border-[var(--glass-border)]/50" : "xl:w-[20%]"} xl:pl-6 pt-4 xl:pt-0 border-t xl:border-t-0 border-[var(--glass-border)]/50`}
                  >
                    <div className="flex flex-col items-start xl:items-center">
                      {!flight.isDetails && (
                        <span
                          className={`${flight.tagColor || "bg-[var(--surface-color)]/90 text-[var(--accent-primary)]"} text-[10px] px-3 py-1 rounded-full mb-2 hidden xl:block shadow-sm`}
                        >
                          {flight.tag}
                        </span>
                      )}
                      <p className="text-2xl font-bold mb-0.5 text-[var(--text-main)]">
                        ${flight.price}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] xl:mb-4">
                        {flight.class}
                      </p>
                    </div>

                    {flight.isDetails && flight.info && (
                      <div className="w-full flex-col gap-1 mb-4 text-[10px] hidden xl:flex">
                        <div className="flex justify-center gap-2">
                          <span className="text-[var(--text-muted)]">
                            Baggage:
                          </span>
                          <span>{flight.info.Baggage}</span>
                        </div>
                        <div className="flex justify-center gap-2">
                          <span className="text-[var(--text-muted)]">
                            Cabin:
                          </span>
                          <span>{flight.info.Cabin}</span>
                        </div>
                        <div className="flex justify-center gap-2">
                          <span className="text-[var(--text-muted)]">
                            Check In:
                          </span>
                          <span>{flight.info.CheckIn}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (flight.rawOffer) {
                          setSelectedOffer(flight.rawOffer);
                        } else {
                          // Construct standard mock structure
                          setSelectedOffer({
                            id: `mock_${flight.id}`,
                            total_amount: String(flight.price),
                            total_currency: "USD",
                            slices: [
                              {
                                duration: "PT11H00M",
                                segments: [
                                  {
                                    origin: {
                                      iata_code: flight.outbound.depCode,
                                      city_name: "Origin",
                                    },
                                    destination: {
                                      iata_code: flight.outbound.arrCode,
                                      city_name: "Destination",
                                    },
                                    operating_carrier: {
                                      name: flight.outbound.name,
                                      logo_symbol_url: flight.outbound.logo,
                                    },
                                  },
                                ],
                              },
                            ],
                            passengers: [{ id: "pas_mock_1" }],
                          });
                        }
                        window.location.href = "/travel/passenger-info";
                      }}
                      className="bg-[var(--accent-primary)]/95 text-[var(--text-main)] text-xs font-semibold px-6 py-2.5 rounded-full hover:opacity-80 hover:shadow-[var(--glow-primary)] active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}
