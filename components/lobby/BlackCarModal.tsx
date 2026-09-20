/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/purity */
"use client";

import { useState, useEffect } from "react";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  X,
  ShieldCheck,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react";
import { recordTransaction, recordPurchase } from "@/lib/ledger";
import { ChatManager } from "@/lib/api";

type BlackCarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
  destinationAddress?: string;
  distanceMiles?: string;
};

const VEHICLES = [
  {
    id: "escalade",
    name: "Cadillac Escalade ESV",
    tagline: "Ultra-Luxury VIP SUV",
    capacity: "7 Passengers",
    price: 120.0,
    color: "from-slate-900 to-black border-amber-500/40",
    badge: "Most Popular",
  },
  {
    id: "maybach",
    name: "Mercedes-Maybach S-Class",
    tagline: "First Class Executive Sedan",
    capacity: "4 Passengers",
    price: 180.0,
    color: "from-purple-950 to-slate-950 border-purple-500/40",
    badge: "Ultra Luxury",
  },
  {
    id: "modelx",
    name: "Tesla Model X Plaid",
    tagline: "High-Tech Electric SUV",
    capacity: "6 Passengers",
    price: 110.0,
    color: "from-cyan-950 to-slate-950 border-cyan-500/40",
    badge: "Eco Executive",
  },
];

export default function BlackCarModal({
  isOpen,
  onClose,
  destinationName = "State Farm Arena",
  destinationAddress = "State Farm Arena, Downtown Atlanta, GA",
  distanceMiles = "29.9 miles",
}: BlackCarModalProps) {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [passengers, setPassengers] = useState(2);
  const [pickupTime, setPickupTime] = useState("ASAP (Immediate Dispatch)");
  const [flightNumber, setFlightNumber] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Verified Lead Passenger Manifest State
  const [passengerName, setPassengerName] = useState("Hector Clark");
  const [passengerPhone, setPassengerPhone] = useState("+1 (404) 555-0199");
  const [passengerEmail, setPassengerEmail] = useState("hector@flydna.io");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("flydna_user") || "{}");
        if (u.name) setPassengerName(u.name);
        if (u.phone) setPassengerPhone(u.phone);
        if (u.email) setPassengerEmail(u.email);
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const flydnaFee = Math.round(selectedVehicle.price * 0.025 * 100) / 100;
  const totalPrice = selectedVehicle.price + flydnaFee;

  const isFlightRequired =
    pickupTime.includes("Flight") ||
    destinationName.toLowerCase().includes("airport") ||
    destinationName.toLowerCase().includes("fbo") ||
    destinationName.toLowerCase().includes("field") ||
    destinationName.toLowerCase().includes("terminal") ||
    destinationName.toLowerCase().includes("int'l");

  const handleAuthorizeBooking = () => {
    // Validate flight & FBO requirement for airport transfers
    if (isFlightRequired && (!flightNumber.trim() || !pickupNotes.trim())) {
      setValidationError(
        "Please provide your Flight/Tail # and FBO Terminal for airport tracking.",
      );
      return;
    }

    setValidationError(null);
    setIsSettling(true);

    setTimeout(() => {
      setIsSettling(false);
      setIsBooked(true);

      const trackingInfo = flightNumber
        ? ` [Flight/Tail #${flightNumber}]`
        : "";

      // Record transaction and purchase in global ledger
      recordTransaction({
        type: "Luxury Chauffeur Settlement",
        note: `${selectedVehicle.name} Transfer to ${destinationName}${trackingInfo} (2.5% Treasury Fee: $${flydnaFee.toFixed(2)})`,
        amount: totalPrice,
        currency: "USD",
        method: "debit",
        status: "Confirmed",
      });

      recordPurchase({
        title: `Black Car Chauffeur: ${selectedVehicle.name}${trackingInfo}`,
        category: "Bookings",
        amount: totalPrice,
        merchant: "FlyDnA Luxury Chauffeur Service",
        status: "Confirmed",
        flydnaFee,
      });

      // Dispatch global notification (Header bell badge & dropdown)
      if (typeof window !== "undefined") {
        const refCode = `FDNA-CAR-${Date.now().toString().slice(-4)}`;
        const notifText = flightNumber
          ? `🎉 Chauffeur Confirmed! Ref #${refCode}. ${selectedVehicle.name} dispatched to ${destinationName} (Tracking Flight ${flightNumber}).`
          : `🎉 Chauffeur Confirmed! Ref #${refCode}. Dispatched ${selectedVehicle.name} to ${destinationName}. Itinerary & receipt sent to your Email & SMS!`;

        window.dispatchEvent(
          new CustomEvent("flydna-new-notification", {
            detail: {
              message: notifText,
            },
          }),
        );

        // Inject direct Concierge ("101") confirmation chat message
        try {
          const agentChatText = `🚘 Chauffeur Booking Confirmed! Ref #${refCode}\n\n🚘 Vehicle: ${selectedVehicle.name}\n📍 Route: Atlanta ➔ ${destinationName}\n✈️ Tracking: ${flightNumber ? `Flight/Tail #${flightNumber}` : "Direct Pickup"}\n📍 Terminal: ${pickupNotes || "Standard Pickup"}\n💰 Authorized Total: $${totalPrice.toFixed(2)} USD\n\nYour LUXY chauffeur is tracking your arrival in real-time. I'm your FlyDnA Concierge, and I'm here 24/7 in chat if you need to adjust your pick-up time, add champagne, or request luxury amenities!`;
          ChatManager.injectAgentMessage("101", agentChatText);
        } catch (e) {}
      }
    }, 1500);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl overflow-hidden glass-panel-heavy rounded-3xl border border-amber-500/30 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white backdrop-blur-2xl bg-gradient-to-b from-[#0a1120] to-[#040814]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          {!isBooked ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  <Car size={22} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    ⚡ VIP Chauffeur Dispatch
                  </span>

                  <h3 className="text-lg font-black text-white leading-tight">
                    Luxury Black Car Service
                  </h3>
                </div>
              </div>

              {/* Route Summary Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 flex flex-col gap-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} className="text-cyan-400" /> Route Specs
                  </span>
                  <span className="text-xs font-black text-cyan-300">
                    {distanceMiles} (~35 mins)
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-semibold text-slate-300">
                    <span className="text-slate-500 font-bold">FROM:</span>{" "}
                    Current Location (Atlanta, GA)
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    <span className="text-amber-400 font-bold">TO:</span>{" "}
                    {destinationName}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {destinationAddress}
                  </span>
                </div>
              </div>

              {/* Verified Lead Passenger Manifest (LUXY Dispatch API Sync) */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 mb-5 flex items-center justify-between text-left backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="size-8.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 grid place-items-center text-cyan-300 shrink-0 shadow-sm">
                    <ShieldCheck size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {passengerName}
                      </span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 tracking-wider">
                        ✓ Verified Manifest
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 font-semibold mt-0.5">
                      📱 {passengerPhone} • ✉️ {passengerEmail}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-cyan-300 uppercase tracking-wider bg-cyan-500/20 px-2 py-1 rounded-lg border border-cyan-400/30 hidden sm:inline-block">
                  LUXY API Sync
                </span>
              </div>

              {/* Vehicle Selection Grid */}
              <div className="flex flex-col gap-2.5 mb-5 text-left">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Vehicle Class:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {VEHICLES.map((vehicle) => {
                    const isSelected = selectedVehicle.id === vehicle.id;
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`p-3.5 rounded-2xl border transition duration-300 flex flex-col justify-between text-left cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            {vehicle.badge}
                          </span>
                          <h4 className="text-xs font-black text-white mt-2 leading-tight">
                            {vehicle.name}
                          </h4>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                            {vehicle.capacity}
                          </p>
                        </div>
                        <div className="mt-3 text-right">
                          <span className="text-sm font-black text-amber-400">
                            ${vehicle.price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options & Driver Flight Tracking */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Users size={12} className="text-slate-400" /> Passengers
                  </label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-semibold cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} Passenger{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" /> Dispatch Time
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-semibold cursor-pointer"
                  >
                    <option value="ASAP (Immediate Dispatch)">
                      ASAP (Immediate Dispatch)
                    </option>
                    <option value="In 15 Minutes">In 15 Minutes</option>
                    <option value="In 30 Minutes">In 30 Minutes</option>
                    <option value="Scheduled for Flight Landing">
                      Scheduled for Flight Landing
                    </option>
                  </select>
                </div>
              </div>

              {/* Driver Flight Tracking & FBO Notes */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-left">
                <div className="flex flex-col gap-1">
                  <label
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isFlightRequired ? "text-amber-400" : "text-slate-400"}`}
                  >
                    ✈️ Flight / Tail #{" "}
                    {isFlightRequired ? "(Required)" : "(Optional)"}
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => {
                      setFlightNumber(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="e.g. EK-342 / N782DF"
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400 font-mono font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isFlightRequired ? "text-amber-400" : "text-slate-400"}`}
                  >
                    📍 FBO Terminal{" "}
                    {isFlightRequired ? "(Required)" : "(Optional)"}
                  </label>
                  <input
                    type="text"
                    value={pickupNotes}
                    onChange={(e) => {
                      setPickupNotes(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="e.g. Signature FBO / Gate A2"
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400 font-semibold"
                  />
                </div>
              </div>

              {/* Validation Warning Notice */}
              {validationError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-extrabold text-left mb-4 flex items-center gap-2 animate-shake">
                  <span>⚠️ {validationError}</span>
                </div>
              )}

              {/* Price & Treasury Fee Breakdown */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-6 flex flex-col gap-1.5 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">
                    {selectedVehicle.name} Fare:
                  </span>
                  <span className="font-bold text-white">
                    ${selectedVehicle.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400 flex items-center gap-1">
                    👑 FlyDnA Treasury Royalty Fee (2.5%):
                  </span>
                  <span className="font-bold text-amber-400">
                    +${flydnaFee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between items-center text-sm font-black">
                  <span className="text-white">Total Authorized:</span>
                  <span className="text-amber-400 text-base">
                    ${totalPrice.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAuthorizeBooking}
                disabled={isSettling}
                className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  isSettling
                    ? "bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.6)] animate-pulse"
                    : "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:brightness-110 active:scale-98 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)]"
                }`}
              >
                {isSettling ? (
                  <>
                    <CheckCircle2
                      size={18}
                      className="text-slate-950 animate-bounce"
                    />
                    <span>✅ AUTHORIZED — DISPATCH CONFIRMED!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>
                      AUTHORIZE CHAUFFEUR DISPATCH (${totalPrice.toFixed(2)})
                    </span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Confirmation Success State */
            <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.5)]"
              >
                <CheckCircle2 size={36} />
              </motion.div>
              <div>
                <h3 className="text-xl font-black text-white">
                  Chauffeur Dispatched!
                </h3>
                <p className="text-xs text-slate-300 font-semibold mt-1">
                  Your{" "}
                  <span className="text-amber-400 font-bold">
                    {selectedVehicle.name}
                  </span>{" "}
                  is en route to {destinationName}.
                </p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-xs space-y-1.5 my-2">
                <div className="flex justify-between text-slate-400">
                  <span>Driver Status:</span>{" "}
                  <span className="text-emerald-400 font-bold">
                    En Route (4 mins away)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Receipt ID:</span>{" "}
                  <span className="text-white font-mono font-bold">
                    #FLY-CAR-{Date.now().toString().slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Settled:</span>{" "}
                  <span className="text-amber-400 font-bold">
                    ${totalPrice.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
