"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAgoraCall } from "@/hooks/useAgoraCall";
import { ChatManager } from "@/backend/chatManager";
import { getAuthToken } from "@/lib/api";
import VideoCallPopup from "@/components/profile/VideoCallPopup";
import PttHudNotification from "@/components/lobby/PttHudNotification";


type CallContextType = {
  isCallActive: boolean;
  isCalling: boolean;
  endCall: (toUserId?: string | null) => void;
  pttActiveWith: string | null;
  incomingPttFrom: string | null;
  startPTT: (toUserId: string) => Promise<void>;
  startGroupPTT: (groupId: string) => Promise<void>;
  stopPTT: () => Promise<void>;
  isPttConnecting: boolean;
  isPttMuted: boolean;
  setIsPttMuted: (muted: boolean) => void;

  
  // Expose additional real call properties
  isVideoCallActive: boolean;
  activeCallPartnerId: string | null;
  isCallMuted: boolean;
  setIsCallMuted: (muted: boolean) => void;
  isCallVideoOff: boolean;
  setIsCallVideoOff: (videoOff: boolean) => void;
  isCallSpeakerMuted: boolean;
  setIsCallSpeakerMuted: (speakerMuted: boolean) => void;
  remoteUsers: any[];
  localVideoTrack: any | null;
  incomingCall: { fromUserObj: any; isVideoEnabled: boolean } | null;
  handleAcceptCall: () => void;
  handleDeclineCall: () => void;
  startCall: (userId: string, isVideo: boolean) => void;
  initAndStartCall: (userId: string, isVideo: boolean, isScreenShare?: boolean) => void;
  initiateCall: (toUserId: string, isVideo: boolean, isScreenShare?: boolean) => void;
  isCallInline: boolean;
  setIsCallInline: (inline: boolean) => void;
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return ctx;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { startCall, initAndStartCall, isCallActive, stopCall, remoteUsers, localVideoTrack, muteAudio, muteVideo, muteSpeaker, toggleScreenShare, isScreenSharing } = useAgoraCall();
  useEffect(() => {
    const handler = () => {
      if (isCallActive) { toggleScreenShare(); }
      else if (typeof window !== "undefined") { alert("Start a FaceTime call first, then tap Share Screen."); }
    };
    window.addEventListener("flydna-toggle-screenshare", handler);
    return () => window.removeEventListener("flydna-toggle-screenshare", handler);
  }, [isCallActive, toggleScreenShare]);

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallPartnerId, setActiveCallPartnerId] = useState<string | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallVideoOff, setIsCallVideoOff] = useState(false);
  const [isCallSpeakerMuted, setIsCallSpeakerMuted] = useState(false);
  const [isCallInline, setIsCallInline] = useState(false);

  // Wire mute state to actual Agora SDK track controls
  useEffect(() => {
    if (isCallActive) muteAudio(isCallMuted);
  }, [isCallMuted, isCallActive, muteAudio]);

  useEffect(() => {
    if (isCallActive) muteVideo(isCallVideoOff);
  }, [isCallVideoOff, isCallActive, muteVideo]);

  useEffect(() => {
    if (isCallActive) muteSpeaker(isCallSpeakerMuted);
  }, [isCallSpeakerMuted, isCallActive, muteSpeaker]);

  const pttClientRef = useRef<any>(null);
  const [isPttConnecting, setIsPttConnecting] = useState(false);
  const pttMicRef = useRef<any>(null);
  const pttJoinedRef = useRef(false);
  const pttJoiningRef = useRef(false);
  const pttChannelRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = ChatManager.onIncomingCall((call) => {
      setIncomingCall(call);
    });
    return unsubscribe;
  }, []);

  // Outgoing call ring for sender
  useEffect(() => {
    if (!isCalling || isCallActive) return;
    const audio = new Audio("/sounds/ringtone.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.currentTime = 0; };
  }, [isCalling, isCallActive]);

  useEffect(() => {
    if (!incomingCall) return;
    
    const audio = new Audio("/sounds/ringtone.mp3");
    audio.loop = true;
    audio.volume = 0.5;

    audio.play().catch((err) => {
      console.warn("[CallContext] Failed to play ringtone:", err);
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [incomingCall]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    const socket = ChatManager.getSocket();
    socket?.emit(
      "incomingCallAcceptEvent",
      { caller: incomingCall.callerId, isVideoEnabled: incomingCall.isVideoEnabled },
      (res: any) => {
        if (res?.success && res?.data) {
          startCall(incomingCall.isVideoEnabled, res.data.channelId, res.data.rtcToken, res.data.rtcUid);
          setActiveCallPartnerId(incomingCall.callerId);
          setIsVideoCallActive(!!incomingCall.isVideoEnabled);
        }
      }
    );
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    if (!incomingCall) return;
    if (typeof window !== "undefined") {
      const callerName = incomingCall.callerName || "Traveler";
      window.dispatchEvent(new CustomEvent("flydna-new-notification", {
        detail: { message: `📞 Missed / Declined call from ${callerName}` }
      }));
    }
    const socket = ChatManager.getSocket();
    socket?.emit("incomingCallRejectEvent", { callerId: incomingCall.callerId });
    setIncomingCall(null);
  };

  const isScreenShareRequested = useRef(false);

  const initiateCall = (toUserId: string, isVideo: boolean, isScreenShare: boolean = false) => {
    isScreenShareRequested.current = isScreenShare;
    console.log("[FlyDnA DEBUG] CallContext initiateCall, isVideo:", isVideo, "isScreenShare:", isScreenShare);
    const socket = ChatManager.getSocket();
    if (!socket?.connected) {
      console.warn("[CallContext] Socket not connected, cannot initiate call");
      return;
    }
    setIsCalling(true);
    setIsVideoCallActive(isVideo);
    socket.emit(
      "initiateCall",
      { toUser: toUserId, isVideoEnabled: isVideo || isScreenShare },
      (res: any) => {
        console.log("[CallContext] initiateCall response:", res);
      }
    );
    // Auto-cancel if no answer in 45 seconds
    const targetUserId = toUserId;
    const callTimeout = setTimeout(() => {
      setIsCalling(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("flydna-new-notification", {
          detail: { message: `📞 Missed call — No answer` }
        }));
      }
      const s = ChatManager.getSocket();
      s?.emit("callEnded", { toUserId: targetUserId, missed: true });
    }, 45000);
    (window as any).__callTimeout = callTimeout;
    (window as any).__callTarget = targetUserId;
  };

  useEffect(() => {
    const unsubscribe = ChatManager.onCallAccepted((data: any) => {
      setIsCalling(false);
      clearTimeout((window as any).__callTimeout);
      startCall(
        data.isVideoEnabled,
        data.channelId,
        data.callerRtcToken,
        data.callerRtcUid,
        isScreenShareRequested.current
      );
      setActiveCallPartnerId(data.callee?._id || null);
      setIsVideoCallActive(!!data.isVideoEnabled);
      // Reset screen share request flag
      isScreenShareRequested.current = false;
    });
    return unsubscribe;
  }, [startCall]);

  useEffect(() => {
    const unsubscribe = ChatManager.onCallEnded((data: any) => {
      console.log("[onCallEnded] fired");
      if (incomingCall && typeof window !== "undefined") {
        const callerName = incomingCall.callerName || "Traveler";
        window.dispatchEvent(new CustomEvent("flydna-new-notification", {
          detail: { message: `📞 Missed call from ${callerName}` }
        }));
      }
      setIsCalling(false);
      setIncomingCall(null);
      stopCall();
      setActiveCallPartnerId(null);
      setIsVideoCallActive(false);
    });
    return unsubscribe;
  }, [stopCall, incomingCall]);

  const endCall = (toUserId?: string | null) => {
    const wasCalling = isCalling && !isCallActive;
    setIsCalling(false);
    clearTimeout((window as any).__callTimeout);
    stopCall();
    const socket = ChatManager.getSocket();
    const target = toUserId || activeCallPartnerId || (window as any).__callTarget;
    console.log("[endCall] wasCalling:", wasCalling, "target:", target, "socket connected:", socket?.connected, "toUserId:", toUserId);
    if (target) {
      socket?.emit("callEnded", { toUserId: target, missed: wasCalling });
    }
    setActiveCallPartnerId(null);
    setIsVideoCallActive(false);
  };

  const [pttActiveWith, setPttActiveWith] = useState<string | null>(null);
  useEffect(() => {

    const unlock = () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        ctx.resume().then(() => ctx.close());
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);
  const [incomingPttFrom, setIncomingPttFrom] = useState<string | null>(null);
  const [activePttSpeaker, setActivePttSpeaker] = useState<{ id?: string; name?: string; avatar?: string } | null>(null);
  const [isPttMuted, setIsPttMutedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("flydna_ptt_muted") === "true";
    }
    return false;
  });

  const setIsPttMuted = (muted: boolean) => {
    setIsPttMutedState(muted);
    if (typeof window !== "undefined") {
      localStorage.setItem("flydna_ptt_muted", String(muted));
    }
  };

  const pttDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [chirpAudio, setChirpAudio] = useState<HTMLAudioElement | null>(null);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sounds/ptt-chirp.mp3");
      audio.preload = "auto";
      audio.volume = 0.6;
      setChirpAudio(audio);
    }
  }, []);

  const getPttChannelId = (idA: string, idB: string) => {
    const combined = [idA, idB].sort().join("_");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
    }
    return `ptt_${hash}`;
  };

  const playChirp = () => {
    if (chirpAudio) {
      try {
        chirpAudio.currentTime = 0;
        chirpAudio.play().catch(() => {});
      } catch {}
    } else {
      try {
        const audio = new Audio("/sounds/ptt-chirp.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch {}
    }
  };

  const playRogerBeep = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      // Dual-tone Roger Beep: high pitch (880Hz) then low pitch (659Hz)
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.07);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.14);
    } catch (e) {
      console.warn("Failed to play roger beep:", e);
    }
  };

  const getMyId = () => {
    try {
      const raw = localStorage.getItem("flydna_user");
      return raw ? JSON.parse(raw)?._id : null;
    } catch { return null; }
  };

  const startPTT = async (toUserId: string) => {
    playChirp();
    const myId = (() => {
      try {
        const raw = localStorage.getItem("flydna_user");
        if (!raw) return "me";
        const parsed = JSON.parse(raw);
        return parsed?._id || parsed?.id || parsed?.userId || "me";
      } catch {
        return "me";
      }
    })();

    // Set UI state IMMEDIATELY so the Glass HUD banner pops up instantly on button press
    setPttActiveWith(toUserId);
    if (pttDismissTimerRef.current) clearTimeout(pttDismissTimerRef.current);
    const contacts = ChatManager.getContacts() || [];
    const partnerContact = contacts.find((c: any) => String(c._id || c.id || c.userId) === String(toUserId));
    setActivePttSpeaker({
      id: toUserId,
      name: partnerContact?.name || "Contact",
      avatar: partnerContact?.avatarUrl || partnerContact?.profileImage || partnerContact?.avatar,
    });

    const channelId = getPttChannelId(myId, toUserId);
    const socket = ChatManager.getSocket();
    socket?.emit("pttStart", { toUserId, channelId });

    // Background Agora WebRTC Join & Audio Publish
    if (!pttJoinedRef.current || pttChannelRef.current !== channelId) {
      pttJoiningRef.current = true;
      setIsPttConnecting(true);
      try {
        const token = getAuthToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        if (token) {
          const res = await fetch(`${apiBase}/api/agora/getAuthToken`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ channelId }),
          });
          if (res.ok) {
            const data = await res.json();
            const d = data?.data;
            if (d?.rtcToken && d?.rtcUid) {
              const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
              if (pttClientRef.current) { try { await pttClientRef.current.leave(); } catch {} }
              const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
              client.on("user-published", async (user: any, mediaType: any) => {
                await client.subscribe(user, mediaType);
                if (mediaType === "audio") user.audioTrack?.play();
              });
              const uid = d.rtcUid & 0x7fffffff || 1;
              await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID || "", channelId, d.rtcToken, uid);
              if (pttMicRef.current) { try { pttMicRef.current.close(); } catch {} }
              pttMicRef.current = await AgoraRTC.createMicrophoneAudioTrack();
              pttClientRef.current = client;
              pttChannelRef.current = channelId;
              pttJoinedRef.current = true;
            }
          }
        }
      } catch (err) {
        console.warn("[PTT] Background Agora connection error (UI HUD still active):", err);
      } finally {
        pttJoiningRef.current = false;
        setIsPttConnecting(false);
      }
    }
    if (pttJoinedRef.current && pttClientRef.current && pttMicRef.current) {
      try { await pttClientRef.current.publish([pttMicRef.current]); } catch {}
    }
  };

  const stopPTT = async () => {
    if (pttClientRef.current && pttMicRef.current) {
      try { await pttClientRef.current.unpublish([pttMicRef.current]); } catch {}
    }
    const socket = ChatManager.getSocket();
    if (pttActiveWith) {
      socket?.emit("pttStop", { toUserId: pttActiveWith });
    }
    setPttActiveWith(null);
    playRogerBeep();

    if (pttDismissTimerRef.current) clearTimeout(pttDismissTimerRef.current);
    pttDismissTimerRef.current = setTimeout(() => {
      setActivePttSpeaker(null);
    }, 3500);
  };

  // ── Group PTT ──────────────────────────────────────────────────────────────
  const startGroupPTT = async (groupId: string) => {
    playChirp();
    const channelId = `grp_${groupId}`;

    // Set UI state IMMEDIATELY so the Glass HUD banner pops up instantly
    setPttActiveWith(groupId);
    if (pttDismissTimerRef.current) clearTimeout(pttDismissTimerRef.current);
    setActivePttSpeaker({
      id: groupId,
      name: "Group Stage PTT",
      avatar: undefined,
    });

    const socket = ChatManager.getSocket();
    socket?.emit("pttStart", { groupId, channelId });

    if (!pttJoinedRef.current || pttChannelRef.current !== channelId) {
      pttJoiningRef.current = true;
      setIsPttConnecting(true);
      try {
        const token = getAuthToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        if (token) {
          const res = await fetch(`${apiBase}/api/agora/getAuthToken`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ channelId }),
          });
          if (res.ok) {
            const data = await res.json();
            const d = data?.data;
            if (d?.rtcToken && d?.rtcUid) {
              const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
              if (pttClientRef.current) { try { await pttClientRef.current.leave(); } catch {} }
              const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
              client.on("user-published", async (user: any, mediaType: any) => {
                await client.subscribe(user, mediaType);
                if (mediaType === "audio") user.audioTrack?.play();
              });
              const uid = d.rtcUid & 0x7fffffff || 1;
              await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID || "", channelId, d.rtcToken, uid);
              if (pttMicRef.current) { try { pttMicRef.current.close(); } catch {} }
              pttMicRef.current = await AgoraRTC.createMicrophoneAudioTrack();
              pttClientRef.current = client;
              pttChannelRef.current = channelId;
              pttJoinedRef.current = true;
            }
          }
        }
      } catch (err) {
        console.warn("[GroupPTT] Channel join failed (UI HUD still active):", err);
      } finally {
        pttJoiningRef.current = false;
        setIsPttConnecting(false);
      }
    }
    if (pttJoinedRef.current && pttClientRef.current && pttMicRef.current) {
      try { await pttClientRef.current.publish([pttMicRef.current]); } catch {}
    }
  };

  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = ChatManager.onIncomingPTT(async (data: any) => {
      if (pttDismissTimerRef.current) {
        clearTimeout(pttDismissTimerRef.current);
        pttDismissTimerRef.current = null;
      }
      playChirp();
      
      const fromUserId = data?.fromUserId || null;
      setIncomingPttFrom(fromUserId);

      // Resolve contact details for HUD
      const contacts = ChatManager.getContacts() || [];
      const speakerContact = contacts.find((c: any) => c._id === fromUserId || c.id === fromUserId);
      setActivePttSpeaker({
        id: fromUserId,
        name: speakerContact?.name || data?.fromUserName || "Traveler",
        avatar: speakerContact?.avatar || data?.fromUserAvatar,
      });

      // If user has PTT Muted enabled, do not subscribe to audio track (silent notification)
      if (localStorage.getItem("flydna_ptt_muted") === "true") {
        console.log("[PTT] Incoming PTT suppressed due to PTT Mute setting.");
        return;
      }

      const isGroupPtt = !!data?.groupId;
      const channelId = isGroupPtt
        ? `grp_${data.groupId}`
        : (() => {
            const myId = (() => { try { const raw = localStorage.getItem("flydna_user"); return raw ? JSON.parse(raw)?._id : null; } catch { return null; } })();
            return myId ? getPttChannelId(myId, data.fromUserId) : null;
          })();

      if (!channelId) return;
      if (pttJoinedRef.current && pttChannelRef.current === channelId) return;
      pttJoiningRef.current = true;
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agora/getAuthToken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ channelId }),
        });
        const data2 = await res.json();
        const d = data2?.data;
        if (!d?.rtcToken || !d?.rtcUid) return;
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        if (pttClientRef.current) { try { await pttClientRef.current.leave(); } catch {} }
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        client.on('user-published', async (user: any, mediaType: any) => {
          await client.subscribe(user, mediaType);
          if (mediaType === 'audio') user.audioTrack?.play();
        });
        const uid = d.rtcUid & 0x7fffffff || 1;
        await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID || '', channelId, d.rtcToken, uid);
        pttMicRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        pttClientRef.current = client;
        pttChannelRef.current = channelId;
        pttJoinedRef.current = true;
      } catch (err) { console.error('[PTT] Incoming pre-join failed:', err); }
      finally { pttJoiningRef.current = false; }
    });
    return unsubscribe;
  }, [initAndStartCall]);

  useEffect(() => {
    const unsubscribe = ChatManager.onPTTEnded(() => {
      setIncomingPttFrom(null);
      playRogerBeep();
      
      // Auto-dismiss HUD 3.5 seconds after PTT ends
      if (pttDismissTimerRef.current) clearTimeout(pttDismissTimerRef.current);
      pttDismissTimerRef.current = setTimeout(() => {
        setActivePttSpeaker(null);
      }, 3500);

      setTimeout(() => {
        stopCall();
      }, 1500);
    });
    return unsubscribe;
  }, [stopCall]);

  const isNascPage = pathname?.startsWith("/nasc");

  return (
    <CallContext.Provider
      value={{
        isCallActive,
        isCalling,
        endCall,
        pttActiveWith,
        incomingPttFrom,
        startPTT,
        startGroupPTT,
        stopPTT,
        isPttConnecting,
        isPttMuted,
        setIsPttMuted,
        isVideoCallActive,
        activeCallPartnerId,
        isCallMuted,
        setIsCallMuted,
        isCallVideoOff,
        setIsCallVideoOff,
        isCallSpeakerMuted,
        setIsCallSpeakerMuted,
        remoteUsers,
        localVideoTrack,
        incomingCall,
        handleAcceptCall,
        handleDeclineCall,
        startCall,
        initAndStartCall,
        initiateCall,
        isCallInline,
        setIsCallInline,
      }}
    >
      {children}

      {/* Floating PTT Speaker Notification Banner HUD */}
      <PttHudNotification
        activePttUser={activePttSpeaker}
        isPttActive={!!incomingPttFrom || !!pttActiveWith}

        isPttMuted={isPttMuted}
        onTogglePttMute={() => setIsPttMuted(!isPttMuted)}
        onOpenChat={(userId) => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("flydna-open-chat", { detail: { userId } }));
          }
        }}
        onDismiss={() => setActivePttSpeaker(null)}
      />

      {incomingCall && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-panel-heavy rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 border border-cyan-400/30">
            <div className="size-16 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
              <span className="text-2xl">{incomingCall.isVideoEnabled ? "🎥" : "📞"}</span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                {incomingCall.fromUserObj?.name || "Someone"} is calling...
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {incomingCall.isVideoEnabled ? "Video Call" : "Voice Call"}
              </p>
            </div>
            <div className="flex gap-4 mt-4 w-full">
              <button
                onClick={handleDeclineCall}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-400 font-semibold hover:bg-red-500/30 transition"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptCall}
                className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {!isNascPage && !isCallInline && (
        <VideoCallPopup
          isMeetingActive={isCallActive && isVideoCallActive}
          setIsMeetingActive={(active: boolean) => {
            if (!active) {
              endCall();
            }
          }}
          selectedMeetingContact={activeCallPartnerId || ""}
          setSelectedMeetingContact={() => {}}
          selectedGroupContacts={[]}
          setSelectedGroupContacts={() => {}}
          activeSpeakerId={activeCallPartnerId}
          isCallMuted={isCallMuted}
          setIsCallMuted={setIsCallMuted}
          isCallVideoOff={isCallVideoOff}
          setIsCallVideoOff={setIsCallVideoOff}
          isCallSpeakerMuted={isCallSpeakerMuted}
          setIsCallSpeakerMuted={setIsCallSpeakerMuted}
          remoteUsers={remoteUsers}
          localVideoTrack={localVideoTrack}
        />
      )}
    </CallContext.Provider>
  );
}

