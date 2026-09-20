/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Search, Loader2, MapPin, Clock } from "lucide-react";
import { useSearchStore } from "@/utils/states/useSearchStore";

export type FlightData = {
  flightNumber: string;
  airline: string;
  routeFrom: string;
  routeTo: string;
  fromName: string;
  toName: string;
  status: string;
  scheduledArrival: string;
  departureTime: string;
  remainingTime: string;
  aircraft: string;
  seat: string;
  gate: string;
  terminal: string;
  altitude: string;
  speed: string;
  progress: number;
};

export default function FlightTrackerCard() {
  const { selectedOffer, selectedSeat } = useSearchStore();
  const [flightInput, setFlightInput] = useState("");
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (selectedOffer) {
      const outboundSlice = selectedOffer.slices?.[0];
      const firstSegment = outboundSlice?.segments?.[0];
      const lastSegment =
        outboundSlice?.segments?.[outboundSlice.segments.length - 1];

      if (firstSegment) {
        const carrierCode =
          firstSegment.operating_carrier?.iata_code ||
          firstSegment.marketing_carrier?.iata_code ||
          "FDNA";
        const flightNum =
          firstSegment.marketing_carrier_flight_number ||
          firstSegment.operating_carrier_flight_number ||
          "100";
        const flightNumStr = `${carrierCode}-${flightNum}`;

        const autoData: FlightData = {
          flightNumber: flightNumStr,
          airline:
            firstSegment.operating_carrier?.name ||
            firstSegment.marketing_carrier?.name ||
            "Delta Air Lines",
          routeFrom: firstSegment.origin?.iata_code || "ATL",
          routeTo: lastSegment?.destination?.iata_code || "LAS",
          fromName:
            firstSegment.origin?.name || "Atlanta Hartsfield-Jackson (ATL)",
          toName:
            lastSegment?.destination?.name || "Las Vegas Harry Reid Intl (LAS)",
          status: "ACTIVE",
          departureTime: "02:15 PM",
          scheduledArrival: lastSegment?.arriving_at
            ? new Date(lastSegment.arriving_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "06:45 PM",
          remainingTime: "3H 15M REMAINING",
          aircraft:
            firstSegment.aircraft?.name ||
            firstSegment.aircraft_model?.name ||
            "Airbus A350",
          seat: selectedSeat || "02A",
          gate: "GATE A05",
          terminal: "TERMINAL Concourse A",
          altitude: "36,000 FT",
          speed: "535 MPH",
          progress: 58,
        };

        setFlightData(autoData);
        setFlightInput(flightNumStr);
        setHasSearched(true);
      }
    }
  }, [selectedOffer, selectedSeat]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightInput.trim()) return;

    setIsSearching(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const token =
        localStorage.getItem("flydna_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch(
        `${apiBase}/api/tracker/flight/${encodeURIComponent(flightInput)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const json = await res.json();
      if (
        res.ok &&
        (json.success === true || json.status === "success") &&
        json.data
      ) {
        setFlightData(json.data);
        setHasSearched(true);
      } else {
        setFlightData(null); // Triggers the "Not found" state
      }
    } catch (err) {
      setFlightData(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="glass-panel-heavy rounded-[28px] p-6 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 text-left h-full min-h-0 gap-4">
      <div className="flex-1 flex flex-col min-h-0 justify-between">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-main)] tracking-tight">
              Flight Tracker
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              Real-time flight route and itinerary
            </p>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="relative mb-5 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Flight ID (e.g. DL-100)"
              value={flightInput}
              onChange={(e) => setFlightInput(e.target.value)}
              className="w-full bg-[var(--surface-color)] border border-white/10 rounded-xl pl-10 pr-24 py-3 text-xs text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 transition font-medium"
            />
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 transition font-bold text-xs text-white flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        {/* Search Results / Telemetry Display */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
          <AnimatePresence mode="wait">
            {!hasSearched ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 px-4 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]"
              >
                <p className="text-xs font-medium max-w-[220px] leading-relaxed">
                  Enter a flight number to view live route, arrival time, and
                  seating.
                </p>
              </motion.div>
            ) : flightData ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex-1 flex flex-col justify-between py-1 gap-4"
              >
                {/* Airline & Status Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-main)]">
                      {flightData.airline || "Commercial Airline"}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {flightData.flightNumber}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                    {flightData.status || "En Route"}
                  </span>
                </div>

                {/* Vertical Route Timeline */}
                <div className="flex flex-col gap-2 relative pl-1">
                  {/* Origin */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20 mt-1 shrink-0" />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                            {flightData.routeFrom || "ATL"}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-medium truncate max-w-[140px]">
                            {flightData.fromName?.split("(")[0] || "Atlanta"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-main)] mt-1">
                      {flightData.departureTime || "02:15 PM"}
                    </span>
                  </div>

                  {/* Connecting Line & Flight Duration */}
                  <div className="flex items-center justify-between pl-[4px] my-0.5">
                    <div className="w-[2px] h-6 bg-dashed border-l-2 border-dashed border-white/20 ml-[3px]" />
                    <div className="flex items-center gap-2 pr-1">
                      <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                        {flightData.remainingTime
                          ? flightData.remainingTime.replace(" REMAINING", "")
                          : "3H 15M"}{" "}
                        Duration
                      </span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 mt-1 shrink-0" />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                            {flightData.routeTo || "LAS"}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-medium truncate max-w-[140px]">
                            {flightData.toName?.split("(")[0] || "Las Vegas"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-cyan-400 mt-1">
                      {flightData.scheduledArrival || "06:45 PM"}
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-left">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                      Aircraft
                    </span>
                    <span className="text-xs font-bold text-[var(--text-main)] mt-0.5 block truncate">
                      {flightData.aircraft || "Airbus A350"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                      Seat
                    </span>
                    <span className="text-xs font-bold text-cyan-400 mt-0.5 block">
                      {flightData.seat || "02A"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                      Gate
                    </span>
                    <span className="text-xs font-bold text-[var(--text-main)] mt-0.5 block truncate">
                      {flightData.gate || "A05"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-red-400 text-xs font-semibold"
              >
                Flight ID not found. Please try another flight number.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Track (Fixed at bottom) */}
      {hasSearched && flightData && (
        <div className="pt-3 border-t border-white/5 flex-shrink-0">
          <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-0.5">
            <span>Flight Progress</span>
            <span className="text-cyan-400 font-mono font-bold">
              {flightData.progress}%
            </span>
          </div>
          <div className="relative w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/5">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${flightData.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
