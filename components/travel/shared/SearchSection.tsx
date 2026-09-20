"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  PlaneTakeoff,
  Building,
  Car,
  ArrowRightLeft,
  Calendar,
  Clock,
  Search,
  MapPin,
  Users,
  ChevronDown,
  PlaneLanding,
  Ship,
  Ticket,
  Crown,
} from "lucide-react";
import { useSearchStore, getTodayStr } from "@/utils/states/useSearchStore";
import { airports, Location } from "@/utils/mock-data/airports";
import PrivateJetModal from "../PrivateJetModal";

const categoryRoutes: Record<string, string> = {
  Flights: "/travel/search/flight",
  Private: "/travel/search/private",
  Hotel: "/travel/search/hotel",
  Car: "/travel/search/car",
  Cruise: "/travel/search/cruise",
  Activities: "/travel/search/activities",
};

const DropdownContainer = ({
  children,
  isOpen,
  onClose,
  trigger,
  className = "",
  alignRight = false,
  dropdownClassName = "w-full min-w-[280px]",
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  className?: string;
  alignRight?: boolean;
  dropdownClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {trigger}
      {isOpen && (
        <div
          className={`absolute top-full ${alignRight ? "right-0" : "left-0"} mt-2 ${dropdownClassName} bg-[var(--surface-color)]/95 backdrop-blur-2xl border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden shadow-[var(--accent-primary)]/10 z-50 py-2 max-h-72 overflow-y-auto`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/* Location Selector (Airport Picker) */
const LocationSelector = ({
  label,
  value,
  onChange,
  excludeId,
  icon: Icon,
  placeholder,
  error,
}: {
  label: string;
  value: Location | null;
  onChange: (loc: Location) => void;
  excludeId?: string;
  placeholder: string;
  icon:
    | React.ComponentType<{ className?: string }>
    | ((props: { className?: string }) => React.ReactNode);
  error?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Clear search on close for a fresh start next time
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setSearchQuery(""), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  const [liveAirports, setLiveAirports] = useState<Location[]>([]);
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setLiveAirports([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
        const res = await fetch(`${apiBase}/api/v1/flights/airports?keyword=${encodeURIComponent(q)}`);
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        const seen = new Set<string>();
        setLiveAirports(
          list
            .filter((pl: any) => {
              if (!pl.iataCode || seen.has(pl.iataCode)) return false;
              seen.add(pl.iataCode);
              return true;
            })
            .map((pl: any, i: number) => ({
              id: `live-${pl.iataCode}-${i}`,
              city: pl.cityName || pl.name,
              airport: pl.name,
              code: pl.iataCode,
              coordinates: [pl.longitude ?? 0, pl.latitude ?? 0] as [number, number],
            }))
        );
      } catch {
        setLiveAirports([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAirports = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matches = airports.filter((a) => {
      return (
        a.city.toLowerCase().includes(q) ||
        a.airport.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q)
      );
    });

    const merged = [
      ...liveAirports,
      ...matches.filter((m) => !liveAirports.some((l) => l.code === m.code)),
    ];
    const upperQuery = searchQuery.trim().toUpperCase();
    const isThreeLetter = upperQuery.length === 3 && /^[A-Z]{3}$/.test(upperQuery);
    const alreadyHasCode = merged.some((a) => a.code === upperQuery);

    if (isThreeLetter && !alreadyHasCode) {
      return [
        ...merged,
        {
          id: `custom-${upperQuery}`,
          city: `Airport (${upperQuery})`,
          airport: `Select custom location code: ${upperQuery}`,
          code: upperQuery,
          coordinates: [0, 0] as [number, number],
        },
      ];
    }
    return merged;
  }, [searchQuery, liveAirports]);

  return (
    <div
      id={`location-selector-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`flex-1 min-w-0 flex flex-col ${isOpen ? "relative z-50" : "relative z-10"}`}
    >
      <p className="text-sm text-[var(--text-main)] font-light mb-2 pl-1 hidden lg:block">
        {label}
      </p>
      <DropdownContainer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="w-full"
        trigger={
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-3 py-3 px-3 bg-[var(--surface-color)]/90 backdrop-blur-xl rounded-2xl border ${error ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-[var(--glass-border)]"} hover:bg-[var(--glass-bg)] transition-colors cursor-pointer relative`}
          >
            <div className="bg-[var(--surface-color)] p-2.5 rounded-full text-[var(--text-muted)] shrink-0">
              {Icon && typeof Icon === "function" ? (
                <Icon className="w-4 h-4" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-muted)] mb-0.5 lg:hidden">
                {label}
              </p>
              {value ? (
                <>
                  <p className="text-base md:text-lg text-[var(--text-main)] font-semibold truncate leading-tight">
                    {value.city} ({value.code})
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate hidden sm:block">
                    {value.airport}
                  </p>
                </>
              ) : (
                <p className="text-base text-[var(--text-muted)] font-semibold truncate leading-tight mt-1">
                  {placeholder}
                </p>
              )}
            </div>
            {error && (
              <span className="absolute -bottom-6 left-3 text-[11px] text-red-500 font-medium whitespace-nowrap">
                Please select a location
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        }
      >
        <div className="sticky -top-2 z-20 bg-[var(--surface-color)] backdrop-blur-xl px-3 pb-2 -mt-2 pt-2 border-b border-[var(--glass-border)] mb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search city or airport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[var(--surface-color)] text-[var(--text-main)] text-sm rounded-xl py-2.5 pl-9 pr-4 border border-[var(--glass-border)] focus:border-[var(--accent-primary)]/50 outline-none transition-colors placeholder-[var(--text-muted)]"
              autoFocus
            />
          </div>
        </div>

        {filteredAirports.length > 0 ? (
          filteredAirports.map((airport) => {
            const isSelected = value?.id === airport.id;
            const isBlocked = excludeId === airport.id;

            return (
              <div
                key={airport.id}
                className={`px-4 py-3 flex flex-col gap-0.5 cursor-pointer transition-colors ${
                  isBlocked
                    ? "opacity-30 cursor-not-allowed grayscale"
                    : isSelected
                      ? "bg-[var(--accent-primary)]/20 text-[var(--text-main)]"
                      : "hover:bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
                onClick={() => {
                  if (!isBlocked) {
                    onChange(airport);
                    setIsOpen(false);
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm md:text-base">
                    {airport.city} ({airport.code})
                  </span>
                  {isSelected && (
                    <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full shadow-[var(--glow-primary)] shrink-0"></div>
                  )}
                </div>
                <span className="text-xs opacity-70 truncate pr-4">
                  {airport.airport}
                </span>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            No airports found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </DropdownContainer>
    </div>
  );
};

/* Date Selector (Simple Premium Calendar) */
const DateSelector = ({
  label,
  value,
  onChange,
  minDate,
  allowClear = false,
  onClear,
  hideLabel = false,
  hideBorder = false,
  isFirst = false,
  isLast = false,
  onOpenChange,
}: {
  label: string;
  value: string | null;
  onChange: (date: string) => void;
  minDate?: string | null;
  allowClear?: boolean;
  onClear?: () => void;
  hideLabel?: boolean;
  hideBorder?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const [todayStr, setTodayStr] = useState("");
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayStr(new Date().toISOString().split("T")[0]);
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [value]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Add Date";
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
  };

  const getDayName = (dateStr: string | null) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("default", {
      weekday: "long",
    });
  };

  if (!todayStr)
    return (
      <div className="flex-1 flex flex-col min-w-[120px]">
        {!hideLabel && (
          <p className="text-sm text-[var(--text-main)] font-light mb-2 pl-1 hidden lg:block">
            {label}
          </p>
        )}
        <div className="flex items-center gap-3 py-3 px-5 rounded-2xl border border-white/5 bg-white/5 animate-pulse h-full min-h-[56px]">
          <div className="w-5 h-5 bg-white/10 rounded-full" />
          <div className="h-4 bg-white/10 rounded w-20" />
        </div>
      </div>
    );

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  ).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const fYear = viewDate.getFullYear();
    const fMonth = String(viewDate.getMonth() + 1).padStart(2, "0");
    const fDay = String(i).padStart(2, "0");
    days.push(`${fYear}-${fMonth}-${fDay}`);
  }

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <div
      id={`date-selector-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`flex-1 flex flex-col min-w-[140px] xl:min-w-[180px] 2xl:min-w-[200px] ${isOpen ? "relative z-50" : "relative z-10"}`}
    >
      {!hideLabel && value && (
        <p className="text-sm text-[var(--text-main)] font-light mb-2 pl-1 hidden lg:block">
          {label}
        </p>
      )}
      <DropdownContainer
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        className="h-full w-full"
        dropdownClassName="min-w-[300px] sm:min-w-[320px]"
        alignRight={isLast}
        trigger={
          <div
            onClick={() => handleOpenChange(!isOpen)}
            className={`flex items-center gap-3 py-3 px-4 transition-colors cursor-pointer h-full bg-[var(--surface-color)]/90 backdrop-blur-xl ${
              !value ? "justify-center" : ""
            } ${
              hideBorder
                ? `hover:bg-[var(--glass-bg)] ${isFirst ? "rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl" : ""} ${isLast ? "rounded-b-2xl sm:rounded-bl-none sm:rounded-r-2xl" : ""}`
                : "rounded-2xl border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] bg-[var(--surface-color)]/90 backdrop-blur-xl"
            }`}
          >
            {value ? (
              <Calendar className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
            ) : (
              <span className="text-[var(--accent-primary)] text-lg font-light leading-none shrink-0">
                +
              </span>
            )}
            <div className={`${value ? "flex-1" : ""} min-w-0`}>
              {value && (
                <p className="text-xs text-[var(--text-muted)] mb-0.5 lg:hidden">
                  {label}
                </p>
              )}
              <p
                className={`text-xs font-semibold whitespace-nowrap leading-tight ${!value ? "text-[var(--text-muted)]" : "text-[var(--text-main)]"}`}
              >
                {formatDate(value)}
              </p>
              {value && (
                <p className="text-xs text-[var(--text-muted)] hidden lg:block">
                  {getDayName(value)}
                </p>
              )}
            </div>
            {allowClear && value && (
              <span
                className="ml-2 text-xs text-[var(--text-muted)] hover:text-red-400 cursor-pointer shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear?.();
                }}
              >
                Clear
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        }
      >
        <div className="p-3 w-full sm:w-[320px] bg-[var(--surface-color)]/95 backdrop-blur-2xl">
          <div className="flex justify-between items-center mb-4 px-2">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-[var(--text-main)] border border-white/10"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="font-semibold text-[var(--text-main)]">
              {viewDate.toLocaleString("default", { month: "long" })}{" "}
              {viewDate.getFullYear()}
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-[var(--text-main)] border border-white/10"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-[var(--text-muted)]">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((dStr, idx) => {
              if (!dStr) return <div key={idx} />;

              const isSelected = value === dStr;
              const isPast = minDate ? dStr < minDate : dStr < todayStr;
              const dayNum = parseInt(dStr.split("-")[2], 10);

              return (
                <div
                  key={dStr}
                  className={`h-9 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all duration-300 ${
                    isPast
                      ? "opacity-30 cursor-not-allowed text-[var(--text-muted)] line-through"
                      : isSelected
                        ? "bg-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)] scale-110 font-bold"
                        : "hover:bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                  onClick={() => {
                    if (!isPast) {
                      onChange(dStr);
                      handleOpenChange(false);
                    }
                  }}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>
      </DropdownContainer>
    </div>
  );
};

/* Guest Selector (Rooms/Adults/Children) */
const GuestSelector = ({
  rooms,
  adults,
  children,
  onChange,
}: {
  rooms: number;
  adults: number;
  children: number;
  onChange: (r: number, a: number, c: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      id="guest-selector"
      className={`flex-1 min-w-0 flex flex-col shrink-0 lg:ml-2 ${isOpen ? "relative z-50" : "relative z-10"}`}
    >
      <p className="text-sm text-[var(--text-main)] font-light mb-1 hidden lg:block">
        Guests
      </p>
      <DropdownContainer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="w-full"
        alignRight={true}
        trigger={
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 py-3 px-5 rounded-2xl border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] bg-[var(--surface-color)]/90 backdrop-blur-xl transition-colors cursor-pointer h-full"
          >
            <div className="bg-[var(--surface-color)] p-2.5 rounded-full text-[var(--text-muted)] shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-muted)] mb-0.5 lg:hidden">
                Guests
              </p>
              <p className="text-base text-[var(--text-main)] font-semibold whitespace-nowrap leading-tight">
                {adults} Adults, {children} Child
              </p>
              <p className="text-xs text-[var(--text-muted)] hidden lg:block">
                {rooms} Room
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        }
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between text-[var(--text-main)]">
            <span className="text-sm font-medium">Rooms</span>
            <div className="flex items-center gap-3">
              <button
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
                onClick={() =>
                  onChange(Math.max(1, rooms - 1), adults, children)
                }
              >
                -
              </button>
              <span className="w-4 text-center">{rooms}</span>
              <button
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
                onClick={() => onChange(rooms + 1, adults, children)}
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[var(--text-main)]">
            <span className="text-sm font-medium">Adults</span>
            <div className="flex items-center gap-3">
              <button
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
                onClick={() =>
                  onChange(rooms, Math.max(1, adults - 1), children)
                }
              >
                -
              </button>
              <span className="w-4 text-center">{adults}</span>
              <button
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
                onClick={() => onChange(rooms, adults + 1, children)}
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[var(--text-main)]">
            <span className="text-sm font-medium">Children</span>
            <div className="flex items-center gap-3">
              <button
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
                onClick={() =>
                  onChange(rooms, adults, Math.max(0, children - 1))
                }
              >
                -
              </button>
              <span className="w-4 text-center">{children}</span>
              <button
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
                onClick={() => onChange(rooms, adults, children + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </DropdownContainer>
    </div>
  );
};

const TimeSelector = ({
  label,
  value,
  onChange,
  subLabel,
  isFirst = false,
  isLast = false,
  onOpenChange,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
  subLabel?: string;
  isFirst?: boolean;
  isLast?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const times = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
  ];

  return (
    <div
      id={`time-selector-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`flex flex-1 items-center gap-3 py-3 px-5 cursor-pointer hover:bg-white/5 transition-colors ${isFirst ? "rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl" : ""} ${isLast ? "rounded-b-2xl sm:rounded-bl-none sm:rounded-r-2xl" : ""} ${isOpen ? "relative z-50" : "relative z-10"}`}
    >
      <DropdownContainer
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        className="w-full"
        trigger={
          <div
            onClick={() => handleOpenChange(!isOpen)}
            className="flex items-center gap-3 w-full"
          >
            <Clock className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-muted)] mb-0.5 lg:hidden">
                {label}
              </p>
              <p className="text-base text-[var(--text-main)] font-semibold whitespace-nowrap leading-tight">
                {value}
              </p>
              {subLabel && (
                <p className="text-xs text-[var(--text-muted)] hidden lg:block">
                  {subLabel}
                </p>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-1 p-2">
          {times.map((t, idx) => (
            <div
              key={`${t}-${idx}`}
              className={`px-3 py-2 text-sm rounded-xl cursor-pointer text-center transition-colors ${
                value === t
                  ? "bg-[var(--accent-primary)] text-[var(--text-main)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)]"
              }`}
              onClick={() => {
                onChange(t);
                handleOpenChange(false);
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </DropdownContainer>
    </div>
  );
};

// ─── Flight Panel ───
const FlightPanel = ({
  errors,
}: {
  errors: { departure: boolean; arrival: boolean };
}) => {
  const {
    departure,
    arrival,
    departureDate,
    returnDate,
    tripType,
    setDeparture,
    setArrival,
    setDepartureDate,
    setReturnDate,
    setTripType,
  } = useSearchStore();

  const [isDatesOpen, setIsDatesOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 justify-center md:justify-start">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="flightType"
            className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
            checked={tripType === "One Way"}
            onChange={() => {
              setTripType("One Way");
              setReturnDate(null);
            }}
          />
          <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
            One Way
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="flightType"
            className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
            checked={tripType === "Round Trip"}
            onChange={() => setTripType("Round Trip")}
          />
          <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
            Round Trip
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="flightType"
            className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
            checked={tripType === "Multi Way"}
            onChange={() => setTripType("Multi Way")}
          />
          <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
            Multi Way
          </span>
        </label>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-end lg:gap-2 relative z-10">
        <LocationSelector
          label="Flying From"
          value={departure}
          onChange={setDeparture}
          placeholder="Origins"
          icon={(props: { className?: string }) => (
            <PlaneTakeoff className={props.className} />
          )}
          error={errors.departure}
        />

        <div className="shrink-0 lg:-mx-4 z-60 lg:pb-3.5 flex justify-center -my-3 lg:my-0 relative">
          <button
            className="bg-[var(--accent-primary)] p-2.5 rounded-full text-[var(--text-main)] hover:bg-[var(--accent-secondary)] hover:scale-110 transition-all duration-300 shadow-[var(--glow-primary)] flex items-center justify-center border-[3px] border-[var(--surface-color)] lg:border-none rotate-90 lg:rotate-0 cursor-pointer"
            onClick={() => {
              const temp = departure;
              setDeparture(arrival);
              setArrival(temp);
            }}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        <LocationSelector
          label="Flying To"
          value={arrival}
          onChange={setArrival}
          excludeId={departure?.id}
          placeholder="Destinations"
          icon={(props: { className?: string }) => (
            <PlaneLanding className={props.className} />
          )}
          error={errors.arrival}
        />

        {/* Date Selector */}
        <div className="flex flex-col shrink-0 mt-2 lg:mt-0 lg:ml-2">
          <p className="text-sm text-[var(--text-main)] font-light mb-1 hidden lg:block">
            Departure — Return
          </p>
          <div
            className={`flex flex-col sm:flex-row items-stretch border border-[var(--glass-border)] rounded-2xl shadow-sm lg:h-[62px] relative transition-all duration-300 ${
              isDatesOpen
                ? "z-50 ring-1 ring-[var(--accent-primary)]/20 bg-[var(--surface-color)]"
                : "z-10 bg-transparent"
            }`}
          >
            <DateSelector
              label="Departure"
              value={departureDate}
              onChange={(d) => {
                setDepartureDate(d);
                if (returnDate && d > returnDate) setReturnDate(d);
              }}
              hideLabel
              hideBorder
              isFirst
              onOpenChange={setIsDatesOpen}
            />

            <div className="flex items-center self-stretch justify-center relative z-10">
              <div className="w-full h-px sm:w-px sm:h-8 bg-white/10" />
            </div>

            <DateSelector
              label="Return Date"
              value={returnDate}
              minDate={departureDate}
              onChange={(d) => {
                setReturnDate(d);
                setTripType("Round Trip");
              }}
              allowClear
              onClear={() => {
                setReturnDate(null);
                setTripType("One Way");
              }}
              hideLabel
              hideBorder
              isLast
              onOpenChange={setIsDatesOpen}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Private Panel ───
const PrivatePanel = ({
  errors,
}: {
  errors: { departure: boolean; arrival: boolean };
}) => {
  const {
    departure,
    arrival,
    departureDate,
    returnDate,
    tripType,
    setDeparture,
    setArrival,
    setDepartureDate,
    setReturnDate,
    setTripType,
  } = useSearchStore();

  const [jetClass, setJetClass] = useState("Light Jet");
  useEffect(() => { try { sessionStorage.setItem("flydna_jet_class", JSON.stringify({ v: ({"Light Jet":"light","Midsize Jet":"midsize","Super Midsize":"super-midsize","Heavy Jet":"heavy","Turboprop":"turboprop"} as any)[jetClass] || "midsize", t: Date.now() })); } catch {} }, [jetClass]);
  const [isDatesOpen, setIsDatesOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 justify-center md:justify-start">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="privateTripType"
            className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
            checked={tripType === "One Way"}
            onChange={() => {
              setTripType("One Way");
              setReturnDate(null);
            }}
          />
          <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
            One Way
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="privateTripType"
            className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
            checked={tripType === "Round Trip"}
            onChange={() => setTripType("Round Trip")}
          />
          <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
            Round Trip
          </span>
        </label>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2 relative z-10">
        <LocationSelector
          label="Departure Hub"
          value={departure}
          onChange={setDeparture}
          placeholder="Private Terminal / Origin"
          icon={(props: { className?: string }) => (
            <PlaneTakeoff className={props.className} />
          )}
          error={errors.departure}
        />

        <div className="shrink-0 lg:-mx-4 z-60 lg:pb-3.5 flex justify-center -my-3 lg:my-0 relative">
          <button
            className="bg-[var(--accent-primary)] p-2.5 rounded-full text-[var(--text-main)] hover:bg-[var(--accent-secondary)] hover:scale-110 transition-all duration-300 shadow-[var(--glow-primary)] flex items-center justify-center border-[3px] border-[var(--surface-color)] lg:border-none rotate-90 lg:rotate-0 cursor-pointer"
            onClick={() => {
              const temp = departure;
              setDeparture(arrival);
              setArrival(temp);
            }}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        <LocationSelector
          label="Arrival Hub"
          value={arrival}
          onChange={setArrival}
          excludeId={departure?.id}
          placeholder="Private Terminal / Destination"
          icon={(props: { className?: string }) => (
            <PlaneLanding className={props.className} />
          )}
          error={errors.arrival}
        />

        <div className="flex flex-col shrink-0 lg:ml-2">
          <p className="text-sm text-[var(--text-main)] font-light mb-1 hidden lg:block">
            Departure Date
          </p>
          <div className="flex items-stretch border border-[var(--glass-border)] rounded-2xl shadow-sm lg:h-[62px] relative bg-transparent">
            <DateSelector
              label="Departure"
              value={departureDate}
              onChange={setDepartureDate}
              hideLabel
              hideBorder
              isFirst
              isLast={!returnDate}
              onOpenChange={setIsDatesOpen}
            />
            {tripType === "Round Trip" && (
              <>
                <div className="flex items-center self-stretch justify-center relative z-10">
                  <div className="w-full h-px sm:w-px sm:h-8 bg-white/10" />
                </div>
                <DateSelector
                  label="Return Date"
                  value={returnDate}
                  minDate={departureDate}
                  onChange={setReturnDate}
                  allowClear
                  onClear={() => {
                    setReturnDate(null);
                    setTripType("One Way");
                  }}
                  hideLabel
                  hideBorder
                  isLast
                  onOpenChange={setIsDatesOpen}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-[140px] xl:min-w-[180px] lg:ml-2">
          <p className="text-sm text-[var(--text-main)] font-light mb-2 pl-1 hidden lg:block">
            Jet Class
          </p>
          <select
            value={jetClass}
            onChange={(e) => { setJetClass(e.target.value); try { sessionStorage.setItem("flydna_jet_class", JSON.stringify({ v: ({"Light Jet":"light","Midsize":"midsize","Midsize Jet":"midsize","Super Midsize":"super-midsize","Heavy Jet":"heavy","Heavy":"heavy","Turboprop":"turboprop"} as any)[e.target.value] || "midsize", t: Date.now() })); } catch {} }}
            className="flex items-center justify-between w-full h-[62px] py-3 px-4 bg-[var(--surface-color)]/90 backdrop-blur-xl border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] rounded-2xl text-base text-[var(--text-main)] font-semibold outline-none cursor-pointer"
          >
            <option value="Light Jet">Light Jet (Phenom 300 / CJ3)</option>
            <option value="Midsize Jet">Midsize Jet (Hawker 800XP)</option>
            <option value="Super Midsize">Super Midsize (Challenger 300)</option>
            <option value="Heavy Jet">Heavy Jet (Gulfstream G450)</option>
          </select>
        </div>
      </div>
    </>
  );
};

// ─── Hotel Panel ───
const HotelPanel = () => {
  const {
    hotelLocation,
    departureDate,
    returnDate,
    setHotelLocation,
    setDepartureDate,
    setReturnDate,
  } = useSearchStore();

  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [isDatesOpen, setIsDatesOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 justify-center md:justify-start">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="hotelType"
            className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
            defaultChecked
          />
          <span className="text-sm text-[var(--text-main)] transition-colors group-hover:text-[var(--text-main)]">
            Hotel
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="hotelType"
            className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-main)]">
            Resort
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="hotelType"
            className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-main)]">
            Apartment
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="hotelType"
            className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-main)]">
            Villa
          </span>
        </label>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2 relative z-10">
        <LocationSelector
          label="Location"
          value={hotelLocation}
          onChange={setHotelLocation}
          placeholder="Where are you going?"
          icon={MapPin}
        />

        {/* Check-in / Check-out */}
        <div className="flex flex-col shrink-0 lg:ml-2">
          <p className="text-sm text-[var(--text-main)] font-light mb-1 hidden lg:block">
            Check-in — Check-out
          </p>
          <div
            className={`flex flex-col sm:flex-row items-stretch border border-[var(--glass-border)] rounded-2xl shadow-sm relative transition-all duration-300 ${
              isDatesOpen
                ? "z-50 ring-1 ring-[var(--accent-primary)]/20 bg-[var(--surface-color)]"
                : "z-10 bg-transparent"
            }`}
          >
            <DateSelector
              label="Check-in"
              value={departureDate}
              onChange={(d) => {
                setDepartureDate(d);
                if (returnDate && d > returnDate) setReturnDate(d);
              }}
              hideLabel
              hideBorder
              isFirst
              onOpenChange={setIsDatesOpen}
            />

            <div className="flex items-center self-stretch justify-center relative z-10">
              <div className="w-full h-px sm:w-px sm:h-8 bg-white/10" />
            </div>

            <DateSelector
              label="Check-out"
              value={returnDate}
              minDate={departureDate}
              onChange={setReturnDate}
              allowClear
              hideLabel
              hideBorder
              isLast
              onOpenChange={setIsDatesOpen}
            />
          </div>
        </div>

        <GuestSelector
          rooms={rooms}
          adults={adults}
          // eslint-disable-next-line react/no-children-prop
          children={children}
          onChange={(r, a, c) => {
            setRooms(r);
            setAdults(a);
            setChildren(c);
          }}
        />
      </div>
    </>
  );
};

// ─── Car Panel ───
const CarPanel = () => {
  const {
    carPickupLocation,
    carPickupTime,
    carReturnTime,
    departureDate,
    returnDate,
    setCarPickupLocation,
    setCarPickupTime,
    setCarReturnTime,
    setDepartureDate,
    setReturnDate,
  } = useSearchStore();

  const [isDatesOpen, setIsDatesOpen] = useState(false);
  const [isTimesOpen, setIsTimesOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 justify-center md:justify-start">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="carType"
            className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
            defaultChecked
          />
          <span className="text-sm text-[var(--text-main)] transition-colors group-hover:text-[var(--text-main)]">
            Rent a Car
          </span>
        </label>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2 relative z-10">
        <LocationSelector
          label="Pick-up Location"
          value={carPickupLocation}
          onChange={setCarPickupLocation}
          placeholder="Where to pick up?"
          icon={Search}
        />

        {/* Date Selector */}
        <div className="flex flex-col shrink-0 lg:ml-2">
          <p className="text-sm text-[var(--text-main)] font-light mb-1 hidden lg:block">
            Pick-up — Return
          </p>
          <div
            className={`flex flex-col sm:flex-row items-stretch border border-[var(--glass-border)] rounded-2xl shadow-sm relative transition-all duration-300 ${
              isDatesOpen
                ? "z-50 ring-1 ring-[var(--accent-primary)]/20 bg-[var(--surface-color)]"
                : "z-10 bg-transparent"
            }`}
          >
            <DateSelector
              label="Pick-up Date"
              value={departureDate}
              onChange={(d) => {
                setDepartureDate(d);
                if (returnDate && d > returnDate) setReturnDate(d);
              }}
              hideLabel
              hideBorder
              isFirst
              onOpenChange={setIsDatesOpen}
            />

            <div className="flex items-center self-stretch justify-center relative z-10">
              <div className="w-full h-px sm:w-px sm:h-8 bg-white/10" />
            </div>

            <DateSelector
              label="Return Date"
              value={returnDate}
              minDate={departureDate}
              onChange={setReturnDate}
              allowClear
              hideLabel
              hideBorder
              isLast
              onOpenChange={setIsDatesOpen}
            />
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex flex-col shrink-0 lg:ml-2">
          <p className="text-sm text-[var(--text-main)] font-light mb-1 hidden lg:block">
            Time
          </p>
          <div
            className={`flex flex-col sm:flex-row items-stretch border border-[var(--glass-border)] rounded-2xl shadow-sm relative transition-all duration-300 ${
              isTimesOpen
                ? "z-50 ring-1 ring-[var(--accent-primary)]/20 bg-[var(--surface-color)]"
                : "z-10 bg-transparent"
            }`}
          >
            <TimeSelector
              label="Pick-up Time"
              value={carPickupTime}
              onChange={setCarPickupTime}
              subLabel="Pick-up"
              isFirst
              onOpenChange={setIsTimesOpen}
            />

            <div className="flex items-center self-stretch justify-center relative z-10">
              <div className="w-full h-px sm:w-px sm:h-8 bg-white/10" />
            </div>

            <TimeSelector
              label="Return Time"
              value={carReturnTime}
              onChange={setCarReturnTime}
              subLabel="Return"
              isLast
              onOpenChange={setIsTimesOpen}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main Component ───
const SearchSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchStore = useSearchStore();
  const {
    departureDate,
    setDepartureDate,
    // submitSearch
  } = searchStore;

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
  const [flightErrors, setFlightErrors] = useState({
    departure: false,
    arrival: false,
  });

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      if (!departureDate) {
        setDepartureDate(getTodayStr());
      }
    }, 0);
  }, [departureDate, setDepartureDate]);

  const { activeCategory: storeCategory, setActiveCategory } = searchStore;

  const urlCategory = pathname.startsWith("/travel/search/hotel")
    ? "Hotel"
    : pathname.startsWith("/travel/search/car")
      ? "Car"
      : pathname.startsWith("/travel/search/cruise")
        ? "Cruise"
        : pathname.startsWith("/travel/search/activities")
          ? "Activities"
          : pathname.startsWith("/travel/search/private")
            ? "Private"
            : "Flights";

  const activeCategory = storeCategory ?? urlCategory;
  // Receive empty-leg BOOK handoffs: /travel?tab=private&from=PDK&to=TEB&date=...
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if ((sp.get("tab") || "").toLowerCase() !== "private") return;
      setActiveCategory("Private");
      const store = useSearchStore.getState();
      const mk = (code) => {
        const hit = airports.find((a) => a.code.toUpperCase() === code.toUpperCase());
        return hit || { id: "icao-" + code, city: code, airport: code + " (General Aviation)", code, coordinates: [0, 0] };
      };
      const f = sp.get("from"); const t = sp.get("to"); const d = sp.get("date");
      if (f) store.setDeparture(mk(f) as any);
      if (t) store.setArrival(mk(t) as any);
      if (d) store.setDepartureDate(d);
    } catch {}
  }, []);
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams && typeof rawSearchParams.get === "function" ? rawSearchParams : null;
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current || !searchParams) return;
    if (pathname.startsWith("/travel/search/hotel")) {
      const cityP = searchParams ? searchParams.get("city") : null;
      if (!cityP) return;

      seededRef.current = true;
      const s = cityP.toLowerCase().trim();
      const local = airports.find(
        (a) =>
          a.city.toLowerCase() === s ||
          a.city.toLowerCase().includes(s) ||
          s.includes(a.city.toLowerCase())
      );
      if (local) {
        searchStore.setHotelLocation(local);
        setActiveCategory("Hotel");
      } else {
        (async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
            const res = await fetch(`${apiBase}/api/v1/flights/airports?keyword=${encodeURIComponent(cityP)}`);
            const json = await res.json();
            const first = Array.isArray(json?.data) ? json.data[0] : null;
            if (first?.iataCode) {
              searchStore.setHotelLocation({
                id: `live-${first.iataCode}`,
                city: first.cityName || first.name,
                airport: first.name,
                code: first.iataCode,
                coordinates: [first.longitude ?? 0, first.latitude ?? 0] as [number, number],
              });
              setActiveCategory("Hotel");
            }
          } catch {}
        })();
      }
      return;
    }
    if (!pathname.startsWith("/travel/search/flight")) return;
    const fromP = searchParams ? searchParams.get("from") : null;
    const toP = searchParams ? searchParams.get("to") : null;
    const dateP = searchParams ? searchParams.get("date") : null;
    if (!fromP && !toP) return;

    seededRef.current = true;
    const match = (q: string | null): Location | null => {
      if (!q) return null;
      const s = q.toLowerCase();
      return (
        airports.find((a) => a.code.toLowerCase() === s) ||
        airports.find(
          (a) =>
            s.includes(a.code.toLowerCase()) ||
            a.city.toLowerCase() === s ||
            s.includes(a.city.toLowerCase())
        ) ||
        null
      );
    };
    const dep = match(fromP);
    const arr = match(toP);
    if (dep) searchStore.setDeparture(dep);
    if (arr) searchStore.setArrival(arr);
    if (dateP) searchStore.setDepartureDate(dateP);
    if (dep && arr) {
      setActiveCategory("Flights");
      searchStore.submitSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const categories = [
    { name: "Flights", icon: PlaneTakeoff },
    { name: "Private", label: "Private Charter", icon: Crown },
    { name: "Hotel", icon: Building },
    { name: "Car", icon: Car },
    { name: "Cruise", icon: Ship },
    { name: "Activities", icon: Ticket },
  ];

  const handleCategoryClick = (name: string) => {
    if (name === "Cruise") {
      router.push("/travel/search/cruise");
      return;
    }
    if (name === "Activities") {
      router.push("/travel/search/activities");
      return;
    }
    setActiveCategory(name);
  };

  const handleSearch = async () => {
    if (activeCategory === "Flights" || activeCategory === "Private") {
      let hasError = false;
      const newErrors = { departure: false, arrival: false };

      if (!searchStore.departure) {
        newErrors.departure = true;
        hasError = true;
      }
      if (!searchStore.arrival) {
        newErrors.arrival = true;
        hasError = true;
      }

      setFlightErrors(newErrors);
      if (hasError) return;
    }

    setIsLoading(true);

    const payload = {
      category: activeCategory,
      departureDate: searchStore.departureDate,
      returnDate: searchStore.returnDate,
      tripType: searchStore.tripType,
      departure: searchStore.departure,
      arrival: searchStore.arrival,
      hotelLocation: searchStore.hotelLocation,
      carPickupLocation: searchStore.carPickupLocation,
      carPickupTime: searchStore.carPickupTime,
      carReturnTime: searchStore.carReturnTime,
      timestamp: new Date().toISOString(),
    };

    // Log only the selected category's data
    console.log("Mock API Call: Sending search criteria...", {
      category: payload.category,
      data:
        payload.category === "Flights" || payload.category === "Private"
          ? {
              departureDate: payload.departureDate,
              returnDate: payload.returnDate,
              tripType: payload.tripType,
              departure: payload.departure,
              arrival: payload.arrival,
            }
          : payload.category === "Hotel"
            ? {
                hotelLocation: payload.hotelLocation,
                checkIn: payload.departureDate,
                checkOut: payload.returnDate,
              }
            : payload.category === "Car"
              ? {
                  carPickupLocation: payload.carPickupLocation,
                  carPickupTime: payload.carPickupTime,
                  carReturnTime: payload.carReturnTime,
                  pickupDate: payload.departureDate,
                  returnDate: payload.returnDate,
                }
              : {},
    });

    if (activeCategory === "Flights") {
      setActiveCategory("Flights");
      await searchStore.submitSearch();
    } else if (activeCategory === "Private") {
      setIsPrivateModalOpen(true);
      setIsLoading(false);
      return;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const route = categoryRoutes[activeCategory];
    if (route) router.push(route);

    setIsLoading(false);
  };

  if (!mounted) return null;

  return (
    <div className="relative z-20 w-full max-w-6xl mx-auto -mt-10 flex flex-col items-center">
      <PrivateJetModal
        isOpen={isPrivateModalOpen}
        onClose={() => setIsPrivateModalOpen(false)}
        initialAircraftClass={"midsize"}
        initialDepartureDate={(searchStore as any).departureDate ? String((searchStore as any).departureDate) : ""}
        initialReturnDate={(searchStore as any).returnDate ? String((searchStore as any).returnDate) : ""}
        initialTripType={(searchStore as any).tripType || ""}
        initialOrigin={searchStore.departure?.code || "ATL"}
        initialDestination={searchStore.arrival?.code || (searchStore.arrival?.airport?.match(/\(([A-Z0-9]{3,4})\)/)?.[1] ?? "")}
      />
      <div
        className="flex overflow-x-auto w-auto max-w-[calc(100vw-2rem)] md:max-w-none items-center gap-1 bg-[var(--surface-color)] p-1.5 rounded-2xl md:rounded-full mb-6 border border-[var(--glass-border)] shadow-xl mx-4 sm:mx-0 z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium text-sm transition-all duration-300 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[var(--accent-primary)] text-[var(--text-main)] shadow-lg"
                  : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" /> {(cat as any).label || cat.name}
            </button>
          );
        })}
      </div>

      {activeCategory !== "Cruise" && activeCategory !== "Activities" && (
        <div className="w-full bg-[var(--surface-color)]/90 backdrop-blur-xl border border-[var(--glass-border)] md:mx-0 rounded-3xl px-5 md:px-8 pt-6 pb-8 shadow-2xl relative max-w-7xl mx-auto z-10">
          {/* <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none -z-10">
            <Image
              src="/assets/search-glow-effect.svg"
              alt="glow effect"
              className="absolute -top-4 -right-4 w-48 h-48"
              width={192}
              height={192}
              priority
            />
          </div> */}

          {/* <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none -z-10">
            <Image
              src="/assets/search-glow-effect.svg"
              alt="glow effect"
              className="absolute -bottom-20 -left-12 w-48 h-48 rotate-180"
              width={192}
              height={192}
              priority
            />
          </div> */}

          <div className="relative z-20">
            {activeCategory === "Hotel" ? (
              <HotelPanel />
            ) : activeCategory === "Car" ? (
              <CarPanel />
            ) : activeCategory === "Private" ? (
              <PrivatePanel errors={flightErrors} />
            ) : (
              <FlightPanel errors={flightErrors} />
            )}

            <div className="flex justify-center mt-6 lg:mt-8 z-5 relative">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className={`flex items-center gap-2 bg-[var(--accent-primary)] shadow-[var(--glow-primary)] hover:bg-[var(--accent-secondary)] text-[var(--text-main)] px-10 md:px-14 py-3 rounded-full font-medium text-sm transition-all duration-300 w-full md:w-auto justify-center ${
                  isLoading
                    ? "opacity-70 cursor-wait scale-95"
                    : "hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSection;
