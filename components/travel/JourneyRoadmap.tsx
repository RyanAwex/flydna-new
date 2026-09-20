"use client";

import React from "react";
import { motion } from "framer-motion";
import { Car, Building2, Plane, MapPin, ShieldCheck, CheckCircle2, Calendar, FileText, FileSpreadsheet } from "lucide-react";

export interface JourneyRoadmapProps {
  bookingId?: string;
  requestId?: string;
  leadName?: string;
  origin?: string;
  destination?: string;
  aircraftClass?: string;
  paxCount?: number;
  totalPrice?: number;
  departureDate?: string;
  departureFbo?: string;
  arrivalFbo?: string;
  hasLuxyGround?: boolean;
  onReturn?: () => void;
}

export const JourneyRoadmap: React.FC<JourneyRoadmapProps> = ({
  bookingId,
  requestId,
  leadName = "Guest",
  origin = "RYY",
  destination = "TEB",
  aircraftClass = "turboprop",
  paxCount = 1,
  totalPrice = 4321,
  departureDate = "Wed, 09 Sep 2026",
  departureFbo,
  arrivalFbo,
  hasLuxyGround = true,
  onReturn,
  exportToken,
}) => {
  const orig = origin.toUpperCase();
  const dest = destination.toUpperCase();
  const aClass = aircraftClass.toUpperCase();
  const depFboStr = departureFbo || `${orig} Signature Flight Support`;
  const arrFboStr = arrivalFbo || `${dest} Executive FBO Terminal`;
  const formattedPrice = Number(totalPrice || 0).toLocaleString();

  const cleanDate = (departureDate || "").replace(/\s*00:00:00(\.000)?\s*(GMT|UTC|[A-Z]{3,4})?/i, "").trim();
  const displayAircraft = aircraftClass.toLowerCase().includes("turboprop")
    ? "Turboprop (Pilatus PC-12 or similar)"
    : aircraftClass.toLowerCase().includes("light")
    ? "Light Jet (Citation CJ3 / Phenom 300)"
    : `${aClass} Aircraft`;

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "https://staging.flydna.io";
  const tok = (typeof exportToken === "string" && exportToken) ? `&token=${exportToken}` : "";

  // 1-Click Calendar Deep Links
  const calTitle = encodeURIComponent(`FlyDnA Private Charter: ${orig} -> ${dest}`);
  const calDesc = encodeURIComponent(
    `FlyDnA Charter Booking: ${bookingId || requestId || "PENDING"}\n` +
    `Aircraft: ${aClass}\n` +
    `Route: ${orig} (${depFboStr}) to ${dest} (${arrFboStr})\n` +
    `Passengers: ${paxCount}\n` +
    `Status: Card Authorized / Charges Pending Approval\n` +
    `Support: FlyDnA Concierge 24/7 Operations`
  );
  const calLoc = encodeURIComponent(`${orig} Airport - ${depFboStr}`);
  const nowD = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const startStr = `${nowD.getUTCFullYear()}${pad(nowD.getUTCMonth() + 1)}${pad(nowD.getUTCDate())}T140000Z`;
  const endStr = `${nowD.getUTCFullYear()}${pad(nowD.getUTCMonth() + 1)}${pad(nowD.getUTCDate())}T170000Z`;

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${startStr}/${endStr}&details=${calDesc}&location=${calLoc}`;
  const outlookCalUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${calTitle}&body=${calDesc}&location=${calLoc}`;

  // Direct Client-Side Export Fallbacks (works offline/standalone)
  const handleExportICS = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//FlyDnA//B2B Dispatch Handoff//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:flydna-${bookingId || "DEMO"}-${Date.now()}@flydna.jets`,
      `DTSTAMP:${nowD.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:FlyDnA Charter: ${orig} -> ${dest}`,
      `LOCATION:${orig} Airport - ${depFboStr}`,
      `DESCRIPTION:FlyDnA Booking Ref: ${bookingId || requestId || "PENDING"}\\nAircraft: ${aClass}\\nPassengers: ${paxCount}\\nStatus: Card Authorized / Charges Pending\\nConcierge: 24/7 FlyDnA Dispatch`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FlyDnA_${orig}_${dest}_Itinerary.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvContent = [
      "Booking Reference,Lead Passenger,Origin,Destination,Aircraft Class,Passengers,Estimated Hold USD,Status,Departure Date,Departure FBO,Arrival FBO",
      `"${bookingId || requestId || "PENDING"}","${leadName}","${orig}","${dest}","${aClass}",${paxCount},"${formattedPrice}","Card Authorized - Charges Pending","${departureDate}","${depFboStr}","${arrFboStr}"`,
    ].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FlyDnA_${bookingId || "Charter"}_Manifest.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      bookingReference: bookingId || requestId || "PENDING",
      leadPassenger: leadName,
      status: "CARD_AUTHORIZED_PENDING_APPROVAL",
      routing: {
        origin: orig,
        originFbo: depFboStr,
        destination: dest,
        destinationFbo: arrFboStr,
        departureDate: departureDate,
      },
      aircraft: {
        category: aClass,
        passengers: paxCount,
      },
      financials: {
        holdAmountUSD: totalPrice,
        currency: "USD",
        pricingType: "PART_295_ESTIMATED_HOLD",
      },
      dispatch: {
        groundTransport: hasLuxyGround ? "LUXY_CHAUFFEURED_SUV" : "SELF",
        brokerRegulation: "DOT Part 295 / Part 135 direct air carriers",
        timestamp: new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FlyDnA_${bookingId || "CRM_Payload"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const nodes = [
    {
      id: "01",
      mode: "GROUND RELAY",
      title: "LUXY Black SUV Transfer",
      subtitle: hasLuxyGround ? "Chauffeured Pickup · Gate 4 Tarmac Pass" : "Self-Arranged Ground Transport",
      icon: Car,
      color: "#8b5cf6",
      status: "Confirmed",
      statusColor: "emerald",
      x: 50,
      y: 110,
    },
    {
      id: "02",
      mode: "FBO DISPATCH",
      title: depFboStr,
      subtitle: `${orig} VIP Lounge · Zero Security Lines · VIP Ramp`,
      icon: Building2,
      color: "#06b6d4",
      status: "Staged",
      statusColor: "cyan",
      x: 160,
      y: 55,
    },
    {
      id: "03",
      mode: "AIR CHARTER (PART 135)",
      title: `Private Flight: ${orig} ➔ ${dest}`,
      subtitle: `${aClass} Jet · ${paxCount} Vetted Pax · Tail Telemetry`,
      icon: Plane,
      color: "#3b82f6",
      status: "Locked",
      statusColor: "emerald",
      x: 270,
      y: 160,
    },
    {
      id: "04",
      mode: "DESTINATION ARRIVAL",
      title: arrFboStr,
      subtitle: `${dest} VIP Ramp · Luggage Escort · Concierge Relay`,
      icon: MapPin,
      color: "#f59e0b",
      status: "Ready",
      statusColor: "emerald",
      x: 380,
      y: 55,
    },
    {
      id: "05",
      mode: "DESTINATION",
      title: "LUXY Dropoff & Final Destination",
      subtitle: `Direct Hotel / Office Relay · 24/7 Concierge Chat 101`,
      icon: ShieldCheck,
      color: "#10b981",
      status: "Scheduled",
      statusColor: "emerald",
      x: 490,
      y: 110,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0d1f38] to-[#071420] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 p-6 space-y-6">
      {/* Top Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span>✦ PRIVATE CHARTER · INFOGRAPHIC ROADMAP ✦</span>
        </div>
        <h3 className="text-2xl font-black tracking-tight text-white">
          Your Door-to-Door Journey Wire
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          FAR Part 295 operational node relay. Real-time telemetry, passenger vetting, and VIP dispatch locked in.
        </p>
      </div>

      {/* Hero Paid Vault */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/80 border border-cyan-500/40 text-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/5 backdrop-blur-[1px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest">
            CARD AUTHORIZED · CHARGES PENDING APPROVAL
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ${formattedPrice} <span className="text-sm font-bold text-cyan-400">USD</span>
          </p>
          <p className="text-xs text-slate-400 font-semibold">
            Estimated Hold · Subject to Part 135 Operator Hard Quote
          </p>
          <p className="text-sm font-black text-cyan-300 tracking-wider pt-1">
            {orig} ➔ {dest}
          </p>
          {(bookingId || requestId) && (
            <p className="text-[10px] font-mono text-slate-500">
              REF: {bookingId || requestId}
            </p>
          )}
        </div>
      </div>

      {/* ── Visual Undulating Roadmap (The Project Roadmap layout) ── */}
      <div className="p-4 rounded-2xl bg-[#061322] border border-cyan-500/20 overflow-x-auto shadow-lg">
        <div className="min-w-[500px]">
          <svg viewBox="0 0 540 220" className="w-full h-auto select-none">
            <defs>
              <linearGradient id="roadmapWave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="25%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="75%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="nodeHalo" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Wavy Flow Line */}
            <path
              d="M 50,110 C 95,55 120,55 160,55 C 200,55 230,160 270,160 C 310,160 340,55 380,55 C 420,55 445,110 490,110"
              fill="none"
              stroke="url(#roadmapWave)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Nodes */}
            {nodes.map((node) => {
              const isTop = node.y < 100;
              return (
                <g key={node.id} className="cursor-pointer">
                  {/* Outer glowing halo */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="18"
                    fill="#071420"
                    stroke={node.color}
                    strokeWidth="2.5"
                    filter="url(#nodeHalo)"
                  />
                  {/* Node ID */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="900"
                    fill="#ffffff"
                  >
                    {node.id}
                  </text>

                  {/* Alternating Text Labels above / below */}
                  {isTop ? (
                    <>
                      <text
                        x={node.x}
                        y={node.y - 26}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="900"
                        fill="#e2e8f0"
                      >
                        {node.id}. {node.mode.split(" ")[0]}
                      </text>
                      <text
                        x={node.x}
                        y={node.y - 15}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#94a3b8"
                      >
                        {node.id === "02" ? `${orig} Terminal` : `${dest} Ramp`}
                      </text>
                    </>
                  ) : (
                    <>
                      <text
                        x={node.x}
                        y={node.y + 32}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="900"
                        fill="#e2e8f0"
                      >
                        {node.id}. {node.mode.split(" ")[0]}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 44}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#94a3b8"
                      >
                        {node.id === "01" ? "LUXY Car" : node.id === "03" ? `${orig} ➔ ${dest}` : "LUXY Dropoff"}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Standard Executive Travel Itinerary ── */}
      <div className="space-y-3">
        {/* Flight Itinerary Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/25 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/15">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">Flight Itinerary</span>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Operator Sourcing Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <p className="text-xl font-black text-white">{orig}</p>
              <p className="text-xs font-bold text-cyan-300">{depFboStr}</p>
              <p className="text-[10px] text-slate-400">{cleanDate}</p>
            </div>
            <div className="text-center sm:border-x sm:border-slate-800 py-1">
              <Plane className="w-5 h-5 text-cyan-400 mx-auto" />
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Non-Stop · {displayAircraft}</p>
              <p className="text-[9px] text-slate-500">{paxCount} Vetted Passenger(s)</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xl font-black text-white">{dest}</p>
              <p className="text-xs font-bold text-cyan-300">{arrFboStr}</p>
              <p className="text-[10px] text-slate-400">Direct Tarmac Ramp</p>
            </div>
          </div>
        </div>

        {/* Ground Transport Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Ground Transportation (LUXY Black SUV)</p>
              <p className="text-[10px] text-slate-400">
                {hasLuxyGround ? "Chauffeured Pickup Requested · Direct Tarmac Gate 4 Access" : "Self-Arranged Ground Transport to Private Terminal"}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
            {hasLuxyGround ? "Requested" : "Self"}
          </span>
        </div>

        {/* Part 295 Broker Notice */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-slate-300 space-y-1">
          <p className="font-black text-amber-300 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <span>⚠️</span> Important Charter Sourcing Notice
          </p>
          <p className="text-[10.5px] leading-relaxed text-slate-300">
            This confirms your card authorization hold of <strong className="text-white">${formattedPrice} USD</strong>. As a DOT Part 295 charter broker, FlyDnA is currently sourcing live bids from certified Part 135 direct air carriers. The final price may adjust when hard quotes are confirmed. Binding operator contracts and tail assignments will be delivered to your Concierge Chat (`101`) prior to capture.
          </p>
        </div>
      </div>

      {/* ── B2B Dispatch Handoff & Export Hub (For EAs, Travel Agents & Tour Operators) ── */}
      <div className="p-4 rounded-2xl bg-[#061322] border border-cyan-500/25 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>💼</span> Executive Handoff & Agency Export Hub
            </span>
            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Zero Friction Integration
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Seamlessly push charter details into executive Outlook/Google calendars, CRM systems (Salesforce, ClientBase, TRAMS), and corporate accounting.
          </p>
        </div>

        {/* Calendar Sync Group */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">1-Click Executive Calendar Sync</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href={outlookCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-[11px] transition cursor-pointer text-center"
            >
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Add to Outlook Web</span>
            </a>
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] transition cursor-pointer text-center"
            >
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Add to Google Cal</span>
            </a>
            <button
              type="button"
              onClick={handleExportICS}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-[11px] transition cursor-pointer text-center"
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Download .ICS (iCal)</span>
            </button>
          </div>
        </div>

        {/* Agency Back-Office & CRM Group */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Back-Office & CRM Export Formats</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={`${backendBase}/api/jets/export/${bookingId || requestId || "DEMO-101"}?format=xlsx${tok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 font-bold text-[10.5px] transition text-center"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </a>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 font-bold text-[10.5px] transition cursor-pointer text-center"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Sheet</span>
            </button>
            <a
              href={`${backendBase}/api/jets/export/${bookingId || requestId || "DEMO-101"}?format=pdf${tok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 font-bold text-[10.5px] transition text-center"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Briefing PDF</span>
            </a>
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 font-bold text-[10.5px] transition cursor-pointer text-center"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CRM JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Return to Lobby */}
      {onReturn && (
        <button
          onClick={onReturn}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
        >
          Return to Lobby
        </button>
      )}
    </div>
  );
};

export default JourneyRoadmap;
