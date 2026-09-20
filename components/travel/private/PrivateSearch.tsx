"use client";

import React, { useState, useEffect } from "react";
import { useSearchStore } from "@/utils/states/useSearchStore";
import {
  Plane,
  Users,
  Wifi,
  Dog,
  Coffee,
  Utensils,
  Phone,
  Bed,
  Bath,
  VolumeX,
  Sparkles,
  Check,
  Armchair,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PrivateJetModal from "../PrivateJetModal";

function getFeatureIcon(feature: string) {
  const f = feature.toLowerCase();
  if (f.includes("wifi")) return <Wifi className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("pet")) return <Dog className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("lavatory") || f.includes("lavatories")) return <Bath className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("refreshment") || f.includes("snack")) return <Coffee className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("catering") || f.includes("meal") || f.includes("galley")) return <Utensils className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("phone")) return <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("sleep") || f.includes("bed") || f.includes("shower")) return <Bed className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("quiet")) return <VolumeX className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (f.includes("attendant") || f.includes("lounge") || f.includes("cabin")) return <Armchair className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  return <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
}

interface CharterOption {
  id: string;
  name: string;
  model: string;
  passengers: number;
  pricePerHour: number;
  totalCost: number;
  durationHours: number;
  features: string[];
  exteriorImg: string;
  interiorImg: string;
  aircraftClass: "light" | "midsize" | "super-midsize" | "heavy";
}

export default function PrivateSearch() {
  // Pre-fill from empty-leg BOOK handoffs: ?from=PDK&to=TEB&date=...
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const f = sp.get("from");
      const t = sp.get("to");
      const d = sp.get("date");
      if (!f && !t && !d) return;
      const store = useSearchStore.getState();
      const AIRPORT_COORDS: Record<string, [number, number]> = {
        PDK: [-84.302, 33.8756],
        RYY: [-84.5971, 34.0132],
        LZU: [-83.9622, 33.9781],
        FTY: [-84.5213, 33.7791],
        ATL: [-84.4277, 33.6407],
        TEB: [-74.0608, 40.8501],
        JFK: [-73.7781, 40.6413],
        MIA: [-80.2906, 25.7959],
        LAX: [-118.4085, 33.9416],
        LAS: [-115.1537, 36.084],
        MCO: [-81.3081, 28.4312],
        BNA: [-86.6782, 36.1263],
        VNY: [-118.49, 34.2098],
        HPN: [-73.7076, 41.067],
        OPF: [-80.2717, 25.907],
        APF: [-81.7753, 26.1526],
        ASE: [-106.869, 39.2232],
        EGE: [-106.9177, 39.6426],
        SDL: [-111.9105, 33.6229],
        DAL: [-96.8517, 32.8471],
      };
      const mk = (code: string) => ({
        id: "icao-" + code,
        city: code,
        airport: code + " (General Aviation)",
        code,
        coordinates: AIRPORT_COORDS[code] || null,
      });
      if (f) store.setDeparture(mk(f) as any);
      if (t) store.setArrival(mk(t) as any);
      if (d) store.setDepartureDate(d);
      const ac = sp.get("aircraft");
      if (ac) {
        const a = ac.toLowerCase();
        const cls = /pc-12|king air|caravan|pilatus/.test(a)
          ? "turboprop"
          : /phenom|cj|citation m2|learjet 7|hondajet|light/.test(a)
            ? "light"
            : /challenger 3|citation x|sovereign|super/.test(a)
              ? "super-midsize"
              : /hawker|xls|latitude|lear 60|mid/.test(a)
                ? "midsize"
                : /gulfstream|global|falcon 7|falcon 8|challenger 6|g[45]50|g500|g600|heavy/.test(
                      a,
                    )
                  ? "heavy"
                  : "";
        if (cls)
          try {
            sessionStorage.setItem(
              "flydna_jet_class",
              JSON.stringify({ v: cls, t: Date.now() }),
            );
          } catch {}
      }
    } catch {}
  }, []);
  const router = useRouter();
  const { departure, arrival, departureDate, returnDate, tripType } =
    useSearchStore();

  // Modal & View States
  const [selectedJet, setSelectedJet] = useState<CharterOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModes, setViewModes] = useState<
    Record<string, "exterior" | "interior">
  >({});

  const originCode = departure?.code || "ATL";
  const originName = departure?.city || "Atlanta";
  const destCode =
    arrival?.code ||
    (arrival?.airport?.match(/\(([A-Z0-9]{3,4})\)/)?.[1] ?? "");
  const destName = arrival?.city || "";

  // Calculated flight time based on distance (mocked)
  const durationHours = 1.8;

  const jetOptions: CharterOption[] = [
    {
      id: "light-jet",
      name: "Phenom 300",
      model: "Embraer Light Jet",
      passengers: 6,
      pricePerHour: 3500,
      totalCost: Math.round(3500 * durationHours),
      durationHours,
      features: [
        "Complementary WiFi",
        "Enclosed Lavatory",
        "Pet Friendly",
        "Refreshments Included",
      ],
      exteriorImg: "/assets/jets/phenom_300_exterior.png",
      interiorImg: "/assets/jets/phenom_300_interior.png",
      aircraftClass: "light",
    },
    {
      id: "midsize-jet",
      name: "Hawker 800XP",
      model: "Beechcraft Midsize Jet",
      passengers: 8,
      pricePerHour: 4800,
      totalCost: Math.round(4800 * durationHours),
      durationHours,
      features: [
        "Standing Cabin",
        "Gourmet Catering",
        "Flight Attendant",
        "High-Speed WiFi",
      ],
      exteriorImg: "/assets/jets/hawker_800xp_exterior.png",
      interiorImg: "/assets/jets/phenom_300_interior.png",
      aircraftClass: "midsize",
    },
    {
      id: "super-mid",
      name: "Challenger 300",
      model: "Bombardier Super Midsize Jet",
      passengers: 9,
      pricePerHour: 6200,
      totalCost: Math.round(6200 * durationHours),
      durationHours,
      features: [
        "Full Galley",
        "Sleep Configurations",
        "Ultra Quiet Cabin",
        "SatPhone",
      ],
      exteriorImg: "/assets/jets/challenger_300_exterior.png",
      interiorImg: "/assets/jets/phenom_300_interior.png",
      aircraftClass: "super-midsize",
    },
    {
      id: "heavy-jet",
      name: "Gulfstream G450",
      model: "Gulfstream Heavy Jet",
      passengers: 14,
      pricePerHour: 8500,
      totalCost: Math.round(8500 * durationHours),
      durationHours,
      features: [
        "Executive Lounge Layout",
        "Full Hot Meals",
        "Dual Lavatories",
        "Bedding & Shower",
      ],
      exteriorImg: "/assets/jets/gulfstream_g450_exterior.png",
      interiorImg: "/assets/jets/phenom_300_interior.png",
      aircraftClass: "heavy",
    },
  ];

  const handleBookClick = (jet: CharterOption) => {
    setSelectedJet(jet);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-0 py-8 relative">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800/80 pb-5">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          Private Jet Charters
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Available charter aircraft from{" "}
          <span className="text-slate-200 font-semibold">
            {originName} ({originCode})
          </span>{" "}
          to{" "}
          <span className="text-slate-200 font-semibold">
            {destName || "Selected Destination"}{" "}
            {destCode ? `(${destCode})` : ""}
          </span>
          .
        </p>
      </div>

      {/* Grid of Available Aircraft (Max 2 nested containers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jetOptions.map((jet) => {
          const isInterior = viewModes[jet.id] === "interior";

          return (
            <div
              key={jet.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition duration-200 text-white"
            >
              {/* Top Row: Title, Class & Rate */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-blue-400 uppercase">
                    {jet.name}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {jet.model}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Hourly Rate
                  </span>
                  <span className="text-lg font-bold font-mono text-blue-400">
                    ${jet.pricePerHour.toLocaleString()}
                    <span className="text-xs text-slate-500 font-sans">
                      /hr
                    </span>
                  </span>
                </div>
              </div>

              {/* Aircraft Photo & View Controls */}
              <div className="my-3 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden relative group">
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 p-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-medium">
                  <button
                    onClick={() =>
                      setViewModes((prev) => ({
                        ...prev,
                        [jet.id]: "exterior",
                      }))
                    }
                    className={`px-2 py-0.5 rounded transition ${
                      !isInterior
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Exterior
                  </button>
                  <button
                    onClick={() =>
                      setViewModes((prev) => ({
                        ...prev,
                        [jet.id]: "interior",
                      }))
                    }
                    className={`px-2 py-0.5 rounded transition ${
                      isInterior
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Cabin
                  </button>
                </div>

                <div className="w-full h-52 relative overflow-hidden bg-slate-950">
                  <img
                    src={isInterior ? jet.interiorImg : jet.exteriorImg}
                    alt={`${jet.name} ${isInterior ? "Cabin Interior" : "Exterior"}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Specs & Features Grid with exact Lucide icons */}
              <div className="grid grid-cols-2 gap-2.5 py-3 border-t border-slate-800/60 my-1 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Up to {jet.passengers} Passengers</span>
                </div>
                {jet.features.slice(0, 3).map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-slate-300"
                  >
                    {getFeatureIcon(feat)}
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Footer: Price & Book Button */}
              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between mt-1">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Estimated Total
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    ${jet.totalCost.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleBookClick(jet)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer active:scale-98 text-xs tracking-wider uppercase shadow-sm"
                >
                  Book Charter
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      <PrivateJetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialOrigin={originCode}
        initialDestination={destCode}
        initialAircraftClass={selectedJet?.aircraftClass || "midsize"}
      />
    </div>
  );
}
