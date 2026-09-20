/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export type GroupMember = {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: string;
};

interface GroupMessage {
  id: number | string;
  from: string;
  text: string;
  time: string;
  senderId?: string;
  senderName?: string;
}

interface GroupChatStageProps {
  members: GroupMember[];
  latestSenderId?: string | null;
  sceneId?: string;
  sceneSrc?: string;
}

// ─── Character head coordinate slots ─────────────────────────────────────────
// Percentage coordinates relative to container. The anchor sits at the top of
// each character's head — bubbles render ABOVE via -translate-y-full.
const HEAD_SLOTS: Record<string, Array<{ left: string; top: string }>> = {
  basketball: [
    { left: "30%", top: "54%" }, // bottom-left sitting player w/ ball
    { left: "53%", top: "21%" }, // standing drinking water
    { left: "72%", top: "39%" }, // sitting on bench w/ towel
    { left: "88%", top: "23%" }, // right standing player
  ],
  bike: [
    { left: "41%", top: "36%" }, // Left friend w/ mug (red arrow 1)
    { left: "59%", top: "20%" }, // Middle friend facing right (red arrow 2)
    { left: "78%", top: "36%" }, // Right friend w/ headphones (red arrow 3)
    { left: "86%", top: "36%" }, // Extra right space
  ],
  goku: [
    { left: "24%", top: "43%" }, // Left red dot (over Vegeta's head)
    { left: "67%", top: "42%" }, // Right red dot (to the right of Goku's head)
    { left: "50%", top: "40%" },
    { left: "80%", top: "40%" },
  ],
  // Rooftop: characters spread along a railing/ledge — calibrate with NEXT_PUBLIC_STAGE_CALIBRATE=true
  rooftop: [
    { left: "15%", top: "38%" }, // far-left character
    { left: "38%", top: "32%" }, // center-left character
    { left: "62%", top: "34%" }, // center-right character
    { left: "83%", top: "36%" }, // far-right character
  ],
  rooftopnights: [
    { left: "15%", top: "38%" },
    { left: "38%", top: "32%" },
    { left: "62%", top: "34%" },
    { left: "83%", top: "36%" },
  ],
  coolin: [
    { left: "22%", top: "42%" },
    { left: "48%", top: "32%" },
    { left: "72%", top: "38%" },
  ],
  cruise: [
    { left: "20%", top: "40%" },
    { left: "40%", top: "35%" },
    { left: "60%", top: "38%" },
    { left: "80%", top: "35%" },
  ],
  default: [
    { left: "67%", top: "54%" },
    { left: "77%", top: "54%" },
    { left: "55%", top: "56%" },
    { left: "85%", top: "52%" },
  ],
};

// ─── Comic bubble style definitions ──────────────────────────────────────────
// One distinct visual style per slot index so each character has their own
// comic-book "voice." Bubbles use thick black outlines, hard drop-shadows,
// and distinct colours — exactly like the reference image.
type TailSide = "left" | "center" | "right" | "thought";

interface BubbleStyle {
  wrapperClass: string; // outer shape + fill + border
  textClass: string; // message text typography
  nameClass: string; // sender label colour
  tailSide: TailSide; // where the tail spike exits the bottom
  fillHex: string; // for the SVG tail fill
  strokeHex: string; // for the SVG tail stroke
}

const COMIC_STYLES: BubbleStyle[] = [
  {
    // Slot 0 — Classic white speech (clean, friendly)
    wrapperClass:
      "rounded-2xl bg-white border-[3px] border-slate-900 shadow-[4px_4px_0px_#000]",
    textClass: "font-black text-slate-900 text-[12px] leading-tight",
    nameClass: "text-blue-600",
    tailSide: "left",
    fillHex: "#ffffff",
    strokeHex: "#0f172a",
  },
  {
    // Slot 1 — Bold yellow action (hype, exclamations)
    wrapperClass:
      "rounded-lg bg-amber-300 border-[3px] border-slate-900 shadow-[4px_4px_0px_#000]",
    textClass:
      "font-black text-slate-900 text-[11px] leading-tight tracking-wide",
    nameClass: "text-amber-700",
    tailSide: "center",
    fillHex: "#fcd34d",
    strokeHex: "#0f172a",
  },
  {
    // Slot 2 — Thought bubble (dreamy, reflective — cloud oval)
    wrapperClass:
      "rounded-[60px] bg-sky-100 border-[3px] border-slate-700 shadow-[4px_4px_0px_rgba(0,0,0,0.55)]",
    textClass: "font-bold italic text-slate-800 text-[11px] leading-snug",
    nameClass: "text-sky-600",
    tailSide: "thought",
    fillHex: "#e0f2fe",
    strokeHex: "#334155",
  },
  {
    // Slot 3 — Rose urgent (intense, reactive)
    wrapperClass:
      "rounded-xl bg-rose-100 border-[3px] border-rose-800 shadow-[4px_4px_0px_rgba(136,19,55,0.7)]",
    textClass: "font-black text-rose-900 text-[12px] leading-tight",
    nameClass: "text-rose-600",
    tailSide: "right",
    fillHex: "#fff1f2",
    strokeHex: "#9f1239",
  },
];

// ─── Comic tail SVG ───────────────────────────────────────────────────────────
function ComicTail({
  side,
  fill,
  stroke,
}: {
  side: TailSide;
  fill: string;
  stroke: string;
}) {
  // Thought tail — three descending circles
  if (side === "thought") {
    return (
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[3px]">
        <div
          className="size-2.5 rounded-full border-[2.5px]"
          style={{ background: fill, borderColor: stroke }}
        />
        <div
          className="size-1.5 rounded-full border-[2px]"
          style={{ background: fill, borderColor: stroke }}
        />
        <div
          className="size-[5px] rounded-full border-[2px]"
          style={{ background: fill, borderColor: stroke }}
        />
      </div>
    );
  }

  // Spiked triangle tail — exits toward the character's mouth
  // left=~20%, center=50%, right=~75% of bubble width
  const offsetPct = side === "left" ? "20%" : side === "right" ? "72%" : "50%";

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        bottom: "-14px",
        left: offsetPct,
        transform: "translateX(-50%)",
        overflow: "visible",
      }}
      width="22"
      height="14"
      viewBox="0 0 22 14"
      fill="none"
    >
      {/* Stroke path — slightly wider for the outline */}
      <path d="M0 0 L22 0 L11 14 Z" fill={stroke} />
      {/* Fill path — inset by 2.5px */}
      <path d="M2.5 0 L19.5 0 L11 11.5 Z" fill={fill} />
    </svg>
  );
}

// ─── Starburst shape for exclamation-style messages ──────────────────────────
// Used optionally when message text ends in "!" or is short/punchy
function StarburstBubble({
  text,
  name,
  onExit,
}: {
  text: string;
  name: string;
  onExit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.4, rotate: 12 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      className="relative mb-3 flex items-center justify-center"
      style={{ width: 120, height: 120 }}
    >
      {/* SVG starburst */}
      <svg
        className="absolute inset-0"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="60,4 70,42 108,30 82,58 116,72 78,76 86,114 60,90 34,114 42,76 4,72 38,58 12,30 50,42"
          fill="#fbbf24"
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center px-3 text-center">
        <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1">
          {name}
        </span>
        <span className="font-black text-slate-900 text-[11px] leading-tight uppercase">
          {text.slice(0, 28)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Default members (fallback for preview) ──────────────────────────────────
const DEFAULT_MEMBERS: GroupMember[] = [
  { id: "mem-1", name: "Douglas Miller" },
  { id: "mem-2", name: "Piff" },
  { id: "mem-3", name: "Rayane Sefiani" },
  { id: "mem-4", name: "You" },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function GroupChatStage({
  members,
  latestSenderId,
  sceneId = "neon-lounge",
  sceneSrc,
}: GroupChatStageProps) {
  const activeSrc = sceneSrc || "/scenes/BasketBall.mp4";
  const isVideo = /\.(mp4|mov|webm)$/i.test(activeSrc);

  const [liveMessages, setLiveMessages] = useState<GroupMessage[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        const newMsg: GroupMessage = {
          ...detail.message,
          senderId:
            detail.senderId || detail.message.senderId || detail.message.from,
          senderName: detail.senderName || detail.message.senderName,
          ts: Date.now(),
        };
        // Replace previous active message so recipient bubble disappears and new sender's bubble pops cleanly
        setLiveMessages([newMsg]);
        // Auto-expire bubble after 5 seconds
        setTimeout(() => {
          setLiveMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
        }, 5000);
      }
    };
    window.addEventListener("flydna-group-message", handler);
    return () => window.removeEventListener("flydna-group-message", handler);
  }, []);

  // Pick slot set from sceneSrc filename
  const srcLower = activeSrc.toLowerCase();
  let slots = HEAD_SLOTS.default;
  if (srcLower.includes("basketball")) slots = HEAD_SLOTS.basketball;
  else if (
    srcLower.includes("bike") ||
    srcLower.includes("motorcycle") ||
    srcLower.includes("night-drive") ||
    srcLower.includes("night-ride")
  )
    slots = HEAD_SLOTS.bike;
  else if (srcLower.includes("goku")) slots = HEAD_SLOTS.goku;
  else if (srcLower.includes("rooftopnights")) slots = HEAD_SLOTS.rooftopnights;
  else if (srcLower.includes("rooftop")) slots = HEAD_SLOTS.rooftop;
  else if (srcLower.includes("cruise")) slots = HEAD_SLOTS.cruise;
  else if (srcLower.includes("coolin")) slots = HEAD_SLOTS.coolin;
  const stageFit =
    srcLower.includes("rooftop") || srcLower.includes("cruise")
      ? "object-contain"
      : "object-cover";

  // Deterministically sort members so character slots (0 over Vegeta, 1 over Goku) match across Edge, Chrome, and all client screens
  const activeMembers = useMemo(() => {
    const list = members?.length > 0 ? members : DEFAULT_MEMBERS;
    return [...list].sort((a, b) => {
      const idA = String(a.id || (a as any)._id || a.name || "").toLowerCase();
      const idB = String(b.id || (b as any)._id || b.name || "").toLowerCase();
      return idA.localeCompare(idB);
    });
  }, [members]);

  return (
    <div className="group/stage absolute inset-0 w-full h-full overflow-hidden bg-[#060c14] z-0 rounded-2xl pointer-events-auto">
      {/* ── Background scene ── */}
      {isVideo ? (
        <>
          {/* Blurred backdrop fill — prevents black letterbox bars */}
          <video
            key={activeSrc + "_bg"}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xl scale-110"
            src={activeSrc}
            aria-hidden
          />
          {/* Main scene — contain so all characters are visible */}
          <video
            key={activeSrc}
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full ${stageFit} opacity-90`}
            src={activeSrc}
          />
        </>
      ) : (
        <>
          <Image
            key={activeSrc + "_bg"}
            src={activeSrc}
            alt=""
            fill
            className="object-cover opacity-40 blur-xl scale-110"
            aria-hidden
          />
          <Image
            key={activeSrc}
            src={activeSrc}
            alt="Group Chat Backdrop"
            fill
            className={`${stageFit} opacity-90`}
          />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#02060b]/60 via-transparent to-[#02060b]/15" />

      {/* ── DEV CALIBRATION OVERLAY ──────────────────────────────────────
          Add NEXT_PUBLIC_STAGE_CALIBRATE=true to .env.local to show dots  */}
      {process.env.NEXT_PUBLIC_STAGE_CALIBRATE === "true" && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          {slots.map((slot, i) => (
            <div
              key={i}
              className="absolute size-5 rounded-full bg-red-500/90 border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[9px] text-white font-black shadow-lg"
              style={{ left: slot.left, top: slot.top }}
            >
              {i}
            </div>
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={`v${i}`}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={`h${i}`}
              className="absolute left-0 right-0 h-px bg-white/10"
              style={{ top: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>
      )}

      {/* ── Comic speech bubble anchors ───────────────────────────────── */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {activeMembers.map((member, idx) => {
          const slot = slots[idx % slots.length];
          const style = COMIC_STYLES[idx % COMIC_STYLES.length];
          const memberId = String(
            member.id || (member as any)._id || member.name || idx,
          );

          // Most-recent message for this member from the live queue
          const memberMsg = [...liveMessages]
            .reverse()
            .find(
              (m) =>
                m.senderId === memberId ||
                m.from === memberId ||
                m.senderId === member.name ||
                (member.name === "You" &&
                  (m.from === "me" || m.senderId === "__self__")),
            );

          const isTalking = !!memberMsg;
          const cleanName = (
            memberMsg?.senderName ||
            member.name ||
            "Member"
          ).replace(/^Member\s+/i, "");
          const msgText = memberMsg?.text || "";
          const onRight = parseFloat(String(slot.left)) > 55;
          const slotPct = parseFloat(String(slot.left));
          const nearLeft = slotPct < 18;
          const nearRight = slotPct > 85;
          const isHigh = parseFloat(String(slot.top)) < 30;
          const bubbleTime = (() => {
            const s = Math.floor(
              (Date.now() - ((memberMsg as any)?.ts || Date.now())) / 1000,
            );
            return s < 60
              ? "just now"
              : s < 3600
                ? Math.floor(s / 60) + "m ago"
                : Math.floor(s / 3600) + "h ago";
          })();
          const isOnline = String((member as any).status || "")
            .toLowerCase()
            .includes("online");
          const tier =
            msgText.length <= 20
              ? "quip"
              : msgText.length <= 50
                ? "msg"
                : "story";
          const tierMax = tier === "quip" ? 200 : tier === "msg" ? 264 : 320;
          const tierText =
            tier === "quip"
              ? "text-[14px] font-bold"
              : tier === "msg"
                ? "text-[13px] font-medium"
                : "text-[12px] font-medium";
          const tierCap = tier === "story" ? 140 : 90;

          // Starburst only for genuinely short/punchy messages (≤10 chars)
          const isShout = isTalking && idx === 1 && msgText.length <= 10;

          return (
            <motion.div
              key={memberId + "_" + idx}
              className={`absolute -translate-x-1/2 flex ${isHigh ? "flex-col-reverse" : "flex-col"} items-center z-40`}
              style={{
                left: slot.left,
                top: slot.top,
                // Slide-up so the base of the stack sits at the head anchor
                transform: isHigh
                  ? "translate(-50%, -18px)"
                  : "translate(-50%, -100%)",
              }}
            >
              <AnimatePresence mode="wait">
                {isTalking ? (
                  <motion.div
                    key={String(memberMsg!.id) + "_glass"}
                    initial={{ opacity: 0, y: 14, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 480, damping: 28 }}
                    className={`${isHigh ? "mt-1" : "mb-1"} relative pointer-events-auto`}
                    style={{
                      maxWidth: tierMax,
                      minWidth: tier === "quip" ? 110 : 150,
                      left: nearLeft ? "34%" : nearRight ? "-34%" : undefined,
                    }}
                  >
                    <div
                      className={`relative ${onRight ? "mr-5 pr-9 pl-4" : "ml-5 pl-9 pr-4"} ${tier === "quip" ? "py-1.5 rounded-full" : "py-2.5 rounded-[22px]"} text-left bg-slate-900/55 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] overflow-hidden`}
                      style={{
                        backdropFilter: "blur(20px) saturate(1.7)",
                        WebkitBackdropFilter: "blur(20px) saturate(1.7)",
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
                      <div
                        className={`relative flex items-center justify-between gap-3 ${tier === "quip" ? "mb-0" : "mb-0.5"} ${onRight ? "flex-row-reverse" : ""}`}
                      >
                        <span className="text-[11px] font-bold text-indigo-300">
                          {cleanName}
                        </span>
                        <span className="text-[9px] font-semibold text-white/50 whitespace-nowrap">
                          {bubbleTime}
                        </span>
                      </div>
                      <p
                        className={`relative ${tierText} leading-snug text-white/95`}
                      >
                        {msgText.length > tierCap
                          ? msgText.slice(0, tierCap - 2) + "…"
                          : msgText}
                      </p>
                    </div>
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 ${onRight ? "right-0" : "left-0"} size-11 z-10`}
                    >
                      <div className="w-full h-full rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-400/80 via-indigo-400/80 to-purple-400/80 shadow-[0_0_10px_rgba(99,102,241,0.35)]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 ring-2 ring-slate-950/80">
                          {member.avatarUrl ||
                          (member as any).profileImage ||
                          (member as any).avatar ? (
                            <img
                              src={
                                member.avatarUrl ||
                                (member as any).profileImage ||
                                (member as any).avatar
                              }
                              alt={cleanName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white text-[11px] font-black uppercase">
                              {cleanName
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase() || "M"}
                            </div>
                          )}
                        </div>
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* ── Avatar badge — always visible on hover, glows when talking ── */}
              <motion.div
                animate={isTalking ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ repeat: isTalking ? Infinity : 0, duration: 0.8 }}
                className={`relative size-9 rounded-full border-[3px] shadow-[0_0_12px_rgba(0,0,0,0.8)] bg-slate-950 overflow-hidden
                  opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200
                  ${isTalking ? "hidden" : "border-white/30"}`}
              >
                {member.avatarUrl ||
                (member as any).profileImage ||
                (member as any).avatar ? (
                  <img
                    src={
                      member.avatarUrl ||
                      (member as any).profileImage ||
                      (member as any).avatar
                    }
                    alt={cleanName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white text-[10px] font-black uppercase">
                    {cleanName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "M"}
                  </div>
                )}
                {/* Live dot */}
                {isTalking && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-amber-400 border border-slate-950 animate-pulse" />
                )}
              </motion.div>

              {/* ── Name pill — visible on hover or when talking ── */}
              <div
                className={`mt-1 px-2 py-0.5 rounded-full border backdrop-blur-md text-[9px] font-black tracking-wider shadow-md
                  opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200
                  ${
                    isTalking
                      ? "!opacity-100 bg-transparent border-transparent text-cyan-300 text-[11px] drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] animate-bounce"
                      : "bg-slate-950/90 border-white/20 text-cyan-300"
                  }`}
              >
                {isTalking ? "\u25BC" : cleanName}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
