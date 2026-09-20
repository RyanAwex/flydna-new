/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Plane,
  RotateCcw,
  Search,
  Crown,
  Car,
  Luggage,
  Armchair,
  ChevronDown,
  ArrowLeftRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export type FlyDnaDealsCardProps = {
  dealsTab: "Stays" | "Flights" | "Cruises" | "Events" | "FBO";
  setDealsTab: React.Dispatch<
    React.SetStateAction<"Stays" | "Flights" | "Cruises" | "Events" | "FBO">
  >;
  dealsDeparture: string;
  setDealsDeparture: React.Dispatch<React.SetStateAction<string>>;
  dealsDestination: string;
  setDealsDestination: React.Dispatch<React.SetStateAction<string>>;
  onEventsSearch?: () => void;
  onKeywordChange?: (kw: string) => void;
  onFboSearch?: (telemetryData: any) => void;
  onHandoffChange?: (handoff: string) => void;
};

export default function FlyDnaDealsCard({
  dealsTab,
  setDealsTab,
  dealsDeparture,
  setDealsDeparture,
  dealsDestination,
  setDealsDestination,
  onEventsSearch,
  onKeywordChange,
  onFboSearch,
  onHandoffChange,
}: FlyDnaDealsCardProps) {
  const router = useRouter();

  // 3D Physical Coin Flip State
  const [isFlipped, setIsFlipped] = useState(false);

  // Front Form State
  const [guestCount, setGuestCount] = useState(1);
  const [budget, setBudget] = useState("All Budgets");
  const [activeDropdown, setActiveDropdown] = useState<
    "guests" | "budget" | null
  >(null);

  // Back FBO Form State
  const [fboMode, setFboMode] = useState<"track" | "legs">("legs");
  const [legFrom, setLegFrom] = useState("PDK");
  const [legTo, setLegTo] = useState("TEB");
  const [fboIcao, setFboIcao] = useState("LZU");
  const [fboTail, setFboTail] = useState("N800XP");
  const [rampStatus, setRampStatus] = useState<"prepped" | "inbound" | "ready">(
    "inbound",
  );
  const [isPrepped, setIsPrepped] = useState(true);

  const guestsTitle =
    dealsTab === "Flights" || dealsTab === "Cruises"
      ? "Passengers"
      : dealsTab === "Events"
        ? "Quantity"
        : "Guests";

  const guestOptions = [1, 2, 3, 4, 5];
  const budgetOptions = [
    "All Budgets",
    "Under $150/night",
    "$150 - $300/night",
    "$300 - $600/night",
    "$600+/night Luxury",
  ];

  const handleSearchSubmit = () => {
    if (dealsTab === "Events") {
      if (onEventsSearch) onEventsSearch();
    } else {
      if (dealsDestination) {
        router.push(`/search?city=${encodeURIComponent(dealsDestination)}`);
      } else if (onEventsSearch) {
        onEventsSearch();
      }
    }
  };

  const handleTabClick = (
    tab: "Stays" | "Flights" | "Cruises" | "Events" | "FBO",
  ) => {
    setDealsTab(tab);
    if (tab === "FBO") {
      setIsFlipped(true);
    } else {
      setIsFlipped(false);
      if (tab === "Events") {
        if (dealsDestination && onKeywordChange) {
          onKeywordChange(dealsDestination);
        }
        if (onEventsSearch) onEventsSearch();
      }
    }
  };

  const handleFboSubmit = async (
    overrideRampStatus?: "prepped" | "inbound" | "ready",
    overridePrepped?: boolean,
  ) => {
    const currentStatus = overrideRampStatus || rampStatus;
    const preppedState =
      overridePrepped !== undefined ? overridePrepped : isPrepped;
    const readinessQuery = preppedState ? "prepped" : "unprepped";
    const handoffLabel =
      currentStatus === "prepped"
        ? "Tarmac SUV Meet"
        : currentStatus === "inbound"
          ? "Baggage Transfer"
          : "Conf Lounge";

    const handoffInfoObj = {
      type:
        currentStatus === "prepped"
          ? "suv"
          : currentStatus === "inbound"
            ? "baggage"
            : "lounge",
      isPrepped: preppedState,
      title:
        currentStatus === "prepped"
          ? "🏎️ LUXY Tarmac SUV Meet"
          : currentStatus === "inbound"
            ? "🧳 Baggage Express & Cargo Valet"
            : "🛋️ Executive Suite & Conf Room",
      detail: !preppedState
        ? "Line-Tech Team Assigned • Awaiting Ramp Cart Dispatch"
        : currentStatus === "prepped"
          ? "Cadillac Escalade ESV (Driver: Marcus • Tag: VIP-800)"
          : currentStatus === "inbound"
            ? "Ramp Cargo Cart Prepped • Fast-Track Luggage Transfer"
            : "Private Suite 1-A Reserved • Espresso Bar & High-Speed WiFi",
      badge: !preppedState
        ? "⏳ Dispatching Ramp Crew"
        : currentStatus === "prepped"
          ? "Pre-Cleared Ramp"
          : currentStatus === "inbound"
            ? "Priority Cargo Prepped"
            : "Suite Reserved",
      bgClass: !preppedState
        ? "from-amber-950/90 to-slate-900 border-amber-500/40 text-amber-300"
        : currentStatus === "prepped"
          ? "from-cyan-950/90 to-slate-900 border-cyan-400/40 text-cyan-300"
          : currentStatus === "inbound"
            ? "from-blue-950/90 to-slate-900 border-blue-400/40 text-blue-300"
            : "from-amber-950/90 to-slate-900 border-amber-400/40 text-amber-300",
      badgeClass: !preppedState
        ? "bg-amber-400 text-slate-950 animate-pulse"
        : currentStatus === "prepped"
          ? "bg-cyan-400 text-slate-950"
          : currentStatus === "inbound"
            ? "bg-cyan-400 text-slate-950"
            : "bg-amber-400 text-slate-950",
    };

    const payload = {
      icao: fboIcao || "LZU",
      tail: fboTail || "",
      fboName:
        (fboIcao || "LZU") === "LZU"
          ? "Gwinnett Aero (LZU)"
          : (fboIcao || "LZU") === "PDK"
            ? "Signature Flight Support (PDK)"
            : `${fboIcao} FBO`,
      aircraft: null,
      status: null,
      telemetryState: "unavailable",
      telemetryMessage: "Telemetry temporarily unavailable",
      eta: null,
      date: new Date().toISOString().split("T")[0],
      paxCount: guestCount,
      handoff: handoffLabel,
      readiness: readinessQuery,
      handoffInfo: null,
    };

    try {
      const res = await fetch(
        `/api/fbo/telemetry?icao=${encodeURIComponent(fboIcao)}&tail=${encodeURIComponent(fboTail)}&role=${guestCount}&handoff=${encodeURIComponent(handoffLabel)}&readiness=${readinessQuery}`,
      );
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && onFboSearch) {
          onFboSearch(json.data);
          if (onEventsSearch) onEventsSearch();
          return;
        }
      }
    } catch (err) {
      console.warn("FBO telemetry search API call fallback:", err);
    }

    if (onFboSearch) onFboSearch(payload);
    if (onEventsSearch) onEventsSearch();
  };

  return (
    <div className="w-full h-full relative" style={{ perspective: "1200px" }}>
      {/* 3D Coin Flip Motion Container */}
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.75,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative"
      >
        {/* ================= FRONT SIDE OF CARD ================= */}
        <div
          className="glass-panel-heavy rounded-[26px] p-4 pb-3 flex flex-col justify-between absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,rgba(0,174,255,0.06),transparent_50%)] border border-white/10 shadow-2xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <h3 className="font-extrabold text-base tracking-wide uppercase text-slate-200">
                FlyDnA Deals
              </h3>
            </div>

            <div className="w-full border-t border-white/5 my-2" />

            {/* Tabs */}
            <div className="flex gap-1 py-1 rounded-xl bg-white/[0.02] border border-white/5 mb-2.5">
              {(["Stays", "Flights", "Cruises", "Events", "FBO"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition duration-300 cursor-pointer ${
                      dealsTab === tab
                        ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] dark:from-blue-600 dark:to-cyan-500 text-white shadow-[0_0_12px_rgba(139,115,87,0.35)] dark:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-2.5 text-sm font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {dealsTab === "Events" ? "Event Location" : "Departure"}
                  </label>
                  <input
                    autoComplete="off"
                    type="search"
                    name="flydna-search"
                    data-lpignore="true"
                    placeholder={
                      dealsTab === "Events" ? "City name..." : "Origin city..."
                    }
                    value={dealsDeparture}
                    onChange={(e) => setDealsDeparture(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && onEventsSearch) onEventsSearch();
                    }}
                    className="w-full glass-input rounded-xl py-2 px-3 text-slate-200 placeholder-slate-500 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {dealsTab === "Events" ? "Artist or Event" : "Arrival"}
                  </label>
                  <input
                    autoComplete="off"
                    type="search"
                    name="flydna-search"
                    data-lpignore="true"
                    placeholder={
                      dealsTab === "Events"
                        ? "Truist Park..."
                        : "Destination..."
                    }
                    value={dealsDestination}
                    onChange={(e) => {
                      setDealsDestination(e.target.value);
                      if (dealsTab === "Events" && onKeywordChange)
                        onKeywordChange(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && onEventsSearch) onEventsSearch();
                    }}
                    className="w-full glass-input rounded-xl py-2 px-3 text-slate-200 placeholder-slate-500 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Guest and Budget Row */}
              <div className="grid grid-cols-2 gap-3 relative">
                {/* Guests Selection */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {guestsTitle}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "guests" ? null : "guests",
                      )
                    }
                    className="w-full bg-[var(--surface-color)]/65 border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold outline-none flex items-center justify-between cursor-pointer hover:border-[var(--accent-primary)]/35 transition text-left"
                  >
                    <span>
                      {guestCount}{" "}
                      {guestCount === 1
                        ? dealsTab === "Stays"
                          ? "Guest"
                          : dealsTab === "Events"
                            ? "Ticket"
                            : "Passenger"
                        : dealsTab === "Stays"
                          ? "Guests"
                          : dealsTab === "Events"
                            ? "Tickets"
                            : "Passengers"}
                    </span>
                    <span className="text-[8px] text-[var(--text-muted)]">
                      ▼
                    </span>
                  </button>

                  <AnimatePresence>
                    {activeDropdown === "guests" && (
                      <>
                        <div
                          className="fixed inset-0 z-[100]"
                          onClick={() => setActiveDropdown(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 25,
                          }}
                          className="absolute left-0 right-0 bottom-full mb-2 max-h-40 overflow-y-auto rounded-xl border border-[var(--accent-primary)]/20 bg-[var(--surface-color)]/95 backdrop-blur-md p-1.5 z-[101] shadow-[0_-10px_25px_rgba(139,115,87,0.15)] scrollbar-none"
                        >
                          {guestOptions.map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setGuestCount(num);
                                setActiveDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold transition cursor-pointer ${
                                num === guestCount
                                  ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-primary)]/5"
                              }`}
                            >
                              {num}{" "}
                              {num === 1
                                ? dealsTab === "Stays"
                                  ? "Guest"
                                  : dealsTab === "Events"
                                    ? "Ticket"
                                    : "Passenger"
                                : dealsTab === "Stays"
                                  ? "Guests"
                                  : dealsTab === "Events"
                                    ? "Tickets"
                                    : "Passengers"}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Budget Selection */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Budget
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "budget" ? null : "budget",
                      )
                    }
                    className="w-full bg-[var(--surface-color)]/65 border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold outline-none flex items-center justify-between cursor-pointer hover:border-[var(--accent-primary)]/35 transition text-left"
                  >
                    <span className="truncate pr-1">{budget}</span>
                    <span className="text-[8px] text-[var(--text-muted)]">
                      ▼
                    </span>
                  </button>

                  <AnimatePresence>
                    {activeDropdown === "budget" && (
                      <>
                        <div
                          className="fixed inset-0 z-[100]"
                          onClick={() => setActiveDropdown(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 25,
                          }}
                          className="absolute left-0 right-0 bottom-full mb-2 max-h-40 overflow-y-auto rounded-xl border border-[var(--accent-primary)]/20 bg-[var(--surface-color)]/95 backdrop-blur-md p-1.5 z-[101] shadow-[0_-10px_25px_rgba(139,115,87,0.15)] scrollbar-none"
                        >
                          {budgetOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setBudget(opt);
                                setActiveDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold transition cursor-pointer ${
                                opt === budget
                                  ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-primary)]/5"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onEventsSearch) onEventsSearch();
            }}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] dark:from-blue-600 dark:to-cyan-500 hover:brightness-110 active:scale-[0.98] transition font-bold text-xs tracking-wider uppercase text-white shadow-[0_0_15px_rgba(139,115,87,0.35)] dark:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer text-center"
          >
            Search Packages
          </button>
        </div>

        {/* ================= BACK SIDE OF CARD (🛩️ FBO SEARCH MODE) ================= */}
        <div
          className="glass-panel-heavy rounded-[26px] p-4 pb-3 flex flex-col justify-between absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(6,182,212,0.06),transparent_50%)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div>
            {/* Header: Front header + Flip Back button */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
                  <Plane size={16} />
                </div>
                <h3 className="font-extrabold text-base tracking-wide uppercase text-slate-200">
                  FBO Search
                </h3>
              </div>

              <button
                onClick={() => {
                  setIsFlipped(false);
                  setDealsTab("Stays");
                }}
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white hover:border-cyan-400/40 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={10} /> Flip Back
              </button>
            </div>

            <div className="w-full border-t border-white/5 my-2" />

            {/* Tabs Bar */}
            <div className="flex gap-1 py-1 rounded-xl bg-white/[0.02] border border-white/5 mb-2.5">
              {(["Stays", "Flights", "Cruises", "Events", "FBO"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition duration-300 cursor-pointer ${
                      dealsTab === tab
                        ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] dark:from-blue-600 dark:to-cyan-500 text-white shadow-[0_0_12px_rgba(139,115,87,0.35)] dark:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            {/* FBO Mode Toggle */}
            <div className="flex gap-1 mb-2 p-0.5 rounded-lg bg-white/[0.03] border border-white/5">
              {(
                [
                  ["legs", "EMPTY LEGS"],
                  ["track", "TRACK ARRIVAL"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setFboMode(m as any)}
                  className={`flex-1 py-1.5 text-[9px] font-black rounded-md uppercase tracking-wider transition cursor-pointer ${fboMode === m ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {fboMode === "legs" ? (
              <div className="space-y-2.5 text-sm font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      From (ICAO)
                    </label>
                    <input
                      type="search"
                      name="flydna-search"
                      data-lpignore="true"
                      autoComplete="off"
                      placeholder="PDK, TEB..."
                      value={legFrom}
                      onChange={(e) => setLegFrom(e.target.value.toUpperCase())}
                      className="w-full glass-input rounded-xl py-2 px-3 text-slate-200 placeholder-slate-500 font-semibold focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      To (ICAO)
                    </label>
                    <input
                      type="search"
                      name="flydna-search"
                      data-lpignore="true"
                      autoComplete="off"
                      placeholder="TEB, OPF..."
                      value={legTo}
                      onChange={(e) => setLegTo(e.target.value.toUpperCase())}
                      className="w-full glass-input rounded-xl py-2 px-3 text-slate-200 placeholder-slate-500 font-semibold focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-sm font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Airport / ICAO
                    </label>
                    <input
                      type="search"
                      name="flydna-search"
                      data-lpignore="true"
                      autoComplete="off"
                      placeholder="LZU, PDK, TEB..."
                      value={fboIcao}
                      onChange={(e) => setFboIcao(e.target.value.toUpperCase())}
                      className="w-full glass-input rounded-xl py-2 px-3 text-slate-200 placeholder-slate-500 font-semibold focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Tail # / Flight ID
                    </label>
                    <input
                      type="search"
                      name="flydna-search"
                      data-lpignore="true"
                      autoComplete="off"
                      placeholder="N800XP, N12345..."
                      value={fboTail}
                      onChange={(e) => setFboTail(e.target.value.toUpperCase())}
                      className="w-full glass-input rounded-xl py-2 px-3 text-slate-200 placeholder-slate-500 font-semibold focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* VIP Ground & Concierge Handoff Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Passenger Count
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextCount = guestCount >= 4 ? 1 : guestCount + 1;
                        setGuestCount(nextCount);
                      }}
                      className="w-full bg-[var(--surface-color)]/65 border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold outline-none flex items-center justify-between cursor-pointer hover:border-[var(--accent-primary)]/35 transition text-left gap-1.5"
                    >
                      <span className="truncate text-[10px] flex items-center gap-1.5 min-w-0">
                        <Crown
                          size={12}
                          className="text-[var(--text-main)] shrink-0"
                        />
                        <span className="truncate">
                          {guestCount}{" "}
                          {guestCount === 1
                            ? "VIP Passenger"
                            : "VIP Passengers"}
                        </span>
                      </span>
                      <ChevronDown
                        size={11}
                        className="text-[var(--text-muted)] shrink-0"
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Ground Handoff
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus =
                          rampStatus === "prepped"
                            ? "inbound"
                            : rampStatus === "inbound"
                              ? "ready"
                              : "prepped";
                        setRampStatus(nextStatus);
                        const nextLabel =
                          nextStatus === "prepped"
                            ? "Tarmac SUV Meet"
                            : nextStatus === "inbound"
                              ? "Baggage Transfer"
                              : "Conf Lounge";
                        if (onHandoffChange) onHandoffChange(nextLabel);
                        handleFboSubmit(nextStatus);
                      }}
                      className="w-full bg-[var(--surface-color)]/65 border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold outline-none flex items-center justify-between cursor-pointer hover:border-[var(--accent-primary)]/35 transition text-left gap-1.5"
                    >
                      <span className="truncate text-[10px] flex items-center gap-1.5 min-w-0">
                        {rampStatus === "prepped" && (
                          <Car
                            size={12}
                            className="text-[var(--text-main)] shrink-0"
                          />
                        )}
                        {rampStatus === "inbound" && (
                          <Luggage
                            size={12}
                            className="text-[var(--text-main)] shrink-0"
                          />
                        )}
                        {rampStatus === "ready" && (
                          <Armchair
                            size={12}
                            className="text-[var(--text-main)] shrink-0"
                          />
                        )}
                        <span className="truncate">
                          {rampStatus === "prepped"
                            ? "Tarmac SUV Meet"
                            : rampStatus === "inbound"
                              ? "Baggage Transfer"
                              : "Conf Lounge"}
                        </span>
                      </span>
                      <ArrowLeftRight
                        size={10}
                        className="text-[var(--text-muted)] shrink-0"
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {fboMode === "legs" ? (
            <button
              type="button"
              onClick={() => {
                const aircraft = [
                  "Hawker 800XP",
                  "Citation X",
                  "Challenger 300",
                  "Gulfstream G450",
                  "Phenom 300",
                ];
                const legs = Array.from({ length: 3 }, (_, i) => {
                  const d = new Date(
                    Date.now() +
                      (2 + i * 3 + Math.floor(Math.random() * 2)) * 86400000,
                  );
                  return {
                    type: "emptyLeg",
                    id: `leg-${Date.now()}-${i}`,
                    from: legFrom || "PDK",
                    to: legTo || "TEB",
                    date: d.toISOString().split("T")[0],
                    dateLabel: d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }),
                    aircraft:
                      aircraft[Math.floor(Math.random() * aircraft.length)],
                    seats: 6 + Math.floor(Math.random() * 6),
                    price: 3900 + Math.floor(Math.random() * 8) * 550,
                    sample: true,
                    operator: "Sample Operator",
                  };
                });
                window.dispatchEvent(
                  new CustomEvent("flydna-empty-legs", { detail: { legs } }),
                );
              }}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] dark:from-blue-600 dark:to-cyan-500 hover:brightness-110 active:scale-[0.98] transition font-bold text-xs tracking-wider uppercase text-white shadow-[0_0_15px_rgba(139,115,87,0.35)] dark:shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer text-center"
            >
              Search Empty Legs
            </button>
          ) : (
            <button
              onClick={() => handleFboSubmit()}
              className="w-full mt-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] dark:from-blue-600 dark:to-cyan-500 hover:brightness-110 active:scale-[0.98] transition font-bold text-xs tracking-wider uppercase text-white shadow-[0_0_15px_rgba(139,115,87,0.35)] dark:shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <Search size={14} /> Search FBO Network
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
