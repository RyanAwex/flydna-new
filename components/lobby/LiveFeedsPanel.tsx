/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Share2, MapPin, Star, Search } from "lucide-react";

export type LiveFeedsPanelProps = {
  dealsTab: "Stays" | "Flights" | "Cruises" | "Events" | "FBO";
  setDealsTab: (
    tab: "Stays" | "Flights" | "Cruises" | "Events" | "FBO",
  ) => void;
  dealsDeparture: string;
  setDealsDeparture?: (city: string) => void;
  dealsDestination: string;
  setDealsDestination?: (city: string) => void;
  dealsKeyword: string;
  selectedCalDate?: Date;
  selectedStays: any[];
  selectedFlights: any[];
  localEvents: any[];
  selectedCruises: any[];
  lastFboTelemetry?: any;
  activeHandoffLabel?: string;
  liveFeed?: any[];
  isSixWeekMonth: boolean;
  onShareItem: (item: {
    title: string;
    details: string;
    price?: string;
    category: string;
  }) => void;
  onOpenSeating: (event: any) => void;
};

// High-resolution photography for cards
const FALLBACK_IMAGES = {
  stay: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
  flight:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80",
  event:
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
  cruise:
    "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80",
  fbo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80",
};

export default function LiveFeedsPanel({
  dealsTab,
  setDealsTab,
  dealsDeparture,
  dealsDestination,
  dealsKeyword,
  selectedStays,
  selectedFlights,
  localEvents,
  selectedCruises,
  isSixWeekMonth,
  onShareItem,
  onOpenSeating,
}: LiveFeedsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Stays" | "Flights" | "Events" | "Cruises" | "FBO"
  >(dealsTab);

  useEffect(() => {
    setActiveFilter(dealsTab);
  }, [dealsTab]);

  const handleTabSelect = (
    tab: "All" | "Stays" | "Flights" | "Events" | "Cruises" | "FBO",
  ) => {
    setActiveFilter(tab);
    if (tab !== "All") {
      setDealsTab(tab);
    }
  };

  const fboCharters = useMemo(
    () => [
      {
        tail: "N800XP",
        aircraft: "Hawker 800XP",
        from: dealsDeparture || "LZU",
        to: dealsDestination || "MIA",
        terminal: "Gwinnett Aero Terminal",
        seats: 8,
        duration: "1h 45m",
        price: "$3,600",
        image: FALLBACK_IMAGES.fbo,
      },
      {
        tail: "N650GX",
        aircraft: "Gulfstream G650",
        from: "PDK",
        to: "TEB",
        terminal: "Signature Flight Support",
        seats: 12,
        duration: "2h 10m",
        price: "$4,800",
        image:
          "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80",
      },
      {
        tail: "N750CX",
        aircraft: "Cessna Citation X+",
        from: "MIA",
        to: "OPF",
        terminal: "Fontainebleau Aviation",
        seats: 8,
        duration: "1h 15m",
        price: "$3,200",
        image:
          "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=600&q=80",
      },
    ],
    [dealsDeparture, dealsDestination],
  );

  const counts = useMemo(() => {
    const staysCount = selectedStays.length;
    const flightsCount = selectedFlights.length;
    const eventsCount = localEvents.filter((e) => !e.noResults).length;
    const cruisesCount = selectedCruises.length;
    const fboCount = fboCharters.length;
    return {
      Stays: staysCount,
      Flights: flightsCount,
      Events: eventsCount,
      Cruises: cruisesCount,
      FBO: fboCount,
      All: staysCount + flightsCount + eventsCount + cruisesCount + fboCount,
    };
  }, [
    selectedStays,
    selectedFlights,
    localEvents,
    selectedCruises,
    fboCharters,
  ]);

  const activeSearchSummary = useMemo(() => {
    if (dealsTab === "Flights") {
      return `${dealsDeparture || "ATL"} ➔ ${dealsDestination || "MIA"}`;
    }
    if (dealsTab === "Stays") {
      return dealsDestination || dealsDeparture || "Featured Retreats";
    }
    if (dealsTab === "Cruises") {
      return dealsDeparture ? `Port: ${dealsDeparture}` : "Caribbean & Bahamas";
    }
    if (dealsTab === "Events") {
      return dealsKeyword || dealsDeparture || "Upcoming Events";
    }
    if (dealsTab === "FBO") {
      return "Private Aviation Charters";
    }
    return "All Feeds";
  }, [dealsTab, dealsDeparture, dealsDestination, dealsKeyword]);

  return (
    <div
      className={`glass-panel-heavy rounded-[26px] p-4 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_100%_0%,rgba(6,182,212,0.04),transparent_50%)] border border-white/10 transition-all duration-300 ${
        isSixWeekMonth ? "h-[385px]" : "h-[345px]"
      }`}
    >
      {/* Header Container */}
      <div className="flex flex-col gap-2.5 pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Live Feeds
            </h3>
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] sm:max-w-[180px]">
              • {activeSearchSummary}
            </span>
          </div>

          <span className="text-[9px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {counts.All} Results
          </span>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {[
            { id: "All", label: "All", count: counts.All },
            { id: "Stays", label: "Stays", count: counts.Stays },
            { id: "Flights", label: "Flights", count: counts.Flights },
            { id: "Events", label: "Events", count: counts.Events },
            { id: "Cruises", label: "Cruises", count: counts.Cruises },
            { id: "FBO", label: "FBO", count: counts.FBO },
          ].map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 shrink-0 ${
                  isSelected
                    ? "bg-white text-slate-950 shadow-sm"
                    : "bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`text-[8.5px] px-1 py-0.2 rounded ${
                      isSelected
                        ? "bg-slate-900 text-white"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scrollable Feed List */}
      <div
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="flex-1 flex flex-col gap-2.5 overflow-y-auto pt-2.5 pr-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        <AnimatePresence mode="popLayout">
          {/* ========================================================================= */}
          {/* 1. FBO PRIVATE JET CHARTERS */}
          {/* ========================================================================= */}
          {(activeFilter === "FBO" || activeFilter === "All") &&
            fboCharters.map((charter, cIdx) => (
              <motion.div
                key={`fbo-charter-${cIdx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20 backdrop-blur-md shadow-sm transition-all duration-200 flex items-stretch text-left group min-h-[96px]"
              >
                <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden self-stretch bg-white/5">
                  <img
                    src={charter.image}
                    alt={charter.aircraft}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[8px] font-bold text-amber-300 border border-white/10 uppercase tracking-wider">
                    FBO Charter
                  </span>
                </div>

                <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate">
                        {charter.aircraft}
                      </h4>
                      <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {charter.tail}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200 mt-0.5">
                      <span>{charter.from}</span>
                      <span className="text-slate-500 font-normal">➔</span>
                      <span>{charter.to}</span>
                      <span className="text-[9px] text-slate-400 font-normal ml-1">
                        • {charter.seats} Seats • {charter.duration}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                    <span className="text-xs font-bold text-white">
                      {charter.price}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onShareItem({
                            title: `${charter.aircraft} Charter (${charter.tail})`,
                            details: `${charter.from} ➔ ${charter.to} • ${charter.terminal}`,
                            price: charter.price,
                            category: "FBO",
                          })
                        }
                        className="size-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-slate-300 hover:text-white transition cursor-pointer"
                        title="Share Charter"
                      >
                        <Share2 size={11} />
                      </button>
                      <Link
                        href={`/travel/search/private?from=${encodeURIComponent(charter.from)}&to=${encodeURIComponent(charter.to)}&aircraft=${encodeURIComponent(charter.aircraft)}`}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-950 hover:bg-slate-200 font-bold text-[10px] tracking-wide transition cursor-pointer active:scale-95"
                      >
                        Reserve
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

          {/* ========================================================================= */}
          {/* 2. STAYS & HOTELS CARDS */}
          {/* ========================================================================= */}
          {(activeFilter === "Stays" || activeFilter === "All") &&
            selectedStays.map((stay: any, idx: number) => {
              const cleanPrice = stay.price
                ? `$${String(stay.price)
                    .replace(/\$/g, "")
                    .replace(/\/night/gi, "")
                    .trim()}`
                : "$240";

              return (
                <motion.div
                  key={`stay-card-${idx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20 backdrop-blur-md shadow-sm transition-all duration-200 flex items-stretch text-left group min-h-[96px]"
                >
                  <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden self-stretch bg-white/5">
                    <img
                      src={stay.image || FALLBACK_IMAGES.stay}
                      alt={stay.hotelName || "Stay"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[8px] font-bold text-amber-300 border border-white/10 uppercase tracking-wider">
                      Stay
                    </span>
                  </div>

                  <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-100 transition-colors">
                          {stay.hotelName}
                        </h4>
                        <div className="flex items-center text-amber-300 text-[9px] shrink-0">
                          <Star size={9} className="fill-current" />
                          <span className="font-bold ml-0.5">
                            {stay.stars || 5}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <MapPin size={9} className="shrink-0 text-slate-500" />
                        <span>{stay.city || "Featured Destination"}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      <div>
                        <span className="text-xs font-bold text-white">
                          {cleanPrice}
                        </span>
                        <span className="text-[9px] text-slate-500 ml-1">
                          / night
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            onShareItem({
                              title: stay.hotelName,
                              details: `${stay.city} • Luxury Stay`,
                              price: `${cleanPrice} / night`,
                              category: "Stay",
                            })
                          }
                          className="size-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-slate-300 hover:text-white transition cursor-pointer"
                          title="Share Stay"
                        >
                          <Share2 size={11} />
                        </button>
                        <Link
                          href={`/travel/search/hotel?city=${encodeURIComponent(stay.city || "Atlanta")}&hotel=${encodeURIComponent(stay.hotelName)}`}
                          className="px-2.5 py-1 rounded-lg bg-white text-slate-950 hover:bg-slate-200 font-bold text-[10px] tracking-wide transition cursor-pointer active:scale-95"
                        >
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

          {/* ========================================================================= */}
          {/* 3. FLIGHTS CARDS */}
          {/* ========================================================================= */}
          {(activeFilter === "Flights" || activeFilter === "All") &&
            selectedFlights.map((flight: any, idx: number) => (
              <motion.div
                key={`flight-card-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20 backdrop-blur-md shadow-sm transition-all duration-200 flex items-stretch text-left group min-h-[96px]"
              >
                <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden self-stretch bg-white/5">
                  <img
                    src={flight.image || FALLBACK_IMAGES.flight}
                    alt={flight.airline || "Flight"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[8px] font-bold text-sky-300 border border-white/10 uppercase tracking-wider">
                    Flight
                  </span>
                </div>

                <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate">
                        {flight.airline}
                      </h4>
                      <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {flight.flightNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200 mt-0.5">
                      <span>{flight.departure}</span>
                      <span className="text-slate-500 font-normal">➔</span>
                      <span>{flight.arrival}</span>
                      <span className="text-[9px] text-slate-400 font-normal ml-1">
                        • {flight.duration || "Non-stop"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                    <span className="text-xs font-bold text-white">
                      ${flight.price}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onShareItem({
                            title: `${flight.airline} Flight ${flight.flightNo}`,
                            details: `${flight.departure} (${flight.from}) ➔ ${flight.arrival} (${flight.to})`,
                            price: `$${flight.price}`,
                            category: "Flight",
                          })
                        }
                        className="size-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-slate-300 hover:text-white transition cursor-pointer"
                        title="Share Flight"
                      >
                        <Share2 size={11} />
                      </button>
                      <Link
                        href={`/travel/search/flight?from=${encodeURIComponent(flight.from || "ATL")}&to=${encodeURIComponent(flight.to || "JFK")}&flight=${encodeURIComponent(flight.flightNo)}`}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-950 hover:bg-slate-200 font-bold text-[10px] tracking-wide transition cursor-pointer active:scale-95"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

          {/* ========================================================================= */}
          {/* 4. EVENTS CARDS */}
          {/* ========================================================================= */}
          {(activeFilter === "Events" || activeFilter === "All") &&
            localEvents
              .filter((e) => !e.noResults)
              .map((event: any, idx: number) => (
                <motion.div
                  key={`event-card-${idx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20 backdrop-blur-md shadow-sm transition-all duration-200 flex items-stretch text-left group min-h-[96px]"
                >
                  <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden self-stretch bg-white/5">
                    <img
                      src={event.image || FALLBACK_IMAGES.event}
                      alt={event.name || "Event"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[8px] font-bold text-purple-300 border border-white/10 uppercase tracking-wider">
                      Event
                    </span>
                  </div>

                  <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-100 transition-colors">
                          {event.name}
                        </h4>
                        {event.date && (
                          <span className="text-[9px] font-medium text-slate-400 shrink-0">
                            {event.date}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <MapPin size={9} className="shrink-0 text-slate-500" />
                        <span>{event.venue || event.city || "Live Stage"}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      <span className="text-xs font-bold text-white">
                        {event.priceMin
                          ? `$${Math.round(event.priceMin)}`
                          : "Available"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            onShareItem({
                              title: event.name,
                              details: `${event.venue || event.city} • ${event.date || ""}`,
                              price: event.priceMin
                                ? `$${Math.round(event.priceMin)}`
                                : "Tickets Available",
                              category: "Event",
                            })
                          }
                          className="size-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-slate-300 hover:text-white transition cursor-pointer"
                          title="Share Event"
                        >
                          <Share2 size={11} />
                        </button>
                        <button
                          onClick={() =>
                            onOpenSeating({
                              id: event.id || event.name,
                              name: event.name,
                              venue: event.venue || event.city || "",
                              city: event.city || "",
                              date: event.date,
                              time: event.time,
                              priceMin: event.priceMin,
                              image: event.image,
                              category: "Live Concert",
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-white text-slate-950 hover:bg-slate-200 font-bold text-[10px] tracking-wide transition cursor-pointer active:scale-95"
                        >
                          Tickets
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

          {/* ========================================================================= */}
          {/* 5. CRUISES CARDS */}
          {/* ========================================================================= */}
          {(activeFilter === "Cruises" || activeFilter === "All") &&
            selectedCruises.map((cruise: any, idx: number) => (
              <motion.div
                key={`cruise-card-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20 backdrop-blur-md shadow-sm transition-all duration-200 flex items-stretch text-left group min-h-[96px]"
              >
                <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden self-stretch bg-white/5">
                  <img
                    src={cruise.image || FALLBACK_IMAGES.cruise}
                    alt={cruise.line || "Cruise"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[8px] font-bold text-indigo-300 border border-white/10 uppercase tracking-wider">
                    Cruise
                  </span>
                </div>

                <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {cruise.line} • {cruise.route || "Caribbean Voyage"}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      Port: {cruise.departurePort || "Miami, FL"} •{" "}
                      {cruise.nights || "7 Nights"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                    <span className="text-xs font-bold text-white">
                      ${cruise.price}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onShareItem({
                            title: `${cruise.line} — ${cruise.route}`,
                            details: `Port: ${cruise.departurePort || "Miami, FL"}`,
                            price: `$${cruise.price}`,
                            category: "Cruise",
                          })
                        }
                        className="size-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-slate-300 hover:text-white transition cursor-pointer"
                        title="Share Cruise"
                      >
                        <Share2 size={11} />
                      </button>
                      <Link
                        href={`/travel/search/cruise?line=${encodeURIComponent(cruise.line)}`}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-950 hover:bg-slate-200 font-bold text-[10px] tracking-wide transition cursor-pointer active:scale-95"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

          {/* Clean Minimal Empty State */}
          {counts.All === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 my-auto">
              <Search size={16} className="text-slate-500 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-300">Search Deals</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px]">
                Search for destinations or dates in FlyDnA Deals to display
                results here.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
