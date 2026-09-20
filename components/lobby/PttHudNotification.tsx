/* eslint-disable @next/next/no-img-element */
"use client";

import { Volume2, VolumeX, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type PttHudNotificationProps = {
  activePttUser: { id?: string; name?: string; avatar?: string } | null;
  isPttActive: boolean;
  isPttMuted: boolean;
  onTogglePttMute: () => void;
  onOpenChat?: (userId?: string) => void;
  onDismiss?: () => void;
};

export default function PttHudNotification({
  activePttUser,
  isPttActive,
  isPttMuted,
  onTogglePttMute,
  onOpenChat,
  onDismiss,
}: PttHudNotificationProps) {
  if (!activePttUser && !isPttActive) return null;

  const speakerName = activePttUser?.name || "A Traveler";
  const speakerAvatar = activePttUser?.avatar;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] max-w-md w-[92vw] sm:w-[420px]"
      >
        <div className="glass-panel-heavy rounded-2xl p-3.5 border border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] bg-slate-950/85 backdrop-blur-xl flex items-center justify-between gap-3">
          {/* Avatar & Speaker Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              {speakerAvatar ? (
                <img
                  src={speakerAvatar}
                  alt={speakerName}
                  className="size-11 rounded-full object-cover border-2 border-cyan-400/60 shadow-md"
                />
              ) : (
                <div className="size-11 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md border border-cyan-300/40">
                  {speakerName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Active Audio Wave indicator */}
              {isPttActive && !isPttMuted && (
                <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center animate-ping" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white truncate max-w-[140px] sm:max-w-[170px]">
                  {speakerName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  PTT
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5 font-medium">
                {isPttMuted ? (
                  <>
                    <VolumeX size={12} className="text-amber-400" />
                    <span className="text-amber-300">Incoming Audio Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2
                      size={12}
                      className="text-emerald-400 animate-pulse"
                    />
                    <span className="text-emerald-300">
                      Speaking on speaker...
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Toggle PTT Mute */}
            <button
              onClick={onTogglePttMute}
              title={
                isPttMuted
                  ? "Unmute PTT Audio"
                  : "Mute PTT Audio (Do Not Disturb)"
              }
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isPttMuted
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {isPttMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Respond / Open Chat */}
            {onOpenChat && (
              <button
                onClick={() => onOpenChat(activePttUser?.id)}
                className="py-1.5 px-3 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <MessageSquare size={13} />
                <span>Respond</span>
              </button>
            )}

            {/* Dismiss */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
