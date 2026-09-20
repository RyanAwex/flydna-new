"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BookingSegment {
  type: "flight" | "hotel" | "car" | "experience";
  label: string;
  sublabel: string;
  icon: string;
  detail?: string;
  amount?: number;
}

export interface TripReceiptProps {
  /** Trip reference */
  tripId?: string;
  /** Passenger / customer name */
  passengerName?: string;
  /** Total amount paid */
  totalPaid: number;
  currency?: string;
  /** Origin → destination short codes */
  origin?: string;
  destination?: string;
  /** Booked segments — up to 4 drive the wheel quadrants */
  segments?: BookingSegment[];
  onClose?: () => void;
}

// ─── SVG pie-slice path (0° = top, clockwise) ─────────────────────────────────
function pieSlice(
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

// Label position outside arc
function labelPos(cx: number, cy: number, angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ─── Default segments per booking type ───────────────────────────────────────
const SEGMENT_DEFAULTS: Record<string, Omit<BookingSegment, "type">> = {
  car:        { label: "Ground Transfer",  sublabel: "LUXY Chauffeured Pickup",   icon: "🚙" },
  flight:     { label: "Private Flight",   sublabel: "FBO Departure · Zero Lines", icon: "✈️" },
  hotel:      { label: "Hotel Check-In",   sublabel: "VIP Suite · Direct Arrival", icon: "🏨" },
  experience: { label: "Safe Travels",     sublabel: "Destination Transfer",       icon: "📍" },
};

// Quadrant angles (clockwise from top): 10 o'clock, 2 o'clock, 4 o'clock, 8 o'clock
const QUAD_ANGLES = [
  { start: 225, end: 315, labelAngle: 270 }, // top-left   (10 o'clock)
  { start: 315, end: 45,  labelAngle: 0   }, // top-right  (12/2 o'clock)
  { start: 45,  end: 135, labelAngle: 90  }, // bottom-right (4 o'clock)
  { start: 135, end: 225, labelAngle: 180 }, // bottom-left (8 o'clock)
];

// Dark teal palette
const COLORS = ["#0e4d5c", "#0a3a47", "#07303c", "#0c4454"];
const ACCENT = "#06b6d4";  // cyan-500
const GLOW   = "#22d3ee";  // cyan-400

// ─── Component ────────────────────────────────────────────────────────────────
export const TripJourneyWheel: React.FC<TripReceiptProps> = ({
  tripId,
  passengerName,
  totalPaid,
  currency = "USD",
  origin = "ORG",
  destination = "DST",
  segments: propSegments,
  onClose,
}) => {
  const [showSafeTravelz, setShowSafeTravelz] = useState(false);

  // Build 4 segments — fill missing slots with experience/placeholder
  const raw: BookingSegment[] = propSegments?.slice(0, 4) ?? [
    { type: "car",        ...SEGMENT_DEFAULTS.car        },
    { type: "flight",     ...SEGMENT_DEFAULTS.flight     },
    { type: "hotel",      ...SEGMENT_DEFAULTS.hotel      },
    { type: "experience", ...SEGMENT_DEFAULTS.experience },
  ];
  while (raw.length < 4) {
    raw.push({ type: "experience", ...SEGMENT_DEFAULTS.experience });
  }

  const CX = 150; const CY = 150; const R = 116;

  return (
    <div
      className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl select-none"
      style={{
        background: "linear-gradient(145deg, #0a1628 0%, #0d1f38 60%, #071420 100%)",
        border: "1px solid rgba(6,182,212,0.2)",
        boxShadow: "0 0 60px rgba(6,182,212,0.08), 0 25px 50px rgba(0,0,0,0.6)",
      }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-cyan-500/10">
        {/* Badge */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center rounded-2xl px-4 py-3"
          style={{
            background: "linear-gradient(135deg, #0e4d5c, #083a47)",
            border: "1px solid rgba(6,182,212,0.3)",
            minWidth: 110,
          }}
        >
          <span className="text-2xl mb-1">✈️</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300 text-center leading-tight">
            Private<br />Charter
          </p>
          <div
            className="mt-1.5 px-2 py-0.5 rounded text-[7px] font-black tracking-widest uppercase text-emerald-300"
            style={{ border: "1px solid rgba(52,211,153,0.4)" }}
          >
            ✓ Booking Confirmed
          </div>
        </div>

        {/* Trip info */}
        <div className="flex-1">
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-0.5">
            FlyDnA Trip Receipt
          </p>
          {passengerName && (
            <p className="text-sm font-bold text-white">{passengerName}</p>
          )}
          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
            Your door-to-door journey is confirmed and paid. This infographic serves as your official receipt. Multi-rail settlement accepted.
          </p>
          {tripId && (
            <p className="text-[9px] font-mono text-cyan-500 mt-1">REF: {tripId}</p>
          )}
        </div>
      </div>

      {/* ── WHEEL ────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center py-4" style={{ minHeight: 330 }}>

        {/* Jet graphic (left overlay) */}
        <div
          className="absolute pointer-events-none"
          style={{ left: -20, top: "50%", transform: "translateY(-50%)", zIndex: 2, opacity: 0.85 }}
        >
          <svg width="180" height="80" viewBox="0 0 200 90" fill="none">
            <ellipse cx="105" cy="45" rx="88" ry="16" fill="#0e4d5c" />
            <ellipse cx="188" cy="45" rx="13" ry="8" fill={ACCENT} opacity="0.8" />
            <polygon points="80,45 132,8 152,45 80,45" fill="#083a47" />
            <polygon points="80,45 132,82 152,45 80,45" fill="#072e3a" opacity="0.7" />
            <polygon points="18,45 30,10 52,45" fill="#0a3342" />
            {[112,127,142,157,170].map((x, i) => (
              <ellipse key={i} cx={x} cy="40" rx="4" ry="3" fill={ACCENT} opacity="0.35" />
            ))}
            {/* Wing glow */}
            <ellipse cx="115" cy="20" rx="22" ry="4" fill={ACCENT} opacity="0.1" />
          </svg>
        </div>

        {/* SVG Wheel */}
        <svg viewBox="0 0 300 300" width={300} height={300} style={{ position: "relative", zIndex: 1 }}>
          {/* Background disc */}
          <circle cx={CX} cy={CY} r={R + 2} fill="#071420" />

          {/* Pie slices */}
          {raw.map((seg, idx) => {
            const q = QUAD_ANGLES[idx];
            const lp = labelPos(CX, CY, q.labelAngle, 76);
            return (
              <g key={idx}>
                <path
                  d={pieSlice(CX, CY, R, q.start, q.end)}
                  fill={COLORS[idx]}
                  style={{ filter: `drop-shadow(0 0 8px ${ACCENT}18)` }}
                />
                {/* Icon */}
                <text
                  x={lp.x} y={lp.y - 8}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="14"
                >
                  {seg.icon}
                </text>
                {/* Label */}
                <text
                  x={lp.x} y={lp.y + 5}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7" fontWeight="800" fill="#e2e8f0"
                  style={{ fontFamily: "inherit" }}
                >
                  {seg.label}
                </text>
                {/* Sublabel */}
                <text
                  x={lp.x} y={lp.y + 13}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="5.5" fill="#64748b"
                  style={{ fontFamily: "inherit" }}
                >
                  {seg.sublabel}
                </text>
                {/* Per-segment amount */}
                {seg.amount && (
                  <text
                    x={lp.x} y={lp.y + 21}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="5.5" fill={GLOW} fontWeight="700"
                    style={{ fontFamily: "inherit" }}
                  >
                    ${seg.amount.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Divider lines */}
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke={ACCENT} strokeWidth="0.8" opacity="0.15" />
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke={ACCENT} strokeWidth="0.8" opacity="0.15" />

          {/* Outer glow ring */}
          <circle cx={CX} cy={CY} r={R + 1} fill="none" stroke={ACCENT} strokeWidth="0.8" opacity="0.25" />

          {/* Center circle */}
          <circle cx={CX} cy={CY} r="46"
            fill="#071420"
            stroke={ACCENT} strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 12px ${ACCENT}60)` }}
          />
          <circle cx={CX} cy={CY} r="42" fill="none" stroke={ACCENT} strokeWidth="0.5" opacity="0.3" />
        </svg>

        {/* ── Center button overlay ──────────────────────────────────────── */}
        <button
          onClick={() => { setShowSafeTravelz(true); setTimeout(() => setShowSafeTravelz(false), 3000); }}
          className="absolute flex flex-col items-center justify-center rounded-full transition-all duration-300 active:scale-95 cursor-pointer"
          style={{
            width: 90, height: 90, zIndex: 3,
            background: "transparent",
          }}
        >
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">PAID ✓</span>
          <span className="text-[11px] font-black text-white mt-0.5">
            ${totalPaid.toLocaleString()}
          </span>
          <span className="text-[8px] font-bold text-cyan-300">{currency}</span>
          <span className="text-[7px] font-black text-white mt-0.5">
            {origin} → {destination}
          </span>
          <span className="text-[6px] text-cyan-400 underline mt-1 opacity-70">
            Tap • #SafeTravelz
          </span>
        </button>

        {/* ── #SafeTravelz flash ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showSafeTravelz && (
            <motion.div
              key="st"
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none rounded-full"
              style={{ background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 65%)" }}
            >
              <span className="text-4xl">💙✈️</span>
              <span className="text-sm font-black text-cyan-300 tracking-widest uppercase mt-1">
                #SafeTravelz
              </span>
              <span className="text-xs text-slate-300 font-semibold mt-0.5">
                Thanks from FlyDnA
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SEGMENT SUMMARY STRIP ────────────────────────────────────────── */}
      <div
        className="grid gap-px mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${raw.length}, 1fr)`, border: "1px solid rgba(6,182,212,0.12)" }}
      >
        {raw.map((seg, i) => (
          <div
            key={i}
            className="flex flex-col items-center py-2.5 px-1 text-center"
            style={{ background: i % 2 === 0 ? "#0a1e30" : "#081827" }}
          >
            <span className="text-base">{seg.icon}</span>
            <span className="text-[8px] font-bold text-slate-300 mt-0.5">{seg.label}</span>
            {seg.detail && (
              <span className="text-[7px] text-slate-500 mt-0.5">{seg.detail}</span>
            )}
            {seg.amount && (
              <span className="text-[8px] font-black text-cyan-400 mt-0.5">
                ${seg.amount.toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── AMENITY ICON STRIP ───────────────────────────────────────────── */}
      <div
        className="px-4 pb-3"
        style={{ borderTop: "1px solid rgba(6,182,212,0.08)" }}
      >
        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
          {["🏠","🚗","🚕","👨‍✈️","✈️","🚁","🏨","🍽️","💵","🌐","💰","🔺","🤝"].map((ic, i) => (
            <span key={i} className="text-xs opacity-60 hover:opacity-100 transition-opacity">{ic}</span>
          ))}
        </div>
        <div className="flex items-center justify-between py-2">
          {["🛏️","📶","🧳","🥂","📍","⛺","🏛️","🗼","📊","🛡️","🔑","💎"].map((ic, i) => (
            <span key={i} className="text-xs opacity-60 hover:opacity-100 transition-opacity">{ic}</span>
          ))}
          <span className="text-[9px] font-black text-emerald-400 flex items-center gap-0.5">
            ☑ <span className="uppercase tracking-wider">Confirmed</span>
          </span>
        </div>
      </div>

      {/* ── RETURN BUTTON ─────────────────────────────────────────────────── */}
      {onClose && (
        <div className="flex justify-center pb-5 pt-1">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-950 transition hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #0284c7)`,
              boxShadow: `0 0 20px ${ACCENT}40`,
            }}
          >
            Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default TripJourneyWheel;
