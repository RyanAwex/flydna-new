/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MicOff,
  Mic,
  Video,
  VolumeX,
  Volume2,
  Maximize2,
  Phone,
  X,
  Plus,
} from "lucide-react";
import { ChatManager } from "@/backend/chatManager";

type VideoCallPopupProps = {
  isMeetingActive: boolean;
  setIsMeetingActive: (active: boolean) => void;
  selectedMeetingContact: string;
  setSelectedMeetingContact: (id: string) => void;
  selectedGroupContacts: string[];
  setSelectedGroupContacts: React.Dispatch<React.SetStateAction<string[]>>;
  activeSpeakerId: string | null;
  isCallMuted: boolean;
  setIsCallMuted: (muted: boolean) => void;
  isCallVideoOff: boolean;
  setIsCallVideoOff: (videoOff: boolean) => void;
  isCallSpeakerMuted: boolean;
  setIsCallSpeakerMuted: (speakerMuted: boolean) => void;
  remoteUsers?: any[];
  localVideoTrack?: any;
  inlineMode?: boolean;
};

export default function VideoCallPopup({
  isMeetingActive,
  setIsMeetingActive,
  selectedMeetingContact,
  setSelectedMeetingContact,
  selectedGroupContacts,
  setSelectedGroupContacts,
  activeSpeakerId,
  isCallMuted,
  setIsCallMuted,
  isCallVideoOff,
  setIsCallVideoOff,
  isCallSpeakerMuted,
  setIsCallSpeakerMuted,
  remoteUsers = [],
  localVideoTrack,
  inlineMode = false,
}: VideoCallPopupProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    console.log("[DEBUG] VideoCallPopup MOUNTED");
    return () => console.log("[DEBUG] VideoCallPopup UNMOUNTED");
  }, []);

  useEffect(() => {
    console.log(
      "[DEBUG] video effect firing, isMeetingActive:",
      isMeetingActive,
      "localVideoTrack:",
      !!localVideoTrack,
      "remoteUsers count:",
      remoteUsers.length,
    );
    if (!isMeetingActive) return;
    if (localVideoTrack) {
      try {
        localVideoTrack.play("agora_local");
        console.log(
          "[DEBUG] called play on agora_local, element exists:",
          !!document.getElementById("agora_local"),
        );
      } catch (e) {
        console.log("[DEBUG] play failed:", e);
      }
    }
    remoteUsers.forEach((u: any) => {
      if (u?.videoTrack) {
        try {
          u.videoTrack.play(`agora_remote${u.uid}`);
        } catch {}
      }
    });
  }, [isMeetingActive, localVideoTrack, remoteUsers]);

  if (!isMeetingActive) return null;

  const contactsList = ChatManager.getContacts();
  const activeContacts = [
    contactsList.find((c) => c.id === selectedMeetingContact)!,
    ...selectedGroupContacts
      .filter((id) => id !== selectedMeetingContact)
      .map((id) => contactsList.find((c) => c.id === id)!),
  ].filter(Boolean);

  const fallbackImages = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
  ];
  const myName = (() => {
    if (typeof window === "undefined") return "You";
    try {
      const raw = localStorage.getItem("flydna_user");
      const user = raw ? JSON.parse(raw) : null;
      return user?.name ? `${user.name} (You)` : "You";
    } catch {
      return "You";
    }
  })();

  const remoteUid =
    remoteUsers && remoteUsers.length > 0 ? remoteUsers[0].uid : null;

  const allFeeds = [
    {
      id: "__self__",
      name: myName,
      image:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
      videoElementId: "agora_local",
      isMuted: isCallMuted,
      isVideoOff: isCallVideoOff,
    },
    ...activeContacts.map((c, idx) => ({
      id: c.id,
      name: c.name,
      image: c.avatarUrl || fallbackImages[idx % fallbackImages.length],
      videoElementId:
        idx === 0 && remoteUid ? `agora_remote${remoteUid}` : null,
      isMuted: false,
      isVideoOff: false,
    })),
  ];

  const handleHangUp = () => {
    setIsMeetingActive(false);
    setSelectedGroupContacts([]);
  };

  const renderVideoBox = (feed: (typeof allFeeds)[0], sizeClass: string) => {
    const isSpeaking =
      activeSpeakerId === feed.id && !feed.isMuted && !feed.isVideoOff;
    const feedNameSize = isFullScreen
      ? "text-xs md:text-sm px-3.5 py-1.5"
      : "text-[9px] px-1.5 py-0.5";
    const statusDotSize = isFullScreen ? "size-2 mr-1" : "size-1.5 mr-0.5";
    const youBadgeSize = isFullScreen
      ? "px-2.5 py-1 text-[10px]"
      : "px-1.5 py-0.5 text-[7px]";
    const audioBarHeight = isFullScreen ? "h-4" : "h-2.5";
    const audioBarWidth = isFullScreen ? "w-0.5" : "w-0.5";

    return (
      <div
        key={feed.id}
        className={`relative rounded-2xl overflow-hidden bg-[#06111f] border transition-all duration-300 ${sizeClass} ${
          isSpeaking
            ? "border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)] ring-1 ring-cyan-400"
            : "border-white/10"
        }`}
      >
        {(feed as any).videoElementId && (
          <div
            id={(feed as any).videoElementId}
            className="absolute inset-0 w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover bg-[#06111f]"
          />
        )}
        {feed.isVideoOff ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
            <div
              className={`${isFullScreen ? "size-16 text-sm" : "size-10 text-xs"} rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold mb-2`}
            >
              {feed.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <span
              className={`${isFullScreen ? "text-xs" : "text-[8px]"} font-bold text-slate-500 uppercase tracking-wider`}
            >
              Video Off
            </span>
          </div>
        ) : (feed as any).videoElementId ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        ) : (
          <>
            <img
              src={feed.image}
              alt={feed.name}
              className={`w-full h-full object-cover select-none pointer-events-none transition duration-500 ${
                isSpeaking ? "scale-105 saturate-110" : "saturate-90"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {feed.isMuted && (
            <span
              className={`${isFullScreen ? "p-2" : "p-1"} rounded bg-black/60 border border-white/10 text-red-400 flex items-center justify-center`}
              title="Muted"
            >
              <MicOff size={isFullScreen ? 14 : 8} />
            </span>
          )}
          {feed.id === "__self__" && (
            <span
              className={`${youBadgeSize} rounded bg-cyan-500/80 border border-cyan-400/30 font-black text-white uppercase tracking-wider`}
            >
              YOU
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <span
            className={`${feedNameSize} font-extrabold text-white bg-black/45 border border-white/5 rounded flex items-center gap-1`}
          >
            <span
              className={`${statusDotSize} rounded-full ${feed.isVideoOff ? "bg-red-400" : "bg-emerald-400 shadow-[0_0_5px_#34d399]"}`}
            />
            {isFullScreen ? feed.name : feed.name.split(" ")[0]}
          </span>

          {isSpeaking && (
            <div
              className={`flex items-end gap-0.5 bg-black/40 px-1.5 py-1 rounded border border-white/5 ${audioBarHeight}`}
            >
              <span
                className={`${audioBarWidth} h-1/2 bg-cyan-400 animate-[pulse_0.8s_infinite]`}
              />
              <span
                className={`${audioBarWidth} h-full bg-cyan-400 animate-[pulse_0.5s_infinite]`}
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className={`${audioBarWidth} h-2/3 bg-cyan-400 animate-[pulse_0.6s_infinite]`}
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFeedsGrid = () => {
    return (
      <div
        className={`grid grid-cols-2 gap-3 ${isFullScreen ? "flex-1 min-h-0 h-full" : ""}`}
      >
        {allFeeds.map((feed) =>
          renderVideoBox(
            feed,
            isFullScreen
              ? "w-full h-full min-h-0 flex-grow"
              : "w-full aspect-video",
          ),
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={inlineMode ? false : { opacity: 0, scale: 0.9, y: 50 }}
      animate={inlineMode ? false : { opacity: 1, scale: 1, y: 0 }}
      exit={inlineMode ? false : { opacity: 0, scale: 0.9, y: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`${
        inlineMode
          ? "relative w-full h-full flex flex-col bg-transparent"
          : "fixed z-[999] rounded-[26px] border border-cyan-400/25 bg-[#06111f]/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      } overflow-hidden text-left transition-all duration-300 ${
        inlineMode
          ? ""
          : isFullScreen
            ? "inset-4 md:inset-6 flex flex-col w-auto max-w-none h-[calc(100vh-3rem)]"
            : "bottom-6 right-6 w-[350px] md:w-[380px] flex flex-col"
      }`}
    >
      {/* Title Bar - Only show if not inline */}
      {!inlineMode && (
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span
              className={`${isFullScreen ? "text-xs" : "text-[10px]"} font-black tracking-widest text-slate-400 uppercase`}
            >
              ENCRYPTED VIDEO CALL
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`${isFullScreen ? "p-2.5 rounded-xl" : "p-1.5 rounded-lg"} bg-white/[0.03] border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer`}
              title={isMinimized ? "Expand View" : "Minimize View"}
            >
              {isMinimized ? (
                <Plus size={isFullScreen ? 15 : 11} />
              ) : (
                <div className="w-2.5 h-0.5 bg-current" />
              )}
            </button>
            <button
              onClick={handleHangUp}
              className={`${isFullScreen ? "p-2.5 rounded-xl" : "p-1.5 rounded-lg"} bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 transition cursor-pointer`}
              title="Hang Up"
            >
              <X size={isFullScreen ? 15 : 11} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isFullScreen ? "100%" : "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`p-4 flex flex-col justify-between ${isFullScreen ? "flex-1 min-h-0" : ""}`}
          >
            {renderFeedsGrid()}

            {/* Controls Bar */}
            <div
              className={`flex justify-center items-center mt-3 pt-3 border-t border-white/5 gap-3 ${isFullScreen ? "py-2" : ""}`}
            >
              <button
                onClick={() => setIsCallMuted(!isCallMuted)}
                className={`${isFullScreen ? "p-3.5" : "p-2.5"} rounded-full border transition cursor-pointer flex items-center justify-center ${
                  isCallMuted
                    ? "bg-red-500/10 border-red-400/20 text-red-400"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                title={isCallMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isCallMuted ? (
                  <MicOff size={isFullScreen ? 18 : 13} />
                ) : (
                  <Mic size={isFullScreen ? 18 : 13} />
                )}
              </button>

              <button
                onClick={() => setIsCallVideoOff(!isCallVideoOff)}
                className={`${isFullScreen ? "p-3.5" : "p-2.5"} rounded-full border transition cursor-pointer flex items-center justify-center ${
                  isCallVideoOff
                    ? "bg-red-500/10 border-red-400/20 text-red-400"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                title={isCallVideoOff ? "Turn Video On" : "Turn Video Off"}
              >
                {isCallVideoOff ? (
                  <Video
                    size={isFullScreen ? 18 : 13}
                    className="text-red-400"
                  />
                ) : (
                  <Video size={isFullScreen ? 18 : 13} />
                )}
              </button>

              <button
                onClick={() => setIsCallSpeakerMuted(!isCallSpeakerMuted)}
                className={`${isFullScreen ? "p-3.5" : "p-2.5"} rounded-full border transition cursor-pointer flex items-center justify-center ${
                  isCallSpeakerMuted
                    ? "bg-red-500/10 border-red-400/20 text-red-400"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                title={isCallSpeakerMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isCallSpeakerMuted ? (
                  <VolumeX size={isFullScreen ? 18 : 13} />
                ) : (
                  <Volume2 size={isFullScreen ? 18 : 13} />
                )}
              </button>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className={`${isFullScreen ? "p-3.5" : "p-2.5"} rounded-full border transition cursor-pointer flex items-center justify-center ${
                  isFullScreen
                    ? "bg-cyan-500/10 border-cyan-400/20 text-cyan-300"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                <Maximize2 size={isFullScreen ? 18 : 13} />
              </button>

              <button
                onClick={handleHangUp}
                className={`rounded-full bg-red-500 hover:bg-red-600 transition text-white flex items-center justify-center gap-2 font-black cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.4)] ${isFullScreen ? "px-6 py-3.5 text-sm" : "px-3 py-2 text-[10px]"}`}
                title="End Call"
              >
                <Phone
                  size={isFullScreen ? 16 : 11}
                  className="rotate-[135deg] fill-current"
                />
                <span>HANG UP</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Status Strip */}
      {isMinimized && (
        <div className="px-4 py-2 bg-white/[0.02] flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>Active Session • {allFeeds.length} participants</span>
          <span className="text-cyan-400">
            Speaker:{" "}
            {allFeeds
              .find((f) => f.id === activeSpeakerId)
              ?.name.split(" ")[0] || "None"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
