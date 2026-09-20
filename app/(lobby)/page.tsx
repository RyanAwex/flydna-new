/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import SeatingChartModal, {
  SeatingEventData,
} from "@/components/travel/events/SeatingChartModal";
import { useMemo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Share2,
  Send,
  X,
} from "lucide-react";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useHeaderNav } from "@/hooks/useHeaderNav";

import FlyDnaDealsCard from "@/components/lobby/FlyDnaDealsCard";
import LiveFeedsPanel from "@/components/lobby/LiveFeedsPanel";
const MapPanel = dynamic(() => import("@/components/lobby/MapPanel"), {
  ssr: false,
});
import ContactsPanel from "@/components/lobby/ContactsPanel";
import ChatPanel from "@/components/lobby/ChatPanel";
import { ChatManager } from "@/backend/chatManager";
import { getAuthToken, BASE_URL } from "@/lib/api";
import { Message } from "@/types/chat";
import { useCall } from "@/context/CallContext";

export default function LobbyPage() {
  const { isDarkMode, toggleDarkMode, activeTab, handleActiveTabChange } =
    useHeaderNav("Lobby");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Favorites" | "Online">("All");
  const [input, setInput] = useState("");

  // Deals tab states
  const [dealsTab, setDealsTab] = useState<
    "Stays" | "Flights" | "Cruises" | "Events" | "FBO"
  >("Stays");
  const [dealsDeparture, setDealsDeparture] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("flydna_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.city) return parsed.city;
        }
      } catch {}
    }
    return "Atlanta";
  });
  const [dealsDestination, setDealsDestination] = useState("Los Angeles");
  const [dealsKeyword, setDealsKeyword] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const storedOnboarding = localStorage.getItem("flydna_onboarding");
        if (storedOnboarding) {
          const parsed = JSON.parse(storedOnboarding);
          const favArtist = parsed?.travelDreams?.favoriteMusicArtist;
          if (favArtist && String(favArtist).trim())
            return String(favArtist).trim();
        }
      } catch {}
    }
    return "";
  });

  const [lastFboTelemetry, setLastFboTelemetry] = useState<any>({
    icao: "LZU",
    tail: "N800XP",
    fboName: "Gwinnett Aero (LZU)",
    aircraft: "Hawker 800XP",
    status: "Inbound / En Route",
    eta: "14:35 EST",
    date: new Date().toISOString().split("T")[0],
    paxCount: 2,
    handoff: "Tarmac SUV Meet",
    readiness: "prepped",
  });
  const [activeHandoffLabel, setActiveHandoffLabel] =
    useState<string>("Tarmac SUV Meet");

  const today = useMemo(() => {
    return new Date();
  }, []);

  // Calendar states
  const [currentCalDate, setCurrentCalDate] = useState<Date>(today);
  const [selectedCalDate, setSelectedCalDate] = useState<Date>(today);

  const handlePrevMonth = () => {
    setCurrentCalDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentCalDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const isSixWeekMonth = useMemo(() => {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayIndex = (firstDay.getDay() + 6) % 7; // Monday = 0
    const currentMonthDays = new Date(year, month + 1, 0).getDate();
    return startDayIndex + currentMonthDays > 35;
  }, [currentCalDate]);

  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [eventsSearchTick, setEventsSearchTick] = useState(0);
  const localEventsRef = useRef<any[]>([]);

  // Share to Contacts Modal state & handler
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    item: {
      title: string;
      details: string;
      price?: string;
      category: string;
    } | null;
  }>({ open: false, item: null });

  const shareContactsList = [
    {
      id: "101",
      name: "FlyDnA Concierge",
      role: "Luxury Host & Experience Plug",
      avatar: "👑",
    },
    {
      id: "102",
      name: "FlyDnA Travel Agent",
      role: "Aviation & Airport Specialist",
      avatar: "✈️",
    },
    {
      id: "103",
      name: "FlyDnA Tech Support",
      role: "Platform Support & News",
      avatar: "⚡",
    },
    {
      id: "group_futurerballerz",
      name: "FuturerBallerz_v2",
      role: "Group Chat • 3 Members",
      avatar: "⚽",
    },
  ];

  const handleExecuteShare = (contact: (typeof shareContactsList)[0]) => {
    if (!shareModal.item) return;
    const { title, details, price, category } = shareModal.item;
    const shareText = `📍 Shared via FlyDnA Live Feeds:\n\n✨ [${category.toUpperCase()}] ${title}\n📍 ${details}${price ? `\n💰 ${price}` : ""}\n\nCheck this out on FlyDnA!`;

    try {
      if (contact.id.startsWith("10")) {
        ChatManager.injectAgentMessage(contact.id, shareText);
      }
    } catch (e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("flydna-new-notification", {
          detail: {
            message: `📲 Shared "${title}" with ${contact.name}!`,
          },
        }),
      );
    }
    setShareModal({ open: false, item: null });
  };

  useEffect(() => {
    localEventsRef.current = localEvents;
  }, [localEvents]);

  useEffect(() => {
    const fetchEvents = async () => {
      const city = dealsDeparture || "Atlanta";
      const kw = dealsKeyword?.trim() || "";

      // Instant artist tour dates generator (0ms lag!)
      if (kw) {
        const instantTourDates: any[] = []; // Rule 1: no fabricated tour dates — Events are real TM only
        if (instantTourDates.length > 0) {
          setLocalEvents(instantTourDates);
          const firstEvDate = new Date(instantTourDates[0].date);
          if (!isNaN(firstEvDate.getTime())) {
            setCurrentCalDate(firstEvDate);
            setSelectedCalDate(firstEvDate);
          }
        }
      }

      try {
        const token = localStorage.getItem("flydna_token");
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
        const kwParam = kw ? `&keyword=${encodeURIComponent(kw)}` : "";
        const res = await fetch(
          `${apiBase}/api/calendar/events?city=${encodeURIComponent(city)}${kwParam}`,
          {
            headers: {
              ...(token
                ? { Authorization: `Bearer ${token}`, "auth-token": token }
                : {}),
            },
          },
        );
        if (!res.ok) return;
        const json = await res.json();

        if (json && json.success && Array.isArray(json.data)) {
          const validEvs = json.data.filter((e: any) => !e.noResults);
          // A search REPLACES the result set (previously merged forever -> stale city-wide leftovers)
          setLocalEvents(validEvs);
          // Keyword search: jump the calendar to the first hit so future-month results aren't hidden
          if (kw && validEvs.length > 0) {
            const firstEvDate = new Date(validEvs[0].date);
            if (!isNaN(firstEvDate.getTime())) {
              setCurrentCalDate(firstEvDate);
              setSelectedCalDate(firstEvDate);
            }
          }
        }
      } catch (err) {
        console.warn("[Events Fetch Failed]", err);
      }
    };
    fetchEvents();
  }, [dealsDeparture, dealsKeyword, eventsSearchTick]);

  const [todos, setTodos] = useState<
    {
      id: string;
      text: string;
      category: "Meeting" | "Flight" | "Cruise" | "Reminder";
      date: string;
      completed?: boolean;
    }[]
  >([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("flydna_todos");
      if (stored) {
        setTodos(JSON.parse(stored));
      } else {
        const initialTodos = [
          {
            id: "1",
            text: "Travel planning with Emma",
            category: "Meeting" as const,
            date: "2026-06-11",
            completed: false,
          },
          {
            id: "2",
            text: "Flight departure to LAX",
            category: "Flight" as const,
            date: "2026-06-14",
            completed: false,
          },
          {
            id: "3",
            text: "Mediterranean cruise check-in",
            category: "Cruise" as const,
            date: "2026-06-20",
            completed: false,
          },
          {
            id: "4",
            text: "Review identity credentials",
            category: "Reminder" as const,
            date: "2026-06-12",
            completed: false,
          },
        ];
        setTodos(initialTodos);
        localStorage.setItem("flydna_todos", JSON.stringify(initialTodos));
      }
    } catch {}
  }, []);

  const saveTodos = (updated: typeof todos) => {
    setTodos(updated);
    localStorage.setItem("flydna_todos", JSON.stringify(updated));
  };

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getTodosForDate = (date: Date) => {
    const key = formatDateKey(date);
    return todos.filter((t) => t.date === key);
  };

  const defaultHotelEntries = [
    {
      id: "h1-init",
      type: "stay",
      text: "Featured stay: Star Sky Park KLCC in Kuala Lumpur — Luxury infinity pool apartment from $167/night.",
      image:
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400",
      hotelId: "h1",
      city: "Kuala Lumpur",
      price: "$167/night",
      bookUrl: "/travel/search/hotel/live-1",
    },
    {
      id: "h2-init",
      type: "stay",
      text: "Trending luxury stay: Singapore SkyPark Suites — Marina Bay view from $340/night.",
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=400",
      hotelId: "h2",
      city: "Singapore",
      price: "$340/night",
      bookUrl: "/travel",
    },
  ];

  const [liveFeed, setLiveFeed] = useState<any[]>([
    {
      id: 101,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "stay",
      text: "Featured stay: Star Sky Park KLCC in Kuala Lumpur — Luxury infinity pool apartment from $167/night.",
      image:
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400",
      price: "$167/night",
      bookUrl: "/travel/search/hotel/live-1",
    },
  ]);

  // Seating chart modal (opened by feed Tickets button, map Get Tickets, and AI staff)
  const [seatingModal, setSeatingModal] = useState<{
    open: boolean;
    event: SeatingEventData | null;
  }>({ open: false, event: null });
  useEffect(() => {
    const handleOpenSeating = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSeatingModal({ open: true, event: detail?.event || detail || null });
    };
    window.addEventListener("flydna-open-seating-chart", handleOpenSeating);
    return () =>
      window.removeEventListener(
        "flydna-open-seating-chart",
        handleOpenSeating,
      );
  }, []);
  // Empty-leg search results from the DealsCard FBO flip-world
  useEffect(() => {
    const onLegs = (e: any) => {
      const legs = e?.detail?.legs || [];
      if (!legs.length) return;
      const items = legs.map((leg: any) => ({
        id: leg.id,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "emptyLeg",
        legDate: leg.date,
        text: `${leg.sample ? "[SAMPLE] " : ""}Empty Leg: ${leg.from} \u2192 ${leg.to} \u00b7 ${leg.dateLabel} \u00b7 ${leg.aircraft} \u00b7 ${leg.seats} seats \u00b7 ${leg.operator}`,
        price: `$${Number(leg.price).toLocaleString()}`,
        bookUrl: `/travel/search/private?from=${encodeURIComponent(leg.from)}&to=${encodeURIComponent(leg.to)}&date=${encodeURIComponent(leg.date)}&aircraft=${encodeURIComponent(leg.aircraft)}`,
      }));
      setLiveFeed((prev) => [...items, ...prev].slice(0, 40));
    };
    window.addEventListener("flydna-empty-legs", onLegs);
    return () => window.removeEventListener("flydna-empty-legs", onLegs);
  }, []);

  // Dynamic Live Feed Telemetry simulator (Task 6)
  useEffect(() => {
    const feedTemplates: any[] = [];
    const hotelEntries: any[] = [...defaultHotelEntries];
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io"}/api/v1/hotels/feed`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d?.data) && d.data.length > 0) {
          hotelEntries.length = 0;
          hotelEntries.push(
            ...d.data.map((x: any) => ({
              type: "stay",
              text: x.text,
              image: x.image || null,
              hotelId: x.hotelId,
              city: x.city,
              price: x.price || null,
              bookUrl: x.bookUrl || null,
            })),
          );
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      const currentEvents = localEventsRef.current || [];
      const hasEvents = currentEvents.length > 0;
      const hasHotels = hotelEntries.length > 0;

      let selectedTemplate: any = null;
      const pickHotel = hasHotels && (!hasEvents || Math.random() > 0.4);

      if (pickHotel) {
        selectedTemplate =
          hotelEntries[Math.floor(Math.random() * hotelEntries.length)];
      } else if (hasEvents) {
        const ev =
          currentEvents[Math.floor(Math.random() * currentEvents.length)];
        const eventMsgType = Math.random() > 0.5 ? "event" : "flight";
        if (eventMsgType === "event") {
          selectedTemplate = {
            type: "event",
            text: `Ticket alert: "${ev.name}" in ${ev.city || "local area"} is trending. ${ev.priceMin ? `Prices from $${Math.round(ev.priceMin)}.` : "Tickets selling fast!"}`,
          };
        } else {
          selectedTemplate = {
            type: "flight",
            text: `Route optimization: Added direct charter flights to ${ev.city || "event city"} for "${ev.name}".`,
          };
        }
      }

      if (!selectedTemplate) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      setLiveFeed((prev) => {
        const next = [
          {
            id: Date.now(),
            time: timeStr,
            type: selectedTemplate.type,
            text: selectedTemplate.text,
            image: (selectedTemplate as any).image || null,
            price: (selectedTemplate as any).price || null,
            bookUrl: (selectedTemplate as any).bookUrl || null,
          },
          ...prev,
        ];
        return next.slice(0, 15);
      });
    }, 18000);

    return () => clearInterval(interval);
  }, [defaultHotelEntries]);

  const [calendarView, setCalendarView] = useState<"grid" | "agenda">("grid");

  const [selectedFlights, setSelectedFlights] = useState<any[]>([]);
  const formatISODuration = (iso: string) => {
    if (!iso) return "";
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return iso;
    const h = match[1] ? match[1] + "h" : "";
    const m = match[2] ? match[2] + "m" : "";
    return [h, m].filter(Boolean).join(" ") || iso;
  };
  const resolveCityToIata = async (city: string) => {
    if (!city) return null;
    const trimmed = city.trim();
    if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const res = await fetch(
        apiBase +
          "/api/v1/flights/airports?keyword=" +
          encodeURIComponent(trimmed),
      );
      const json = await res.json();
      const list = json?.data || [];
      const hit =
        list.find((x: any) => x.subType === "AIRPORT" && x.iataCode) ||
        list.find((x: any) => x.iataCode);
      return hit ? hit.iataCode : null;
    } catch {
      return null;
    }
  };
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [staysLoading, setStaysLoading] = useState(false);
  const [selectedFlightsDateStr, setSelectedFlightsDateStr] = useState<
    string | null
  >(null);

  const getFlightPrice = (
    dateObj: Date,
    departure: string,
    arrival: string,
  ) => {
    if (
      !departure ||
      !arrival ||
      departure.trim().toLowerCase() === arrival.trim().toLowerCase()
    )
      return null;

    const dateCopy = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
    );
    if (dateCopy < today) return null;

    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const depStr = departure.trim().toLowerCase();
    const arrStr = arrival.trim().toLowerCase();
    let depHash = 0;
    let arrHash = 0;
    for (let i = 0; i < depStr.length; i++) depHash += depStr.charCodeAt(i);
    for (let i = 0; i < arrStr.length; i++) arrHash += arrStr.charCodeAt(i);

    const hash = (day * 31 + month * 7 + depHash * 3 + arrHash) % 100;
    if (hash % 8 === 0) {
      return Math.round(120 + ((hash * 3.5) % 350));
    }
    return null;
  };

  const getFlightsForDate = (
    dateObj: Date,
    departure: string,
    arrival: string,
  ) => {
    const price = getFlightPrice(dateObj, departure, arrival);
    if (price === null) return [];

    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const depStr = departure.trim().toLowerCase();
    const arrStr = arrival.trim().toLowerCase();
    let depHash = 0;
    let arrHash = 0;
    for (let i = 0; i < depStr.length; i++) depHash += depStr.charCodeAt(i);
    for (let i = 0; i < arrStr.length; i++) arrHash += arrStr.charCodeAt(i);

    const hash = (day * 31 + month * 7 + depHash * 3 + arrHash) % 100;

    const airlines = [
      { name: "Delta Air Lines", code: "DL" },
      { name: "United Airlines", code: "UA" },
      { name: "American Airlines", code: "AA" },
      { name: "JetBlue Airways", code: "B6" },
    ];

    const flights = [];
    const flightCount = 1 + (hash % 3);

    for (let i = 0; i < flightCount; i++) {
      const airline = airlines[(hash + i) % airlines.length];
      const flightNum = 100 + ((hash * 7 + i * 23) % 899);
      const depHour = 6 + ((hash * 3 + i * 5) % 15);
      const depMin = ((hash + i * 15) % 4) * 15;
      const flightPrice = Math.round(price * (1 + (i * 0.1 - 0.1)));

      const depTimeStr = `${String(depHour).padStart(2, "0")}:${String(depMin).padStart(2, "0")}`;
      const arrHour = (depHour + 3 + (hash % 3)) % 24;
      const arrTimeStr = `${String(arrHour).padStart(2, "0")}:${String(depMin).padStart(2, "0")}`;

      flights.push({
        airline: airline.name,
        flightNo: `${airline.code}-${flightNum}`,
        departure: depTimeStr,
        arrival: arrTimeStr,
        price: flightPrice,
        from: departure,
        to: arrival,
      });
    }

    return flights;
  };

  const getHotelPrice = (dateObj: Date, city: string) => {
    if (!city) return null;

    const dateCopy = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
    );
    if (dateCopy < today) return null;

    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const cityStr = city.trim().toLowerCase();
    let cityHash = 0;
    for (let i = 0; i < cityStr.length; i++) cityHash += cityStr.charCodeAt(i);

    const hash = (day * 23 + month * 11 + cityHash) % 100;
    if (hash % 6 === 0) {
      return Math.round(85 + ((hash * 2.5) % 250));
    }
    return null;
  };

  const getHotelsForDate = (dateObj: Date, city: string) => {
    const price = getHotelPrice(dateObj, city);
    if (price === null) return [];

    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const cityStr = city.trim().toLowerCase();
    let cityHash = 0;
    for (let i = 0; i < cityStr.length; i++) cityHash += cityStr.charCodeAt(i);

    const hash = (day * 23 + month * 11 + cityHash) % 100;

    const hotels = [
      { name: "The Ritz-Carlton", stars: 5 },
      { name: "Hilton Grand Vacations", stars: 4 },
      { name: "Four Seasons Resort", stars: 5 },
      { name: "Sheraton Grand Hotel", stars: 4 },
      { name: "Marriott Premium Suites", stars: 4 },
    ];

    const count = 1 + (hash % 2);
    const results = [];
    for (let i = 0; i < count; i++) {
      const hotel = hotels[(hash + i) % hotels.length];
      const hotelPrice = Math.round(price * (1 + (i * 0.15 - 0.1)));
      results.push({
        hotelName: hotel.name,
        stars: hotel.stars,
        price: hotelPrice,
        city: city,
      });
    }
    return results;
  };

  const getCruisePrice = (dateObj: Date, city: string) => {
    const port = city || "Miami";
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const cityStr = port.trim().toLowerCase();
    let cityHash = 0;
    for (let i = 0; i < cityStr.length; i++) cityHash += cityStr.charCodeAt(i);

    const hash = (day * 17 + month * 13 + cityHash) % 100;
    return Math.round(380 + ((hash * 11.5) % 650));
  };

  const getCruisesForDate = (dateObj: Date, city: string) => {
    const port = city || "Miami, FL";
    const basePrice = getCruisePrice(dateObj, port) || 450;

    const cruiseOptions = [
      {
        line: "Royal Caribbean",
        route: "Western Caribbean & Perfect Day",
        nights: "7 Nights",
        priceOffset: 0,
        image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80",
      },
      {
        line: "Celebrity Cruises",
        route: "Bahamas & Key West Luxury Escape",
        nights: "4 Nights",
        priceOffset: -60,
        image: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&w=600&q=80",
      },
      {
        line: "Virgin Voyages",
        route: "Riviera Maya & Beach Club Voyage",
        nights: "5 Nights",
        priceOffset: 110,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      },
      {
        line: "Norwegian Cruise Line",
        route: "Eastern Caribbean Island Hopper",
        nights: "7 Nights",
        priceOffset: 45,
        image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=600&q=80",
      },
    ];

    return cruiseOptions.map((opt, idx) => ({
      line: opt.line,
      route: opt.route,
      nights: opt.nights,
      departurePort: port,
      price: Math.max(299, basePrice + opt.priceOffset + idx * 20),
      image: opt.image,
    }));
  };

  const [selectedStays, setSelectedStays] = useState<any[]>([]);
  const [selectedCruises, setSelectedCruises] = useState<any[]>([]);

  const handleCellClick = (dateObj: Date, isPrev: boolean, isNext: boolean) => {
    setSelectedCalDate(dateObj);
    if (isPrev) {
      handlePrevMonth();
    } else if (isNext) {
      handleNextMonth();
    }

    // Make Calendar cell clicks 100% interactive across all tabs
    if (dealsTab === "FBO") {
      // FBO date click: re-query REAL schedule for the selected date (no fabrication)
      const dStr =
        dateObj.getFullYear() +
        "-" +
        String(dateObj.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(dateObj.getDate()).padStart(2, "0");
      const fboTailNow = lastFboTelemetry?.tail;
      if (fboTailNow) {
        fetch(
          `/api/fbo/telemetry?icao=${encodeURIComponent(lastFboTelemetry?.icao || "LZU")}&tail=${encodeURIComponent(fboTailNow)}&date=${dStr}&handoff=${encodeURIComponent(activeHandoffLabel || "Tarmac SUV Meet")}`,
        )
          .then((r) => r.json())
          .then((j) => {
            if (j?.success) setLastFboTelemetry(j.data);
          })
          .catch(() => {});
      }
    }
  };

  const fetchRealFlights = async (
    dateObj: Date,
    departure: string,
    destination: string,
  ) => {
    if (!departure || !destination) {
      setSelectedFlights([]);
      return;
    }
    setFlightsLoading(true);
    try {
      const origin = await resolveCityToIata(departure);
      const dest = await resolveCityToIata(destination);
      if (!origin || !dest) {
        setSelectedFlights([]);
        setFlightsLoading(false);
        return;
      }
      const dateStr =
        dateObj.getFullYear() +
        "-" +
        String(dateObj.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(dateObj.getDate()).padStart(2, "0");
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const res = await fetch(apiBase + "/api/v1/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination: dest,
          departureDate: dateStr,
          passengers: [{ type: "adult" }],
        }),
      });
      const json = await res.json();
      const offers = json?.data?.offers || [];
      const mapped = offers.slice(0, 8).map((offer: any) => {
        const slice = offer.slices?.[0];
        const segs = slice?.segments || [];
        const seg = segs[0];
        const lastSeg = segs[segs.length - 1];
        return {
          airline: seg?.marketing_carrier?.name || "Unknown",
          airlineLogo: seg?.marketing_carrier?.logo_symbol_url || null,
          flightNo:
            (seg?.marketing_carrier?.iata_code || "") +
            (seg?.marketing_carrier_flight_number || ""),
          departure: seg?.departing_at
            ? new Date(seg.departing_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          arrival: lastSeg?.arriving_at
            ? new Date(lastSeg.arriving_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          duration: formatISODuration(slice?.duration),
          price: offer.total_amount
            ? Number(offer.total_amount).toFixed(0)
            : "",
          from: departure,
          to: destination,
        };
      });
      if (mapped.length > 0) {
        setSelectedFlights(mapped);
      } else {
        const fallbackFlights = getFlightsForDate(
          dateObj,
          departure || "ATL",
          destination || "JFK",
        );
        setSelectedFlights(fallbackFlights);
      }
    } catch (err) {
      console.warn("[Flights Search Failed]", err);
      const fallbackFlights = getFlightsForDate(
        dateObj,
        departure || "ATL",
        destination || "JFK",
      );
      setSelectedFlights(fallbackFlights);
    } finally {
      setFlightsLoading(false);
    }
  };
  useEffect(() => {
    if (dealsTab === "Flights") {
      fetchRealFlights(selectedCalDate, dealsDeparture, dealsDestination);
    }

    const targetCity = dealsDestination || dealsDeparture || "Atlanta";
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io"}/api/v1/hotels/city?city=${encodeURIComponent(targetCity)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        const real = Array.isArray(d?.data)
          ? d.data.filter((x: any) => x.price)
          : [];
        if (real.length > 0) {
          setSelectedStays(
            real.map((x: any) => ({
              hotelName: x.name,
              stars: Math.min(5, Math.round(x.stars || 4)),
              city: x.city || targetCity,
              price: x.price,
              image: x.image,
            })),
          );
        } else {
          const dynamicHotels = getHotelsForDate(selectedCalDate, targetCity);
          setSelectedStays(dynamicHotels);
        }
      })
      .catch(() => {
        const dynamicHotels = getHotelsForDate(selectedCalDate, targetCity);
        setSelectedStays(dynamicHotels);
      });

    const cruises = getCruisesForDate(selectedCalDate, dealsDeparture || "Miami");
    setSelectedCruises(cruises);

    const hasItems =
      dealsTab === "Flights" ||
      dealsTab === "Stays" ||
      (dealsTab === "Cruises" && cruises.length > 0) ||
      (dealsTab === "Events" &&
        (() => {
          const dStr =
            selectedCalDate.getFullYear() +
            "-" +
            String(selectedCalDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(selectedCalDate.getDate()).padStart(2, "0");
          return localEvents.some((e) => e.date === dStr);
        })());

    if (hasItems) {
      setSelectedFlightsDateStr(
        selectedCalDate.toLocaleDateString("default", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      );
    } else {
      setSelectedFlightsDateStr(null);
    }
  }, [
    dealsDeparture,
    dealsDestination,
    selectedCalDate,
    dealsTab,
    localEvents,
  ]);

  const [contactsList, setContactsList] = useState(() =>
    ChatManager.getContacts(),
  );
  // Open a chat directly from a notification click (?chat=<userId>)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const target = sp.get("chat");
      if (!target) return;
      if (!contactsList || !contactsList.length) return; // wait for contacts to load
      const hit = contactsList.find(
        (c: any) =>
          String(c.id) === String(target) ||
          String((c as any).userId || "") === String(target),
      );
      if (hit) {
        setSelectedId(hit.id);
        const url = new URL(window.location.href);
        url.searchParams.delete("chat");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    } catch {}
  }, [contactsList]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  useEffect(() => {
    const sync = () => {
      setContactsList([...ChatManager.getContacts()]);
      if (selectedId !== null) {
        setChatMessages([...ChatManager.getMessages(selectedId)]);
        // Join group room when opening a group chat
        const contact = ChatManager.getContacts().find(
          (c: any) => c.id === selectedId,
        );
        if (contact?.isGroup && ChatManager.getSocket()?.connected) {
          ChatManager.getSocket()?.emit("joinGroup", selectedId);
        }
      } else {
        setChatMessages([]);
      }
    };

    sync();

    const unsubscribe = ChatManager.subscribe(sync);
    return () => unsubscribe();
  }, [selectedId]);

  const { isCallActive, endCall, isCalling, isCallMuted, setIsCallMuted } =
    useCall();
  // Venue-card reserve/order buttons open the Concierge
  useEffect(() => {
    const handler = () => setSelectedId("101");
    window.addEventListener("flydna-concierge-request", handler);
    return () =>
      window.removeEventListener("flydna-concierge-request", handler);
  }, []);

  const selectedContact = useMemo(
    () => contactsList.find((contact) => contact.id === selectedId) ?? null,
    [selectedId, contactsList],
  );

  const filteredContacts = useMemo(() => {
    if (filter === "Online") {
      return contactsList.filter(
        (contact) =>
          contact.status === "Online" || contact.status === "Typing...",
      );
    }

    return contactsList;
  }, [filter, contactsList]);

  const handleRemoveContact = async (contactId: string) => {
    try {
      const token = getAuthToken();
      await fetch(`${BASE_URL}/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: { "auth-token": token || "" },
      });
      await ChatManager.refreshContacts();
    } catch (err) {
      console.error("Failed to remove contact:", err);
    }
  };

  // Handle Google contacts redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search || "");
    const googleContacts = params?.get ? params.get("google_contacts") : null;
    if (googleContacts) {
      try {
        const contacts = JSON.parse(decodeURIComponent(googleContacts));
        window.dispatchEvent(
          new MessageEvent("message", {
            data: { type: "GOOGLE_CONTACTS_SYNC", contacts },
          }),
        );
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      } catch {}
    }
  }, []);

  const handleSend = () => {
    if (!input.trim() || selectedId === null) return;
    ChatManager.sendMessage(selectedId, input);
    setInput("");
  };

  const handleMuteToggle = (_contactId: string) => {
    setIsCallMuted(!isCallMuted);
  };

  const handleClearHistory = (contactId: string) => {
    ChatManager.clearHistory(contactId);
  };

  const isMuted = selectedId !== null ? ChatManager.isMuted(selectedId) : false;

  return (
    <main className="min-h-screen overflow-x-hidden pb-5 transition-colors duration-500 text-[var(--text-main)] bg-[var(--bg-app)]">
      {/* Animated glowing liquid blobs background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 -top-20 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-1)_0%,transparent_70%)] animate-blob-1" />
        <div className="absolute right-10 top-32 h-[450px] w-[450px] bg-[radial-gradient(circle,var(--blob-color-2)_0%,transparent_70%)] animate-blob-2" />
        <div className="absolute -bottom-20 left-1/3 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-3)_0%,transparent_70%)] animate-blob-3" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1920px] flex-col gap-7 p-4 md:p-6 md:pb-4 pt-20 md:pt-24">
        <Header
          isDarkMode={isDarkMode}
          onThemeToggle={toggleDarkMode}
          activeTab={activeTab}
          setActiveTab={handleActiveTabChange}
        />

        <section className="grid flex-1 gap-5 xl:grid-cols-[1.02fr_1fr]">
          <div className="grid h-[800px] 2xl:h-[900px] gap-5 lg:grid-rows-[1fr_490px]">
            <MapPanel
              selectedContact={selectedContact}
              onSelect={setSelectedId}
              isDarkMode={isDarkMode}
            />
            <ContactsPanel
              contacts={filteredContacts}
              selectedId={selectedId}
              filter={filter}
              onFilterChange={setFilter}
              onSelect={setSelectedId}
              onRemove={handleRemoveContact}
            />
          </div>

          <ChatPanel
            contacts={contactsList}
            selectedContact={selectedContact}
            chatMessages={chatMessages}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            onClose={() => setSelectedId(null)}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            onClearHistory={handleClearHistory}
            isCallActive={isCallActive}
            isCalling={isCalling}
            onEndCall={() => endCall(selectedContact?.id)}
            onSelectContact={(c) => {
              const match = contactsList.find(
                (x) =>
                  x.id === c.id ||
                  x.contactId === c.id ||
                  (c.name && x.name?.toLowerCase() === c.name.toLowerCase()),
              );
              if (match) setSelectedId(match.id);
              else
                alert(
                  `${c.name || "This member"} isn't in your contacts yet. Add them to start a 1v1 chat.`,
                );
            }}
          />
        </section>

        {/* Full-width premium row section for Deals, Calendar, and Live Feed */}
        <section className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-stretch">
          {/* Column 1: FlyDnA Deals Card */}
          <div
            className={`flex flex-col justify-stretch [&>*]:flex-1 relative overflow-visible transition-all duration-300 ${
              isSixWeekMonth ? "h-[385px]" : "h-[345px]"
            }`}
            style={{ perspective: "1200px" }}
          >
            <FlyDnaDealsCard
              dealsTab={dealsTab}
              setDealsTab={setDealsTab}
              dealsDeparture={dealsDeparture}
              setDealsDeparture={setDealsDeparture}
              dealsDestination={dealsDestination}
              setDealsDestination={setDealsDestination}
              onEventsSearch={() => setEventsSearchTick((t) => t + 1)}
              onKeywordChange={(kw) => {
                setDealsKeyword(kw);
                setEventsSearchTick((t) => t + 1);
              }}
              onFboSearch={(telemetry) => {
                if (!telemetry) return;
                setLastFboTelemetry(telemetry);
                const todayStr =
                  telemetry.date || new Date().toISOString().split("T")[0];
                const newFboEv = {
                  id: `fbo-${Date.now()}`,
                  name: `🛩️ FBO ${telemetry.tail || "—"} (${telemetry.fboName || telemetry.icao})`,
                  date: todayStr,
                  time: telemetry.eta || "—",
                  city: telemetry.icao || "LZU",
                  venue: telemetry.fboName || "Gwinnett Aero",
                  category: "Flight",
                };
                setLocalEvents((prev) => [newFboEv, ...prev]);
                setCurrentCalDate(new Date());
                setSelectedCalDate(new Date());
                setEventsSearchTick((t) => t + 1);
              }}
              onHandoffChange={(h) => setActiveHandoffLabel(h)}
            />
          </div>

          {/* Column 2: Calendar & Agenda Card */}
          <div
            className={`glass-panel-heavy rounded-[26px] p-5 flex flex-col justify-between relative overflow-hidden bg-[radial-gradient(circle_at_0%_0%,rgba(6,182,212,0.03),transparent_50%)] transition-all duration-300 ${
              isSixWeekMonth ? "h-[385px]" : "h-[345px]"
            }`}
          >
            <AnimatePresence mode="wait">
              {calendarView === "grid" ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col h-full justify-between"
                >
                  {/* Top row: Logo, Title, and Return to Today Button */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div>
                        <h3 className="font-extrabold text-sm tracking-wide uppercase text-slate-200">
                          Calendar
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                          Exclusive deals
                        </p>
                      </div>
                    </div>

                    {/* Return to Today Pill Button */}
                    <button
                      onClick={() => {
                        setCurrentCalDate(today);
                        setSelectedCalDate(today);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[10px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-0 outline-none active:scale-95 shadow-sm"
                      title="Return to today's date"
                    >
                      <span className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      <span>Today</span>
                    </button>
                  </div>

                  {/* Centered Month & Year Navigator Bar */}
                  <div className="flex items-center justify-between px-2 py-0.5 mb-1 rounded-xl bg-white/[0.02]">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer border-0 outline-none flex items-center justify-center"
                      title="Previous Month"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <span className="text-slate-100 text-xs font-black tracking-widest uppercase select-none">
                      {currentCalDate.toLocaleString("default", {
                        month: "long",
                      })}{" "}
                      {currentCalDate.getFullYear()}
                    </span>

                    <button
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer border-0 outline-none flex items-center justify-center"
                      title="Next Month"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 flex-1 w-full items-center justify-items-center content-center gap-y-1.5 gap-x-1">
                    {/* Days of week */}
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d, i) => (
                        <span
                          key={i}
                          className="text-slate-500 font-black text-[10px] tracking-widest uppercase text-center select-none pb-0.5"
                        >
                          {d}
                        </span>
                      ),
                    )}

                    {/* Calendar cells */}
                    {(() => {
                      const year = currentCalDate.getFullYear();
                      const month = currentCalDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const startDayIndex = (firstDay.getDay() + 6) % 7;
                      const prevMonthLastDate = new Date(
                        year,
                        month,
                        0,
                      ).getDate();
                      const currentMonthDays = new Date(
                        year,
                        month + 1,
                        0,
                      ).getDate();

                      const cells: {
                        date: Date;
                        isCurrentMonth: boolean;
                        type: "prev" | "current" | "next";
                      }[] = [];

                      for (let i = startDayIndex - 1; i >= 0; i--) {
                        cells.push({
                          date: new Date(
                            year,
                            month - 1,
                            prevMonthLastDate - i,
                          ),
                          isCurrentMonth: false,
                          type: "prev",
                        });
                      }

                      for (let i = 1; i <= currentMonthDays; i++) {
                        cells.push({
                          date: new Date(year, month, i),
                          isCurrentMonth: true,
                          type: "current",
                        });
                      }

                      const totalSlots = cells.length > 35 ? 42 : 35;
                      const nextDaysNeeded = totalSlots - cells.length;
                      for (let i = 1; i <= nextDaysNeeded; i++) {
                        cells.push({
                          date: new Date(year, month + 1, i),
                          isCurrentMonth: false,
                          type: "next",
                        });
                      }

                      return cells.map((cell, idx) => {
                        const dateObj = cell.date;
                        const isSelected =
                          selectedCalDate.toDateString() ===
                          dateObj.toDateString();
                        const isToday =
                          today.toDateString() === dateObj.toDateString();
                        const price =
                          dealsTab === "Events"
                            ? (() => {
                                const dStr =
                                  dateObj.getFullYear() +
                                  "-" +
                                  String(dateObj.getMonth() + 1).padStart(
                                    2,
                                    "0",
                                  ) +
                                  "-" +
                                  String(dateObj.getDate()).padStart(2, "0");
                                const ev = localEvents.find(
                                  (e) => e.date === dStr,
                                );
                                return ev &&
                                  ev.priceMin !== undefined &&
                                  ev.priceMin !== null
                                  ? Math.round(ev.priceMin)
                                  : ev
                                    ? 45
                                    : null;
                              })()
                            : dealsTab === "Stays"
                              ? getHotelPrice(
                                  dateObj,
                                  dealsDestination || dealsDeparture,
                                )
                              : dealsTab === "Cruises"
                                ? getCruisePrice(dateObj, dealsDeparture)
                                : getFlightPrice(
                                    dateObj,
                                    dealsDeparture,
                                    dealsDestination,
                                  );

                        return (
                          <div
                            key={`cell-${idx}`}
                            className="relative w-full flex items-center justify-center"
                          >
                            <button
                              onClick={() => {
                                handleCellClick(
                                  dateObj,
                                  cell.type === "prev",
                                  cell.type === "next",
                                );
                              }}
                              className={`w-full aspect-square max-h-[32px] max-w-[32px] rounded-full flex items-center justify-center transition-all duration-300 relative group cursor-pointer border-0 outline-none ${
                                isSelected
                                  ? "bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] dark:from-cyan-500 dark:to-blue-600 text-white font-black shadow-[var(--glow-primary)] dark:shadow-[0_0_12px_rgba(0,229,255,0.4)] scale-105"
                                  : isToday
                                    ? "bg-[var(--accent-primary)]/15 dark:bg-cyan-500/15 text-[var(--accent-primary)] dark:text-cyan-400 font-extrabold shadow-[var(--glow-primary)] dark:shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                                    : cell.isCurrentMonth
                                      ? "text-[var(--text-main)] hover:bg-white/[0.04]"
                                      : "text-slate-600 hover:text-slate-400 hover:bg-white/[0.02]"
                              }`}
                            >
                              <span className="text-[11px] font-bold group-hover:scale-105 transition-transform">
                                {dateObj.getDate()}
                              </span>

                              {/* Task Dot indicator */}
                              {getTodosForDate(dateObj).length > 0 && (
                                <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.7)] animate-pulse" />
                              )}

                              {price !== null && (
                                <span
                                  className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full text-[8.5px] font-extrabold leading-tight tracking-tight border transition-all duration-300 ${
                                    isSelected
                                      ? "bg-emerald-500 text-white border-emerald-400"
                                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400"
                                  }`}
                                >
                                  ${price}
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="agenda"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col h-full justify-between text-left"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <button
                      onClick={() => setCalendarView("grid")}
                      className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition cursor-pointer flex items-center gap-1"
                    >
                      ← Calendar
                    </button>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase leading-none">
                      {selectedCalDate.toLocaleDateString("default", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      Agenda
                    </span>
                  </div>

                  {/* Todo List Scrollable Area */}
                  <div className="flex-grow overflow-y-auto pr-1.5 scrollbar-none space-y-2 mb-2.5 max-h-[190px]">
                    {getTodosForDate(selectedCalDate).length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs font-semibold">
                        No reminders for this day.
                      </div>
                    ) : (
                      getTodosForDate(selectedCalDate).map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/5 text-[11px] font-bold"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!todo.completed}
                              onChange={() => {
                                const updated = todos.map((t) =>
                                  t.id === todo.id
                                    ? { ...t, completed: !t.completed }
                                    : t,
                                );
                                saveTodos(updated);
                              }}
                              className="size-3.5 rounded border-white/10 bg-white/5 accent-cyan-400 text-black cursor-pointer"
                            />
                            <span
                              className={`text-slate-200 ${
                                todo.completed
                                  ? "line-through text-slate-500 font-normal"
                                  : ""
                              }`}
                            >
                              {todo.text}
                            </span>
                            <span
                              className={`text-[8px] px-1 py-[1px] rounded border ${
                                todo.category === "Meeting"
                                  ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                  : todo.category === "Flight"
                                    ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                    : todo.category === "Cruise"
                                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              {todo.category}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const updated = todos.filter(
                                (t) => t.id !== todo.id,
                              );
                              saveTodos(updated);
                            }}
                            className="p-1 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Todo Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const text = (
                        form.elements.namedItem("todoText") as HTMLInputElement
                      ).value;
                      const cat = (
                        form.elements.namedItem("todoCat") as HTMLSelectElement
                      ).value as any;
                      if (!text.trim()) return;
                      const newTodo = {
                        id: String(Date.now()),
                        text,
                        category: cat,
                        date: formatDateKey(selectedCalDate),
                        completed: false,
                      };
                      saveTodos([...todos, newTodo]);
                      form.reset();
                    }}
                    className="flex gap-1.5 border-t border-white/5 pt-2"
                  >
                    <input
                      name="todoText"
                      type="text"
                      placeholder="Add reminder..."
                      className="flex-grow bg-[#06111f]/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    />
                    <select
                      name="todoCat"
                      className="bg-[#06111f]/80 border border-white/10 rounded-lg px-1 text-[10px] text-slate-400 font-bold outline-none cursor-pointer"
                    >
                      <option value="Reminder">Remind</option>
                      <option value="Meeting">Meet</option>
                      <option value="Flight">Flight</option>
                      <option value="Cruise">Cruise</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-white font-black text-xs cursor-pointer active:scale-95 transition"
                    >
                      +
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Column 3: Redesigned Category-Tailored FlyDnA Live Feeds Panel */}
          <LiveFeedsPanel
            dealsTab={dealsTab}
            setDealsTab={setDealsTab}
            dealsDeparture={dealsDeparture}
            setDealsDeparture={setDealsDeparture}
            dealsDestination={dealsDestination}
            setDealsDestination={setDealsDestination}
            dealsKeyword={dealsKeyword}
            selectedCalDate={selectedCalDate}
            selectedStays={selectedStays}
            selectedFlights={selectedFlights}
            localEvents={localEvents}
            selectedCruises={selectedCruises}
            lastFboTelemetry={lastFboTelemetry}
            activeHandoffLabel={activeHandoffLabel}
            liveFeed={liveFeed}
            isSixWeekMonth={isSixWeekMonth}
            onShareItem={(item) => setShareModal({ open: true, item })}
            onOpenSeating={(event) => setSeatingModal({ open: true, event })}
          />
        </section>

        {/* SHARE TO CONTACTS MODAL */}
        <AnimatePresence>
          <SeatingChartModal
            isOpen={seatingModal.open}
            onClose={() => setSeatingModal({ open: false, event: null })}
            event={seatingModal.event}
          />
          {shareModal.open && shareModal.item && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md overflow-hidden glass-panel-heavy rounded-3xl border border-cyan-400/30 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-white backdrop-blur-2xl bg-gradient-to-b from-[#0a1120] to-[#040814]"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                      <Share2 size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-extrabold text-sm text-white">
                        Share to FlyDnA Contacts
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Select a contact or group to share this deal
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShareModal({ open: false, item: null })}
                    className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Item Preview Card */}
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 mb-4 text-left">
                  <span className="text-[9px] font-black uppercase text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    {shareModal.item.category}
                  </span>
                  <h4 className="font-black text-xs text-white mt-1">
                    {shareModal.item.title}
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                    {shareModal.item.details}
                  </p>
                  {shareModal.item.price && (
                    <span className="inline-block mt-2 text-[10px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded">
                      {shareModal.item.price}
                    </span>
                  )}
                </div>

                {/* Contacts List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                  {shareContactsList.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleExecuteShare(contact)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 transition duration-200 group cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-400/30">
                          {contact.avatar}
                        </span>
                        <div>
                          <span className="font-black text-xs text-white group-hover:text-cyan-300 transition">
                            {contact.name}
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {contact.role}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition">
                        <Send size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </main>
  );
}
