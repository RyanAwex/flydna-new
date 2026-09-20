"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  animate,
} from "framer-motion";
import { useRef, useEffect } from "react";
import Image from "next/image";

const destinations = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=150&q=80",
    title: "Paris",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&w=150&q=80",
    title: "Rome",
  },
  {
    id: 3,
    image:
      "https://plus.unsplash.com/premium_photo-1661914240950-b0124f20a5c1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dG9reW98ZW58MHx8MHx8fDA%3D",
    title: "Tokyo",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=150&q=80",
    title: "Dubai",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=150&q=80",
    title: "Amsterdam",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=150&q=80",
    title: "Sydney",
  },
  {
    id: 7,
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=150&q=80",
    title: "London",
  },
  {
    id: 8,
    image:
      "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=150&q=80",
    title: "New York",
  },
  {
    id: 9,
    image:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=150&q=80",
    title: "Kyoto",
  },
  {
    id: 10,
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=150&q=80",
    title: "Bali",
  },
  {
    id: 11,
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=150&q=80",
    title: "Prague",
  },
  {
    id: 12,
    image:
      "https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=150&q=80",
    title: "Santorini",
  },
  {
    id: 13,
    image:
      "https://images.unsplash.com/photo-1598135753163-6167c1a1ad65?auto=format&fit=crop&w=150&q=80",
    title: "Maldives",
  },
];

const ARC_START_DEG = -110;
const ARC_END_DEG = 110;
const ARC_RANGE_DEG = ARC_END_DEG - ARC_START_DEG;

const RING_RADIUS = 550;
const RING_CENTER_Y = 630;
const IMG_HALF = 48;
const DURATION_MS = 60000;
const total = destinations.length;

export default function DestinationsArc() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const globeX = useMotionValue(169);
  const planeScaleX = useMotionValue(1);
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(globeX, [169, -316], {
      duration: 12,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    });
    return controls.stop;
  }, [globeX]);

  useAnimationFrame((t) => {
    try {
      if (!globeX || typeof globeX.get !== "function" || !planeScaleX || typeof planeScaleX.get !== "function") return;
      const currentX = globeX.get();
      const baseProgress = (169 - currentX) / (169 - -316);
      const velocity = typeof globeX.getVelocity === "function" ? globeX.getVelocity() : 0;

      // Update plane direction without triggering React renders
      if (velocity < 0 && planeScaleX.get() !== 1) planeScaleX.set(1);
      if (velocity > 0 && planeScaleX.get() !== -1) planeScaleX.set(-1);

      const flightProgress = velocity < 0 ? baseProgress : 1 - baseProgress;
      const totalMinutes = 840;
      const currentMins = Math.round(flightProgress * totalMinutes);
      const hrs = Math.floor(currentMins / 60);
      const mins = currentMins % 60;

      let timeStr = "";
      if (flightProgress < 0.05) timeStr = "Departing...";
      else if (flightProgress > 0.95) timeStr = "Arrived";
      else timeStr = `${hrs}h ${mins}m`;

      if (timeRef.current && timeRef.current.textContent !== timeStr) {
        timeRef.current.textContent = timeStr;
      }

      refs.current.forEach((el, i) => {
        if (!el) return;

        const offset = (i / total) * DURATION_MS;
        const normalized = ((t + offset) % DURATION_MS) / DURATION_MS;

        const angleDeg = ARC_START_DEG + normalized * ARC_RANGE_DEG;
        const angleRad = angleDeg * (Math.PI / 180);

        const x = Math.sin(angleRad) * RING_RADIUS - IMG_HALF;
        const y = RING_CENTER_Y - Math.cos(angleRad) * RING_RADIUS - IMG_HALF;

        // GPU Accelerated positioning
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    } catch (err) {
      return;
    }
  });

  return (
    <section className="w-full py-16 overflow-hidden relative flex flex-col items-center">
      <div className="text-center relative z-10 px-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-3">
          ✦ DESTINATIONS UNLIMITED ✦
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">
          Explore Destinations Worldwide
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm md:text-base font-semibold max-w-xl mx-auto leading-relaxed tracking-wide">
          See More Of The World — Curated luxury resorts, private villas & iconic escapes across 7 continents.
        </p>
      </div>

      <div
        className="relative w-full max-w-[1400px] flex justify-center mt-5 h-[240px] sm:h-[420px] md:h-[500px] lg:h-[660px] xl:h-[720px]"
      >
        <div className="absolute top-0 left-1/2 -ml-[550px] w-[1100px] h-[640px] origin-top transform scale-[0.28] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.9] xl:scale-100 flex justify-center">
          <div className="absolute bottom-0 w-[820px] h-[410px] rounded-t-full bg-gradient-to-t from-[var(--accent-primary)]/20 to-transparent blur-2xl pointer-events-none" />
          <div className="absolute w-[1100px] h-[1100px] border border-[var(--text-main)]/10 rounded-full top-20 pointer-events-none" />

          <div
            className="absolute rounded-full overflow-hidden pointer-events-none shadow-[0_0_50px_10px_var(--accent-primary)]"
            style={{ width: 820, height: 820, top: 220 }}
          >
            <motion.div
              className="absolute h-full top-0"
              style={{
                width: "300%",
                left: "-100%",
                backgroundImage: "url('/assets/world-2.svg')",
                backgroundSize: "820px 120%",
                backgroundPosition: "0 140%",
                backgroundRepeat: "repeat-x",
                filter: "var(--map-filter)",
                x: globeX,
              }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 38% 42%, transparent 35%, var(--accent-primary)/60 68%, var(--accent-primary)/100 100%)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow: "inset 0 0 50px 1px var(--accent-primary)",
              }}
            />

            <div
              className="absolute z-50 flex flex-col items-center pointer-events-none"
              style={{
                top: "25%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="mb-4 whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] min-h-[32px]">
                <span
                  ref={timeRef}
                  className="text-xs font-black tracking-widest text-cyan-300 bg-slate-950/90 border border-cyan-400/40 px-3.5 py-1.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] backdrop-blur-md"
                ></span>
              </div>

              <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)] flex items-center justify-center shadow-[var(--glow-primary)] overflow-hidden relative">
                <motion.div
                  className="absolute w-6 h-[1.5px] bg-white/40 rounded-full"
                  style={{ top: "30%", right: "-50%" }}
                  animate={{ x: [0, -60], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute w-3 h-[1.5px] bg-white/60 rounded-full"
                  style={{ top: "65%", right: "-50%" }}
                  animate={{ x: [0, -80], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.3,
                  }}
                />

                <motion.div
                  style={{ scaleX: planeScaleX }}
                  animate={{ y: [-1, 2, -1] }}
                  transition={{
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="relative flex items-center justify-center w-full h-full"
                >
                  <motion.div
                    className="absolute -left-[4px] top-[48%] -translate-y-1/2 w-4 h-4 bg-[var(--accent-primary)] rounded-full blur-[4px] opacity-80 mix-blend-screen"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 0.15,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="transform rotate-90 relative z-10 drop-shadow-md"
                  >
                    <path d="M22 16.0416V13.8863L13 8.35678V3.38221C13 2.61869 12.5523 2 12 2C11.4477 2 11 2.61869 11 3.38221V8.35678L2 13.8863V16.0416L11 13.2536V18.7303L8.5 20.6713V22L12 21.0504L15.5 22V20.6713L13 18.7303V13.2536L22 16.0416Z" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </div>

          {destinations.map((dest, i) => (
            <div
              key={dest.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="absolute top-0 left-1/2 w-24 h-24 overflow-visible cursor-pointer z-30 group pointer-events-auto"
            >
              {/* Pure Pristine Photo Bubble */}
              <div className="w-full h-full rounded-full border-2 border-white/40 shadow-[0_0_25px_rgba(6,182,212,0.35)] overflow-hidden transition-all duration-300 group-hover:scale-125 group-hover:border-cyan-400 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.9)]">
                <Image
                  src={dest.image}
                  alt={dest.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  width={96}
                  height={96}
                  priority
                />
              </div>

              {/* Ghost Z-Shape / L-Shape Connector Line & Floating Callout Badge */}
              <div className="absolute bottom-1/2 left-1/2 mb-1 flex flex-col items-start pointer-events-none opacity-0 translate-y-3 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-300 ease-out z-50">
                {/* Floating Title Callout Badge */}
                <div className="px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-950/95 border border-cyan-500/60 dark:border-cyan-400/80 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_0_30px_rgba(6,182,212,0.65)] backdrop-blur-xl flex items-center gap-2 whitespace-nowrap -ml-28 -mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping shadow-[0_0_10px_#22d3ee]" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white drop-shadow-sm">
                    {dest.title}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/40">
                    Luxury Resort
                  </span>
                </div>

                {/* SVG Z-Shape / L-Shape Connector Line */}
                <svg
                  width="100"
                  height="50"
                  viewBox="0 0 100 50"
                  fill="none"
                  className="overflow-visible -ml-20 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]"
                >
                  <path
                    d="M 15 4 L 15 24 Q 15 28 20 28 L 80 28 Q 85 28 85 33 L 85 46"
                    stroke="url(#cyanZGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Base Connection Node at Bubble */}
                  <circle cx="85" cy="46" r="4.5" fill="#22d3ee" className="animate-pulse" />
                  <circle cx="85" cy="46" r="2" fill="#ffffff" />

                  {/* Top Node at Badge */}
                  <circle cx="15" cy="4" r="3.5" fill="#22d3ee" />

                  <defs>
                    <linearGradient id="cyanZGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
