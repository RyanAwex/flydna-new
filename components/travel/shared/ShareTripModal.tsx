"use client";

import React, { useState, useEffect } from "react";
import { Share2, Send, Copy, Check, X, Plane, Hotel, Ticket, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatManager } from "@/backend/chatManager";

export type ShareTripModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tripData: {
    type: "flight" | "hotel" | "event" | "cruise" | "deal";
    title: string;
    subtitle?: string;
    price?: string;
    date?: string;
    image?: string;
    url?: string;
  } | null;
};

export default function ShareTripModal({
  isOpen,
  onClose,
  tripData,
}: ShareTripModalProps) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const c = ChatManager.getContacts() || [];
      setContacts(c);
      if (c.length > 0) setSelectedContactId(c[0]._id || c[0].id);
      setSentSuccess(false);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !tripData) return null;

  const getIcon = () => {
    switch (tripData.type) {
      case "flight":
        return <Plane className="text-cyan-400" size={20} />;
      case "hotel":
        return <Hotel className="text-amber-400" size={20} />;
      case "event":
        return <Ticket className="text-purple-400" size={20} />;
      default:
        return <Compass className="text-emerald-400" size={20} />;
    }
  };

  const handleShareToContact = () => {
    if (!selectedContactId) return;
    const shareMessage = `✈️ FlyDnA Deal Share: ${tripData.title} ${tripData.price ? `(${tripData.price})` : ""} ${tripData.subtitle ? `- ${tripData.subtitle}` : ""}`;
    const socket = ChatManager.getSocket();
    if (socket?.connected) {
      socket.emit("sendMessage", {
        toUserId: selectedContactId,
        message: shareMessage,
        tripCard: tripData,
      });
    }
    setSentSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleCopyLink = () => {
    const link = tripData.url || (typeof window !== "undefined" ? window.location.href : "");
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-panel-heavy rounded-3xl p-6 max-w-md w-full border border-cyan-400/30 bg-slate-950/90 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.2)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30">
                <Share2 size={18} className="text-cyan-400" />
              </div>
              <h3 className="font-extrabold text-base text-white tracking-wide">
                Share Deal to FlyDnA
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Card Preview */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex-shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white truncate">
                {tripData.title}
              </h4>
              {tripData.subtitle && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {tripData.subtitle}
                </p>
              )}
              {tripData.price && (
                <span className="inline-block mt-1 text-xs font-black text-cyan-300">
                  {tripData.price}
                </span>
              )}
            </div>
          </div>

          {/* Select Contact */}
          <div className="space-y-3 mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Contact to Send In-Chat
            </label>
            {contacts.length > 0 ? (
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full glass-input rounded-xl py-2.5 px-3 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer bg-slate-900 border border-slate-700"
              >
                {contacts.map((c: any) => (
                  <option key={c._id || c.id} value={c._id || c.id} className="bg-slate-900 text-white">
                    {c.name || c.username || "Traveler"}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-400 italic">No online contacts loaded.</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleShareToContact}
              disabled={!selectedContactId || sentSuccess}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {sentSuccess ? (
                <>
                  <Check size={14} />
                  <span>Sent to Chat!</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send to Contact</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
