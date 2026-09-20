"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Car,
  MapPin,
  Briefcase,
  Dog,
  CheckCircle2,
  ShieldAlert,
  UtensilsCrossed,
  Lock,
} from "lucide-react";

interface GuestPassenger {
  id: string;
  name: string;
  dob: string;
  gender: string;
  passportOrGovId: string;
  weightLbs: string;
}

interface PrivateJetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrigin?: string;
  initialDestination?: string;
  initialAircraftClass?: "light" | "midsize" | "super-midsize" | "heavy";
  initialStep?: "route" | "manifest" | "fbo";
  initialDepartureDate?: string;
  initialReturnDate?: string;
  initialTripType?: string;
}

const FBO_DICTIONARY: Record<string, { fboName: string; address: string }> = {
  ATL: {
    fboName: "Signature Flight Support (ATL/PDK)",
    address: "2000 Aviation Way, Atlanta, GA 30341",
  },
  PDK: {
    fboName: "Signature Flight Support (PDK)",
    address: "2000 Aviation Way, Atlanta, GA 30341",
  },
  JFK: {
    fboName: "Sheltair Aviation (JFK)",
    address: "1450 JFK Airport Rd, Jamaica, NY 11430",
  },
  TEB: {
    fboName: "Signature Flight Support (TEB)",
    address: "201 Industrial Ave, Teterboro, NJ 07608",
  },
  LAX: {
    fboName: "Atlantic Aviation (LAX)",
    address: "6423 W Imperial Hwy, Los Angeles, CA 90045",
  },
  VNY: {
    fboName: "Signature Flight Support (VNY)",
    address: "7432 Hayvenhurst Ave, Van Nuys, CA 91406",
  },
  MIA: {
    fboName: "Fontainebleau Aviation (OPF/MIA)",
    address: "14200 NW 42nd Ave, Opa-locka, FL 33054",
  },
  OPF: {
    fboName: "Fontainebleau Aviation (OPF)",
    address: "14200 NW 42nd Ave, Opa-locka, FL 33054",
  },
  ORD: {
    fboName: "Signature Flight Support (ORD)",
    address: "10555 W Higgins Rd, Rosemont, IL 60018",
  },
  LAS: {
    fboName: "Signature Flight Support (LAS)",
    address: "6005 Las Vegas Blvd S, Las Vegas, NV 89119",
  },
  LHR: {
    fboName: "Signature Flight Support London (LTN)",
    address: "President Way, Luton LU2 9NW, UK",
  },
  CDG: {
    fboName: "Jetex Paris Le Bourget (LBG)",
    address: "Aéroport du Bourget, 93350 Le Bourget, France",
  },
};

type AircraftClass = "turboprop" | "light" | "midsize" | "super-midsize" | "heavy";

interface SubmittedCharterRequest {
  requestId: string;
  paxCount: number;
  exportToken?: string | null;
  [key: string]: unknown;
}

const AIRCRAFT_HOURLY: Record<AircraftClass, number> = {
  turboprop: 1800,
  light: 2600,
  midsize: 3400,
  "super-midsize": 4300,
  heavy: 6200,
};

const AIRPORT_DIST: Record<string, number> = {
  "ATL-TEB": 665,
  "PDK-TEB": 660,
  "RYY-TEB": 655,
  "LZU-TEB": 650,
  "FTY-TEB": 665,
  "ATL-MIA": 515,
  "PDK-VNY": 1690,
  "ATL-LAS": 1520,
  "ATL-LAX": 1700,
  "TEB-MIA": 950,
  "MIA-LAS": 2175,
  "LAX-LAS": 236,
};

const getDistNm = (a: string, b: string) =>
  AIRPORT_DIST[`${a.toUpperCase()}-${b.toUpperCase()}`] ||
  AIRPORT_DIST[`${b.toUpperCase()}-${a.toUpperCase()}`] ||
  800;

export default function PrivateJetModal({
  isOpen,
  onClose,
  initialOrigin = "ATL",
  initialDestination = "",
  initialAircraftClass = "midsize",
  initialStep = "route",
  initialDepartureDate = "",
  initialReturnDate = "",
  initialTripType = "",
}: PrivateJetModalProps) {
  const [step, setStep] = useState<"route" | "manifest" | "fbo" | "payment">(
    initialStep,
  );
  const [routeType, setRouteType] = useState<
    "one-way" | "round-trip" | "multi-leg"
  >(() => (initialTripType === "Round Trip" ? "round-trip" : "one-way"));
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [departureDate, setDepartureDate] = useState(() => {
    if (initialDepartureDate) {
      try {
        const d = new Date(initialDepartureDate);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {}
    }
    return "2026-09-10";
  });
  const [timeFlexibility, setTimeFlexibility] = useState(
    "Exact Time (02:00 PM)",
  );
  const [aircraftClass, setAircraftClass] = useState<AircraftClass>(() => {
    let sc: string | undefined = initialAircraftClass;
    if (typeof sessionStorage !== "undefined") {
      try {
        const raw = sessionStorage.getItem("flydna_jet_class");
        if (raw) {
          const note = raw.startsWith("{")
            ? JSON.parse(raw)
            : { v: raw, t: Date.now() };
          if (note.v && Date.now() - (note.t || 0) < 60000) sc = note.v;
        }
      } catch {}
    }
    if (
      sc &&
      (["turboprop", "light", "midsize", "super-midsize", "heavy"] as const).includes(
        sc as AircraftClass,
      )
    ) {
      return sc as AircraftClass;
    }
    return "midsize";
  });

  // Lead Passenger TSA Secure Flight Fields
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadDob, setLeadDob] = useState("");
  const [leadGender, setLeadGender] = useState("M");
  const [leadPassport, setLeadPassport] = useState("");
  const [leadWeight, setLeadWeight] = useState("180");

  // Dynamic Guest Manifest
  const [guests, setGuests] = useState<GuestPassenger[]>([]);

  // Weight & Balance
  const [luggageCount, setLuggageCount] = useState("4");
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState("");

  // Legally Declared Firearms & Security Equipment
  const [hasFirearms, setHasFirearms] = useState(false);
  const [hardCaseConfirmed, setHardCaseConfirmed] = useState(true);
  const [ammoDeclared, setAmmoDeclared] = useState(false);
  const [firearmDetails, setFirearmDetails] = useState("");

  // In-Flight VIP Catering & Fine Dining
  const [cateringPreferences, setCateringPreferences] = useState("");

  const [specialRequests, setSpecialRequests] = useState("");
  const [specialHandling, setSpecialHandling] = useState("");
  const [returnDate, setReturnDate] = useState(() => {
    if (initialReturnDate) {
      try {
        const d = new Date(initialReturnDate);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {}
    }
    return "";
  });
  const [returnTime, setReturnTime] = useState("");
  const [extraLegs, setExtraLegs] = useState<
    { from: string; to: string; date: string; flex: string }[]
  >([]);
  // ── Step 4: Payment Authorization (hold only — capture happens at quote-confirm) ──
  const estimatedPrice = React.useMemo(() => {
    const hourly = AIRCRAFT_HOURLY[aircraftClass] || 3200;
    const hrs = Math.max(0.5, getDistNm(origin, destination) / 420);
    const base = Math.round(hourly * hrs);
    return base + Math.round(base * 0.26);
  }, [aircraftClass, origin, destination]);
  const authCeiling = Math.round(estimatedPrice * 1.15);
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [payError, setPayError] = useState("");
  const [authorizing, setAuthorizing] = useState(false);

  // Auto-Populated Departure & Arrival FBO Details (Editable)
  const [departureFboName, setDepartureFboName] = useState("");
  const [departureFboAddress, setDepartureFboAddress] = useState("");
  const [arrivalFboName, setArrivalFboName] = useState("");
  const [arrivalFboAddress, setArrivalFboAddress] = useState("");

  // Ground Transport Cross-Sell (LUXY Black Car to FBO)
  const [requestLUXY, setRequestLUXY] = useState(true);
  const [pickupAddress, setPickupAddress] = useState("");

  // Auto-populate FBO addresses whenever origin or destination changes
  React.useEffect(() => {
    const origKey = (origin || "ATL").trim().toUpperCase();
    const destKey = (destination || "").trim().toUpperCase();

    const depFbo = FBO_DICTIONARY[origKey] || {
      fboName: `Signature Flight Support (${origKey})`,
      address: `100 Executive Aviation Way, ${origKey} Airport`,
    };
    const arrFbo = FBO_DICTIONARY[destKey] || {
      fboName: `Sheltair / Atlantic Aviation (${destKey})`,
      address: `500 Private Ramp Rd, ${destKey} Airport`,
    };

    setDepartureFboName(depFbo.fboName);
    setDepartureFboAddress(depFbo.address);
    setArrivalFboName(arrFbo.fboName);
    setArrivalFboAddress(arrFbo.address);

    // Auto-populate LUXY Pickup/Dropoff address with Arrival FBO upon landing
    setPickupAddress(arrFbo.address);
  }, [origin, destination]);

  // State Management
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "error" | "loading" | "success"
  >("idle");
  const [submittedRequest, setSubmittedRequest] =
    useState<SubmittedCharterRequest | null>(null);

  const addGuest = () => {
    setGuests([
      ...guests,
      {
        id: `guest_${Date.now()}`,
        name: "",
        dob: "",
        gender: "M",
        passportOrGovId: "",
        weightLbs: "170",
      },
    ]);
  };

  const removeGuest = (id: string) => {
    setGuests(guests.filter((g) => g.id !== id));
  };

  const updateGuest = (
    id: string,
    field: keyof GuestPassenger,
    value: string,
  ) => {
    setGuests(guests.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const authorizeAndSubmit = async () => {
    setPayError("");
    if (paymentMethod !== "credit-card") {
      setPayError("This payment method is coming soon — please use a card.");
      return;
    }
    if (!leadName || !leadEmail) {
      setPayError("Lead passenger name and email are required — see Step 2.");
      return;
    }
    const digits = cardNumber.replace(/\D/g, "");
    const luhn = (n: string) => {
      let sum = 0,
        dbl = false;
      for (let i = n.length - 1; i >= 0; i--) {
        let d = +n[i];
        if (dbl) {
          d *= 2;
          if (d > 9) d -= 9;
        }
        sum += d;
        dbl = !dbl;
      }
      return sum % 10 === 0;
    };
    if (!cardName.trim()) {
      setPayError("Card holder name is required.");
      return;
    }
    if (digits.length < 13 || digits.length > 19 || !luhn(digits)) {
      setPayError("Please enter a valid card number.");
      return;
    }
    if (!/^\d{2}\s*\/?\s*\d{2}$/.test(cardExpiry.trim())) {
      setPayError("Expiry must be MM/YY.");
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvc.trim())) {
      setPayError("CVC must be 3-4 digits.");
      return;
    }
    setAuthorizing(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const res = await fetch(`${apiBase}/api/jets/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedMax: authCeiling }),
      });
      const data = await res.json();
      if (!data.success) {
        setPayError(data.error || "Authorization failed.");
        setAuthorizing(false);
        return;
      }
      await handleSubmit({
        paymentIntentId: data.paymentIntentId,
        authorizedMax: data.authorizedMax,
      });
    } catch {
      setPayError("Could not reach authorization service.");
    }
    setAuthorizing(false);
  };
  const handleSubmit = async (authInfo?: {
    paymentIntentId: string;
    authorizedMax: number;
  }) => {
    if (!leadName || !leadEmail) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 2500);
      return;
    }

    setSubmitStatus("loading");

    const fullManifest = [
      {
        isLead: true,
        name: leadName,
        dob: leadDob,
        gender: leadGender,
        passportOrGovId: leadPassport,
        weightLbs: Number(leadWeight) || 180,
      },
      ...guests.map((g) => ({
        isLead: false,
        name: g.name,
        dob: g.dob,
        gender: g.gender,
        passportOrGovId: g.passportOrGovId,
        weightLbs: Number(g.weightLbs) || 170,
      })),
    ];

    const totalPaxWeight = fullManifest.reduce(
      (acc, curr) => acc + (curr.weightLbs || 0),
      0,
    );

    const payload = {
      userName: leadName,
      userEmail: leadEmail,
      userPhone: leadPhone,
      routeType,
      returnDate: routeType === "round-trip" ? returnDate : undefined,
      returnTime: routeType === "round-trip" ? returnTime : undefined,
      specialHandling,
      ...(authInfo
        ? {
            paymentIntentId: authInfo.paymentIntentId,
            authorizedMax: authInfo.authorizedMax,
          }
        : {}),
      legs: [
        {
          departureAirport: origin,
          departureCode: origin,
          arrivalAirport: destination,
          arrivalCode: destination,
          departureDate,
          departureTimeFlexibility: timeFlexibility,
        },
        ...(routeType === "multi-leg"
          ? extraLegs
              .filter((l) => l.from && l.to)
              .map((l) => ({
                departureAirport: l.from,
                departureCode: l.from,
                arrivalAirport: l.to,
                arrivalCode: l.to,
                departureDate: l.date,
                departureTimeFlexibility: l.flex || "Flexible",
              }))
          : []),
      ],
      paxCount: fullManifest.length,
      aircraftClass,
      tsaManifest: fullManifest,
      weightAndBalance: {
        totalPaxWeightLbs: totalPaxWeight,
        luggageCount: Number(luggageCount) || 0,
        hasPets,
        petDetails,
      },
      firearmDeclaration: {
        hasFirearms,
        hardCaseConfirmed,
        ammoDeclared,
        details: firearmDetails,
      },
      cateringPreferences,
      groundTransport: {
        requestedLUXY: requestLUXY,
        pickupAddress,
        fboTerminal: departureFboName,
      },
      specialRequests,
    };

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("flydna_token")
          : null;
      const res = await fetch(`${apiBase}/api/jets/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedRequest({
          ...(data.request || {}),
          exportToken: data.exportToken || null,
        });
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus("idle"), 2500);
      }
    } catch (err) {
      console.error("[charter] request failed:", err);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-3xl max-h-[90vh] bg-[var(--surface-color)]/95 backdrop-blur-2xl border border-[var(--glass-border)] rounded-[28px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col text-[var(--text-main)]"
        >
          {/* Top Bar */}
          <div className="px-6 sm:px-8 py-4.5 border-b border-[var(--glass-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-main)] tracking-tight">
                  Private Jet Charter Intake
                </h2>
                <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                  On-demand Part 135 charter sourcing &amp; concierge dispatch
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--surface-color)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Submitted Request Confirmation State */}
          {submittedRequest ? (
            <div
              className="p-8 sm:p-10 flex flex-col items-center text-center space-y-5 scrollbar-none overflow-y-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="w-14 h-14 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shadow-[var(--glow-primary)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-semibold text-[var(--text-main)]">
                  Charter Request Submitted
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md">
                  Our dispatch desk is sourcing Part 135 aircraft quotes. Your
                  itinerary and quote will be delivered to your account.
                </p>
              </div>

              <div className="w-full max-w-md p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2.5">
                  <span className="text-[11px] font-mono text-[var(--accent-primary)] font-bold uppercase tracking-wider">
                    Ref: {submittedRequest.requestId}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <p>
                  <strong className="text-[var(--text-muted)] font-medium">
                    Lead Passenger:
                  </strong>{" "}
                  {leadName}
                </p>
                <p>
                  <strong className="text-[var(--text-muted)] font-medium">
                    Route:
                  </strong>{" "}
                  {origin} &rarr; {destination} ({departureDate})
                </p>
                <p>
                  <strong className="text-[var(--text-muted)] font-medium">
                    Aircraft Class:
                  </strong>{" "}
                  {aircraftClass.toUpperCase()} JET
                </p>
                <p>
                  <strong className="text-[var(--text-muted)] font-medium">
                    Manifest:
                  </strong>{" "}
                  {submittedRequest.paxCount} Passenger(s)
                </p>
                {requestLUXY && (
                  <p className="text-[var(--accent-primary)] font-medium flex items-center gap-1.5 pt-1">
                    <Car className="w-3.5 h-3.5" /> LUXY FBO Chauffeur Ground
                    Pickup Requested
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  onClose();
                  window.location.href = "/";
                }}
                className="px-8 py-3 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] shadow-[var(--glow-primary)] font-medium text-[var(--text-main)] text-sm transition hover:scale-105 cursor-pointer"
              >
                Return to Lobby
              </button>
            </div>
          ) : (
            /* Main Form Body (Container 1 inside dialog) */
            <div
              className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Step Navigation Pill Container */}
              <div className="grid grid-cols-4 gap-1 p-1.5 rounded-full bg-[var(--surface-color)] border border-[var(--glass-border)] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStep("route")}
                  className={`py-2 px-1 rounded-full transition cursor-pointer text-center truncate ${
                    step === "route"
                      ? "bg-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  1. Route &amp; Jet
                </button>
                <button
                  type="button"
                  onClick={() => setStep("manifest")}
                  className={`py-2 px-1 rounded-full transition cursor-pointer text-center truncate ${
                    step === "manifest"
                      ? "bg-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  2. Manifest
                </button>
                <button
                  type="button"
                  onClick={() => setStep("fbo")}
                  className={`py-2 px-1 rounded-full transition cursor-pointer text-center truncate ${
                    step === "fbo"
                      ? "bg-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  3. FBO &amp; Ground
                </button>
                <button
                  type="button"
                  onClick={() => setStep("payment")}
                  className={`py-2 px-1 rounded-full transition cursor-pointer text-center truncate ${
                    step === "payment"
                      ? "bg-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  4. Authorization
                </button>
              </div>

              {/* Rate Bar */}
              <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shadow-[var(--glow-primary)]" />
                  Estimated Rate
                </span>
                <span className="text-base font-bold font-mono text-[var(--accent-primary)]">
                  ${estimatedPrice.toLocaleString()}{" "}
                  <span className="text-xs text-[var(--text-muted)] font-sans font-normal">
                    USD
                  </span>
                </span>
              </div>

              {/* STEP 1: ROUTE */}
              {step === "route" && (
                <>
                  {/* Route Type Buttons */}
                  <div className="flex items-center gap-2">
                    {(["one-way", "round-trip", "multi-leg"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRouteType(type)}
                        className={`px-4 py-2 rounded-full text-xs font-medium capitalize border transition cursor-pointer ${
                          routeType === type
                            ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)]"
                            : "bg-[var(--surface-color)] border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                      >
                        {type.replace("-", " ")}
                      </button>
                    ))}
                  </div>

                  {/* Airport Inputs */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Departure Airport
                      </label>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="e.g. ATL, PDK"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Arrival Airport
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. JFK, TEB"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Dates & Departure Window */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Departure Date
                      </label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Departure Window
                      </label>
                      <select
                        value={timeFlexibility}
                        onChange={(e) => setTimeFlexibility(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none transition"
                      >
                        <option
                          value="Exact Time (02:00 PM)"
                          className="bg-[var(--surface-color)]"
                        >
                          Exact Time (02:00 PM)
                        </option>
                        <option
                          value="Morning (08:00 AM - 12:00 PM)"
                          className="bg-[var(--surface-color)]"
                        >
                          Morning (08:00 AM - 12:00 PM)
                        </option>
                        <option
                          value="Afternoon (12:00 PM - 05:00 PM)"
                          className="bg-[var(--surface-color)]"
                        >
                          Afternoon (12:00 PM - 05:00 PM)
                        </option>
                        <option
                          value="Evening (05:00 PM - 10:00 PM)"
                          className="bg-[var(--surface-color)]"
                        >
                          Evening (05:00 PM - 10:00 PM)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Round Trip Row */}
                  {routeType === "round-trip" && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
                      <div>
                        <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                          Return Date
                        </label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                          Return Window
                        </label>
                        <select
                          value={
                            returnTime.startsWith("Exact") ||
                            [
                              "Morning (08:00 AM - 12:00 PM)",
                              "Afternoon (12:00 PM - 05:00 PM)",
                              "Evening (05:00 PM - 10:00 PM)",
                              "Flexible",
                            ].includes(returnTime)
                              ? returnTime.startsWith("Exact")
                                ? "Exact"
                                : returnTime
                              : returnTime
                                ? "Exact"
                                : "Flexible"
                          }
                          onChange={(e) =>
                            setReturnTime(
                              e.target.value === "Exact"
                                ? "Exact Time ()"
                                : e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none transition"
                        >
                          <option
                            value="Flexible"
                            className="bg-[var(--surface-color)]"
                          >
                            Flexible
                          </option>
                          <option
                            value="Morning (08:00 AM - 12:00 PM)"
                            className="bg-[var(--surface-color)]"
                          >
                            Morning (08:00 AM - 12:00 PM)
                          </option>
                          <option
                            value="Afternoon (12:00 PM - 05:00 PM)"
                            className="bg-[var(--surface-color)]"
                          >
                            Afternoon (12:00 PM - 05:00 PM)
                          </option>
                          <option
                            value="Evening (05:00 PM - 10:00 PM)"
                            className="bg-[var(--surface-color)]"
                          >
                            Evening (05:00 PM - 10:00 PM)
                          </option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Multi-Leg Rows */}
                  {routeType === "multi-leg" && (
                    <div className="space-y-3 border-t border-[var(--glass-border)] pt-4">
                      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block ml-1">
                        Additional Legs
                      </span>
                      {extraLegs.map((leg, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end"
                        >
                          <div>
                            <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1 ml-1">
                              Leg {i + 2} From
                            </label>
                            <input
                              type="text"
                              value={leg.from}
                              onChange={(e) =>
                                setExtraLegs(
                                  extraLegs.map((x, j) =>
                                    j === i
                                      ? {
                                          ...x,
                                          from: e.target.value.toUpperCase(),
                                        }
                                      : x,
                                  ),
                                )
                              }
                              placeholder="ASE"
                              className="w-full px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] uppercase focus:border-[var(--accent-primary)] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1 ml-1">
                              To
                            </label>
                            <input
                              type="text"
                              value={leg.to}
                              onChange={(e) =>
                                setExtraLegs(
                                  extraLegs.map((x, j) =>
                                    j === i
                                      ? {
                                          ...x,
                                          to: e.target.value.toUpperCase(),
                                        }
                                      : x,
                                  ),
                                )
                              }
                              placeholder="LAS"
                              className="w-full px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] uppercase focus:border-[var(--accent-primary)] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1 ml-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={leg.date}
                              onChange={(e) =>
                                setExtraLegs(
                                  extraLegs.map((x, j) =>
                                    j === i
                                      ? { ...x, date: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1 ml-1">
                              Time
                            </label>
                            <select
                              value={leg.flex}
                              onChange={(e) =>
                                setExtraLegs(
                                  extraLegs.map((x, j) =>
                                    j === i
                                      ? { ...x, flex: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                            >
                              <option
                                value=""
                                className="bg-[var(--surface-color)]"
                              >
                                Flexible
                              </option>
                              <option
                                value="Morning"
                                className="bg-[var(--surface-color)]"
                              >
                                Morning
                              </option>
                              <option
                                value="Afternoon"
                                className="bg-[var(--surface-color)]"
                              >
                                Afternoon
                              </option>
                              <option
                                value="Evening"
                                className="bg-[var(--surface-color)]"
                              >
                                Evening
                              </option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setExtraLegs(extraLegs.filter((_, j) => j !== i))
                            }
                            className="p-2.5 rounded-xl border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition cursor-pointer flex items-center justify-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setExtraLegs([
                            ...extraLegs,
                            {
                              from:
                                (extraLegs.length
                                  ? extraLegs[extraLegs.length - 1].to
                                  : destination) || "",
                              to: "",
                              date: "",
                              flex: "",
                            },
                          ])
                        }
                        className="px-4 py-2 rounded-full border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] text-xs font-medium hover:bg-[var(--accent-primary)]/10 transition cursor-pointer"
                      >
                        + Add Leg
                      </button>
                    </div>
                  )}

                  {/* Aircraft Category Selection */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-main)] mb-2.5 block ml-1">
                      Aircraft Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        {
                          id: "turboprop",
                          name: "Turboprop",
                          pax: "6-8 PAX",
                          eg: "Pilatus PC-12",
                        },
                        {
                          id: "light",
                          name: "Light",
                          pax: "4-6 PAX",
                          eg: "Phenom 300",
                        },
                        {
                          id: "midsize",
                          name: "Midsize",
                          pax: "7-8 PAX",
                          eg: "Hawker 800XP",
                        },
                        {
                          id: "super-midsize",
                          name: "Super-Mid",
                          pax: "8-10 PAX",
                          eg: "Challenger 350",
                        },
                        {
                          id: "heavy",
                          name: "Heavy",
                          pax: "10-16 PAX",
                          eg: "Gulfstream G550",
                        },
                      ].map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setAircraftClass(cls.id as AircraftClass)}
                          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                            aircraftClass === cls.id
                              ? "bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)]"
                              : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--glass-border)] hover:text-[var(--text-main)]"
                          }`}
                        >
                          <p className="text-xs font-semibold text-[var(--text-main)]">
                            {cls.name}
                          </p>
                          <p className="text-[10px] text-[var(--accent-primary)] font-mono mt-0.5">
                            {cls.pax}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
                            {cls.eg}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("manifest")}
                    className="w-full py-3.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] shadow-[var(--glow-primary)] text-[var(--text-main)] font-medium text-sm transition hover:scale-[1.01] cursor-pointer"
                  >
                    Continue to Manifest &rarr;
                  </button>
                </>
              )}

              {/* STEP 2: MANIFEST */}
              {step === "manifest" && (
                <>
                  <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                    <span className="text-xs font-semibold uppercase text-[var(--text-main)] tracking-wider">
                      Lead Passenger (TSA Vetting)
                    </span>
                    <span className="text-[10px] text-[var(--accent-primary)] font-medium bg-[var(--accent-primary)]/10 px-3 py-0.5 rounded-full border border-[var(--accent-primary)]/20">
                      Primary Contact
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="As shown on Passport / ID"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="client@flydna.io"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={leadDob}
                        onChange={(e) => setLeadDob(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Gender
                      </label>
                      <select
                        value={leadGender}
                        onChange={(e) => setLeadGender(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                      >
                        <option value="M" className="bg-[var(--surface-color)]">
                          Male (M)
                        </option>
                        <option value="F" className="bg-[var(--surface-color)]">
                          Female (F)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Gov ID / Passport
                      </label>
                      <input
                        type="text"
                        value={leadPassport}
                        onChange={(e) => setLeadPassport(e.target.value)}
                        placeholder="ID / Known Traveler #"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-4">
                    <span className="text-xs font-semibold uppercase text-[var(--text-main)] tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--accent-primary)]" />{" "}
                      Additional Passengers ({guests.length})
                    </span>
                    <button
                      type="button"
                      onClick={addGuest}
                      className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--accent-primary)]/25 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Passenger
                    </button>
                  </div>

                  {guests.map((g, index) => (
                    <div
                      key={g.id}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center pb-3 border-b border-[var(--glass-border)]/60"
                    >
                      <div className="sm:col-span-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--accent-primary)] uppercase">
                          Pax #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeGuest(g.id)}
                          className="text-[var(--text-muted)] hover:text-red-400 transition cursor-pointer sm:hidden"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={g.name}
                        onChange={(e) =>
                          updateGuest(g.id, "name", e.target.value)
                        }
                        placeholder="Full Legal Name"
                        className="px-3.5 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                      <input
                        type="date"
                        value={g.dob}
                        onChange={(e) =>
                          updateGuest(g.id, "dob", e.target.value)
                        }
                        className="px-3.5 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={g.passportOrGovId}
                          onChange={(e) =>
                            updateGuest(g.id, "passportOrGovId", e.target.value)
                          }
                          placeholder="Passport / ID #"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeGuest(g.id)}
                          className="hidden sm:flex text-[var(--text-muted)] hover:text-red-400 transition cursor-pointer p-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-[var(--glass-border)] pt-4">
                    <span className="text-xs font-semibold uppercase text-[var(--text-main)] tracking-wider flex items-center gap-2 mb-2.5">
                      <Briefcase className="w-4 h-4 text-[var(--accent-primary)]" />{" "}
                      Luggage &amp; Balance
                    </span>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                          Luggage Bag Count
                        </label>
                        <input
                          type="number"
                          value={luggageCount}
                          onChange={(e) => setLuggageCount(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                          Estimated Weight (lbs)
                        </label>
                        <input
                          type="number"
                          value={leadWeight}
                          onChange={(e) => setLeadWeight(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-4">
                    <label className="text-xs font-medium text-[var(--text-main)] flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPets}
                        onChange={(e) => setHasPets(e.target.checked)}
                        className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
                      />
                      <Dog className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>Traveling with Pets</span>
                    </label>
                    {hasPets && (
                      <input
                        type="text"
                        value={petDetails}
                        onChange={(e) => setPetDetails(e.target.value)}
                        placeholder="Breed & weight"
                        className="px-4 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    )}
                  </div>

                  <div className="border-t border-[var(--glass-border)] pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--text-main)] flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasFirearms}
                          onChange={(e) => setHasFirearms(e.target.checked)}
                          className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
                        />
                        <ShieldAlert className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span>
                          Declared Firearms or Security Detail Equipment
                        </span>
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        FAA Part 135
                      </span>
                    </div>

                    {hasFirearms && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[var(--text-main)] pt-1">
                        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hardCaseConfirmed}
                            onChange={(e) =>
                              setHardCaseConfirmed(e.target.checked)
                            }
                            className="w-3.5 h-3.5 rounded accent-[var(--accent-primary)] cursor-pointer"
                          />
                          <span>Locked Hard Case</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ammoDeclared}
                            onChange={(e) => setAmmoDeclared(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-[var(--accent-primary)] cursor-pointer"
                          />
                          <span>Ammunition Declared</span>
                        </label>
                        <input
                          type="text"
                          value={firearmDetails}
                          onChange={(e) => setFirearmDetails(e.target.value)}
                          placeholder="Equipment details"
                          className="px-3.5 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("route")}
                      className="px-6 py-3 rounded-full bg-[var(--surface-color)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-medium transition cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("fbo")}
                      className="flex-1 py-3.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] shadow-[var(--glow-primary)] text-[var(--text-main)] font-medium text-sm transition hover:scale-[1.01] cursor-pointer"
                    >
                      Continue to FBO &amp; Ground &rarr;
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3: FBO & GROUND */}
              {step === "fbo" && (
                <>
                  <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                    <span className="text-xs font-semibold uppercase text-[var(--text-main)] tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--accent-primary)]" />{" "}
                      Private FBO Terminals
                    </span>
                    <span className="text-[10px] font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-0.5 rounded-full border border-[var(--accent-primary)]/20">
                      Default Handlers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-main)] block ml-1">
                        Departure FBO ({origin || "ATL"})
                      </label>
                      <input
                        type="text"
                        value={departureFboName}
                        onChange={(e) => setDepartureFboName(e.target.value)}
                        placeholder="FBO Facility Name"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={departureFboAddress}
                        onChange={(e) => setDepartureFboAddress(e.target.value)}
                        placeholder="FBO Street Address"
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-mono text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-main)] block ml-1">
                        Arrival FBO ({destination || "Destination"})
                      </label>
                      <input
                        type="text"
                        value={arrivalFboName}
                        onChange={(e) => setArrivalFboName(e.target.value)}
                        placeholder="Arrival FBO Name"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={arrivalFboAddress}
                        onChange={(e) => setArrivalFboAddress(e.target.value)}
                        placeholder="Arrival FBO Street Address"
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-mono text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-[var(--text-main)] tracking-wider flex items-center gap-2 mb-2 ml-1">
                      <UtensilsCrossed className="w-4 h-4 text-[var(--accent-primary)]" />{" "}
                      In-Flight Catering Preferences
                    </label>
                    <textarea
                      rows={2}
                      value={cateringPreferences}
                      onChange={(e) => setCateringPreferences(e.target.value)}
                      placeholder="Special culinary, wine, champagne, or dietary requests..."
                      className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Special Handling (Oversized Gear)
                      </label>
                      <input
                        type="text"
                        value={specialHandling}
                        onChange={(e) => setSpecialHandling(e.target.value)}
                        placeholder="Skis, golf bags, wheelchairs..."
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                        Special Requests
                      </label>
                      <input
                        type="text"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Setup on ice, meet planeside..."
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[var(--glass-border)] pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Car className="w-5 h-5 text-[var(--accent-primary)]" />
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                            LUXY Ground Chauffeur
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Planeside FBO pickup &amp; dropoff
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requestLUXY}
                          onChange={(e) => setRequestLUXY(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                      </label>
                    </div>

                    {requestLUXY && (
                      <div>
                        <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                          Pickup / Destination Street Address
                        </label>
                        <input
                          type="text"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="Hotel, Private Residence, or Office Address"
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-muted)] leading-relaxed flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-[var(--text-main)]">
                        DOT Part 295 Disclosure:
                      </strong>{" "}
                      FlyDnA Inc acts solely as an authorized air charter
                      broker. Flights are operated by FAA Part 135 certified air
                      carriers in full operational control.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("manifest")}
                      className="px-6 py-3 rounded-full bg-[var(--surface-color)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-medium transition cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("payment")}
                      className="flex-1 py-3.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] shadow-[var(--glow-primary)] text-[var(--text-main)] font-medium text-sm transition hover:scale-[1.01] cursor-pointer"
                    >
                      Continue to Authorization &rarr;
                    </button>
                  </div>
                </>
              )}

              {/* STEP 4: PAYMENT / AUTHORIZATION */}
              {step === "payment" && (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:text-sm border-b border-[var(--glass-border)] pb-4">
                    <span className="text-[var(--text-muted)]">Route</span>
                    <span className="font-semibold text-[var(--text-main)] text-right">
                      {origin} &rarr; {destination}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      Aircraft Class
                    </span>
                    <span className="font-semibold text-[var(--text-main)] text-right capitalize">
                      {aircraftClass.replace("-", " ")} Jet
                    </span>
                    <span className="text-[var(--text-muted)]">Departure</span>
                    <span className="font-semibold text-[var(--text-main)] text-right">
                      {departureDate}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      Total Manifest
                    </span>
                    <span className="font-semibold text-[var(--text-main)] text-right">
                      {1 + guests.length} Passenger(s)
                    </span>
                    <span className="text-[var(--text-muted)] pt-1 font-semibold">
                      Estimated Total
                    </span>
                    <span className="text-right pt-1 font-bold font-mono text-[var(--accent-primary)] text-base">
                      ${estimatedPrice.toLocaleString()} USD
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    You are not charged now. Your card is pre-authorized up to $
                    {authCeiling.toLocaleString()} — you approve the final quote
                    before booking confirmation.
                  </p>

                  {payError && (
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                      {payError}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-[var(--surface-color)] border border-[var(--glass-border)]">
                    {[
                      { id: "credit-card", label: "Credit Card", live: true },
                      {
                        id: "flydna-vault",
                        label: "Vault (Soon)",
                        live: false,
                      },
                      { id: "xrp", label: "Web3 (Soon)", live: false },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => m.live && setPaymentMethod(m.id)}
                        className={`py-2 rounded-full text-xs font-medium transition ${
                          !m.live
                            ? "opacity-40 cursor-not-allowed text-[var(--text-muted)]"
                            : paymentMethod === m.id
                              ? "bg-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)] font-semibold"
                              : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "credit-card" && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => {
                            setCardName(e.target.value);
                            setPayError("");
                          }}
                          placeholder="Name on card"
                          autoComplete="cc-name"
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => {
                            setCardNumber(e.target.value);
                            setPayError("");
                          }}
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM / YY"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--text-main)] block mb-1.5 ml-1">
                            CVC
                          </label>
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="•••"
                            maxLength={4}
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            className="w-full px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>256-Bit TLS Encrypted Authorization</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("fbo")}
                      className="px-6 py-3 rounded-full bg-[var(--surface-color)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-medium transition cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={authorizeAndSubmit}
                      disabled={authorizing || submitStatus === "success"}
                      className={`flex-1 py-3.5 rounded-full font-medium text-sm transition hover:scale-[1.01] cursor-pointer disabled:opacity-80 ${
                        submitStatus === "success"
                          ? "bg-emerald-600 text-white"
                          : authorizing
                            ? "bg-[var(--accent-primary)] text-[var(--text-main)] animate-pulse"
                            : "bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] shadow-[var(--glow-primary)] text-[var(--text-main)]"
                      }`}
                    >
                      {authorizing
                        ? "Authorizing..."
                        : submitStatus === "success"
                          ? "Request Authorized"
                          : "Authorize & Request"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
