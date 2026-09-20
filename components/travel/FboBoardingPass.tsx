"use client";

import React from "react";
import { Plane, ShieldCheck, MapPin, Clock, Car, QrCode, Sparkles } from "lucide-react";

interface ConfirmedDetails {
  operatingCarrier?: string;
  tailNumber?: string;
  fboName?: string;
  fboAddress?: string;
  departureTime?: string;
  tarmacAccessApproved?: boolean;
  qrCodeData?: string;
}

interface FboBoardingPassProps {
  requestId: string;
  leadPassengerName: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  aircraftClass: string;
  confirmedDetails: ConfirmedDetails;
  paxCount: number;
}

export default function FboBoardingPass({
  requestId,
  leadPassengerName,
  originCode,
  destinationCode,
  departureDate,
  aircraftClass,
  confirmedDetails,
  paxCount,
}: FboBoardingPassProps) {
  const fboName = confirmedDetails.fboName || "Signature Flight Support (PDK)";
  const fboAddress = confirmedDetails.fboAddress || "2000 Aviation Way, Atlanta, GA 30341";
  const tailNumber = confirmedDetails.tailNumber || "N800XP";
  const carrier = confirmedDetails.operatingCarrier || "Executive Air Charter (Part 135)";
  const depTime = confirmedDetails.departureTime || "02:00 PM EDT";
  const tarmacApproved = confirmedDetails.tarmacAccessApproved ?? true;

  return (
    <div className="w-full max-w-2xl mx-auto my-6 rounded-3xl bg-slate-950/95 border border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-2xl text-white overflow-hidden relative">
      {/* Header Accent Bar */}
      <div className="bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-600 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-950">
            FBO EXECUTIVE PASS • DISPATCH CONFIRMED
          </span>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-950/80 text-cyan-300 border border-cyan-400/40">
          PART 135 CHARTER
        </span>
      </div>

      {/* Main Pass Body */}
      <div className="p-6 space-y-6">
        {/* Route Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Departure FBO</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{originCode || "ATL"}</h3>
            <p className="text-xs font-semibold text-slate-300">{fboName}</p>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <div className="w-24 h-[1.5px] bg-gradient-to-r from-cyan-400 to-blue-500" />
              <Plane className="w-5 h-5 transform rotate-90 text-cyan-300 drop-shadow-[0_0_10px_#22d3ee]" />
              <div className="w-24 h-[1.5px] bg-gradient-to-r from-blue-500 to-cyan-400" />
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>
            <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase">Direct Executive Charter</span>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Destination</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{destinationCode || "JFK"}</h3>
            <p className="text-xs font-semibold text-slate-300">Executive FBO Ramp</p>
          </div>
        </div>

        {/* Flight & Aircraft Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10">
          <div>
            <p className="text-[9px] uppercase font-extrabold text-slate-400">Aircraft Tail #</p>
            <p className="text-sm font-black text-cyan-300 tracking-widest">{tailNumber}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-extrabold text-slate-400">Departure Time</p>
            <p className="text-sm font-black text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {depTime}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-extrabold text-slate-400">Operating Carrier</p>
            <p className="text-xs font-bold text-slate-200 truncate">{carrier}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-extrabold text-slate-400">Passengers</p>
            <p className="text-xs font-bold text-slate-200">{paxCount} PAX Manifest</p>
          </div>
        </div>

        {/* Physical FBO Address & LUXY Tarmac Clearance */}
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 bg-cyan-950/40 p-3.5 rounded-xl border border-cyan-400/30">
            <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-cyan-200">{fboName}</p>
              <p className="text-[11px] text-slate-300 font-mono">{fboAddress}</p>
              <p className="text-[9px] text-cyan-400/80 mt-0.5"> Drive directly to FBO private lounge building. Free executive parking available.</p>
            </div>
          </div>

          {tarmacApproved && (
            <div className="flex items-center gap-2 bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>LUXY Black Car Tarmac Drive-Up Approved — Vehicle cleared for direct aircraft ramp drop-off</span>
            </div>
          )}
        </div>

        {/* Lead Passenger & QR Code Dispatch */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-[9px] uppercase font-extrabold text-slate-400">Lead Passenger</p>
            <p className="text-sm font-black text-white">{leadPassengerName}</p>
            <p className="text-[10px] font-mono text-cyan-400 mt-0.5">REF: {requestId}</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-xl border border-white/10">
            <QrCode className="w-10 h-10 text-cyan-400" />
            <div className="text-[9px] font-mono text-slate-300">
              <p className="font-bold text-white">SCAN AT FBO DESK</p>
              <p>TSA SECURE VETTED</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory DOT Part 295 Broker Disclosure Footer */}
      <div className="bg-slate-900/90 px-6 py-2.5 border-t border-white/10 text-[9px] text-slate-400 leading-normal flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">DOT Part 295 Legal Disclosure:</strong> FlyDnA Inc acts solely as an authorized air charter broker and not as a direct air carrier. All flights are operated by FAA Part 135 certified air carriers in full operational control.
        </p>
      </div>
    </div>
  );
}
