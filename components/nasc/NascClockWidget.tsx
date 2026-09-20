"use client";
import React, { useEffect, useRef, useState } from "react";


function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Move tick calculation outside the component for SSR consistency
const CLOCK_TICKS = Array.from({ length: 60 }).map((_, i) => {
  const a = (i * 6) * Math.PI / 180;
  const maj = i % 5 === 0;
  const r1 = 148, r2 = maj ? 134 : 143;
  const x1 = 170 + r1 * Math.cos(a - Math.PI / 2);
  const y1 = 170 + r1 * Math.sin(a - Math.PI / 2);
  const x2 = 170 + r2 * Math.cos(a - Math.PI / 2);
  const y2 = 170 + r2 * Math.sin(a - Math.PI / 2);
  return (
    <line
      key={i}
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={maj ? "rgba(0,200,255,0.7)" : "rgba(100,60,200,0.35)"}
      strokeWidth={maj ? 2 : 1}
    />
  );
});

export default function NascClockWidget() {
  const [now, setNow] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneBgRef = useRef<SVGRectElement>(null);
  const ftBgRef = useRef<SVGRectElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);



  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Toast
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 1800);
  };

  // Icon pulse
  const pulse = (ref: React.RefObject<SVGRectElement | null>) => {
    if (!ref.current) return;
    ref.current.setAttribute("stroke", "#ffffff");
    ref.current.setAttribute("stroke-width", "3");
    setTimeout(() => {
      ref.current?.setAttribute("stroke-width", "1.5");
    }, 300);
  };

  const handlePhone = () => {
    pulse(phoneBgRef);
    showToast("CALLING...");
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flydna-call-state', { detail: { active: true } }));
    }
    setTimeout(() => { window.location.href = "tel:"; }, 300);
  };

  const handleFT = () => {
    pulse(ftBgRef);
    showToast("FACETIME...");
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flydna-call-state', { detail: { active: true } }));
    }
    setTimeout(() => { window.location.href = "facetime:"; }, 300);
  };

  // Waveform
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 76, H = 22, CY = H / 2;
    let t = 0, running = true;

    function hbY(x: number) {
      return (
        Math.sin(x * 0.18) * 1.2
        + Math.exp(-Math.pow((x % 120 - 40), 2) / 18) * 8
        + Math.exp(-Math.pow((x % 120 - 52), 2) / 6) * 10
        - Math.exp(-Math.pow((x % 120 - 58), 2) / 8) * 6
        + Math.exp(-Math.pow((x % 120 - 66), 2) / 5) * 4
      );
    }

    function drawWave() {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);
      t += 0.8;

      // Purple glow layer
      ctx!.save();
      ctx!.shadowColor = "#9933ff";
      ctx!.shadowBlur = 8;
      ctx!.strokeStyle = "rgba(180,80,255,0.9)";
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      for (let x = 0; x < W; x++) {
        const y = CY - hbY(x + t);
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // Cyan highlight layer
      ctx!.shadowColor = "#00ccff";
      ctx!.shadowBlur = 4;
      ctx!.strokeStyle = "rgba(200,240,255,0.7)";
      ctx!.lineWidth = 0.7;
      ctx!.beginPath();
      for (let x = 0; x < W; x++) {
        const y = CY - hbY(x + t);
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.stroke();
      ctx!.restore();

      requestAnimationFrame(drawWave);
    }
    drawWave();
    return () => { running = false; };
  }, []);

  let h = now.getHours();
  const m = now.getMinutes(), s = now.getSeconds();
  const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;

  return (
    <div className="wr" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "28px 0" }}>
      <div className="wc" style={{ position: "relative", width: 360, height: 660, transform: "scale(0.9)", transformOrigin: "center" }}>
        {/* Background SVG */}
        <svg width={340} height={340} viewBox="0 0 340 340" style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}>
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a0520" />
              <stop offset="60%" stopColor="#050a15" />
              <stop offset="100%" stopColor="#000005" />
            </radialGradient>
            <radialGradient id="purpleAura" cx="40%" cy="55%" r="45%">
              <stop offset="0%" stopColor="#5500cc" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#5500cc" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="cyanAura" cx="65%" cy="45%" r="40%">
              <stop offset="0%" stopColor="#00ccff" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#00ccff" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffe7" />
              <stop offset="35%" stopColor="#0099ff" />
              <stop offset="70%" stopColor="#8833ff" />
              <stop offset="100%" stopColor="#cc00ff" />
            </linearGradient>
            <filter id="outerGlow"><feGaussianBlur stdDeviation="5" result="cb" /><feMerge><feMergeNode in="cb" /><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <clipPath id="watchClip"><circle cx="170" cy="170" r="162" /></clipPath>
          </defs>
          <circle cx={170} cy={170} r={170} fill="#000" />
          <circle cx={170} cy={170} r={162} fill="url(#bgGrad)" />
          <circle cx={170} cy={170} r={162} fill="url(#purpleAura)" clipPath="url(#watchClip)" />
          <circle cx={170} cy={170} r={162} fill="url(#cyanAura)" clipPath="url(#watchClip)" />
          <circle cx={170} cy={170} r={157} stroke="#8833ff" strokeWidth={18} fill="none" opacity={0.25} filter="url(#outerGlow)" />
          <circle cx={170} cy={170} r={157} stroke="url(#arcG)" strokeWidth={10} fill="none" opacity={0.95} />
          <circle cx={170} cy={170} r={148} stroke="rgba(0,200,255,0.12)" strokeWidth={1} fill="none" />
          <g id="ticks">{CLOCK_TICKS}</g>
        </svg>

        {/* Glass overlays */}
        <div className="glass-time" style={{ position: "absolute", top: 136, left: 52, width: 236, height: 76, background: "linear-gradient(135deg,rgba(140,0,255,0.1) 0%,rgba(0,200,255,0.08) 100%)", border: "1px solid rgba(160,80,255,0.3)", borderRadius: 16, backdropFilter: "blur(14px)", boxShadow: "0 0 28px rgba(130,0,255,0.22),inset 0 0 16px rgba(120,0,255,0.08)", zIndex: 2 }} />
        <div className="glass-sub" style={{ position: "absolute", top: 220, left: 52, width: 236, height: 36, background: "linear-gradient(90deg,rgba(0,200,255,0.07) 0%,rgba(120,0,255,0.1) 100%)", border: "1px solid rgba(100,60,255,0.2)", borderRadius: 10, backdropFilter: "blur(10px)", boxShadow: "0 0 14px rgba(100,0,255,0.15),inset 0 0 8px rgba(0,200,255,0.04)", zIndex: 2 }} />
        <div className="glass-date" style={{ position: "absolute", top: 278, left: 108, width: 124, height: 24, background: "linear-gradient(90deg,rgba(0,200,255,0.06) 0%,rgba(160,0,255,0.1) 100%)", border: "1px solid rgba(0,220,255,0.18)", borderRadius: 8, backdropFilter: "blur(8px)", boxShadow: "0 0 10px rgba(0,180,255,0.14),inset 0 0 6px rgba(0,200,255,0.04)", zIndex: 2 }} />

        {/* Foreground SVG */}
        <svg width={340} height={340} viewBox="0 0 340 340" style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}>
          <defs>
            <filter id="glow2"><feGaussianBlur stdDeviation="2.5" result="cb" /><feMerge><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="cGlow"><feFlood floodColor="#00eeff" floodOpacity={0.7} result="fc" /><feComposite in="fc" in2="SourceGraphic" operator="in" result="gl" /><feGaussianBlur in="gl" stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="pGlow"><feFlood floodColor="#bb44ff" floodOpacity={0.8} result="fc" /><feComposite in="fc" in2="SourceGraphic" operator="in" result="gl" /><feGaussianBlur in="gl" stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="iconGlowC"><feGaussianBlur stdDeviation="3" result="cb" /><feMerge><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="iconGlowG"><feGaussianBlur stdDeviation="3" result="cb" /><feMerge><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {/* Weather */}
          <g transform="translate(68,70)" filter="url(#glow2)">
            <path d="M10 18 Q10 27 22 27 L36 27 Q44 27 44 20 Q44 14 36 13 Q36 6 28 7 Q22 2 16 7 Q10 8 10 14 Z" fill="rgba(0,180,255,0.15)" stroke="rgba(0,220,255,0.6)" strokeWidth={1.5} />
            <path d="M25 15 L20 23 L24 23 L19 31" stroke="#00cfff" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 15 L20 23 L24 23 L19 31" stroke="#3ef547f3" strokeWidth={0.8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          </g>
          <text x={136} y={93} fontFamily="Audiowide,sans-serif" fontSize={25} fill="#0af31e" filter="url(#cGlow)">84°</text>
          <text x={136} y={110} fontFamily="Syncopate,sans-serif" fontSize={10} fontWeight={700} fill="#00ddff" letterSpacing={3} filter="url(#cGlow)">STORMY</text>
          <text x={136} y={126} fontFamily="'Chakra Petch',sans-serif" fontSize={15} fill="rgba(180,230,255,0.8)" letterSpacing={1}>New York</text>

          <text id="hh" x={78} y={204} fontFamily="'Exo 2',sans-serif" fontSize={74} fontWeight={900} fill="#00eeff" filter="url(#cGlow)">{pad(h)}</text>
          <text id="mm" x={176} y={204} fontFamily="'Share Tech Mono',monospace" fontSize={72} fill="#cc88ff" filter="url(#pGlow)">{pad(m)}</text>

          {/* Phone icon */}
          <g className="icon-btn" id="phoneBtn" filter="url(#iconGlowC)" transform="translate(66,223)" onClick={handlePhone} style={{ cursor: "pointer" }}>
            <rect x={0} y={0} width={56} height={40} rx={8} fill="transparent" />
            <rect ref={phoneBgRef} x={14} y={0} width={28} height={28} rx={7} fill="rgba(0,180,255,0.12)" stroke="rgba(0,220,255,0.55)" strokeWidth={1.5} id="phoneBg" />
            <path d="M21 7 Q21 5 23 5 L26 5 Q27.5 5 28 6.5 L29 9.5 Q29.5 11 28 11.8 L27 12.3 Q27 12.3 28.5 14.5 Q30 16.5 31 17 L31.5 16 Q32.2 14.5 33.7 15 L36.5 16 Q38 16.5 38 18 L38 21 Q38 23 36 23 Q24 23 21 11 Q21 9 21 7 Z" fill="#00ddff" />
          </g>

          {/* Synth waveform */}
          <foreignObject x={58} y={252} width={76} height={22}>
            <canvas ref={waveRef} width={76} height={22} />
          </foreignObject>

          <text id="ampm" x={140} y={242} fontFamily="'Chakra Petch',sans-serif" fontSize={14} fontWeight={700} fill="#e0ddff" textAnchor="middle" letterSpacing={1} filter="url(#pGlow)">{ap}</text>
          <text id="ss" x={200} y={242} fontFamily="'Share Tech Mono',monospace" fontSize={15} fill="#00eeff" textAnchor="middle" filter="url(#cGlow)">{pad(s)}</text>

          {/* FaceTime icon */}
          <g className="icon-btn" id="ftBtn" filter="url(#iconGlowG)" transform="translate(218,223)" onClick={handleFT} style={{ cursor: "pointer" }}>
            <rect x={0} y={0} width={56} height={40} rx={8} fill="transparent" />
            <rect ref={ftBgRef} x={14} y={0} width={28} height={28} rx={7} fill="rgba(0,255,140,0.1)" stroke="rgba(0,255,140,0.5)" strokeWidth={1.5} id="ftBg" />
            <rect x={18} y={9} width={14} height={10} rx={3} fill="#00ff99" />
            <path d="M33 11 L39 8 L39 20 L33 17 Z" fill="#00ff99" />
            <circle cx={25} cy={14} r={2} fill="rgba(5,20,15,0.9)" />
          </g>

          <text x={170} y={295} textAnchor="middle" fontFamily="Syncopate,sans-serif" fontSize={16} fontWeight={700} fill="#00ddff" filter="url(#cGlow)" letterSpacing={2}>04.06.26</text>
        </svg>

        {/* Toast */}
        <div id="toast" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 6, background: "rgba(20,0,40,0.85)", border: "1px solid #9b30ff", color: "#cc88ff", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap", pointerEvents: "none", opacity: toast ? 1 : 0, transition: "opacity 0.25s", letterSpacing: 2, backdropFilter: "blur(8px)", zIndex: 10 }}>{toast}</div>
      </div>
    </div>
  );
}

