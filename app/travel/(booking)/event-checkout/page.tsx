"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProgressBar from "../components/ProgressBar";

type Seat = { section: number; row: string; seat: number; tier: string };
type Guest = { seat: string; firstName: string; lastName: string };

const vehicleFor = (n: number) => (n <= 3 ? "Sedan / SUV" : n === 4 ? "SUV XL" : n <= 13 ? "Sprinter Van" : "Motorcoach");

export default function EventCheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<number>(params.get("step") === "2" ? 2 : 1);
  const [event, setEvent] = useState<any>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [qty, setQty] = useState(1);

  // Add-ons (all request-mode: no prices, no availability promised — dispatch/partner desk quotes)
  const [blackCar, setBlackCar] = useState(false);
  const [pickupType, setPickupType] = useState<"address" | "airport" | "fbo">("address");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnRide, setReturnRide] = useState(true);
  const [hospitality, setHospitality] = useState(false);
  const [hospitalityNote, setHospitalityNote] = useState("");
  const [dinner, setDinner] = useState(false);
  const [dinnerTime, setDinnerTime] = useState("");
  const [afterParty, setAfterParty] = useState(false);

  // Guests
  const [lead, setLead] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    try {
      const ev = JSON.parse(sessionStorage.getItem("checkout_event") || "null");
      const booking = JSON.parse(sessionStorage.getItem("checkout_event_booking") || "null");
      const q = parseInt(sessionStorage.getItem("checkout_qty") || "", 10) || booking?.quantity || 1;
      setEvent(ev); setQty(q);
      const s: Seat[] = booking?.seats || [];
      setSeats(s);
      setGuests(s.map((st) => ({ seat: `Sec ${st.section} · Row ${st.row} · Seat ${st.seat}`, firstName: "", lastName: "" })));
      const u = JSON.parse(localStorage.getItem("flydna_user") || "null");
      if (u) setLead((l) => ({ ...l, firstName: u.firstName || (u.name || "").split(" ")[0] || "", lastName: u.lastName || (u.name || "").split(" ").slice(1).join(" ") || "", email: u.email || "", phone: u.phone || "" }));
      const prevAdd = JSON.parse(sessionStorage.getItem("checkout_addons") || "null");
      if (Array.isArray(prevAdd)) {
        const bc = prevAdd.find((a: any) => a.type === "black_car"); if (bc) { setBlackCar(true); setPickupType(bc.pickupType || "address"); setPickupLocation(bc.pickupLocation || ""); setPickupTime(bc.pickupTime || ""); setReturnRide(!!bc.returnRide); }
        const h = prevAdd.find((a: any) => a.type === "hospitality"); if (h) { setHospitality(true); setHospitalityNote(h.note || ""); }
        const d = prevAdd.find((a: any) => a.type === "dinner"); if (d) { setDinner(true); setDinnerTime(d.time || ""); }
        if (prevAdd.find((a: any) => a.type === "after_party")) setAfterParty(true);
      }
    } catch {}
  }, []);

  const vehicle = useMemo(() => vehicleFor(qty), [qty]);

  const saveAddons = () => {
    const addOns: any[] = [];
    if (blackCar) addOns.push({ type: "black_car", provider: "LUXY", passengers: qty, vehicleRequested: vehicle, pickupType, pickupLocation, pickupTime, returnRide, status: "requested", note: "Quoted at dispatch" });
    if (hospitality) addOns.push({ type: "hospitality", provider: "partner_desk", note: hospitalityNote, status: "requested" });
    if (dinner) addOns.push({ type: "dinner", partySize: qty, time: dinnerTime, status: "requested" });
    if (afterParty) addOns.push({ type: "after_party", partySize: qty, status: "requested" });
    sessionStorage.setItem("checkout_addons", JSON.stringify(addOns));
  };

  const goGuests = () => { saveAddons(); setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const goPayment = () => {
    saveAddons();
    const list = [{ ...lead, seat: guests[0]?.seat || "", role: "lead" }, ...guests.slice(1).map((g) => ({ firstName: g.firstName, lastName: g.lastName, seat: g.seat, role: "guest" }))];
    sessionStorage.setItem("checkout_guests", JSON.stringify(list));
    router.push("/travel/payment");
  };

  const leadOk = lead.firstName.trim() && lead.lastName.trim() && lead.email.trim();
  const card = "glass-panel-heavy rounded-3xl p-6 md:p-8 border border-white/10";
  const input = "w-full glass-input rounded-xl py-2.5 px-3 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none";
  const label = "block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1";
  const toggleRow = (on: boolean, set: (v: boolean) => void, title: string, sub: string) => (
    <button type="button" onClick={() => set(!on)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition text-left ${on ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
      <div><div className="text-sm font-black text-[var(--text-main)]">{title}</div><div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div></div>
      <span className={`shrink-0 w-11 h-6 rounded-full relative transition ${on ? "bg-[var(--accent-primary)]" : "bg-white/15"}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${on ? "left-[22px]" : "left-0.5"}`} /></span>
    </button>
  );

  return (
    <div className="min-h-screen px-4 pb-16">
      <ProgressBar currentStep={step === 1 ? 2 : 3} mode="event" />
      <div className="max-w-4xl mx-auto grid gap-6">
        {event && (
          <div className="rounded-2xl p-4 bg-cyan-500/5 border border-cyan-500/20 flex flex-col gap-1">
            <span className="text-sm font-black text-[var(--text-main)]">{event.name}</span>
            <span className="text-xs text-[var(--text-muted)]">📍 {event.venue}{event.city ? ` (${event.city})` : ""} {event.date ? `· 📅 ${event.date}` : ""} {event.time ? `· ⏰ ${event.time}` : ""}</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 mt-1">🎟️ {qty} {qty === 1 ? "ticket" : "tickets"}{seats.length ? ` · ${seats.map((s) => `Sec ${s.section} R${s.row} S${s.seat}`).join(", ")}` : ""}</span>
          </div>
        )}

        {step === 1 && (
          <div className={card}>
            <h1 className="text-2xl font-black text-[var(--text-main)]">Add-Ons</h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">Everything here is requested for you and confirmed by a human — nothing is charged on this step.</p>
            <div className="flex flex-col gap-3">
              {toggleRow(blackCar, setBlackCar, "🚘 Black Car to the venue (LUXY)", `${qty} ${qty === 1 ? "passenger" : "passengers"} → ${vehicle} requested · quoted at dispatch`)}
              {blackCar && (
                <div className="grid md:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div><label className={label}>Pickup From</label>
                    <select value={pickupType} onChange={(e) => setPickupType(e.target.value as any)} className={input}><option value="address">Address</option><option value="airport">Airport (commercial)</option><option value="fbo">FBO (private)</option></select></div>
                  <div><label className={label}>{pickupType === "address" ? "Street Address" : pickupType === "airport" ? "Airport / Flight #" : "FBO / ICAO / Tail #"}</label>
                    <input autoComplete="off" type="search" name="flydna-search" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder={pickupType === "fbo" ? "LZU · Sheltair · N800XP" : pickupType === "airport" ? "ATL · DL1234" : "Where should we pick you up?"} className={input} /></div>
                  <div><label className={label}>Pickup / Arrival Time</label><input autoComplete="off" type="text" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} placeholder="6:15 PM" className={input} /></div>
                  <label className="md:col-span-3 flex items-center gap-2 text-xs text-[var(--text-main)] cursor-pointer"><input type="checkbox" checked={returnRide} onChange={(e) => setReturnRide(e.target.checked)} /> Return ride after the event</label>
                </div>
              )}
              {toggleRow(hospitality, setHospitality, "⭐ Hospitality upgrade", "Suite, courtside, club lounge, meet-and-greet — priced by our partner desk")}
              {hospitality && <textarea value={hospitalityNote} onChange={(e) => setHospitalityNote(e.target.value)} placeholder="What would make it a night? (e.g. suite for 8, pre-game lounge access)" className={input + " min-h-[70px]"} />}
              {toggleRow(dinner, setDinner, "🍽️ Pre-game dinner", `Table for ${qty} near the venue — concierge reserves`)}
              {dinner && <input autoComplete="off" type="text" value={dinnerTime} onChange={(e) => setDinnerTime(e.target.value)} placeholder="Preferred time, e.g. 5:30 PM" className={input} />}
              {toggleRow(afterParty, setAfterParty, "🥂 After-party", "VIP section / bottle service reservation — concierge arranges")}
            </div>
            <div className="flex justify-between mt-8">
              <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">← Back to seats</button>
              <button type="button" onClick={goGuests} className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer">Continue to Guest Details →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={card}>
            <h1 className="text-2xl font-black text-[var(--text-main)]">Guest Details</h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">Tickets transfer to the lead guest. Add names for the other seats so everyone's on the manifest.</p>
            <div className="grid md:grid-cols-2 gap-3 mb-6">
              <div><label className={label}>Lead Guest — First Name</label><input autoComplete="given-name" type="text" value={lead.firstName} onChange={(e) => setLead({ ...lead, firstName: e.target.value })} className={input} /></div>
              <div><label className={label}>Last Name</label><input autoComplete="family-name" type="text" value={lead.lastName} onChange={(e) => setLead({ ...lead, lastName: e.target.value })} className={input} /></div>
              <div><label className={label}>Email (tickets sent here)</label><input autoComplete="email" type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} className={input} /></div>
              <div><label className={label}>Phone</label><input autoComplete="tel" type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} className={input} /></div>
            </div>
            <div className="flex flex-col gap-2">
              {guests.map((g, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr] gap-3 items-end p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div><div className={label}>{i === 0 ? "Lead guest seat" : `Guest ${i + 1}`}</div><div className="text-xs font-black text-cyan-300">{g.seat}</div></div>
                  {i === 0 ? (
                    <div className="col-span-2 text-xs text-[var(--text-muted)] self-center">{lead.firstName || lead.lastName ? `${lead.firstName} ${lead.lastName}` : "Lead guest (above)"}</div>
                  ) : (
                    <>
                      <input autoComplete="off" type="text" placeholder="First name" value={g.firstName} onChange={(e) => setGuests(guests.map((x, j) => (j === i ? { ...x, firstName: e.target.value } : x)))} className={input} />
                      <input autoComplete="off" type="text" placeholder="Last name" value={g.lastName} onChange={(e) => setGuests(guests.map((x, j) => (j === i ? { ...x, lastName: e.target.value } : x)))} className={input} />
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">← Add-Ons</button>
              <button type="button" disabled={!leadOk} onClick={goPayment} className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Continue to Payment →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
