"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import NascHeader, { SearchLocation } from "@/components/nasc/NascHeader";

function getLaunchCountdown() {
  const target = new Date("2026-12-01T00:00:00Z").getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return { days, hours: pad(hours), mins: pad(mins), secs: pad(secs) };
}

import NascArcMenu from "@/components/nasc/NascArcMenu";
import NascVenueCard from "@/components/nasc/NascVenueCard";
import NascTransitionOverlay from "@/components/nasc/NascTransitionOverlay";

const NascATLMapPanel = dynamic(
  () => import("@/components/nasc/NascATLMapPanel"),
  {
    ssr: false,
  },
);

const NascAgenticAI = dynamic(() => import("@/components/nasc/NascAgenticAI"), {
  ssr: false,
});

/* ── Floating video widget ─────────────────────────────────────────────────── */
interface VideoSource {
  type: "youtube";
  id: string;
}

const VIDEO_DB: Record<string, VideoSource> = {
  // ── City feeds (default when no venue selected) ───────────────────────────
  "New York": { type: "youtube", id: "NAR216YbUxk" }, // Knicks 2026 Finals
  Atlanta: { type: "youtube", id: "1b9kklygGu0" }, // Cosm ATL / ATL vibe
  Florida: { type: "youtube", id: "Dk7hHpGdI0I" }, // FL promo
  Texas: { type: "youtube", id: "UZIYQGo0Q6Z" }, // TX promo

  // ── ATL Venues ────────────────────────────────────────────────────────────
  cosm: { type: "youtube", id: "1b9kklygGu0" }, // Cosm ATL Short ✅
  nobu: { type: "youtube", id: "G9cO4t7X7jU" }, // Nobu Atlanta
  cnn: { type: "youtube", id: "q6t8m-x-UfE" }, // CNN HQ
  "mercedes-benz": { type: "youtube", id: "AeFjLCugH4Q" }, // ⚽ FOX Sports — FIFA WC 2026 (embeddable)
  "atl-united": { type: "youtube", id: "dAGZQzBY2zY" }, // ⚽ ATL United vs Chattanooga Jun 2026
  "state-farm": { type: "youtube", id: "NAR216YbUxk" }, // Hawks arena
  "truist-park": { type: "youtube", id: "R5vbs7blVH0" }, // Braves
  "ponce-city": { type: "youtube", id: "1b9kklygGu0" }, // PCM vibe
  "pete-petit": { type: "youtube", id: "nN4g-z_R55g" }, // Center Parc
  hartsfield: { type: "youtube", id: "NAR216YbUxk" }, // Hartsfield

  // ── NYC Venues ────────────────────────────────────────────────────────────
  msg: { type: "youtube", id: "NAR216YbUxk" }, // 🏆 Knicks 2026 Finals highlights
  bc: { type: "youtube", id: "NAR216YbUxk" }, // Barclays / Nets
  citi: { type: "youtube", id: "NAR216YbUxk" }, // Citi Field / Mets
  yankee: { type: "youtube", id: "NAR216YbUxk" }, // Yankee Stadium
  metlife: { type: "youtube", id: "NAR216YbUxk" }, // MetLife / Jets · Giants
  redbull: { type: "youtube", id: "NAR216YbUxk" }, // Red Bull Arena
  ubs: { type: "youtube", id: "NAR216YbUxk" }, // UBS / Islanders

  // ── NYC Airports ──────────────────────────────────────────────────────────
  lga: { type: "youtube", id: "1b9kklygGu0" }, // LGA terminal
  jfk: { type: "youtube", id: "1b9kklygGu0" }, // JFK international
  ewr: { type: "youtube", id: "1b9kklygGu0" }, // Newark Liberty
  teb: { type: "youtube", id: "1b9kklygGu0" }, // Teterboro private
};

function getVideoSource(venue: string | null, city: string): VideoSource {
  if (venue && VIDEO_DB[venue]) return VIDEO_DB[venue];
  return VIDEO_DB[city] || { type: "youtube", id: "h3h035Eyx5A" };
}

function FloatingVideo({
  activeVenue,
  currentState,
}: {
  activeVenue: string | null;
  currentState: string;
}) {
  const [minimized, setMinimized] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoSource>(() =>
    getVideoSource(activeVenue, currentState),
  );
  const [isChangingChannel, setIsChangingChannel] = useState(false);

  // CRT channel-change static effect when venue or city changes
  useEffect(() => {
    const next = getVideoSource(activeVenue, currentState);
    if (next.id !== currentVideo.id || next.type !== currentVideo.type) {
      setIsChangingChannel(true);
      const timer = setTimeout(() => {
        setCurrentVideo(next);
        setIsChangingChannel(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeVenue, currentState]);

  const CHANNEL_NAMES: Record<string, string> = {
    // ATL
    cosm: "CH-01: COSM ATL",
    nobu: "CH-02: NOBU ATLANTA",
    cnn: "CH-03: CNN HQ FEED",
    "mercedes-benz": "CH-04: FIFA WC 2026 ⚽ BENZ HOST",
    "atl-united": "CH-04B: FIFA WC 2026 ⚽ ATL UNITED",
    "state-farm": "CH-05: STATE FARM ARENA",
    "truist-park": "CH-06: TRUIST PARK",
    "ponce-city": "CH-07: PONCE CITY MKT",
    "pete-petit": "CH-08: GEORGIA AQUARIUM",
    hartsfield: "CH-09: HARTSFIELD-JACKSON",
    // NYC
    msg: "CH-10: MADISON SQ GARDEN",
    bc: "CH-11: BARCLAYS CENTER",
    citi: "CH-12: CITI FIELD",
    yankee: "CH-13: YANKEE STADIUM",
    metlife: "CH-14: METLIFE STADIUM",
    redbull: "CH-15: RED BULL ARENA",
    ubs: "CH-16: UBS ARENA",
    lga: "CH-17: LAGUARDIA AIRPORT",
    jfk: "CH-18: JFK INT'L AIRPORT",
    ewr: "CH-19: NEWARK LIBERTY",
    teb: "CH-20: TETERBORO PRIVATE",
  };
  const channelName =
    activeVenue && CHANNEL_NAMES[activeVenue]
      ? CHANNEL_NAMES[activeVenue]
      : `CH-LIVE: ${currentState.toUpperCase()}`;

  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: minimized ? 48 : hovered ? 480 : 380,
        height: minimized ? 48 : hovered ? 270 : 214,
        borderRadius: minimized ? "50%" : 12,
        overflow: "hidden",
        border: "1px solid rgba(0,229,255,0.28)",
        boxShadow: hovered
          ? "0 0 32px rgba(0,229,255,0.25), inset 0 0 16px rgba(0,229,255,0.06)"
          : "0 0 20px rgba(0,229,255,0.12), inset 0 0 12px rgba(0,229,255,0.04)",
        backdropFilter: "blur(6px)",
        background: "rgba(6,0,28,0.35)",
        transition: "all 0.35s cubic-bezier(0.34,1.2,0.64,1)",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes noise {
          0%   { transform: translate(0,0) }
          10%  { transform: translate(-1%,-1%) }
          20%  { transform: translate(-2%,1%) }
          30%  { transform: translate(1%,-2%) }
          40%  { transform: translate(-1%,3%) }
          50%  { transform: translate(-2%,1%) }
          60%  { transform: translate(1%,3%) }
          70%  { transform: translate(2%,1%) }
          80%  { transform: translate(-2%,-1%) }
          90%  { transform: translate(1%,2%) }
          100% { transform: translate(1%,-2%) }
        }
      `}</style>

      {!minimized ? (
        <>
          <iframe
            style={{
              width: "100%",
              height: "100%",
              opacity: 1,
              display: "block",
              border: "none",
            }}
            src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=1&playlist=${currentVideo.id}&loop=1&controls=0&showinfo=0&vq=hd1080&hd=1&modestbranding=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />

          {/* CRT static noise overlay — fires on channel change */}
          {isChangingChannel && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                background: "#000",
                overflow: "hidden",
                opacity: 0.9,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "-100px",
                  background:
                    "repeating-radial-gradient(circle at 17% 32%, white, black 0.00085px)",
                  opacity: 0.22,
                  animation: "noise 0.12s steps(4) infinite",
                  filter: "contrast(150%) brightness(120%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))",
                  backgroundSize: "100% 3px, 3px 100%",
                }}
              />
            </div>
          )}

          {/* Scan-line overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
            }}
          />

          {/* Channel info bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px",
              background:
                "linear-gradient(180deg, rgba(6,0,28,0.7) 0%, transparent 100%)",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "rgba(0,229,255,0.7)",
                letterSpacing: "0.15em",
                fontFamily: "monospace",
                flexGrow: 1,
              }}
            >
              ● {channelName}
            </span>
            <button
              onClick={() => setMinimized(true)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(0,229,255,0.5)",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ─
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setMinimized(false)}
          style={{
            width: "100%",
            height: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(0,229,255,0.7)",
            fontSize: 18,
          }}
        >
          ▶
        </button>
      )}
    </div>
  );
}

/* ── Main NASC page ─────────────────────────────────────────────────────────── */
const NASC_ALLOWED_EMAILS = [
  "betauser2@flydna.com",
  "betauser1@flydna.com",
  "hector@flydna.io",
];

export default function NascPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("flydna_user");
      const user = raw ? JSON.parse(raw) : null;
      const email = (user?.email || "").toLowerCase();
      const isAllowed = NASC_ALLOWED_EMAILS.includes(email);
      return (
        isAllowed ||
        user?.nascAccess === true ||
        user?.isAdmin === true ||
        user?.isSubscribed === true
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("flydna_user");
      const user = raw ? JSON.parse(raw) : null;
      const email = (user?.email || "").toLowerCase();
      const isAllowed = NASC_ALLOWED_EMAILS.includes(email);
      setHasAccess(
        isAllowed ||
          user?.nascAccess === true ||
          user?.isAdmin === true ||
          user?.isSubscribed === true,
      );
    } catch {
      setHasAccess(false);
    }
  }, []);

  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<string>("Atlanta");
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [activeVenue, setActiveVenue] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isJoinedWaitlist, setIsJoinedWaitlist] = useState(false);
  const [cd, setCd] = useState(() => getLaunchCountdown());

  useEffect(() => {
    const timer = setInterval(() => setCd(getLaunchCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleLayer = (layer: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  // Search → flyTo + beam + auto-enable layer
  const handleSearchSelect = (loc: SearchLocation) => {
    if (loc.layer)
      setVisibleLayers((prev) => {
        const n = new Set(prev);
        n.add(loc.layer!);
        return n;
      });
    setActiveVenue(null); // brief reset so useEffect fires even if same venue re-selected
    setTimeout(() => setActiveVenue(loc.type === "city" ? null : loc.id), 50);
    if (loc.city !== currentState) setTransitionTarget(loc.city);
  };

  // Venue click → set active (TV channel) + auto-open venue card
  const handleLandmarkClick = (venue: string | null) => {
    setActiveVenue(venue);
  };

  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06111f]">
        <div className="size-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#020814] via-[#040914] to-[#010308] text-center relative overflow-hidden font-sans">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

        {/* Top-Left Back Button */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition duration-200 backdrop-blur-md cursor-pointer group shadow-sm"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform duration-200 text-slate-400 group-hover:text-white"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Back to Lobby</span>
        </Link>

        {/* Main Card */}
        <div className="relative z-10 max-w-lg w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 text-white text-center">
          {/* Header & Status Indicator */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-slate-400">December 2026</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Network Activity Service Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed max-w-sm mx-auto">
              Real-time telemetry, venue feeds, and VIP corridor operations for
              verified FlyDnA members.
            </p>
          </div>

          {/* Countdown Clock Grid */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-xs py-1">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-lg sm:text-xl font-mono font-bold text-white">
                {cd.days}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Days
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-lg sm:text-xl font-mono font-bold text-white">
                {cd.hours}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Hours
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-lg sm:text-xl font-mono font-bold text-white">
                {cd.mins}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Mins
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-lg sm:text-xl font-mono font-bold text-white">
                {cd.secs}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Secs
              </span>
            </div>
          </div>

          {/* Form / Success State */}
          {!isJoinedWaitlist ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!waitlistEmail.trim()) return;
                setIsJoinedWaitlist(true);
                if (typeof window !== "undefined") {
                  try {
                    const saved = JSON.parse(
                      localStorage.getItem("flydna_nasc_waitlist") || "[]",
                    );
                    saved.push(waitlistEmail);
                    localStorage.setItem(
                      "flydna_nasc_waitlist",
                      JSON.stringify(saved),
                    );
                    window.dispatchEvent(
                      new CustomEvent("flydna-new-notification", {
                        detail: {
                          message: `NASC Early Access requested for ${waitlistEmail}`,
                        },
                      }),
                    );
                  } catch (err) {}
                }
              }}
              className="w-full flex flex-col gap-3"
            >
              <input
                type="email"
                required
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-slate-700 transition"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] border border-slate-700 hover:border-slate-600 text-cyan-300 font-semibold text-xs tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Request Early Access</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-cyan-400"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </form>
          ) : (
            <div className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Request Received
              </span>
              <p className="text-[11px] text-slate-400">
                You will be notified as priority invitations open for the NASC
                network.
              </p>
            </div>
          )}

          {/* Footer Metadata / Trust Info */}
          <div className="border-t border-slate-800/80 pt-4 w-full flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-600" />
              DLA CAGE Verified
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-600" />
              Live Telemetry
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-600" />
              256-Bit Encrypted
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="immersive-shell">
      {/* MAP CANVAS — z-0 */}
      <div className="map-canvas">
        <NascATLMapPanel
          visibleLayers={visibleLayers}
          onLandmarkClick={handleLandmarkClick}
          activeVenue={activeVenue}
          currentState={currentState}
        />
      </div>

      {/* HUD LAYER — z-10 */}
      <div className="hud-layer">
        {/* TOP: NASC Header with search */}
        <div className="hud-interactive w-full">
          <NascHeader onSearchSelect={handleSearchSelect} />
        </div>

        {/* TOP-RIGHT: Floating drone-feed TV */}
        <div
          style={{
            position: "absolute",
            top: "120px",
            right: "20px",
            zIndex: 20,
            pointerEvents: "auto",
          }}
        >
          <FloatingVideo
            activeVenue={activeVenue}
            currentState={currentState}
          />
        </div>

        {/* TOP-RIGHT: Venue info card — appears on venue click */}
        {activeVenue && (
          <div
            style={{
              position: "absolute",
              top: "350px",
              right: "20px",
              zIndex: 25,
              pointerEvents: "auto",
            }}
          >
            <NascVenueCard
              venueId={activeVenue}
              onClose={() => setActiveVenue(null)}
            />
          </div>
        )}

        {/* BOTTOM-RIGHT: AI Concierge button — dark, above ArcMenu */}
        <div
          style={{
            position: "absolute",
            bottom: "130px",
            right: "24px",
            zIndex: 35,
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => setShowAI(true)}
            title="Open FlyDnA AI Concierge"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 14,
              border: "1px solid rgba(99,102,241,0.35)",
              background:
                "linear-gradient(135deg, rgba(6,0,24,0.92) 0%, rgba(18,5,48,0.95) 100%)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              color: "#a5b4fc",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              boxShadow:
                "0 0 14px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 24px rgba(99,102,241,0.4)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)";
              e.currentTarget.style.background =
                "linear-gradient(135deg, rgba(12,4,40,0.96) 0%, rgba(30,10,70,0.96) 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 14px rgba(99,102,241,0.18)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
              e.currentTarget.style.background =
                "linear-gradient(135deg, rgba(6,0,24,0.92) 0%, rgba(18,5,48,0.95) 100%)";
            }}
          >
            <span style={{ fontSize: 15 }}>✦</span>
            AI Concierge
          </button>
        </div>

        {/* BOTTOM: Arc orbital menu dock */}
        <div
          className="hud-interactive"
          style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
        >
          <NascArcMenu
            visibleLayers={visibleLayers}
            onToggleLayer={handleToggleLayer}
            onStateSelect={setTransitionTarget}
          />
        </div>
      </div>

      {/* FULLSCREEN STATE TRANSITION */}
      {transitionTarget && (
        <NascTransitionOverlay
          targetState={transitionTarget}
          onComplete={() => {
            setCurrentState(transitionTarget);
            setTransitionTarget(null);
          }}
        />
      )}

      {/* FULLSCREEN AI CONCIERGE OVERLAY */}
      {showAI && <NascAgenticAI onClose={() => setShowAI(false)} />}
    </div>
  );
}
