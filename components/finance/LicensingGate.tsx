"use client";
import React, { useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";

export default function LicensingGate({ feature }: { feature: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="absolute top-3 right-3 z-[60] pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[9px] font-black uppercase tracking-wider">
        <Lock size={9} /> In Licensing
      </div>
      <div
        className="absolute inset-0 z-50 cursor-pointer rounded-[26px]"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={`${feature} coming soon`}
      />
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="max-w-sm w-full glass-panel-heavy rounded-[26px] border border-cyan-400/20 bg-[#06111f]/95 p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 grid place-items-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 mb-4">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-white font-extrabold text-base uppercase tracking-wide mb-2">{feature} — Almost Here</h3>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              We&apos;re completing regulatory licensing to ensure every transaction on FlyDnA is fully protected. Members will be notified the moment this goes live.
            </p>
            <button onClick={() => setOpen(false)} className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider cursor-pointer">
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
