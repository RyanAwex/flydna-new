/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import Stack from "@/utils/stackAnimation";
import { useAgoraCall } from "@/hooks/useAgoraCall";
import { ChatManager } from "@/lib/api";
import { useCall } from "@/context/CallContext";
import {
  recordTransaction,
  recordPurchase,
  cancelBookingByRef,
  getRemainingCancelTime,
} from "@/lib/ledger";
import VideoCallPopup from "@/components/profile/VideoCallPopup";

import { usePathname } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import GroupChatStage from "./GroupChatStage";

import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  X,
  Eye,
  EyeOff,
  Users,
  Paperclip,
  Smile,
  Send,
  Mic,
  Frown,
  Angry,
  Laugh,
  Meh,
  Heart,
  ThumbsUp,
  Check,
  CheckCheck,
  Radio,
  Store,
  ChevronLeft,
  ChevronRight,
  BellOff,
  Bell,
  Trash2,
  CheckCircle2,
  Lock,
  LockKeyhole,
  Coins,
  Sparkles,
  Tv,
  User,
  UserX,
  Camera,
  Loader2,
  Edit3,
  Volume2,
  VolumeX,
  Share2,
  MessageSquare,
  Bot,
  CreditCard,
  ShieldCheck,
  Wallet,
  Globe,
  Link2,
  AlertCircle,
} from "lucide-react";

import { Contact, Message } from "@/types/chat";
import Avatar from "../shared/Avatar";
import { downloadSceneAssets } from "@/app/actions";
import { checkAvaBalance } from "@/utils/web3/avaEngine";

type ChatPanelProps = {
  selectedContact: Contact | null;
  chatMessages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onClose?: () => void;
  hideScenes?: boolean;
  className?: string;
  isMuted?: boolean;
  onMuteToggle?: (contactId: string) => void;
  onClearHistory?: (contactId: string) => void;
  isCallActive?: boolean;
  isCalling?: boolean;
  onEndCall?: () => void;
  onSelectContact?: (contact: Contact) => void;
  contacts?: Contact[];
};

const WalkieTalkie = ({
  size = 16,
  strokeWidth = 2,
  ...props
}: {
  size?: number;
  strokeWidth?: number;
  [key: string]: any;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 2v4" />
    <path d="M12 2v4" />
    <path d="M8 6h5" />
    <rect x="6" y="6" width="10" height="16" rx="2" />
    <path d="M9 10h4" />
    <path d="M9 13h4" />
    <circle cx="11" cy="17" r="1" />
    <path d="M16 9h2v5h-2" />
  </svg>
);

export default function ChatPanel({
  selectedContact,
  chatMessages,
  input,
  onInputChange,
  onSend,
  onClose,
  hideScenes = false,
  className,
  isMuted = false,
  onMuteToggle,
  onClearHistory,
  isCallActive: isCallActiveProp = false,
  isCalling = false,
  onEndCall,
  onSelectContact,
  contacts = [],
}: ChatPanelProps) {
  const pathname = usePathname();

  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [activeTab, setActiveTab] = useState<
    "free" | "ride-out" | "home" | "group-chat" | "vacation"
  >("free");
  const [isPrivacyHidden, setIsPrivacyHidden] = useState(false);
  const [groupMembersList, setGroupMembersList] = useState<any[]>([]);
  const [groupAdminIds, setGroupAdminIds] = useState<string[]>([]);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  useEffect(() => {
    if (!selectedContact?.isGroup || !selectedContact?.id) {
      setGroupMembersList([]);
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("flydna_token")
        : null;
    if (!token) return;
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
    fetch(`${apiBase}/api/groups/${selectedContact.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const members = d?.data?.members || d?.members;
        const admins = d?.data?.adminIds || d?.adminIds;
        setGroupAdminIds(Array.isArray(admins) ? admins.map(String) : []);
        if (typeof window !== "undefined")
          (window as any).__flydnaGroupAdmins = Array.isArray(admins)
            ? admins.map(String)
            : [];
        if (Array.isArray(members)) {
          const joinOrder = (d?.data?.memberIds || d?.memberIds || []).map(
            String,
          );
          const ordered = [...members].sort((a, b) => {
            const ai = joinOrder.indexOf(String(a.id || a._id));
            const bi = joinOrder.indexOf(String(b.id || b._id));
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });
          setGroupMembersList(ordered);
        }
        const savedSceneId = d?.data?.sceneId;
        if (savedSceneId !== undefined && savedSceneId !== null) {
          const allScenes = [...SCENES, ...PREMIUM_SCENES];
          const found = allScenes.find(
            (s) => String(s.id) === String(savedSceneId),
          );
          if (found) setSelectedScene(found);
        }
      })
      .catch(() => {});
  }, [selectedContact?.id, selectedContact?.isGroup]);
  const groupMembers = useMemo(() => {
    if (!selectedContact || !selectedContact.isGroup) return [];
    if (groupMembersList.length > 0) return groupMembersList;

    return (selectedContact.memberIds || []).map((id) => ({
      id,
      name: `Member ${id.slice(-4)}`,
      avatarUrl: "/profile-default.jpg",
    }));
  }, [selectedContact, groupMembersList]);

  const latestSenderId = useMemo(() => {
    if (chatMessages.length === 0) return null;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg.from === "them") {
      const otherMembers = groupMembers.filter((m) => m.id !== "__self__");
      return otherMembers[0]?.id || null;
    }
    return null;
  }, [chatMessages, groupMembers]);

  const [activeHeaderPopup, setActiveHeaderPopup] = useState<
    "phone" | "video" | "more" | null
  >(null);
  const [isWalkieTalkieOn, setIsWalkieTalkieOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(() =>
    Array.from({ length: 28 }, (_, i) =>
      Math.round(Math.sin(i * 0.45) * 15 + 30),
    ),
  );
  const [localMuted, setLocalMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Clean up recording streams, timers, and audio context on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current)
        audioContextRef.current.close().catch(() => {});
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const startVoiceNote = async () => {
    try {
      setIsAttachmentOpen(false);
      setIsEmojiPickerOpen(false);
      isCancelledRef.current = false;
      setRecordingDuration(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let analyser: AnalyserNode | null = null;
      let dataArray: Uint8Array | null = null;

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.5;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch (audioErr) {
        console.warn(
          "[VoiceNote] AudioContext visualizer init skipped:",
          audioErr,
        );
      }

      const updateLevels = () => {
        const barCount = 28;
        const bars: number[] = [];
        const time = Date.now() / 140;

        if (analyser && dataArray) {
          analyser.getByteFrequencyData(dataArray as any);
          const step = Math.max(1, Math.floor(dataArray.length / barCount));
          for (let i = 0; i < barCount; i++) {
            const raw = dataArray[i * step] || 0;
            const amp = (raw / 255) * 85;
            const idle = Math.sin(time + i * 0.45) * 12 + 20;
            bars.push(
              Math.min(
                100,
                Math.max(15, Math.round(amp > 8 ? amp + 15 : idle)),
              ),
            );
          }
        } else {
          for (let i = 0; i < barCount; i++) {
            const idle = Math.sin(time + i * 0.45) * 25 + 40;
            bars.push(Math.min(100, Math.max(15, Math.round(idle))));
          }
        }
        setAudioLevels(bars);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;

        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          setIsRecording(false);
          setRecordingDuration(0);
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingDuration(0);

        let url = "";
        try {
          const formData = new FormData();
          formData.append("file", blob, `voicenote_${Date.now()}.webm`);
          const token = localStorage.getItem("flydna_token");
          const apiBase =
            process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
          const res = await fetch(`${apiBase}/api/file-upload`, {
            method: "POST",
            headers: {
              ...(token
                ? { Authorization: `Bearer ${token}`, "auth-token": token }
                : {}),
            },
            body: formData,
          });
          const data = await res.json();
          if (data && data.success && data.data?.url) {
            url = data.data.url;
          } else if (data && data.photo) {
            url = data.photo;
          }
        } catch (err) {
          console.warn(
            "[VoiceNote] S3 upload failed, falling back to local Blob URL:",
            err,
          );
        }

        if (!url) {
          console.error(
            "[VoiceNote] S3 upload returned no URL — voice note NOT sent (local blob URLs don't work cross-device).",
          );
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("flydna-new-notification", {
                detail: {
                  message: "⚠️ Voice note upload failed — please try again.",
                },
              }),
            );
          }
          return;
        }

        if (selectedContact)
          ChatManager.sendMessage(selectedContact.id, "__voicenote__" + url);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    } catch (err) {
      console.warn("[VoiceNote] Mic denied:", err);
      setIsRecording(false);
    }
  };

  const cancelVoiceNote = () => {
    isCancelledRef.current = true;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const sendVoiceNote = () => {
    isCancelledRef.current = false;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };
  const {
    startPTT,
    startGroupPTT,
    stopPTT,
    pttActiveWith,
    incomingPttFrom,
    initiateCall,
    isPttConnecting,
    isPttMuted,
    setIsPttMuted,
    setIsCallInline,
  } = useCall();

  // Tell CallContext that the chat panel is active so global video popup doesn't render
  useEffect(() => {
    setIsCallInline(true);
    return () => setIsCallInline(false);
  }, [setIsCallInline]);

  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showClearedFeedback, setShowClearedFeedback] = useState(false);

  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);

  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");

  const handleGroupAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact?.isGroup) return;

    try {
      setIsUploadingGroupAvatar(true);
      const token = localStorage.getItem("flydna_token");
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${apiBase}/api/file-upload`, {
        method: "POST",
        headers: {
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      const s3Url =
        uploadData?.data?.url || uploadData?.url || uploadData?.photo;

      if (!s3Url) {
        throw new Error("Failed to get uploaded file URL");
      }

      await fetch(`${apiBase}/api/groups/${selectedContact.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: JSON.stringify({ groupAvatar: s3Url }),
      });

      (selectedContact as any).groupAvatar = s3Url;
      (selectedContact as any).avatarUrl = s3Url;

      window.dispatchEvent(
        new CustomEvent("flydna-group-updated", {
          detail: { groupId: selectedContact.id, groupAvatar: s3Url },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("flydna-new-notification", {
          detail: {
            id: `group-avatar-${Date.now()}`,
            type: "system",
            title: "Group Avatar Updated",
            message: `Updated group avatar for ${selectedContact.name}`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread: true,
          },
        }),
      );
    } catch (err) {
      console.error("Failed to upload group avatar:", err);
    } finally {
      setIsUploadingGroupAvatar(false);
    }
  };

  const handleClearHistory = useCallback(() => {
    if (!selectedContact) return;

    // Block clearing for FlyDnA Staff (IDs 101, 102, 103 or isOfficial) to preserve support evidence
    if (
      ["101", "102", "103"].includes(selectedContact.id) ||
      selectedContact.isOfficial
    ) {
      alert(
        "FlyDnA Official Staff chat threads cannot be cleared to preserve official support records & evidence.",
      );
      setClearConfirm(false);
      setActiveHeaderPopup(null);
      return;
    }

    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    onClearHistory?.(selectedContact.id);
    ChatManager.clearHistory(selectedContact.id);
    setClearConfirm(false);
    setActiveHeaderPopup(null);
    setShowClearedFeedback(true);
    setTimeout(() => setShowClearedFeedback(false), 2500);
  }, [clearConfirm, selectedContact, onClearHistory]);

  const handleMuteToggle = useCallback(() => {
    if (!selectedContact) return;
    onMuteToggle?.(selectedContact.id);
    setActiveHeaderPopup(null);
  }, [selectedContact, onMuteToggle]);

  const handleStartCall = useCallback(
    (isVideo: boolean, isScreenShare: boolean = false) => {
      console.log(
        "[FlyDnA DEBUG] handleStartCall called with isVideo:",
        isVideo,
        "isScreenShare:",
        isScreenShare,
      );
      if (!selectedContact) return;
      setActiveHeaderPopup(null);
      const AI_STAFF_IDS = ["101", "102", "103"];
      if (AI_STAFF_IDS.includes(String(selectedContact.id))) {
        return; // AI staff are text-only — no call/video lane
      }
      initiateCall(selectedContact.id, isVideo, isScreenShare);
    },
    [selectedContact, initiateCall],
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevContactIdRef = useRef<string | null>(selectedContact?.id || null);
  const isMountedRef = useRef(false);
  const isNearBottomRef = useRef(true);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      isNearBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [selectedContact?.id]);

  useEffect(() => {
    if (!selectedContact) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const performScroll = () => {
      if (!isMountedRef.current) {
        container.scrollTop = container.scrollHeight;
        isMountedRef.current = true;
      } else if (prevContactIdRef.current !== selectedContact.id) {
        container.scrollTop = container.scrollHeight;
        prevContactIdRef.current = selectedContact.id;
      } else if (isNearBottomRef.current) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    };

    // Run immediately
    performScroll();

    // Run on next ticks to ensure layout changes are accounted for
    const t1 = setTimeout(performScroll, 50);
    const t2 = setTimeout(performScroll, 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [chatMessages, selectedContact?.id, selectedContact?.status]);

  if (!selectedContact) {
    return (
      <section
        className={`glass-panel-heavy flex flex-col items-center justify-center overflow-hidden rounded-[26px] shadow-[0_15px_35px_rgba(0,0,0,0.35)] relative p-8 ${className || "h-[800px] 2xl:h-[900px]"}`}
      >
        {/* Subtle ambient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.02)_1px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none" />

        {/* Layered ethereal glow behind logo */}
        <div className="absolute size-96 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-indigo-500/20 blur-[90px] pointer-events-none animate-pulse duration-[4000ms]" />
        <div className="absolute size-64 rounded-full bg-cyan-400/25 blur-[60px] pointer-events-none" />

        <div className="flex flex-col items-center text-center max-w-md z-10 w-full my-auto px-4">
          {/* Logo Showcase with prominent glow */}
          <div className="relative mb-8 group flex items-center justify-center">
            {/* Outer animated ambient ring */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-2xl opacity-75 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-b from-cyan-400/40 via-white/10 to-blue-500/30 blur-md opacity-80 pointer-events-none" />

            {/* Main Glass Frame */}
            <div className="relative size-28 sm:size-32 rounded-[26px] bg-gradient-to-b from-white/[0.10] to-white/[0.03] border border-white/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(6,182,212,0.25)] backdrop-blur-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 ease-out group-hover:scale-105">
              {/* Inner subtle specular sheen */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              <Image
                src="/new-logo.png"
                alt="FlyDnA"
                width={112}
                height={112}
                priority
                className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(6,182,212,0.6)] select-none transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-300/80 font-normal text-xs leading-relaxed max-w-[200px]">
            Select a contact from your list or map to start a live encrypted
            session.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`glass-panel-heavy flex flex-col overflow-hidden rounded-[26px] shadow-[0_15px_35px_rgba(0,0,0,0.3)] relative ${className || "h-[800px] 2xl:h-[900px]"}`}
    >
      {selectedContact?.isGroup && (
        <GroupChatStage
          members={groupMembers}
          latestSenderId={latestSenderId}
          sceneId="neon-lounge"
          sceneSrc={selectedScene?.src}
        />
      )}

      {/* We wrap the content in a relative z-10 div so it floats above the 3D stage */}
      <div className="relative z-10 flex flex-col h-full w-full pointer-events-none [&>*]:pointer-events-auto">
        {isCalling && !isCallActiveProp && (
          <div className="flex items-center justify-between bg-blue-500/10 border-b border-blue-400/30 px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm font-semibold text-blue-400">
                Calling...
              </span>
            </div>
            <button
              onClick={() => {
                onEndCall?.();
                const socket = ChatManager.getSocket();
                if (selectedContact) {
                  socket?.emit("callEnded", { toUserId: selectedContact.id });
                }
              }}
              className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
        {isCallActiveProp && (
          <div className="flex items-center justify-between bg-emerald-500/10 border-b border-emerald-400/30 px-6 py-3">
            <span className="text-sm font-semibold text-emerald-400">
              Call in progress...
            </span>
            <button
              onClick={() => {
                onEndCall?.();
                const socket = ChatManager.getSocket();
                if (selectedContact) {
                  socket?.emit("callEnded", { toUserId: selectedContact.id });
                }
              }}
              className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition cursor-pointer"
            >
              End Call
            </button>
          </div>
        )}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div className="flex items-center gap-5">
            {pathname === "/" && (
              <button
                onClick={onClose}
                className="glass-button glass-sheen grid size-11 place-items-center rounded-full text-slate-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div className="relative size-11 shrink-0">
              {selectedContact.isGroup ? (
                (selectedContact as any).groupAvatar ||
                selectedContact.avatarUrl ? (
                  <img
                    src={
                      (selectedContact as any).groupAvatar ||
                      selectedContact.avatarUrl
                    }
                    alt={selectedContact.name}
                    className="size-full rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="size-full rounded-full bg-slate-800 border border-white/10 grid place-items-center text-slate-300">
                    <Users size={19} />
                  </div>
                )
              ) : selectedContact.avatarUrl ||
                (selectedContact as any).profileImage ||
                (selectedContact as any).profilePicture ? (
                <img
                  src={
                    selectedContact.avatarUrl ||
                    (selectedContact as any).profileImage ||
                    (selectedContact as any).profilePicture
                  }
                  alt={selectedContact.name}
                  className="size-full rounded-full object-cover border border-white/10"
                />
              ) : (
                <div
                  className={`size-full rounded-full bg-gradient-to-br ${selectedContact.color || "from-slate-700 to-slate-800"} border border-white/10 grid place-items-center text-sm font-semibold text-white uppercase`}
                >
                  {selectedContact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#06111f] ${selectedContact.accent || (selectedContact.status === "Online" ? "bg-emerald-500" : "bg-slate-500")}`}
              />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold tracking-wide text-white">
                  {selectedContact.name}
                </h2>

                {/* Eye Privacy Toggle Button — group chat only */}
                {selectedContact.isGroup && (
                  <button
                    type="button"
                    onClick={() => setIsPrivacyHidden(!isPrivacyHidden)}
                    title={
                      isPrivacyHidden
                        ? "Privacy Mode Active (Member identities masked). Click to Reveal."
                        : "Enable Privacy Mode"
                    }
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black tracking-wider transition cursor-pointer active:scale-95 ${
                      isPrivacyHidden
                        ? "bg-purple-500/25 border-purple-400/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                        : "bg-slate-900/60 border-white/15 text-slate-300 hover:text-white"
                    }`}
                  >
                    {isPrivacyHidden ? (
                      <EyeOff
                        size={12}
                        className="text-purple-300 animate-pulse"
                      />
                    ) : (
                      <Eye size={12} />
                    )}
                    <span>{isPrivacyHidden ? "STEALTH" : "PRIVACY"}</span>
                  </button>
                )}
              </div>

              {selectedContact.isGroup ? (
                <div className="flex items-center gap-2 -mt-0.5 relative z-20">
                  <button
                    onClick={() => setIsGroupMembersModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-cyan-400/50 text-cyan-300 text-[11px] font-black tracking-wider normal-case transition cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    title="View Group Members Roster"
                  >
                    <div className="flex items-center -space-x-2 overflow-visible">
                      {(groupMembers.length > 0
                        ? groupMembers
                        : [
                            { name: "Douglas Miller", status: "Online" },
                            { name: "Piff", status: "Online" },
                            { name: "Rayane Sefiani", status: "Offline" },
                            { name: "You", status: "Online" },
                          ]
                      )
                        .slice(0, 5)
                        .map((mem: any, idx: number) => {
                          const isOnline =
                            mem.status === "Online" || idx === 0 || idx === 1;
                          const cleanName = (mem.name || "Member").replace(
                            /^Member\s+/i,
                            "",
                          );
                          const initials =
                            cleanName
                              .split(" ")
                              .map((p: string) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "M";

                          const colorBorders = [
                            "border-emerald-400 text-emerald-300 bg-slate-950",
                            "border-cyan-400 text-cyan-300 bg-slate-950",
                            "border-purple-400 text-purple-300 bg-slate-950",
                            "border-amber-400 text-amber-300 bg-slate-950",
                          ];

                          return (
                            <div
                              key={idx}
                              className="relative group/hdr z-10 hover:z-30 transition-all"
                            >
                              <div
                                className={`size-6 rounded-full border-2 grid place-items-center text-[9px] font-black transition-all transform hover:scale-125 shadow-md ${
                                  isPrivacyHidden
                                    ? "blur-[2px] filter border-purple-500 opacity-70 bg-slate-950 text-white"
                                    : colorBorders[idx % colorBorders.length]
                                }`}
                              >
                                {isPrivacyHidden ? "🔒" : initials}
                              </div>
                              {isOnline && !isPrivacyHidden && (
                                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse shadow-[0_0_6px_#34d399]" />
                              )}
                            </div>
                          );
                        })}
                    </div>
                    <span className="ml-1 text-cyan-300 font-extrabold">
                      {groupMembers.length ||
                        selectedContact.memberIds?.length ||
                        4}{" "}
                      Members
                    </span>
                  </button>
                </div>
              ) : (
                <p className="text-xs font-bold text-emerald-400/90 tracking-wider">
                  {selectedContact.status}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3.5 z-40">
            {activeHeaderPopup && (
              <div
                className="fixed inset-0 z-30"
                onClick={() => setActiveHeaderPopup(null)}
              />
            )}

            {[
              {
                id: "scenes" as const,
                icon: Store,
                title: "Scene Marketplace & Motion Backdrops",
                options: [],
              },
              {
                id: "phone" as const,
                icon: Phone,
                title: "Voice Call",
                options: [],
              },
              {
                id: "video" as const,
                icon: Video,
                title: "Video Call",
                options: [
                  {
                    label: "Start Video Call",
                    icon: null,
                    danger: false,
                    action: () => handleStartCall(true, false),
                  },
                  {
                    label: "Share Screen",
                    icon: null,
                    danger: false,
                    action: () =>
                      window.dispatchEvent(
                        new Event("flydna-toggle-screenshare"),
                      ),
                  },
                ],
              },
              {
                id: "walkie" as const,
                icon: WalkieTalkie,
                title: "Walkie Talkie",
                options: [],
              },
              {
                id: "more" as const,
                icon: MoreVertical,
                title: "Actions",
                options: [
                  {
                    label: isPttMuted
                      ? "Unmute PTT Audio (DND Off)"
                      : "Mute PTT Audio (DND On)",
                    icon: isPttMuted ? VolumeX : Volume2,
                    danger: false,
                    action: () => setIsPttMuted(!isPttMuted),
                  },
                  {
                    label: "Share Trip / Live Location",
                    icon: Share2,
                    danger: false,
                    action: () => {
                      if (
                        typeof window !== "undefined" &&
                        navigator?.geolocation
                      ) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            onInputChange(
                              `📍 FlyDnA Live Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
                            );
                          },
                          () => {
                            onInputChange(
                              "✈️ Share Trip Itinerary: Ready for travel booking!",
                            );
                          },
                        );
                      } else {
                        onInputChange(
                          "✈️ Share Trip Itinerary: Ready for travel booking!",
                        );
                      }
                    },
                  },
                  {
                    label: isMuted
                      ? "Unmute Notifications"
                      : "Mute Notifications",
                    icon: isMuted ? Bell : BellOff,
                    danger: false,
                    action: handleMuteToggle,
                  },
                  {
                    label: clearConfirm
                      ? "Tap again to confirm"
                      : "Clear History",
                    icon: clearConfirm ? CheckCircle2 : Trash2,
                    danger: true,
                    action: handleClearHistory,
                  },
                ],
              },
            ]
              .filter((item) => {
                if (item.id === "scenes" && hideScenes) {
                  return false;
                }
                return true;
              })
              .map((item) => {
                const Icon = item.icon;
                const isOpen =
                  item.id !== "walkie" &&
                  item.id !== "scenes" &&
                  item.id !== "phone" &&
                  activeHeaderPopup === item.id;
                const isPTTActive =
                  !!selectedContact && pttActiveWith === selectedContact.id;
                const isReceivingPTT =
                  !!selectedContact && incomingPttFrom === selectedContact.id;
                const isActive =
                  item.id === "walkie" ? isPTTActive || isReceivingPTT : isOpen;
                return (
                  <div key={item.id} className="relative">
                    {/* Static Button */}
                    <button
                      onClick={() => {
                        if (item.id === "phone") {
                          handleStartCall(false, false);
                          return;
                        }
                        if (item.id === "scenes") {
                          if (selectedContact?.isGroup) {
                            setActiveTab("group-chat");
                          }
                          setIsMarketplaceOpen(true);
                          return;
                        }
                        if (item.id !== "walkie") {
                          setActiveHeaderPopup(isOpen ? null : item.id);
                        }
                      }}
                      onMouseDown={() => {
                        if (item.id === "walkie" && selectedContact) {
                          if (selectedContact.isGroup) {
                            startGroupPTT(selectedContact.id);
                          } else {
                            startPTT(selectedContact.id);
                          }
                          setActiveHeaderPopup(null);
                        }
                      }}
                      onMouseUp={() => {
                        if (item.id === "walkie") stopPTT();
                      }}
                      onMouseLeave={() => {
                        if (item.id === "walkie" && isPTTActive) stopPTT();
                      }}
                      onTouchStart={(e) => {
                        if (item.id === "walkie" && selectedContact) {
                          e.preventDefault();
                          if (selectedContact.isGroup) {
                            startGroupPTT(selectedContact.id);
                          } else {
                            startPTT(selectedContact.id);
                          }
                          setActiveHeaderPopup(null);
                        }
                      }}
                      onTouchEnd={() => {
                        if (item.id === "walkie") stopPTT();
                      }}
                      className={`glass-button glass-sheen size-11 grid place-items-center rounded-full text-slate-200 hover:scale-105 active:scale-95 cursor-pointer relative z-40 transition-all ${
                        item.id === "scenes"
                          ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                          : item.id === "walkie" && isActive
                            ? "text-black dark:text-white shadow-[0_0_15px_rgba(6,182,212,0.45)]"
                            : isActive
                              ? "glass-button-active"
                              : ""
                      }`}
                      style={
                        item.id === "walkie" && isActive
                          ? {
                              background: isReceivingPTT
                                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))"
                                : "linear-gradient(135deg, rgba(0, 174, 255, 0.3), rgba(6, 77, 255, 0.2))",
                              borderColor: isReceivingPTT
                                ? "rgba(16, 185, 129, 0.35)"
                                : "rgba(0, 174, 255, 0.35)",
                            }
                          : {}
                      }
                    >
                      {item.id === "walkie" && isPttConnecting ? (
                        <span className="text-[8px] font-black text-white animate-pulse">
                          ...
                        </span>
                      ) : item.id === "walkie" && isActive ? (
                        <div className="flex items-center justify-center gap-[1.5px] h-[19px] w-[19px] translate-y-[2px]">
                          <span className="w-[2px] h-[10px] bg-black dark:bg-white rounded-full animate-bounce [animation-duration:0.6s]" />
                          <span className="w-[2px] h-[14px] bg-black dark:bg-white rounded-full animate-bounce [animation-duration:0.4s] [animation-delay:0.1s]" />
                          <span className="w-[2px] h-[8px] bg-black dark:bg-white rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                          <span className="w-[2px] h-[12px] bg-black dark:bg-white rounded-full animate-bounce [animation-duration:0.5s] [animation-delay:0.05s]" />
                        </div>
                      ) : isOpen ? (
                        <X size={19} />
                      ) : (
                        <Icon size={19} />
                      )}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 28,
                          }}
                          style={{ transformOrigin: "top right" }}
                          className="absolute right-0 top-13 w-[220px] h-fit overflow-hidden flex flex-col z-40 glass-panel-heavy border border-cyan-400/20 bg-[#06111f]/94 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.5)] rounded-2xl"
                        >
                          <div className="flex flex-col h-full p-4 text-white">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                              <div className="flex items-center gap-2 text-cyan-300">
                                <Icon size={16} />
                                <span className="font-bold text-sm">
                                  {item.title}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5 scrollbar-none">
                              {(
                                item.options as {
                                  label: string;
                                  icon: any;
                                  danger: boolean;
                                  action: () => void;
                                }[]
                              ).map((opt, optIdx) => {
                                const OptIcon = opt.icon;
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={opt.action}
                                    className={`w-full text-left text-[13px] font-semibold flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition cursor-pointer ${
                                      opt.danger
                                        ? clearConfirm &&
                                          opt.label.startsWith("Tap")
                                          ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                          : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                    }`}
                                  >
                                    {OptIcon && (
                                      <OptIcon size={14} className="shrink-0" />
                                    )}
                                    {opt.label}
                                  </button>
                                );
                              })}
                              {false &&
                                (item.options as string[]).map(
                                  (opt, optIdx) => (
                                    <button
                                      key={optIdx}
                                      onClick={() => setActiveHeaderPopup(null)}
                                      className="w-full text-left text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded transition cursor-pointer"
                                    >
                                      {opt}
                                    </button>
                                  ),
                                )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Pinned ScenePreview */}
        {!hideScenes && !selectedContact?.isGroup && (
          <div className="px-6 pt-5">
            <ScenePreview
              selectedContact={selectedContact}
              chatMessages={chatMessages}
              selectedScene={selectedScene}
              setSelectedScene={setSelectedScene}
              isPrivacyHidden={isPrivacyHidden}
              setIsPrivacyHidden={setIsPrivacyHidden}
              isMarketplaceOpen={isMarketplaceOpen}
              setIsMarketplaceOpen={setIsMarketplaceOpen}
              isGroupMembersModalOpen={isGroupMembersModalOpen}
              setIsGroupMembersModalOpen={setIsGroupMembersModalOpen}
              onSelectContact={onSelectContact}
              contacts={contacts}
            />
          </div>
        )}

        {(hideScenes || selectedContact?.isGroup) && (
          <ScenePreview
            selectedContact={selectedContact}
            chatMessages={chatMessages}
            selectedScene={selectedScene}
            setSelectedScene={setSelectedScene}
            isPrivacyHidden={isPrivacyHidden}
            setIsPrivacyHidden={setIsPrivacyHidden}
            isMarketplaceOpen={isMarketplaceOpen}
            setIsMarketplaceOpen={setIsMarketplaceOpen}
            isGroupMembersModalOpen={isGroupMembersModalOpen}
            setIsGroupMembersModalOpen={setIsGroupMembersModalOpen}
            onSelectContact={onSelectContact}
            contacts={contacts}
            onlyModal={true}
          />
        )}

        {/* Scrollable chat messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 pb-4 space-y-8 relative z-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="glass-panel-light mx-auto my-4 w-fit px-6 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300/85 rounded-full border border-white/5 shadow-sm">
            {selectedContact?.isGroup ? (
              <button
                onClick={() => setShowFeed((v) => !v)}
                className="cursor-pointer"
              >
                {showFeed ? "🎬 Scene Only" : "💬 Show Chat"}
              </button>
            ) : (
              "Today"
            )}
          </div>

          <div className="space-y-6 px-1 md:px-3">
            <AnimatePresence initial={false}>
              {(!selectedContact?.isGroup || showFeed) &&
                chatMessages.map((message, idx) => (
                  <ChatBubble
                    key={`${message.id || (message as any)._id || "msg"}-${idx}`}
                    message={message}
                    selectedContact={selectedContact}
                  />
                ))}
              {selectedContact.status === "Typing..." && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[78%] rounded-2xl px-5 py-3 text-sm md:max-w-[48%] relative overflow-hidden backdrop-blur-md rounded-bl-md border border-white/10 bg-white/[0.03] shadow-[0_4px_15px_rgba(0,0,0,0.15),_inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center gap-1.5 h-9">
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Glass input area with high stacking context */}
        <div className="relative z-40 border-t border-white/5 p-2">
          <div className="flex items-center gap-2 rounded-[24px] border border-white/8 bg-white/[0.02] p-1 shadow-inner backdrop-blur-md">
            {isRecording ? (
              <div className="flex items-center w-full gap-2 sm:gap-3 px-2 py-0.5">
                {/* 1. Seconds passed counter with pulsing red recording indicator */}
                <div className="flex items-center gap-2 pl-1 pr-1 flex-shrink-0">
                  <span className="relative flex size-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                  </span>
                  <span className="font-mono text-sm font-bold tracking-wider text-red-400 select-none min-w-[36px]">
                    {formatRecordingTime(recordingDuration)}
                  </span>
                </div>

                {/* 2. Voice lines diagram like WhatsApp/Telegram voice waves taking full remaining width */}
                <div className="flex-1 flex items-center justify-center gap-[3px] h-10 px-2 overflow-hidden">
                  {audioLevels.map((lvl, idx) => {
                    const heightPx = Math.max(
                      4,
                      Math.min(30, Math.round((lvl / 100) * 30)),
                    );
                    return (
                      <div
                        key={idx}
                        className="w-1 rounded-full bg-cyan-400 transition-all duration-75 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                        style={{
                          height: `${heightPx}px`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* 3. Cancel button */}
                <button
                  type="button"
                  onClick={cancelVoiceNote}
                  className="glass-button size-11 grid place-items-center rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/15 active:scale-95 cursor-pointer transition-all border border-white/5 hover:border-red-500/30 flex-shrink-0"
                  title="Cancel recording"
                >
                  <Trash2 size={19} />
                </button>

                {/* 4. Send button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendVoiceNote}
                  className="grid size-11 sm:size-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_20px_rgba(0,174,255,0.45),_inset_0_1px_1.5px_rgba(255,255,255,0.4)] cursor-pointer hover:brightness-110 active:brightness-95 transition-all duration-200 flex-shrink-0"
                  title="Send voice note"
                >
                  <Send size={18} />
                </motion.button>
              </div>
            ) : (
              <>
                <div className="relative z-50">
                  <button
                    onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
                    className={`glass-button glass-sheen size-11 grid place-items-center rounded-full text-slate-300 hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all ${
                      isAttachmentOpen ? "glass-button-active" : ""
                    }`}
                  >
                    {isAttachmentOpen ? (
                      <X size={21} />
                    ) : (
                      <Paperclip size={21} />
                    )}
                  </button>

                  {isAttachmentOpen &&
                    isMounted &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <div
                        className="fixed inset-0 z-[80]"
                        onClick={() => setIsAttachmentOpen(false)}
                      />,
                      document.body,
                    )}

                  <AnimatePresence>
                    {isAttachmentOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 28,
                        }}
                        style={{ transformOrigin: "bottom left" }}
                        className="absolute left-0 bottom-full mb-3 w-[230px] overflow-hidden flex flex-col z-[90] glass-panel-heavy border border-cyan-400/30 bg-[#040c18]/80 backdrop-blur-3xl shadow-[0_-16px_40px_rgba(0,0,0,0.85)] rounded-2xl"
                      >
                        <div className="flex flex-col h-full p-4 text-white">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                            <div className="flex items-center gap-2 text-cyan-300">
                              <Paperclip size={16} />
                              <span className="font-bold text-sm">
                                Attach file
                              </span>
                            </div>
                          </div>

                          <div className="flex-grow flex flex-col gap-1 overflow-y-auto pr-0.5 scrollbar-none">
                            {[
                              "Photos & Videos",
                              "Document / PDF",
                              "Share Live Location",
                              "Contact Card",
                            ].map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  setIsAttachmentOpen(false);
                                }}
                                className="w-full text-left text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-2 rounded transition cursor-pointer"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  value={input}
                  onChange={(event) => onInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && input.trim()) {
                      onSend();
                    }
                  }}
                  placeholder="Type a message..."
                  autoComplete="off"
                  name="flydna-chat-message"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500 font-medium"
                />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="glass-button glass-sheen size-11 grid place-items-center rounded-full text-slate-300 hover:text-white hover:scale-105 active:scale-95 cursor-pointer transition-all"
                  >
                    <Smile
                      size={20}
                      className={isEmojiPickerOpen ? "text-cyan-300" : ""}
                    />
                  </button>

                  <AnimatePresence>
                    {isEmojiPickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute right-0 bottom-14 z-50 p-3 rounded-2xl glass-panel-heavy border border-cyan-400/30 bg-[#06111f]/95 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md grid grid-cols-6 gap-2 w-64"
                      >
                        {[
                          "😊",
                          "🔥",
                          "🚀",
                          "👑",
                          "✈️",
                          "🥂",
                          "🚘",
                          "📍",
                          "🏀",
                          "💎",
                          "❤️",
                          "👍",
                          "💯",
                          "💸",
                          "⚡",
                          "🎉",
                          "😎",
                          "🌟",
                          "🛡️",
                          "👀",
                          "🎯",
                          "🛌",
                          "🍾",
                          "🏆",
                          "🔒",
                          "💬",
                          "🙌",
                          "🌊",
                          "✨",
                          "🤙",
                        ].map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onInputChange(input + emoji);
                              setIsEmojiPickerOpen(false);
                            }}
                            className="text-xl p-1.5 rounded-xl hover:bg-white/10 hover:scale-125 transition active:scale-95 text-center cursor-pointer select-none"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Glowing Liquid Orb Send/Mic Button */}
                <motion.button
                  type="button"
                  onClick={input.trim() ? onSend : startVoiceNote}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="grid size-12 place-items-center rounded-full text-white shadow-[0_0_20px_rgba(0,174,255,0.45),_inset_0_1px_1.5px_rgba(255,255,255,0.4)] cursor-pointer hover:brightness-110 active:brightness-95 transition-all duration-200 bg-gradient-to-br from-cyan-400 to-blue-600 flex-shrink-0"
                  title={input.trim() ? "Send message" : "Record voice message"}
                >
                  {input.trim() ? <Send size={18} /> : <Mic size={19} />}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Group Members Modal Portal in ChatPanel Root */}
      {isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isGroupMembersModalOpen && (
              <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsGroupMembersModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="glass-panel-light glass-sheen w-full max-w-[420px] rounded-[28px] border border-cyan-400/30 p-6 flex flex-col relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white z-10 bg-slate-950/95"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2.5 text-cyan-300">
                      <div className="size-9 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-400 grid place-items-center text-white shadow-md">
                        <Users size={18} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-extrabold text-base text-white">
                          {selectedContact?.name || "Group Roster"}
                        </h3>
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          Group Settings & Roster
                        </p>
                        {(() => {
                          const myIdStr = String(
                            ChatManager.getCurrentUserId() || "",
                          ).replace("usr_", "");
                          const creatorIdStr = String(
                            (selectedContact as any)?.creatorId ||
                              (selectedContact as any)?.createdBy ||
                              (selectedContact as any)?.adminId ||
                              "",
                          ).replace("usr_", "");
                          const groupAdmins = (
                            ((window as any).__flydnaGroupAdmins ||
                              []) as string[]
                          ).map((a) => String(a).replace("usr_", ""));
                          const isCreatorOrAdmin =
                            !creatorIdStr ||
                            myIdStr === creatorIdStr ||
                            groupAdmins.includes(myIdStr);

                          if (!isCreatorOrAdmin) {
                            return (
                              <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                🔒 Admin-Only (Only Creator can add members)
                              </p>
                            );
                          }

                          return (
                            <div className="relative mt-1.5">
                              <button
                                type="button"
                                onClick={() => setShowAddPicker((v) => !v)}
                                className="px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider cursor-pointer transition active:scale-95 flex items-center gap-1"
                              >
                                + Add Member (Admin)
                              </button>
                              {showAddPicker && (
                                <div className="absolute left-0 top-8 z-50 w-64 max-h-60 overflow-y-auto rounded-2xl bg-slate-950/95 border border-cyan-400/30 backdrop-blur-2xl shadow-2xl p-2 space-y-1">
                                  {(() => {
                                    const eligible = contacts.filter((c) => {
                                      if (c.isGroup) return false;
                                      const cid = String(
                                        (c as any).userId ||
                                          c.id ||
                                          (c as any)._id ||
                                          "",
                                      ).replace("usr_", "");
                                      if (!cid) return false;
                                      const isMember = groupMembersList.some(
                                        (m) => {
                                          const mid = String(
                                            m.id ||
                                              (m as any)._id ||
                                              (m as any).userId ||
                                              "",
                                          ).replace("usr_", "");
                                          return mid === cid;
                                        },
                                      );
                                      return !isMember;
                                    });

                                    if (eligible.length === 0) {
                                      return (
                                        <p className="px-3 py-2.5 text-[11px] text-slate-400 font-semibold text-center">
                                          All your contacts are already in this
                                          group
                                        </p>
                                      );
                                    }

                                    return eligible.map((c) => (
                                      <button
                                        key={c.id || (c as any)._id}
                                        type="button"
                                        onClick={async () => {
                                          const cId =
                                            (c as any).userId ||
                                            c.id ||
                                            (c as any)._id;
                                          try {
                                            const token =
                                              localStorage.getItem(
                                                "flydna_token",
                                              );
                                            const apiBase =
                                              process.env.NEXT_PUBLIC_API_URL ||
                                              "https://staging.flydna.io";
                                            await fetch(
                                              `${apiBase}/api/groups/${selectedContact?.id}/members`,
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                  ...(token
                                                    ? {
                                                        Authorization: `Bearer ${token}`,
                                                        "auth-token": token,
                                                      }
                                                    : {}),
                                                },
                                                body: JSON.stringify({
                                                  memberId: cId,
                                                }),
                                              },
                                            );

                                            setGroupMembersList((prev) => [
                                              ...prev,
                                              {
                                                id: cId,
                                                name: c.name,
                                                avatarUrl: (c as any).avatarUrl,
                                                status: c.status || "online",
                                              },
                                            ]);
                                            setShowAddPicker(false);

                                            if (typeof window !== "undefined") {
                                              window.dispatchEvent(
                                                new CustomEvent(
                                                  "flydna-new-notification",
                                                  {
                                                    detail: {
                                                      message: `🎉 Added ${c.name} to ${selectedContact?.name || "Group"}!`,
                                                    },
                                                  },
                                                ),
                                              );
                                            }
                                          } catch (e) {
                                            setGroupMembersList((prev) => [
                                              ...prev,
                                              {
                                                id: cId,
                                                name: c.name,
                                                avatarUrl: (c as any).avatarUrl,
                                                status: c.status || "online",
                                              },
                                            ]);
                                            setShowAddPicker(false);
                                          }
                                        }}
                                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left cursor-pointer transition"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <span className="size-7 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0">
                                            {(c.name || "?")
                                              .slice(0, 2)
                                              .toUpperCase()}
                                          </span>
                                          <span className="text-xs font-bold text-white/90 truncate">
                                            {c.name}
                                          </span>
                                        </div>
                                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                                          + Add
                                        </span>
                                      </button>
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsGroupMembersModalOpen(false)}
                      className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Edit Group Section: Clickable Avatar Upload (S3 + MongoDB PATCH) */}
                  <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-cyan-950/40 border border-cyan-400/20 flex items-center justify-between gap-3">
                    <input
                      type="file"
                      ref={groupAvatarInputRef}
                      accept="image/*"
                      onChange={handleGroupAvatarUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => groupAvatarInputRef.current?.click()}
                        className="relative size-14 rounded-full overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer group/gAvatar bg-slate-950 flex-shrink-0"
                        title="Click to upload/change Group Avatar"
                      >
                        {(selectedContact as any)?.groupAvatar ||
                        selectedContact?.avatarUrl ? (
                          <img
                            src={
                              (selectedContact as any)?.groupAvatar ||
                              selectedContact?.avatarUrl
                            }
                            alt={selectedContact?.name || "Group"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/gAvatar:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 grid place-items-center text-white">
                            <Users size={24} />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/gAvatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                          {isUploadingGroupAvatar ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-cyan-300"
                            />
                          ) : (
                            <Camera
                              size={18}
                              className="text-cyan-300 animate-pulse"
                            />
                          )}
                        </div>

                        {isUploadingGroupAvatar && (
                          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                            <Loader2
                              size={20}
                              className="animate-spin text-cyan-300"
                            />
                          </div>
                        )}
                      </div>

                      <div className="text-left flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">
                            {selectedContact?.name || "Group Name"}
                          </span>
                          <button
                            type="button"
                            onClick={() => groupAvatarInputRef.current?.click()}
                            className="text-[10px] text-cyan-300 hover:text-cyan-200 underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={11} />
                            <span>Edit Avatar</span>
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Click avatar to upload custom group picture (S3)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => groupAvatarInputRef.current?.click()}
                      disabled={isUploadingGroupAvatar}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[11px] font-black tracking-wider flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
                    >
                      {isUploadingGroupAvatar ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Camera size={13} />
                      )}
                      <span>
                        {isUploadingGroupAvatar ? "Uploading..." : "Upload"}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                    {(groupMembers.length > 0
                      ? groupMembers
                      : [
                          {
                            id: "mem-1",
                            name: "Douglas Miller",
                            status: "Online",
                            color: "from-cyan-500 to-blue-600",
                          },
                          {
                            id: "mem-2",
                            name: "Piff",
                            status: "Online",
                            color: "from-emerald-500 to-teal-600",
                          },
                          {
                            id: "mem-3",
                            name: "Rayane Sefiani",
                            status: "Offline",
                            color: "from-purple-500 to-indigo-600",
                          },
                          {
                            id: "mem-4",
                            name: "You",
                            status: "Online",
                            color: "from-amber-500 to-orange-600",
                          },
                        ]
                    ).map((member) => (
                      <div
                        key={member.id || member._id}
                        onClick={() => {
                          const targetId = String(
                            member.id || member._id || "",
                          );
                          const found = contacts.find(
                            (c) =>
                              c.id === targetId ||
                              (c as any).contactId === targetId ||
                              c.name.toLowerCase() ===
                                (member.name || "").toLowerCase(),
                          );
                          const targetContact: Contact = found || {
                            id: targetId || `mem-${Math.random()}`,
                            name: member.name || "Member",
                            status: member.status || "Online",
                            avatarUrl: member.profileImage || member.avatarUrl,
                            color: "from-cyan-500 to-blue-600",
                            accent: "bg-emerald-400",
                            lastMessage: "Start 1v1 conversation",
                            time: "Just now",
                            position: "Member",
                          };
                          setIsGroupMembersModalOpen(false);
                          onSelectContact?.(targetContact);
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/40 hover:bg-white/[0.07] transition text-left cursor-pointer active:scale-98 group/mem"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={member.name || "Member"}
                            gradient={
                              member.color || "from-purple-500 to-indigo-500"
                            }
                            size="sm"
                            avatarUrl={member.profileImage || member.avatarUrl}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover/mem:text-cyan-300 transition-colors">
                              {member.name || "Member"}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                              <span
                                className={`size-1.5 rounded-full ${member.status === "Offline" ? "bg-slate-500" : "bg-emerald-400 shadow-[0_0_6px_#34d399]"}`}
                              />
                              {member.status || "Online"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 opacity-0 group-hover/mem:opacity-100 transition-opacity">
                            Chat 1v1
                          </span>

                          {(() => {
                            const myIdN = String(
                              ChatManager.getCurrentUserId() || "",
                            ).replace("usr_", "");
                            const adminsN = (
                              ((window as any).__flydnaGroupAdmins ||
                                []) as string[]
                            ).map((a) => String(a).replace("usr_", ""));
                            const iAmCreator = adminsN.includes(myIdN);
                            const rowId = String(
                              member.id || (member as any)._id || "",
                            ).replace("usr_", "");
                            const rowIsMe =
                              rowId === myIdN || member.name === "You";
                            return !iAmCreator && rowIsMe;
                          })() && (
                            <button
                              type="button"
                              title="Leave this group"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm("Leave this group?")) return;
                                try {
                                  const token =
                                    localStorage.getItem("flydna_token");
                                  const apiBase =
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    "https://staging.flydna.io";
                                  const res = await fetch(
                                    `${apiBase}/api/groups/${selectedContact?.id}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        ...(token
                                          ? {
                                              Authorization: `Bearer ${token}`,
                                              "auth-token": token,
                                            }
                                          : {}),
                                      },
                                    },
                                  );
                                  if (res.ok) window.location.reload();
                                  else alert("Could not leave group.");
                                } catch (err) {
                                  alert("Could not leave group.");
                                }
                              }}
                              className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                            >
                              <span>Leave Group</span>
                            </button>
                          )}
                          {(() => {
                            const myIdN = String(
                              ChatManager.getCurrentUserId() || "",
                            ).replace("usr_", "");
                            const adminsN = (
                              ((window as any).__flydnaGroupAdmins ||
                                []) as string[]
                            ).map((a) => String(a).replace("usr_", ""));
                            const iAmCreator = adminsN.includes(myIdN);
                            const rowId = String(
                              member.id || (member as any)._id || "",
                            ).replace("usr_", "");
                            const rowIsMe =
                              rowId === myIdN || member.name === "You";
                            return iAmCreator && !rowIsMe;
                          })() && (
                            <button
                              type="button"
                              title={`Kick ${member.name} from group`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const mId = member.id || member._id;
                                const mName = member.name || "Member";
                                try {
                                  const token =
                                    localStorage.getItem("flydna_token");
                                  const apiBase =
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    "https://staging.flydna.io";
                                  const res = await fetch(
                                    `${apiBase}/api/groups/${selectedContact?.id}/members/${mId}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        ...(token
                                          ? {
                                              Authorization: `Bearer ${token}`,
                                              "auth-token": token,
                                            }
                                          : {}),
                                      },
                                    },
                                  );
                                  if (!res.ok) {
                                    const body = await res
                                      .json()
                                      .catch(() => null);
                                    alert(
                                      body?.error ||
                                        "Only group admins can remove members.",
                                    );
                                    return;
                                  }
                                  setGroupMembersList((prev) =>
                                    prev.filter((m) => (m.id || m._id) !== mId),
                                  );
                                  window.dispatchEvent(
                                    new CustomEvent("flydna-new-notification", {
                                      detail: {
                                        id: `kick-${Date.now()}`,
                                        type: "system",
                                        title: "Member Removed",
                                        message: `${mName} was kicked from ${selectedContact?.name || "Group"}`,
                                        timestamp:
                                          new Date().toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }),
                                        unread: true,
                                      },
                                    }),
                                  );
                                } catch (err) {
                                  alert("Could not remove member. Try again.");
                                }
                              }}
                              className="px-2.5 py-1 rounded-full bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                            >
                              <UserX size={11} />
                              <span>Kick</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}

export interface Character {
  id: string;
  name: string;
  level: number;
  title: string;
  image: string;
  premium?: boolean;
  stats: { agility: number; network: number; social: number };
  skins: { Realism: string; Cartoon: string; Anime: string };
}

export const CHARACTERS: Character[] = [
  {
    id: "char_noah",
    name: "Noah Smith",
    level: 7,
    title: "Agile Voyager",
    image: "/avatar_ryan.png",
    premium: false,
    stats: { agility: 80, network: 65, social: 75 },
    skins: {
      Realism: "/scenes/concierge.png",
      Cartoon: "/avatar_ryan.png",
      Anime: "/avatar-1.png",
    },
  },
  {
    id: "char_emelia",
    name: "Emelia",
    level: 12,
    title: "Ice Blade",
    image: "/avatar_lisa.png",
    premium: false,
    stats: { agility: 90, network: 70, social: 80 },
    skins: {
      Realism: "/scenes/concierge.png",
      Cartoon: "/avatar_lisa.png",
      Anime: "/avatar-2.png",
    },
  },
  {
    id: "char_kennard",
    name: "Kennard",
    level: 15,
    title: "NASC Overlord",
    image: "/avatar-1.png",
    premium: true,
    stats: { agility: 99, network: 99, social: 95 },
    skins: {
      Realism: "/scenes/concierge.png",
      Cartoon: "/avatar-1.png",
      Anime: "/avatar_ryan.png",
    },
  },
  {
    id: "char_marcus",
    name: "Marcus Vance",
    level: 9,
    title: "Agile Space Hacker",
    image: "/avatar-marcus.png",
    premium: false,
    stats: { agility: 88, network: 92, social: 70 },
    skins: {
      Realism: "/avatar-marcus.png",
      Cartoon: "/avatar-marcus.png",
      Anime: "/avatar-marcus.png",
    },
  },
  {
    id: "char_yuki",
    name: "Yuki Tanaka",
    level: 11,
    title: "Chrono Specialist",
    image: "/avatar-yuki.png",
    premium: false,
    stats: { agility: 85, network: 78, social: 90 },
    skins: {
      Realism: "/avatar-yuki.png",
      Cartoon: "/avatar-yuki.png",
      Anime: "/avatar-yuki.png",
    },
  },
  {
    id: "char_sofia",
    name: "Sofia Rodriguez",
    level: 14,
    title: "Tactical Nano Medic",
    image: "/avatar-sofia.png",
    premium: true,
    stats: { agility: 92, network: 88, social: 96 },
    skins: {
      Realism: "/avatar-sofia.png",
      Cartoon: "/avatar-sofia.png",
      Anime: "/avatar-sofia.png",
    },
  },
];

export interface Scene {
  id: number;
  name: string;
  src: string;
  themeColor?: string;
  premium?: boolean;
  price?: number;
  category?: "free" | "ride-out" | "home" | "group-chat" | "vacation";
}

function VoiceNotePlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animRef = useRef<number>(0);

  const updateProgress = () => {
    const a = audioRef.current;
    if (a && !a.paused) {
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      animRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (a.readyState === 0) {
        a.load();
      }
      a.playbackRate = playbackSpeed;
      a.play()
        .then(() => {
          setPlaying(true);
          setDuration(a.duration || 0);
          animRef.current = requestAnimationFrame(updateProgress);
        })
        .catch((err) => {
          console.warn(
            "[VoiceNote] play failed, attempting WebAudio fallback:",
            err,
          );
          try {
            const altAudio = new Audio(url);
            altAudio.playbackRate = playbackSpeed;
            altAudio
              .play()
              .then(() => setPlaying(true))
              .catch(() => {});
          } catch {}
        });
    } else {
      a.pause();
      setPlaying(false);
      cancelAnimationFrame(animRef.current);
    }
  };

  const handleSpeedChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1.0, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    a.currentTime = pct * duration;
    setProgress(pct * 100);
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    return (
      Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0")
    );
  };

  // Telegram/Instagram balanced voice waveform heights (32 bars)
  const barHeights = [
    4, 6, 12, 18, 10, 22, 14, 20, 8, 24, 16, 10, 20, 14, 22, 9, 16, 12, 20, 10,
    15, 8, 18, 12, 8, 14, 20, 14, 10, 6, 4, 3,
  ];

  return (
    <div
      className="flex items-center gap-3 py-1 px-1 min-w-[240px] sm:min-w-[270px] max-w-full select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          cancelAnimationFrame(animRef.current);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
      />

      {/* Telegram/Instagram Style Round Action Play/Pause Button */}
      <button
        type="button"
        onClick={toggle}
        className="size-10 rounded-full flex items-center justify-center shrink-0 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer shadow-sm"
      >
        {playing ? (
          <div className="flex items-center justify-center gap-1">
            <span className="w-1 h-3.5 bg-current rounded-full" />
            <span className="w-1 h-3.5 bg-current rounded-full" />
          </div>
        ) : (
          <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-current translate-x-0.5" />
        )}
      </button>

      {/* Center Waveform & Bottom Info Row */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        {/* Seekable Waveform */}
        <div
          className="flex items-center gap-[2.5px] h-7 cursor-pointer group/wave"
          onClick={handleSeek}
        >
          {barHeights.map((h, i) => {
            const barPct = (i / barHeights.length) * 100;
            const isPlayed = barPct <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-100"
                style={{
                  height: `${h}px`,
                  backgroundColor: isPlayed
                    ? "currentColor"
                    : "rgba(255, 255, 255, 0.28)",
                  opacity: isPlayed ? 1 : 0.45,
                }}
              />
            );
          })}
        </div>

        {/* Telegram/Instagram Style Bottom Info Bar: Time & Speed */}
        <div className="flex items-center justify-between text-[10.5px] opacity-80 font-medium">
          <span className="font-mono tabular-nums">
            {playing && audioRef.current
              ? formatTime(audioRef.current.currentTime)
              : formatTime(duration)}
          </span>

          <button
            type="button"
            onClick={handleSpeedChange}
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/10 hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
}

function handleVideoTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
  const v = e.currentTarget;
  // Seamless loop trim: loop back 4.5s early for nights_alone/nights-alone to hide TikTok outro logo cleanly
  const srcLower = v.src.toLowerCase();
  const trim =
    srcLower.includes("nights_alone") ||
    srcLower.includes("nights-alone") ||
    srcLower.includes("nights_alone.mp4")
      ? 4.5
      : 1.5;
  if (v.duration && v.currentTime >= v.duration - trim) {
    v.currentTime = 0;
  }
}

export const SCENES: Scene[] = [
  {
    id: 1,
    name: "Neon Cyberpunk",
    src: "/scenes/cyberpunk.png",
    themeColor: "#06b6d4",
    category: "free",
  },
  {
    id: 2,
    name: "Misty Bamboo",
    src: "/scenes/bamboo.png",
    themeColor: "#10b981",
    category: "free",
  },
  {
    id: 3,
    name: "Alpine Sunset",
    src: "/scenes/sunset.png",
    themeColor: "#f97316",
    category: "free",
  },
  {
    id: 4,
    name: "Bioluminescent Cave",
    src: "/scenes/cave.png",
    themeColor: "#8b5cf6",
    category: "free",
  },
  {
    id: 5,
    name: "Cosmic Desert",
    src: "/scenes/desert.png",
    themeColor: "#ec4899",
    category: "free",
  },
  {
    id: 6,
    name: "Glassmorphic Waves",
    src: "/scenes/waves.png",
    themeColor: "#3b82f6",
    category: "free",
  },
  {
    id: 7,
    name: "Nebula Cockpit",
    src: "/scenes/cockpit.png",
    themeColor: "#a855f7",
    category: "free",
  },
  {
    id: 8,
    name: "Mystic Ruins",
    src: "/scenes/ruins.png",
    themeColor: "#059669",
    category: "free",
  },
  {
    id: 9,
    name: "Metropolis Dusk",
    src: "/scenes/metropolis.png",
    themeColor: "#6366f1",
    category: "free",
  },
  {
    id: 10,
    name: "Aurora Cabin",
    src: "/scenes/aurora.png",
    themeColor: "#14b8a6",
    category: "free",
  },
];

export const PREMIUM_SCENES: Scene[] = [
  // Ride-Out Category ($5.00)
  {
    id: 101,
    name: "Midnight Highway Drive",
    src: "/scenes/Night-Drive.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#00f0ff",
    category: "ride-out",
  },
  {
    id: 102,
    name: "City Car Nights",
    src: "/scenes/Car_Nights.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#3b82f6",
    category: "ride-out",
  },
  {
    id: 103,
    name: "Neon Bike Cruise",
    src: "/scenes/Bike-Ride.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#f59e0b",
    category: "ride-out",
  },
  {
    id: 104,
    name: "Motorcycle Highway",
    src: "/scenes/Motorcycle-Ride.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#ef4444",
    category: "ride-out",
  },
  {
    id: 105,
    name: "Night Ride Motion",
    src: "/scenes/Night-Ride.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#8b5cf6",
    category: "ride-out",
  },
  {
    id: 106,
    name: "Night City Bikes",
    src: "/scenes/bike nights.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#10b981",
    category: "ride-out",
  },
  {
    id: 107,
    name: "Big Body Benz",
    src: "/scenes/BigBodyBenz.mov",
    premium: true,
    price: 5.0,
    themeColor: "#6366f1",
    category: "ride-out",
  },
  {
    id: 110,
    name: "Flying Dragon Fantasy",
    src: "/scenes/Flying Dragon.mov",
    premium: true,
    price: 5.0,
    themeColor: "#8b5cf6",
    category: "ride-out",
  },

  // Home Category ($5.00)
  {
    id: 201,
    name: "Solo Night Vibe",
    src: "/scenes/Nights-Alone.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#ec4899",
    category: "home",
  },
  {
    id: 202,
    name: "Cooking at Home",
    src: "/scenes/Cooking.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#f97316",
    category: "home",
  },
  {
    id: 204,
    name: "Home Alone Vibe",
    src: "/scenes/HomeAlone.mov",
    premium: true,
    price: 5.0,
    themeColor: "#3b82f6",
    category: "home",
  },
  {
    id: 205,
    name: "Spiderman Chill",
    src: "/scenes/Spiderman.mov",
    premium: true,
    price: 5.0,
    themeColor: "#ef4444",
    category: "home",
  },

  // Group Chat Category ($5.00)
  {
    id: 301,
    name: "Basketball Squad",
    src: "/scenes/BasketBall.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#ef4444",
    category: "group-chat",
  },
  {
    id: 302,
    name: "Bike Friends Squad",
    src: "/scenes/Bike_Friends.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#10b981",
    category: "group-chat",
  },
  {
    id: 303,
    name: "Goku Power",
    src: "/scenes/Goku.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#f59e0b",
    category: "group-chat",
  },
  {
    id: 304,
    name: "Rooftop Lounge",
    src: "/scenes/rooftop.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#06b6d4",
    category: "group-chat",
  },
  {
    id: 305,
    name: "Rooftop Nights",
    src: "/scenes/RoofTopNights.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#a855f7",
    category: "group-chat",
  },
  {
    id: 306,
    name: "Cruise Deck Sunset",
    src: "/scenes/Cruise.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#f97316",
    category: "group-chat",
  },

  // Vacation Category ($5.00)
  {
    id: 401,
    name: "Tropical Beach Motion",
    src: "/scenes/beach.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#00b4d8",
    category: "vacation",
  },
  {
    id: 404,
    name: "Space Nights Motion",
    src: "/scenes/Space Nights.MOV",
    premium: true,
    price: 5.0,
    themeColor: "#a855f7",
    category: "vacation",
  },
  {
    id: 405,
    name: "Space Cruise Motion",
    src: "/scenes/Space_Cruise.mov",
    premium: true,
    price: 5.0,
    themeColor: "#6366f1",
    category: "vacation",
  },
  {
    id: 406,
    name: "Winter Coaster Thrill",
    src: "/scenes/winter roller-coaster.mp4",
    premium: true,
    price: 5.0,
    themeColor: "#06b6d4",
    category: "vacation",
  },
];

function getSceneObjectPosition(src?: string): string {
  if (!src) return "object-center";
  const s = src.toLowerCase();
  if (
    s.includes("roadtrip") ||
    s.includes("road_trip") ||
    s.includes("boarding")
  ) {
    return "object-top";
  }
  if (s.includes("kick_rocks") || s.includes("kickrocks")) {
    return "object-bottom";
  }
  return "object-center";
}

function ScenePreview({
  selectedContact,
  chatMessages,
  selectedScene: selectedSceneProp,
  setSelectedScene: setSelectedSceneProp,
  isPrivacyHidden = false,
  setIsPrivacyHidden = () => {},
  isMarketplaceOpen = false,
  setIsMarketplaceOpen = () => {},
  isGroupMembersModalOpen: isGroupMembersModalOpenProp,
  setIsGroupMembersModalOpen: setIsGroupMembersModalOpenProp,
  onSelectContact,
  contacts = [],
  onlyModal = false,
}: {
  selectedContact: Contact;
  chatMessages: Message[];
  selectedScene?: Scene | null;
  setSelectedScene?: (scene: Scene | null) => void;
  isPrivacyHidden?: boolean;
  setIsPrivacyHidden?: (val: boolean) => void;
  isMarketplaceOpen?: boolean;
  setIsMarketplaceOpen?: (val: boolean) => void;
  isGroupMembersModalOpen?: boolean;
  setIsGroupMembersModalOpen?: (val: boolean) => void;
  onSelectContact?: (contact: Contact) => void;
  contacts?: Contact[];
  onlyModal?: boolean;
}) {
  const {
    isVideoCallActive,
    isCallMuted,
    setIsCallMuted,
    isCallVideoOff,
    setIsCallVideoOff,
    isCallSpeakerMuted,
    setIsCallSpeakerMuted,
    remoteUsers,
    localVideoTrack,
    activeCallPartnerId,
    endCall,
  } = useCall();
  const [selectedSceneLocal, setSelectedSceneLocal] = useState<Scene | null>(
    null,
  );
  const selectedScene =
    selectedSceneProp !== undefined ? selectedSceneProp : selectedSceneLocal;
  const setSelectedScene = setSelectedSceneProp || setSelectedSceneLocal;

  const [isGroupMembersModalOpenLocal, setIsGroupMembersModalOpenLocal] =
    useState(false);
  const isGroupMembersModalOpen =
    isGroupMembersModalOpenProp !== undefined
      ? isGroupMembersModalOpenProp
      : isGroupMembersModalOpenLocal;
  const setIsGroupMembersModalOpen =
    setIsGroupMembersModalOpenProp || setIsGroupMembersModalOpenLocal;

  const [activeTab, setActiveTab] = useState<
    "free" | "ride-out" | "home" | "group-chat" | "vacation"
  >(selectedContact?.isGroup ? "group-chat" : "free");
  const [purchasedIds, setPurchasedIds] = useState<number[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [checkoutScene, setCheckoutScene] = useState<Scene | null>(null);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutCard, setCheckoutCard] = useState("");
  const [checkoutExpiry, setCheckoutExpiry] = useState("");
  const [checkoutCvc, setCheckoutCvc] = useState("");
  const [paymentStep, setPaymentStep] = useState<
    "form" | "processing" | "success"
  >("form");
  const [paymentRail, setPaymentRail] = useState<
    "fiat" | "ava" | "xrp" | "vault"
  >("fiat");
  const [xrpTxHash, setXrpTxHash] = useState("");
  const [xrpVerifyError, setXrpVerifyError] = useState("");
  const [xrpVerifying, setXrpVerifying] = useState(false);
  const [avaWalletAddress, setAvaWalletAddress] = useState("");
  const [avaBalance, setAvaBalance] = useState("0");
  const [checkingAva, setCheckingAva] = useState(false);
  const [vaultBalances, setVaultBalances] = useState({ xrp: 1000, ava: 500 });
  const [vaultTokenSelected, setVaultTokenSelected] = useState<"xrp" | "ava">(
    "xrp",
  );
  const [linkedEvm, setLinkedEvm] = useState<string | null>(null);
  const [linkedXrp, setLinkedXrp] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeChar, setActiveChar] = useState(CHARACTERS[0]);
  const [activeStyle, setActiveStyle] = useState<
    "Realism" | "Cartoon" | "Anime"
  >("Cartoon");
  const [selectedHat, setSelectedHat] = useState<string | null>(null);
  const [selectedShirt, setSelectedShirt] = useState<string | null>(null);
  const [customizerTab, setCustomizerTab] = useState<"style" | "wear">("style");
  const [coins, setCoins] = useState(1560);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [showReactions, setShowReactions] = useState(false);
  const [selectedReactionIndex, setSelectedReactionIndex] = useState(0);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [groupScene, setGroupScene] = useState<Scene | null>(null);
  const [remotePartnerSceneId, setRemotePartnerSceneId] = useState<
    number | null
  >(null);
  const selectedContactRef = useRef<any>(selectedContact);
  selectedContactRef.current = selectedContact;
  useEffect(() => {
    setRemotePartnerSceneId(null);
  }, [selectedContact?.id]);
  // 1v1 own-message bubble on YOUR scene
  const [liveUserMsg, setLiveUserMsg] = useState<{
    id: number;
    text: string;
    name: string;
  } | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.message) return;
      if ((selectedContact as any)?.isOfficial) return;
      setLiveUserMsg({
        id: d.message.id,
        text: d.message.text,
        name: d.senderName || "You",
      });
      setTimeout(() => setLiveUserMsg(null), 5000);
    };
    window.addEventListener("flydna-user-message", handler);
    return () => window.removeEventListener("flydna-user-message", handler);
  }, []);
  useEffect(() => {
    const handleRemoteSceneUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.sceneId === undefined) return;
      const myOwnId = String(ChatManager.getCurrentUserId()).replace(
        "usr_",
        "",
      );
      const eventFromId = detail.userId
        ? String(detail.userId).replace("usr_", "")
        : "";
      // GROUP scenes: the scene belongs to the room — apply for everyone (incl. own other devices)
      if (detail.isGroup && detail.groupId && selectedContact?.isGroup) {
        if (String(detail.groupId) === String(selectedContact.id)) {
          setRemotePartnerSceneId(Number(detail.sceneId));
          (selectedContact as any).activeSceneId = Number(detail.sceneId);
        }
        return;
      }
      // Never let our own scene change affect our view of the partner (1v1)
      if (eventFromId === myOwnId) return;
      if (!selectedContact) return;
      const rawContactId = String(selectedContact.id || "").replace("usr_", "");
      const rawContactSubId = selectedContact.contactId
        ? String(selectedContact.contactId).replace("usr_", "")
        : "";
      // Only apply if this update came from the contact we're currently viewing
      if (eventFromId === rawContactId || eventFromId === rawContactSubId) {
        setRemotePartnerSceneId(Number(detail.sceneId));
        (selectedContact as any).activeSceneId = Number(detail.sceneId);
      }
    };
    window.addEventListener("flydna-scene-updated", handleRemoteSceneUpdate);
    return () =>
      window.removeEventListener(
        "flydna-scene-updated",
        handleRemoteSceneUpdate,
      );
  }, [selectedContact]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  useEffect(() => {
    if (selectedContact?.isGroup) {
      const fetchGroupDetails = async () => {
        try {
          const token = localStorage.getItem("flydna_token");
          const apiBase =
            process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
          const res = await fetch(
            `${apiBase}/api/groups/${selectedContact.id}`,
            {
              headers: {
                ...(token
                  ? { Authorization: `Bearer ${token}`, "auth-token": token }
                  : {}),
              },
            },
          );
          if (res.ok) {
            const body = await res.json();
            if (body?.data?.members && Array.isArray(body.data.members)) {
              setGroupMembers(body.data.members);
            }
            const savedSceneId = body?.data?.sceneId;
            if (savedSceneId !== undefined && savedSceneId !== null) {
              const allScenes = [...SCENES, ...PREMIUM_SCENES];
              const found = allScenes.find(
                (s) => String(s.id) === String(savedSceneId),
              );
              if (found) setGroupScene(found);
            }
          }
        } catch (e) {
          console.warn("[FlyDnA] Group members fetch error:", e);
        }
      };
      fetchGroupDetails();
    } else {
      setGroupMembers([]);
      setGroupScene(null);
    }
  }, [selectedContact?.id, selectedContact?.isGroup]);

  useEffect(() => {
    const loadVaultBalances = () => {
      try {
        const stored = localStorage.getItem("flydna_vault_balances");
        if (stored) {
          setVaultBalances(JSON.parse(stored));
        } else {
          localStorage.setItem(
            "flydna_vault_balances",
            JSON.stringify({ xrp: 1000.0, ava: 500.0 }),
          );
        }
      } catch (err) {}
    };

    const loadLinkedWallets = () => {
      setLinkedEvm(localStorage.getItem("flydna_linked_evm_wallet"));
      setLinkedXrp(localStorage.getItem("flydna_linked_xrp_wallet"));
    };

    loadVaultBalances();
    loadLinkedWallets();
    window.addEventListener("flydna-vault-updated", loadVaultBalances);
    window.addEventListener("flydna-wallets-linked", loadLinkedWallets);
    return () => {
      window.removeEventListener("flydna-vault-updated", loadVaultBalances);
      window.removeEventListener("flydna-wallets-linked", loadLinkedWallets);
    };
  }, []);

  const chatMapContainerRef = useRef<HTMLDivElement>(null);
  const chatMapRef = useRef<mapboxgl.Map | null>(null);

  const isTransportActive = useMemo(() => {
    const lastMsgs = [...chatMessages].reverse().slice(0, 5);
    return lastMsgs.some((m) => {
      const txt = m.text?.toLowerCase() || "";
      return (
        txt.includes("pickup") ||
        txt.includes("drop-off") ||
        txt.includes("black car") ||
        txt.includes("chauffeur") ||
        txt.includes("route") ||
        txt.includes("transfer")
      );
    });
  }, [chatMessages]);

  useEffect(() => {
    if (!isTransportActive || !chatMapContainerRef.current) {
      if (chatMapRef.current) {
        chatMapRef.current.remove();
        chatMapRef.current = null;
      }
      return;
    }

    const lastThemText =
      [...chatMessages].reverse().find((m) => m.from === "them")?.text || "";
    const textLower = lastThemText.toLowerCase();

    let pickupCoord = [-84.4678, 33.8907]; // Truist Park, ATL
    let dropoffCoord = [-84.3644, 33.8184]; // Southfork Dr, ATL
    let center = [-84.4161, 33.8546];

    if (
      textLower.includes("yankee") ||
      textLower.includes("new york") ||
      textLower.includes("jfk")
    ) {
      pickupCoord = [-73.9262, 40.8296]; // Yankee Stadium, NY
      dropoffCoord = [-73.9857, 40.7484]; // Midtown Manhattan
      center = [-73.956, 40.789];
    }

    // Initialize Mapbox map inside chat backdrop
    const DEFAULT_MAPBOX_TOKEN =
      "pk.eyJ1IjoiaDJvMjYiLCJhIjoiY210NGtibms3MWR2cTJ4cTV1dzNobzUwMiJ9.x4ynmPnKAP8zv0olbb5qBg";
    const token = (
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN || DEFAULT_MAPBOX_TOKEN
    ).trim();
    if (!token || !token.startsWith("pk.")) {
      console.warn(
        "[ChatPanel] Mapbox token missing or invalid. Skipping chat map rendering.",
      );
      return;
    }
    mapboxgl.accessToken = token;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: chatMapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: center as [number, number],
        zoom: 10.5,
        interactive: true,
        attributionControl: false,
      });
      chatMapRef.current = map;
    } catch (err) {
      console.error("Chat Mapbox GL failed to initialize:", err);
      return;
    }

    // Add glowing custom A/B markers

    const elA = document.createElement("div");
    elA.className =
      "size-5 rounded-full bg-cyan-400 border border-white flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.8)]";
    elA.innerHTML = '<span class="text-[8px] font-black text-black">A</span>';
    new mapboxgl.Marker(elA)
      .setLngLat(pickupCoord as [number, number])
      .addTo(map);

    const elB = document.createElement("div");
    elB.className =
      "size-5 rounded-full bg-purple-500 border border-white flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.8)]";
    elB.innerHTML = '<span class="text-[8px] font-black text-white">B</span>';
    new mapboxgl.Marker(elB)
      .setLngLat(dropoffCoord as [number, number])
      .addTo(map);

    // Draw route path
    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              pickupCoord,
              [
                (pickupCoord[0] + dropoffCoord[0]) / 2 + 0.015,
                (pickupCoord[1] + dropoffCoord[1]) / 2 - 0.01,
              ],
              dropoffCoord,
            ],
          },
        },
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#22d3ee",
          "line-width": 3,
          "line-dasharray": [2, 2],
          "line-opacity": 0.8,
        },
      });
    });

    return () => {
      if (chatMapRef.current) {
        chatMapRef.current.remove();
        chatMapRef.current = null;
      }
    };
  }, [isTransportActive, chatMessages]);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("flydna_user");
      const parsedUser = userData ? JSON.parse(userData) : null;
      if (parsedUser && Array.isArray(parsedUser.purchasedScenes)) {
        setPurchasedIds(parsedUser.purchasedScenes);
        localStorage.setItem(
          "flydna_purchased_scenes",
          JSON.stringify(parsedUser.purchasedScenes),
        );
      } else {
        const stored = localStorage.getItem("flydna_purchased_scenes");
        if (stored) {
          setPurchasedIds(JSON.parse(stored));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedContact?.isGroup) {
      setActiveTab("group-chat");
    } else if (activeTab === "group-chat") {
      setActiveTab("free");
    }
  }, [selectedContact?.id, selectedContact?.isGroup]);

  const currentScenes = useMemo(() => {
    const allScenes = [...SCENES, ...PREMIUM_SCENES];
    if (selectedContact?.isGroup) {
      // Group Chat: strictly Group Chat scenes ONLY
      return allScenes.filter((s) => s.category === "group-chat");
    }
    // 1v1 Chat: strictly 1v1 scenes ONLY (exclude group-chat)
    const contextScenes = allScenes.filter((s) => s.category !== "group-chat");
    const filtered = contextScenes.filter(
      (s) => (s.category || (s.premium ? "ride-out" : "free")) === activeTab,
    );
    return filtered.length > 0
      ? filtered
      : contextScenes.filter((s) => s.category === "free");
  }, [activeTab, selectedContact?.isGroup]);

  // Download assets on mount
  useEffect(() => {
    downloadSceneAssets().catch((err) =>
      console.error("[FlyDnA] Scene assets initialization failed:", err),
    );
  }, []);

  // Load selected scene: fast synchronous local restore + non-blocking background sync
  useEffect(() => {
    const syncUserActiveScene = async () => {
      if (selectedContactRef.current?.isGroup) return; // groups use groupScene on GroupChatStage

      // 1. Immediately restore personal scene from localStorage (0ms latency, zero lag)
      let activeId: number | null = null;
      const savedPersonal =
        localStorage.getItem("flydna-user-personal-scene") ||
        localStorage.getItem("flydna-selected-scene");
      if (savedPersonal) {
        try {
          const parsed = JSON.parse(savedPersonal);
          if (parsed && parsed.id) activeId = Number(parsed.id);
        } catch (e) {}
      }

      if (!activeId) {
        const storedDbId = localStorage.getItem("flydna-db-activeSceneId");
        if (storedDbId) activeId = Number(storedDbId);
      }

      const sceneIdToUse = activeId || 3;
      const scene =
        [...SCENES, ...PREMIUM_SCENES].find((s) => s.id === sceneIdToUse) ||
        SCENES[2];
      if (!selectedContactRef.current?.isGroup) {
        setSelectedScene(scene);
      }

      // 2. Non-blocking background sync with user profile
      const token = localStorage.getItem("flydna_token");
      if (token) {
        try {
          const apiBase =
            process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
          const res = await fetch(`${apiBase}/api/user`, {
            headers: { Authorization: `Bearer ${token}`, "auth-token": token },
          });
          if (res.ok) {
            const body = await res.json();
            const userData = body.data || body;
            if (userData && userData.activeSceneId) {
              const bgId = Number(userData.activeSceneId);
              const bgScene = [...SCENES, ...PREMIUM_SCENES].find(
                (s) => s.id === bgId,
              );
              if (bgScene && !selectedContactRef.current?.isGroup) {
                setSelectedScene(bgScene);
                localStorage.setItem(
                  "flydna-user-personal-scene",
                  JSON.stringify(bgScene),
                );
                localStorage.setItem(
                  "flydna-selected-scene",
                  JSON.stringify(bgScene),
                );
                localStorage.setItem(
                  "flydna-db-activeSceneId",
                  bgScene.id.toString(),
                );
              }
            }
          }
        } catch (e) {}
      }
    };

    syncUserActiveScene();
  }, [selectedContact?.id]);

  // Align carousel active index and tab when opening marketplace
  useEffect(() => {
    if (isMarketplaceOpen && selectedScene) {
      const allScenes = [...SCENES, ...PREMIUM_SCENES];
      const targetScene =
        allScenes.find((s) => s.id === selectedScene.id) || selectedScene;
      const tab =
        targetScene.category || (targetScene.premium ? "ride-out" : "free");

      setActiveTab(
        tab as "free" | "ride-out" | "home" | "group-chat" | "vacation",
      );

      const list = allScenes.filter((s) => {
        if (selectedContact?.isGroup) return s.category === "group-chat";
        return (
          s.category !== "group-chat" &&
          (s.category || (s.premium ? "ride-out" : "free")) === tab
        );
      });

      const idx = list.findIndex((s) => s.id === selectedScene.id);
      setCarouselIndex(idx !== -1 ? idx : 0);
    }
  }, [isMarketplaceOpen, selectedScene, selectedContact?.isGroup]);

  // Prevent main page scrolling when presence, checkout, or upgrade modal is open
  useEffect(() => {
    if (isMarketplaceOpen || checkoutScene || showUpgradeModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMarketplaceOpen, checkoutScene, showUpgradeModal]);

  const reactionIcons = [
    { icon: Smile, label: "Smile" },
    { icon: Frown, label: "Sad" },
    { icon: Angry, label: "Angry" },
    { icon: Laugh, label: "Laughing" },
    { icon: Meh, label: "Meh" },
    { icon: Heart, label: "Heart" },
    { icon: ThumbsUp, label: "Like" },
    { icon: Smile, label: "Smile-dup" },
    { icon: Frown, label: "Sad-dup" },
    { icon: Laugh, label: "Laugh-dup" },
  ];

  const CurrentIcon = reactionIcons[selectedReactionIndex]?.icon || Smile;

  const handleUseScene = () => {
    const scene = currentScenes[carouselIndex];
    if (!scene || scene.id === undefined) return;
    if (selectedContact?.isGroup) {
      const myId = String(ChatManager.getCurrentUserId() || "").replace(
        "usr_",
        "",
      );
      const adminsNorm = (
        ((window as any).__flydnaGroupAdmins || []) as string[]
      ).map((a) => String(a).replace("usr_", ""));
      if (adminsNorm.length > 0 && !adminsNorm.includes(myId)) {
        window.dispatchEvent(
          new CustomEvent("flydna-new-notification", {
            detail: {
              id: `scene-gate-${Date.now()}`,
              message: "Only the group creator can set the scene",
            },
          }),
        );
        alert("Only the group creator can set the scene \ud83c\udfac");
        return;
      }
    }
    if (!selectedContact?.isGroup) {
      setSelectedScene(scene);
      localStorage.setItem("flydna-user-personal-scene", JSON.stringify(scene));
    } else {
      setGroupScene(scene);
    }
    localStorage.setItem("flydna-selected-scene", JSON.stringify(scene));
    localStorage.setItem("flydna-db-activeSceneId", scene.id.toString());
    try {
      ChatManager.updateUserScene(
        scene.id,
        undefined,
        selectedContact?.id,
        !!selectedContact?.isGroup,
      );
    } catch (e) {}
    setIsMarketplaceOpen(false);
  };

  const handlePurchaseSuccess = async (sceneId: number) => {
    const updated = Array.from(new Set([...purchasedIds, sceneId]));
    setPurchasedIds(updated);
    localStorage.setItem("flydna_purchased_scenes", JSON.stringify(updated));

    try {
      const userData = localStorage.getItem("flydna_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.purchasedScenes = updated;
        localStorage.setItem("flydna_user", JSON.stringify(parsed));
      }
    } catch (err) {}

    try {
      const token = localStorage.getItem("flydna_token");
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      await fetch(`${apiBase}/api/user/purchase-scene`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: JSON.stringify({ sceneId }),
      });
    } catch (err) {
      console.warn("[Purchase] Failed to sync scene purchase to backend:", err);
    }
  };

  const verifyXrpPayment = async () => {
    if (!checkoutScene) return;
    setXrpVerifyError("");
    setXrpVerifying(true);
    try {
      const response = await fetch("/api/web3/verify-xrp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: xrpTxHash || "MOCK_SUCCESS",
          expectedAmount: "3.33",
          destinationWallet: "rYourFlyDnaXrpCorporateWalletAddress",
        }),
      });
      const data = await response.json();
      if (data.verified) {
        setPaymentStep("processing");
        setTimeout(async () => {
          setPaymentStep("success");
          await handlePurchaseSuccess(checkoutScene.id);

          // Log learn-as-you-go memory snippet
          fetch("/api/agent/learn", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(localStorage.getItem("flydna_token")
                ? {
                    Authorization: `Bearer ${localStorage.getItem("flydna_token")}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              text: `User: Premium. Action: Successfully unlocked premium tech scene backdrop "${checkoutScene.name}" using XRP ledger verification.`,
              category: "technical",
              tags: [
                "support",
                "scene",
                "backdrop",
                "unlocked",
                "xrp",
                "crypto",
                checkoutScene.name.toLowerCase(),
              ],
            }),
          }).catch(() => {});
        }, 2000);
      } else {
        setXrpVerifyError(data.message || "XRP payment verification failed.");
      }
    } catch (err: any) {
      setXrpVerifyError(err.message || "Network error verifying transaction.");
    } finally {
      setXrpVerifying(false);
    }
  };

  return (
    <>
      <div
        className={onlyModal ? "hidden" : "relative w-full mb-6"}
        style={{ perspective: "1500px" }}
      >
        <motion.div
          animate={{ rotateY: isVideoCallActive ? 180 : 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front face (3D Scenes Grid) */}
          <div
            className="w-full pointer-events-auto"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {/* You scene card with dynamic backdrop */}
              <div className="group glass-panel-heavy relative min-h-[200px] overflow-hidden rounded-2xl p-5 bg-[radial-gradient(circle_at_60%_50%,rgba(0,132,255,0.18),transparent_45%),linear-gradient(135deg,rgba(6,17,31,0.5),rgba(5,32,65,0.3))] border-[var(--glass-border)] dark:border-cyan-500/10">
                {/* Dynamic backdrop image/video */}
                {selectedScene &&
                  (/\.(mp4|mov|webm)$/i.test(selectedScene.src) ? (
                    <video
                      src={selectedScene.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className={`absolute inset-0 w-full h-full object-cover ${getSceneObjectPosition(selectedScene.src)} opacity-90 z-0 transition-opacity duration-500 select-none pointer-events-none`}
                    />
                  ) : (
                    <Image
                      src={selectedScene.src}
                      alt={selectedScene.name}
                      fill
                      className={`object-cover ${getSceneObjectPosition(selectedScene.src)} opacity-70 z-0 transition-opacity duration-500 select-none pointer-events-none`}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      draggable={false}
                    />
                  ))}

                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(56,189,248,0.2)_1px,transparent_1.5px)] [background-size:26px_26px] opacity-20 z-1" />

                {/* Single Glassmorphism Scene Message Popup for You (Sender) in place of YOU name badge */}
                {(() => {
                  if (!chatMessages.length) return null;
                  const userMsg = [...chatMessages]
                    .reverse()
                    .find((m) => m.from === "me");
                  if (!userMsg || !userMsg.text) return null;

                  let myName = "You";
                  let myAvatar = "/avatar_ryan.png";
                  try {
                    const userData = localStorage.getItem("flydna_user");
                    if (userData) {
                      const parsed = JSON.parse(userData);
                      if (parsed.name) myName = parsed.name;
                      if (parsed.profileImage || parsed.avatar)
                        myAvatar = parsed.profileImage || parsed.avatar;
                    }
                  } catch (e) {}

                  const timeStr = userMsg.time || "Just now";
                  const rawText = userMsg.text || "";
                  const isVoice = rawText.startsWith("__voicenote__");
                  const isMedia =
                    rawText.startsWith("__photo__") ||
                    /\.(jpeg|jpg|gif|png|webp)/i.test(rawText);

                  // Strip raw markdown formatting symbols for clean scene bubble display
                  const cleanBubbleText = rawText
                    .replace(/\*\*([^*]+)\*\*/g, "$1")
                    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1")
                    .replace(/\[([^\]]+)\]\(#[^\)]+\)/g, "$1")
                    .trim();

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 26,
                      }}
                      className="absolute left-4 top-4 max-w-[82%] sm:max-w-[65%] z-20 flex items-start gap-2.5 group/bubble"
                    >
                      {/* Left Glowing Avatar */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="p-[2px] rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                          <div className="relative size-9 rounded-full overflow-hidden border border-white/20 bg-slate-950">
                            <Image
                              src={myAvatar}
                              alt={myName}
                              fill
                              className="object-cover object-center"
                            />
                          </div>
                        </div>
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      </div>

                      {/* Glassmorphism Speech Container */}
                      <div className="relative flex-1 min-w-[150px] max-w-[280px] p-3 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-[#06111f]/95 via-[#09182d]/90 to-[#040a14]/95 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_18px_rgba(6,182,212,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
                        {/* Top sheen highlight */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent pointer-events-none" />

                        {/* Header: Name and Time */}
                        <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
                          <span className="font-extrabold tracking-wide text-[11px] text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] truncate">
                            {myName}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 flex-shrink-0">
                            {timeStr}
                          </span>
                        </div>

                        {/* Body Message */}
                        <div className="pt-1.5">
                          {isVoice ? (
                            <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold py-0.5">
                              <span className="text-sm">🎤</span>
                              <span>Voice note</span>
                              <div className="flex items-center gap-0.5 ml-auto">
                                <span className="w-0.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
                                <span className="w-0.5 h-4 bg-cyan-300 rounded-full animate-pulse [animation-delay:0.1s]" />
                                <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                                <span className="w-0.5 h-3 bg-cyan-300 rounded-full animate-pulse [animation-delay:0.15s]" />
                              </div>
                            </div>
                          ) : isMedia ? (
                            <div className="flex items-center gap-1.5 text-cyan-200 text-xs font-medium py-0.5">
                              <span>📷</span>
                              <span className="truncate">Photo attached</span>
                            </div>
                          ) : (
                            <p className="font-medium leading-snug text-[12px] text-slate-100 break-words line-clamp-3">
                              {cleanBubbleText}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Marketplace Button on Top Right (revealed on hover) */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => setIsMarketplaceOpen(true)}
                    title="Scene Marketplace"
                    className="size-9 rounded-full glass-panel-light glass-sheen border border-white/10 text-slate-300 hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                  >
                    <Store size={15} />
                  </button>
                </div>

                {/* Floating Heart/Emoji reaction effects */}
                {activeReaction === "Heart" && (
                  <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <motion.span
                        key={num}
                        initial={{
                          opacity: 0,
                          y: 150,
                          x: 20 + num * 20,
                          scale: 0.5,
                        }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          y: [150, 40, -60],
                          x: [20 + num * 25, 10 + num * 20, 30 + num * 30],
                          scale: [0.5, 1.2, 0.8],
                        }}
                        transition={{
                          duration: 1.5 + num * 0.2,
                          ease: "easeOut",
                        }}
                        className="absolute text-xl select-none"
                      >
                        ❤️
                      </motion.span>
                    ))}
                  </div>
                )}

                {activeReaction === "Like" && (
                  <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden flex items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.2, y: 30 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.2, 1.5, 1.0],
                        y: [30, -10, 0],
                      }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="text-4xl select-none"
                    >
                      👍
                    </motion.span>
                  </div>
                )}

                {/* Static Reaction Button */}
                {!showReactions && (
                  <div className="absolute bottom-3 right-3 z-20">
                    <button
                      onClick={() => setShowReactions(true)}
                      className="size-12 rounded-full glass-panel-light glass-sheen border border-white/10 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                    >
                      <CurrentIcon size={19} />
                    </button>
                  </div>
                )}

                {/* Reaction Overlay (Fills the scene card bounds) */}
                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 28,
                      }}
                      className="absolute inset-0 z-30 backdrop-blur-md border border-[var(--glass-border)] shadow-[0_8px_24px_rgba(0,0,0,0.2)] p-4 flex flex-col rounded-2xl"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--surface-color) 90%, transparent)",
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                        <div className="flex items-center gap-2 text-[var(--accent-primary)] dark:text-cyan-300">
                          <Smile size={16} />
                          <span className="font-bold text-sm">
                            Select Reaction
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowReactions(false)}
                          className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 text-slate-400 transition cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* 3-Column Grid */}
                      <div className="flex-1 grid grid-cols-3 gap-2 overflow-y-auto pt-2 pb-2 px-1 scrollbar-none">
                        {reactionIcons.map((item, idx) => {
                          const IconComp = item.icon;
                          const isSelected = idx === selectedReactionIndex;
                          return (
                            <motion.button
                              key={idx}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedReactionIndex(idx);
                                setShowReactions(false);
                                const cleanLabel = item.label.split("-")[0];
                                setActiveReaction(cleanLabel);
                                setTimeout(() => {
                                  setActiveReaction(null);
                                }, 4000);
                              }}
                              className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl transition cursor-pointer border ${
                                isSelected
                                  ? "text-[var(--accent-primary)] dark:text-cyan-300"
                                  : "bg-white/[0.02] border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] dark:border-white/5 dark:text-slate-300 dark:hover:text-white dark:hover:border-white/10 hover:bg-white/[0.04]"
                              }`}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor:
                                        "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                                      borderColor:
                                        "color-mix(in srgb, var(--accent-primary) 45%, transparent)",
                                    }
                                  : {}
                              }
                            >
                              <IconComp size={18} />
                              <span className="text-[9px] mt-1 opacity-85 font-bold tracking-wide">
                                {item.label.split("-")[0]}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Contact scene card */}
              <div className="group glass-panel-heavy relative min-h-[270px] overflow-hidden rounded-2xl p-5 bg-[radial-gradient(circle_at_60%_50%,rgba(168,85,247,0.18),transparent_45%),linear-gradient(135deg,rgba(15,8,35,0.5),rgba(56,18,90,0.3))] border-violet-500/10">
                {/* Dynamic backdrop image for contact */}
                {(() => {
                  if (selectedContact.id === "101") {
                    return (
                      <Image
                        src="/scenes/concierge.png"
                        alt="FlyDnA Concierge Background"
                        fill
                        className="object-cover object-center opacity-90 z-0 transition-opacity duration-500 select-none pointer-events-none"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        draggable={false}
                      />
                    );
                  }
                  if (selectedContact.id === "102") {
                    return (
                      <Image
                        src="/scenes/travel.png"
                        alt="FlyDnA Travel Background"
                        fill
                        className="object-cover object-center opacity-90 z-0 transition-opacity duration-500 select-none pointer-events-none"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        draggable={false}
                      />
                    );
                  }
                  if (selectedContact.id === "103") {
                    return (
                      <Image
                        src="/scenes/tech.png"
                        alt="FlyDnA Tech Support Background"
                        fill
                        className="object-cover object-center opacity-90 z-0 transition-opacity duration-500 select-none pointer-events-none"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        draggable={false}
                      />
                    );
                  }
                  const activeSceneId =
                    remotePartnerSceneId || selectedContact.activeSceneId || 3;
                  const contactScene =
                    [...SCENES, ...PREMIUM_SCENES].find(
                      (s) => s.id === activeSceneId,
                    ) || SCENES[2];
                  const isVideo = /\.(mp4|mov|webm)$/i.test(contactScene.src);
                  if (isVideo) {
                    return (
                      <video
                        src={contactScene.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onTimeUpdate={handleVideoTimeUpdate}
                        className={`absolute inset-0 w-full h-full object-cover ${getSceneObjectPosition(contactScene.src)} opacity-90 z-0 select-none pointer-events-none`}
                      />
                    );
                  }
                  return (
                    <Image
                      src={contactScene.src}
                      alt={contactScene.name}
                      fill
                      className="object-cover object-center opacity-70 z-0 transition-opacity duration-500 select-none pointer-events-none"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      draggable={false}
                    />
                  );
                })()}

                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.2)_1px,transparent_1.5px)] [background-size:26px_26px] opacity-20 z-1" />

                {/* Group privacy/secure controls on Top Right */}
                {selectedContact.isGroup && (
                  <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-black tracking-wider normal-case shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                      <Lock size={11} className="text-cyan-300 animate-pulse" />
                      <span>GROUP SECURE</span>
                    </span>

                    {/* Eye Privacy Mode Toggle Button — group chat only */}
                    <button
                      type="button"
                      onClick={() => setIsPrivacyHidden(!isPrivacyHidden)}
                      title={
                        isPrivacyHidden
                          ? "Privacy Mode Active (Identities Masked). Click to Reveal."
                          : "Enable Privacy Mode (Mask Member Identities)"
                      }
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black tracking-wider transition cursor-pointer active:scale-95 ${
                        isPrivacyHidden
                          ? "bg-purple-500/25 border-purple-400/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                          : "bg-slate-900/60 border-white/10 text-slate-300 hover:text-white"
                      }`}
                    >
                      {isPrivacyHidden ? (
                        <EyeOff
                          size={12}
                          className="text-purple-300 animate-pulse"
                        />
                      ) : (
                        <Eye size={12} />
                      )}
                      <span>{isPrivacyHidden ? "STEALTH" : "PRIVACY"}</span>
                    </button>
                  </div>
                )}

                {(() => {
                  if (
                    ["101", "102", "103"].includes(String(selectedContact.id))
                  )
                    return null;
                  const activeSceneId =
                    remotePartnerSceneId || selectedContact.activeSceneId || 3;
                  const isContactScenePremium = activeSceneId >= 100;
                  if (isContactScenePremium) return null;
                  return (
                    <div className="absolute bottom-0 right-[-10px] h-full w-[70%] max-w-[400px] z-10 transition-transform duration-500 hover:scale-105 pointer-events-none">
                      <Image
                        src="/avatar-2.png"
                        alt="Contact Avatar"
                        fill
                        className="object-contain object-right-bottom"
                        priority
                      />
                    </div>
                  );
                })()}

                {/* Single Glassmorphism Scene Message Popup for Concierge / Contact in place of name badge */}
                {(() => {
                  if (!chatMessages.length) return null;
                  // Display ONLY 1 single latest incoming message from Concierge / contact
                  const targetMsg = [...chatMessages]
                    .reverse()
                    .find((m) => m.from === "them");
                  if (!targetMsg) return null;

                  const senderName =
                    targetMsg.senderName ||
                    selectedContact.name ||
                    "FlyDnA Concierge";
                  const avatarUrl =
                    selectedContact.avatarUrl || "/flydna_concierge_avatar.png";
                  const isOnline =
                    selectedContact.status === "Online" ||
                    selectedContact.status === "Typing...";
                  const timeStr = targetMsg.time || "Just now";
                  const rawText = targetMsg.text || "";
                  const isVoice = rawText.startsWith("__voicenote__");
                  const isMedia =
                    rawText.startsWith("__photo__") ||
                    /\.(jpeg|jpg|gif|png|webp)/i.test(rawText);

                  // Strip raw markdown formatting symbols for clean scene bubble display
                  const cleanBubbleText = rawText
                    .replace(/\*\*([^*]+)\*\*/g, "$1")
                    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1")
                    .replace(/\[([^\]]+)\]\(#[^\)]+\)/g, "$1")
                    .trim();

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 26,
                      }}
                      className="absolute left-4 top-4 max-w-[82%] sm:max-w-[65%] z-20 flex items-start gap-2.5 group/bubble"
                    >
                      {/* Left Glowing Avatar */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="p-[2px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]">
                          <div className="relative size-9 rounded-full overflow-hidden border border-white/20 bg-slate-950">
                            <Image
                              src={avatarUrl}
                              alt={senderName}
                              fill
                              className="object-cover object-center"
                            />
                          </div>
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                        )}
                      </div>

                      {/* Glassmorphism Speech Container */}
                      <div className="relative flex-1 min-w-[150px] max-w-[280px] p-3 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-[#06111f]/95 via-[#09182d]/90 to-[#040a14]/95 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_18px_rgba(6,182,212,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
                        {/* Top sheen highlight */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent pointer-events-none" />

                        {/* Header: Name and Time */}
                        <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
                          <span className="font-extrabold tracking-wide text-[11px] text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] truncate">
                            {senderName}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 flex-shrink-0">
                            {timeStr}
                          </span>
                        </div>

                        {/* Body Message */}
                        <div className="pt-1.5">
                          {isVoice ? (
                            <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold py-0.5">
                              <span className="text-sm">🎤</span>
                              <span>Voice note</span>
                              <div className="flex items-center gap-0.5 ml-auto">
                                <span className="w-0.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
                                <span className="w-0.5 h-4 bg-cyan-300 rounded-full animate-pulse [animation-delay:0.1s]" />
                                <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                                <span className="w-0.5 h-3 bg-cyan-300 rounded-full animate-pulse [animation-delay:0.15s]" />
                              </div>
                            </div>
                          ) : isMedia ? (
                            <div className="flex items-center gap-1.5 text-cyan-200 text-xs font-medium py-0.5">
                              <span>📷</span>
                              <span className="truncate">Photo attached</span>
                            </div>
                          ) : (
                            <p className="font-medium leading-snug text-[12px] text-slate-100 break-words line-clamp-3">
                              {cleanBubbleText}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Back face (Video Call) */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#06111f]/90 pointer-events-auto"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {isVideoCallActive && (
              <VideoCallPopup
                inlineMode={true}
                isMeetingActive={isVideoCallActive}
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
          </div>
        </motion.div>
      </div>

      {/* Group Members Modal */}
      {isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isGroupMembersModalOpen && (
              <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsGroupMembersModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="glass-panel-light glass-sheen w-full max-w-[420px] rounded-[28px] border border-cyan-400/30 p-6 flex flex-col relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white z-10 bg-slate-950/95"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2.5 text-cyan-300">
                      <div className="size-9 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-400 grid place-items-center text-white shadow-md">
                        <Users size={18} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-extrabold text-base text-white">
                          {selectedContact.name}
                        </h3>
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          Group Members List
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsGroupMembersModalOpen(false)}
                      className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                    {(groupMembers.length > 0
                      ? groupMembers
                      : [
                          {
                            id: "mem-1",
                            name: "Douglas Miller",
                            status: "Online",
                            color: "from-cyan-500 to-blue-600",
                          },
                          {
                            id: "mem-2",
                            name: "Piff",
                            status: "Online",
                            color: "from-emerald-500 to-teal-600",
                          },
                          {
                            id: "mem-3",
                            name: "Rayane Sefiani",
                            status: "Offline",
                            color: "from-purple-500 to-indigo-600",
                          },
                          {
                            id: "mem-4",
                            name: "You",
                            status: "Online",
                            color: "from-amber-500 to-orange-600",
                          },
                        ]
                    ).map((member) => (
                      <div
                        key={member.id || member._id}
                        onClick={() => {
                          const targetId = String(
                            member.id || member._id || "",
                          );
                          const found = contacts.find(
                            (c) =>
                              c.id === targetId ||
                              (c as any).contactId === targetId ||
                              c.name.toLowerCase() ===
                                (member.name || "").toLowerCase(),
                          );
                          const targetContact: Contact = found || {
                            id: targetId || `mem-${Math.random()}`,
                            name: member.name || "Member",
                            status: member.status || "Online",
                            avatarUrl: member.profileImage || member.avatarUrl,
                            color: "from-cyan-500 to-blue-600",
                            accent: "bg-emerald-400",
                            lastMessage: "Start 1v1 conversation",
                            time: "Just now",
                            position: "Member",
                          };
                          setIsGroupMembersModalOpen(false);
                          onSelectContact?.(targetContact);
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/40 hover:bg-white/[0.07] transition text-left cursor-pointer active:scale-98 group/mem"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={member.name || "Member"}
                            gradient={
                              member.color || "from-purple-500 to-indigo-500"
                            }
                            size="sm"
                            avatarUrl={member.profileImage || member.avatarUrl}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover/mem:text-cyan-300 transition-colors">
                              {member.name || "Member"}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                              <span
                                className={`size-1.5 rounded-full ${member.status === "Offline" ? "bg-slate-500" : "bg-emerald-400 shadow-[0_0_6px_#34d399]"}`}
                              />
                              {member.status || "Online"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 opacity-0 group-hover/mem:opacity-100 transition-opacity">
                            Chat 1v1
                          </span>

                          {(() => {
                            const myIdN = String(
                              ChatManager.getCurrentUserId() || "",
                            ).replace("usr_", "");
                            const adminsN = (
                              ((window as any).__flydnaGroupAdmins ||
                                []) as string[]
                            ).map((a) => String(a).replace("usr_", ""));
                            const iAmCreator = adminsN.includes(myIdN);
                            const rowId = String(
                              member.id || (member as any)._id || "",
                            ).replace("usr_", "");
                            const rowIsMe =
                              rowId === myIdN || member.name === "You";
                            return !iAmCreator && rowIsMe;
                          })() && (
                            <button
                              type="button"
                              title="Leave this group"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm("Leave this group?")) return;
                                try {
                                  const token =
                                    localStorage.getItem("flydna_token");
                                  const apiBase =
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    "https://staging.flydna.io";
                                  const res = await fetch(
                                    `${apiBase}/api/groups/${selectedContact?.id}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        ...(token
                                          ? {
                                              Authorization: `Bearer ${token}`,
                                              "auth-token": token,
                                            }
                                          : {}),
                                      },
                                    },
                                  );
                                  if (res.ok) window.location.reload();
                                  else alert("Could not leave group.");
                                } catch (err) {
                                  alert("Could not leave group.");
                                }
                              }}
                              className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                            >
                              <span>Leave Group</span>
                            </button>
                          )}
                          {(() => {
                            const myIdN = String(
                              ChatManager.getCurrentUserId() || "",
                            ).replace("usr_", "");
                            const adminsN = (
                              ((window as any).__flydnaGroupAdmins ||
                                []) as string[]
                            ).map((a) => String(a).replace("usr_", ""));
                            const iAmCreator = adminsN.includes(myIdN);
                            const rowId = String(
                              member.id || (member as any)._id || "",
                            ).replace("usr_", "");
                            const rowIsMe =
                              rowId === myIdN || member.name === "You";
                            return iAmCreator && !rowIsMe;
                          })() && (
                            <button
                              type="button"
                              title={`Kick ${member.name} from group`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const mId = member.id || member._id;
                                const mName = member.name || "Member";
                                try {
                                  const token =
                                    localStorage.getItem("flydna_token");
                                  const apiBase =
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    "https://staging.flydna.io";
                                  const res = await fetch(
                                    `${apiBase}/api/groups/${selectedContact.id}/members/${mId}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        ...(token
                                          ? {
                                              Authorization: `Bearer ${token}`,
                                              "auth-token": token,
                                            }
                                          : {}),
                                      },
                                    },
                                  );
                                  if (!res.ok) {
                                    const body = await res
                                      .json()
                                      .catch(() => null);
                                    alert(
                                      body?.error ||
                                        "Only group admins can remove members.",
                                    );
                                    return;
                                  }
                                  setGroupMembers((prev) =>
                                    prev.filter((m) => (m.id || m._id) !== mId),
                                  );
                                  window.dispatchEvent(
                                    new CustomEvent("flydna-new-notification", {
                                      detail: {
                                        id: `kick-${Date.now()}`,
                                        type: "system",
                                        title: "Member Removed",
                                        message: `${mName} was kicked from ${selectedContact.name}`,
                                        timestamp:
                                          new Date().toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }),
                                        unread: true,
                                      },
                                    }),
                                  );
                                } catch (err) {
                                  alert("Could not remove member. Try again.");
                                }
                              }}
                              className="px-2.5 py-1 rounded-full bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                            >
                              <UserX size={11} />
                              <span>Kick</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Scene Marketplace Modal */}
      {isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isMarketplaceOpen && (
              <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6">
                {/* Clean Ambient Glass Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMarketplaceOpen(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                />

                {/* Modal Container: Max 2 nested containers, Apple Minimalist Aesthetics */}
                <motion.div
                  initial={{ scale: 0.96, y: 16, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.96, y: 16, opacity: 0 }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
                  className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[28px] bg-[#090e17]/95 border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-3xl overflow-hidden text-white"
                >
                  {/* Subtle top ambient glow */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

                  {/* Header Bar */}
                  <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.07] shrink-0">
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                      Immersive Identity
                    </h3>

                    <button
                      onClick={() => setIsMarketplaceOpen(false)}
                      className="size-9 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 active:scale-95 transition-all flex items-center justify-center text-slate-400 hover:text-white"
                      aria-label="Close dialog"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Main Split Grid (Max 2 nesting levels) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-7 md:p-8 overflow-y-auto custom-scrollbar">
                    {/* LEFT COLUMN: Traveler Profile & Render Mode (5 cols) */}
                    <div className="md:col-span-5 flex flex-col gap-5">
                      {/* Identity Selection with expanded, comfortable scroll height */}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">
                            Traveler Identity
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {CHARACTERS.length} profiles
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {CHARACTERS.map((char) => {
                            const isActive = activeChar.id === char.id;
                            return (
                              <button
                                key={char.id}
                                onClick={() => setActiveChar(char)}
                                className={`w-full text-left rounded-2xl flex items-center gap-3 transition-all duration-200 border overflow-hidden pr-3.5 ${
                                  isActive
                                    ? "bg-white/[0.08] border-white/20 text-white"
                                    : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 text-slate-300"
                                }`}
                              >
                                <div className="relative self-stretch aspect-square bg-slate-900 overflow-hidden shrink-0 border-r border-white/10">
                                  <Image
                                    src={char.image}
                                    alt={char.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold tracking-tight truncate">
                                      {char.name}
                                    </span>
                                    {isActive && (
                                      <Check
                                        size={12}
                                        className="text-cyan-400 shrink-0"
                                      />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {char.title}
                                  </p>
                                </div>
                                {char.premium && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-300 shrink-0">
                                    VIP
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Render Mode Segmented Control */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.07]">
                        <span className="text-xs font-medium text-slate-300">
                          Visual Rendition
                        </span>
                        <div className="grid grid-cols-3 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                          {(["Realism", "Cartoon", "Anime"] as const).map(
                            (style) => {
                              const isSelected = activeStyle === style;
                              return (
                                <button
                                  key={style}
                                  onClick={() => setActiveStyle(style)}
                                  className={`py-2 px-2 rounded-xl text-xs font-medium tracking-tight transition-all duration-200 text-center ${
                                    isSelected
                                      ? "bg-white/10 text-white shadow-sm border border-white/10"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  {style === "Realism" ? "Photoreal" : style}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Ambient Backdrop & Carousel (7 cols) */}
                    <div className="md:col-span-7 flex flex-col justify-between gap-5">
                      <div className="flex flex-col gap-4">
                        {/* Filter Segmented Bar */}
                        {selectedContact?.isGroup ? (
                          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-purple-400" />
                              <span className="text-xs font-medium">
                                Group Atmosphere Stage
                              </span>
                            </div>
                            <span className="text-[10px] text-purple-300/80 font-mono">
                              Multi-Traveler
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                            {[
                              { id: "free", label: "Landscapes" },
                              { id: "ride-out", label: "Transit" },
                              { id: "home", label: "Private Lounge" },
                              { id: "vacation", label: "Escapes" },
                            ].map((tab) => {
                              const isTabActive = activeTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => {
                                    setActiveTab(
                                      tab.id as
                                        | "free"
                                        | "ride-out"
                                        | "home"
                                        | "vacation",
                                    );
                                    setCarouselIndex(0);
                                  }}
                                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                                    isTabActive
                                      ? "bg-white text-slate-950 border-white font-semibold shadow-sm"
                                      : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Backdrop Preview Stage */}
                        <div className="relative w-full h-[340px] rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden flex items-center justify-center">
                          {/* Selected scene in carousel */}
                          {currentScenes[carouselIndex] && (
                            <>
                              {/\.(mp4|mov|webm)$/i.test(
                                currentScenes[carouselIndex].src,
                              ) ? (
                                <video
                                  key={currentScenes[carouselIndex].src}
                                  src={currentScenes[carouselIndex].src}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  preload="auto"
                                  className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-300"
                                />
                              ) : (
                                <Image
                                  src={currentScenes[carouselIndex].src}
                                  alt={currentScenes[carouselIndex].name}
                                  fill
                                  priority
                                  className="object-cover opacity-90 transition-opacity duration-300"
                                />
                              )}

                              {/* Top info badge */}
                              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                                <span className="px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/90">
                                  {currentScenes[carouselIndex].name}
                                </span>
                                {currentScenes[carouselIndex].premium && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-400/20 backdrop-blur-md border border-amber-400/30 text-[11px] font-medium text-amber-300">
                                    $5.00
                                  </span>
                                )}
                              </div>

                              {/* Gradient footer */}
                              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
                            </>
                          )}

                          {/* Navigation controls */}
                          <button
                            type="button"
                            onClick={() =>
                              setCarouselIndex((prev) =>
                                prev > 0 ? prev - 1 : currentScenes.length - 1,
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-slate-950/70 border border-white/10 text-white/80 hover:text-white hover:bg-slate-900 active:scale-95 transition flex items-center justify-center backdrop-blur-md z-20 cursor-pointer"
                            aria-label="Previous backdrop"
                          >
                            <ChevronLeft size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCarouselIndex((prev) =>
                                prev < currentScenes.length - 1 ? prev + 1 : 0,
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-slate-950/70 border border-white/10 text-white/80 hover:text-white hover:bg-slate-900 active:scale-95 transition flex items-center justify-center backdrop-blur-md z-20 cursor-pointer"
                            aria-label="Next backdrop"
                          >
                            <ChevronRight size={16} />
                          </button>

                          {/* Carousel dot indicators */}
                          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20">
                            {currentScenes.map((_, i) => {
                              const isActiveDot = i === carouselIndex;
                              return (
                                <button
                                  key={i}
                                  onClick={() => setCarouselIndex(i)}
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    isActiveDot
                                      ? "w-5 bg-white shadow-sm"
                                      : "w-1.5 bg-white/30 hover:bg-white/50"
                                  }`}
                                  aria-label={`Go to slide ${i + 1}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Primary Action Button */}
                      <div className="pt-1">
                        {currentScenes[carouselIndex]?.premium &&
                        !purchasedIds.includes(
                          currentScenes[carouselIndex].id,
                        ) ? (
                          <button
                            onClick={() => {
                              setCheckoutScene(currentScenes[carouselIndex]);
                              setPaymentStep("form");
                            }}
                            className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-950 text-xs font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          >
                            <Lock size={14} />
                            <span>Unlock Backdrop for $5.00</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleUseScene}
                            className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-950 text-xs font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Set as Active Ambience</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* NASC Gold Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowUpgradeModal(false)}
            />

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative glass-panel-heavy border border-amber-400/40 w-full max-w-md bg-[#06111f]/95 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center z-10"
            >
              <div className="p-4 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-full mb-4">
                <LockKeyhole size={32} className="animate-pulse" />
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-wide">
                NASC Gold Feature
              </h3>

              <p className="text-xs text-slate-300 font-semibold mt-2.5 max-w-xs">
                Skins, Cinematic Realism avatars, advanced face scanning, and
                premium 3D flight maps are exclusive to NASC Gold members.
              </p>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 w-full my-6 text-left">
                <h4 className="text-[10px] font-black uppercase text-amber-300 tracking-wider mb-2">
                  Unlocked with Gold:
                </h4>
                <ul className="space-y-1.5 text-[10px] font-bold text-slate-300">
                  <li>🚀 3D Tactical Radar Map view</li>
                  <li>📸 Realism style avatar customizer</li>
                  <li>🛰️ E2E Encrypted lobby chat status</li>
                  <li>🎟️ Unlimited Immersive video backdrops</li>
                </ul>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-xs font-bold text-slate-300 uppercase cursor-pointer hover:bg-white/5"
                >
                  Close
                </button>
                <Link
                  href="/travel/subscription"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setIsMarketplaceOpen(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase text-center block cursor-pointer"
                >
                  Upgrade ($100/mo)
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Checkout Modal */}
      {isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {checkoutScene && (
              <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (paymentStep !== "processing") setCheckoutScene(null);
                  }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                />

                {/* Modal Box */}
                <motion.div
                  initial={{ scale: 0.96, y: 16, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.96, y: 16, opacity: 0 }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                  className="relative w-full max-w-[480px] rounded-3xl bg-[#090e17]/95 border border-white/10 p-6 sm:p-7 flex flex-col overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] backdrop-blur-3xl text-white"
                >
                  {/* Subtle top ambient glow */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

                  {/* Darkened backdrop scene preview behind content */}
                  {checkoutScene.src && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                      {/\.(mp4|mov|webm)$/i.test(checkoutScene.src) ? (
                        <video
                          key={checkoutScene.src}
                          src={checkoutScene.src}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover opacity-15 filter brightness-50"
                        />
                      ) : (
                        <Image
                          src={checkoutScene.src}
                          alt={checkoutScene.name}
                          fill
                          className="object-cover opacity-15 filter brightness-50"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-[#090e17]/90 via-[#090e17]/95 to-[#090e17]" />
                    </div>
                  )}

                  {paymentStep === "form" && (
                    <div className="relative z-10 flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-white/[0.08] text-left">
                        <div>
                          <h4 className="text-base font-semibold tracking-tight text-white">
                            Secure Checkout
                          </h4>
                          <p className="text-xs text-slate-400 font-normal mt-0.5">
                            Purchase Premium Motion Backdrop
                          </p>
                        </div>
                        <button
                          onClick={() => setCheckoutScene(null)}
                          className="size-8 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 active:scale-95 transition-all flex items-center justify-center text-slate-400 hover:text-white"
                          aria-label="Close checkout"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Product Preview Card */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between text-left">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-xl overflow-hidden bg-slate-950 relative border border-white/10 shrink-0">
                            {/\.(mp4|mov|webm)$/i.test(checkoutScene.src) ? (
                              <video
                                src={checkoutScene.src}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Image
                                src={checkoutScene.src}
                                alt={checkoutScene.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white tracking-tight truncate">
                              {checkoutScene.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              Cinematic Ambience Stage
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-semibold text-white">
                            $5.00
                          </span>
                          <div className="text-[10px] text-slate-400 font-normal">
                            One-time
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Selector (Lucide Icons) */}
                      <div className="grid grid-cols-4 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.07] gap-1">
                        {[
                          { id: "fiat", label: "Card", icon: CreditCard },
                          { id: "vault", label: "Vault", icon: ShieldCheck },
                          { id: "ava", label: "AVA", icon: Coins },
                          { id: "xrp", label: "XRP", icon: Globe },
                        ].map((method) => {
                          const isSelected = paymentRail === method.id;
                          const IconComp = method.icon;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setPaymentRail(method.id as any)}
                              className={`py-2 px-1 rounded-xl text-xs font-medium tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              <IconComp size={13} className="shrink-0" />
                              <span>{method.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Payment Rail: FIAT (Credit Card) */}
                      {paymentRail === "fiat" ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            setPaymentStep("processing");
                            setTimeout(async () => {
                              setPaymentStep("success");
                              await handlePurchaseSuccess(checkoutScene.id);

                              // Log learn-as-you-go memory snippet
                              fetch("/api/agent/learn", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  ...(localStorage.getItem("flydna_token")
                                    ? {
                                        Authorization: `Bearer ${localStorage.getItem("flydna_token")}`,
                                      }
                                    : {}),
                                },
                                body: JSON.stringify({
                                  text: `User: Premium. Action: Successfully unlocked premium tech scene backdrop "${checkoutScene.name}" using local virtual card.`,
                                  category: "technical",
                                  tags: [
                                    "support",
                                    "scene",
                                    "backdrop",
                                    "unlocked",
                                    checkoutScene.name.toLowerCase(),
                                  ],
                                }),
                              }).catch(() => {});

                              // Save card details dynamically to Card Vault
                              try {
                                const storedCardsRaw = localStorage.getItem(
                                  "flydna_finance_cards",
                                );
                                let currentCards = [];
                                if (storedCardsRaw) {
                                  currentCards = JSON.parse(storedCardsRaw);
                                } else {
                                  currentCards = [
                                    {
                                      id: 1,
                                      type: "Platinum Virtual",
                                      number: "4532 9821 0244 8921",
                                      holder: "Alex Mercer",
                                      expiry: "09/29",
                                      cvv: "492",
                                      theme:
                                        "from-blue-600 via-indigo-600 to-cyan-500",
                                      limit: 15000,
                                      balance: 4230,
                                      glowColor: "rgba(0,174,255,0.4)",
                                    },
                                    {
                                      id: 2,
                                      type: "Cyberpunk Signature",
                                      number: "3782 1092 8824 1009",
                                      holder: "Alex Mercer",
                                      expiry: "12/30",
                                      cvv: "882",
                                      theme:
                                        "from-purple-600 via-pink-600 to-amber-500",
                                      limit: 50000,
                                      balance: 18450,
                                      glowColor: "rgba(168,85,247,0.4)",
                                    },
                                    {
                                      id: 3,
                                      type: "DxA Alpha Access",
                                      number: "5524 9901 2248 1198",
                                      holder: "Alex Mercer",
                                      expiry: "06/28",
                                      cvv: "331",
                                      theme:
                                        "from-[#081225] via-[#0d1c35] to-[#00E5FF]",
                                      limit: 100000,
                                      balance: 93420,
                                      glowColor: "rgba(34,211,238,0.4)",
                                    },
                                  ];
                                }
                                const cleanNumber = checkoutCard.replace(
                                  /-/g,
                                  " ",
                                );
                                const cardExists = currentCards.some(
                                  (c: any) =>
                                    c.number.replace(/\s/g, "") ===
                                    cleanNumber.replace(/\s/g, ""),
                                );
                                if (!cardExists) {
                                  const newSavedCard = {
                                    id: currentCards.length + 1,
                                    type: "Backdrop Pay Card",
                                    number: cleanNumber,
                                    holder: checkoutName || "Guest User",
                                    expiry: checkoutExpiry,
                                    cvv: checkoutCvc,
                                    theme:
                                      "from-emerald-600 via-teal-600 to-cyan-500",
                                    limit: 1000,
                                    balance: 5.0,
                                    glowColor: "rgba(16,185,129,0.4)",
                                  };
                                  localStorage.setItem(
                                    "flydna_finance_cards",
                                    JSON.stringify([
                                      ...currentCards,
                                      newSavedCard,
                                    ]),
                                  );
                                }
                              } catch {}
                            }, 1500);
                          }}
                          className="flex flex-col gap-3 text-left"
                        >
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              required
                              value={checkoutName}
                              onChange={(e) => setCheckoutName(e.target.value)}
                              placeholder="Full Name"
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-white/30 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Card Number
                            </label>
                            <input
                              type="text"
                              required
                              value={checkoutCard}
                              onChange={(e) => {
                                const v = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 16);
                                const matches = v.match(/\d{4,16}/g);
                                const match = (matches && matches[0]) || "";
                                const parts = [];
                                for (
                                  let i = 0, len = match.length;
                                  i < len;
                                  i += 4
                                ) {
                                  parts.push(match.substring(i, i + 4));
                                }
                                setCheckoutCard(
                                  parts.length > 0 ? parts.join("-") : v,
                                );
                              }}
                              placeholder="4111 2222 3333 4444"
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-white/30 transition font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                Expiry Date
                              </label>
                              <input
                                type="text"
                                required
                                value={checkoutExpiry}
                                onChange={(e) => {
                                  const v = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 4);
                                  if (v.length >= 2) {
                                    setCheckoutExpiry(
                                      `${v.substring(0, 2)}/${v.substring(2)}`,
                                    );
                                  } else {
                                    setCheckoutExpiry(v);
                                  }
                                }}
                                placeholder="MM/YY"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-white/30 transition font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                CVC / CVV
                              </label>
                              <input
                                type="password"
                                required
                                value={checkoutCvc}
                                onChange={(e) =>
                                  setCheckoutCvc(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 4),
                                  )
                                }
                                placeholder="•••"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-white/30 transition font-mono"
                              />
                            </div>
                          </div>

                          <div className="pt-1 text-center text-[10px] text-slate-400 font-normal flex items-center justify-center gap-1.5">
                            <ShieldCheck size={13} className="text-slate-400" />
                            <span>256-bit encrypted secure payment</span>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-950 text-xs font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
                          >
                            <span>Pay $5.00</span>
                          </button>
                        </form>
                      ) : paymentRail === "ava" ? (
                        /* Payment Rail: AVA */
                        <div className="flex flex-col gap-3.5 text-left">
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-medium text-amber-300">
                              <span>Travala Loyalty Perks (5% Off)</span>
                              <span>- $0.25</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-white">
                              <span>Total Due</span>
                              <span>1.98 AVA ($4.75)</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                Your EVM Wallet Address
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={avaWalletAddress}
                                  onChange={(e) =>
                                    setAvaWalletAddress(e.target.value)
                                  }
                                  placeholder="0x..."
                                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-white/30 transition font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setCheckingAva(true);
                                    const bal =
                                      await checkAvaBalance(avaWalletAddress);
                                    setAvaBalance(bal);
                                    setCheckingAva(false);
                                  }}
                                  className="px-3 py-2 bg-white/[0.06] border border-white/10 hover:bg-white/10 rounded-xl text-xs font-medium text-slate-200 transition"
                                >
                                  {checkingAva ? "Checking..." : "Verify"}
                                </button>
                              </div>
                              {linkedEvm ? (
                                <button
                                  type="button"
                                  onClick={() => setAvaWalletAddress(linkedEvm)}
                                  className="text-[10px] text-cyan-400 font-medium hover:underline flex items-center gap-1 mt-1.5"
                                >
                                  <Link2 size={11} />
                                  <span>
                                    Use profile wallet ({linkedEvm.slice(0, 6)}
                                    ...{linkedEvm.slice(-4)})
                                  </span>
                                </button>
                              ) : (
                                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                  <AlertCircle size={11} />
                                  <span>No linked EVM wallet on profile</span>
                                </div>
                              )}
                              {avaBalance !== "0" && (
                                <div className="text-xs text-amber-300 font-medium mt-1.5 flex justify-between">
                                  <span>Available Balance:</span>
                                  <span>
                                    {parseFloat(avaBalance).toFixed(2)} AVA
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="p-3 rounded-xl border border-white/5 bg-slate-950/40">
                              <label className="block text-[10px] text-slate-400 font-medium mb-1">
                                Recipient Smart Contract
                              </label>
                              <div className="text-[10px] font-mono text-slate-300 break-all select-all">
                                0x4F4aC55F22481198A8824100918f08e34f
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPaymentStep("processing");
                              setTimeout(async () => {
                                setPaymentStep("success");
                                await handlePurchaseSuccess(checkoutScene.id);
                              }, 1500);
                            }}
                            className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 text-xs font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
                          >
                            <Coins size={14} />
                            <span>Confirm & Pay 1.98 AVA</span>
                          </button>
                        </div>
                      ) : paymentRail === "xrp" ? (
                        /* Payment Rail: XRP */
                        <div className="flex flex-col gap-3.5 text-left">
                          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-medium text-blue-300">
                              <span>Market Conversion (1 XRP = $1.50)</span>
                              <span>3.33 XRP</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-white">
                              <span>Total Due</span>
                              <span>$5.00 USD</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-medium mb-1">
                                Destination XRPL Wallet
                              </label>
                              <div className="p-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-[10px] font-mono text-slate-300 break-all select-all">
                                rYourFlyDnaXrpCorporateWalletAddress
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                Transaction ID (TXID)
                              </label>
                              <input
                                type="text"
                                required
                                value={xrpTxHash}
                                onChange={(e) => setXrpTxHash(e.target.value)}
                                placeholder="Paste XRPL Ledger Hash"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-white/30 transition font-mono"
                              />
                              {linkedXrp && (
                                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                  <Link2 size={11} />
                                  <span>
                                    From linked: {linkedXrp.slice(0, 8)}...
                                  </span>
                                </div>
                              )}
                              {xrpVerifyError && (
                                <div className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  <span>{xrpVerifyError}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={verifyXrpPayment}
                            disabled={xrpVerifying}
                            className="w-full py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 active:scale-[0.99] text-white text-xs font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
                          >
                            <Globe size={14} />
                            <span>
                              {xrpVerifying
                                ? "Verifying Ledger..."
                                : "Verify & Pay 3.33 XRP"}
                            </span>
                          </button>
                        </div>
                      ) : (
                        /* Payment Rail: Vault */
                        <div className="flex flex-col gap-3.5 text-left">
                          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                              <span>Settlement Speed</span>
                              <span className="text-emerald-400">Instant</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-white">
                              <span>Amount Due</span>
                              <span>
                                {vaultTokenSelected === "xrp"
                                  ? "3.33 XRP ($5.00)"
                                  : "1.98 AVA ($4.75)"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setVaultTokenSelected("xrp")}
                              className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                                vaultTokenSelected === "xrp"
                                  ? "bg-white/[0.08] border-white/20 text-white"
                                  : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04]"
                              }`}
                            >
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                XRP Vault
                              </span>
                              <span className="text-xs font-semibold text-white mt-1">
                                {vaultBalances.xrp.toFixed(2)} XRP
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setVaultTokenSelected("ava")}
                              className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                                vaultTokenSelected === "ava"
                                  ? "bg-white/[0.08] border-white/20 text-white"
                                  : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04]"
                              }`}
                            >
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                AVA Vault
                              </span>
                              <span className="text-xs font-semibold text-white mt-1">
                                {vaultBalances.ava.toFixed(2)} AVA
                              </span>
                            </button>
                          </div>

                          {/* Sufficiency Check */}
                          {(() => {
                            const required =
                              vaultTokenSelected === "xrp" ? 3.33 : 1.98;
                            const balance =
                              vaultTokenSelected === "xrp"
                                ? vaultBalances.xrp
                                : vaultBalances.ava;
                            const isSufficient = balance >= required;

                            return (
                              <>
                                <div className="p-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-xs font-medium text-slate-300 flex justify-between">
                                  <span>
                                    Required: {required}{" "}
                                    {vaultTokenSelected.toUpperCase()}
                                  </span>
                                  <span
                                    className={
                                      isSufficient
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                    }
                                  >
                                    {isSufficient
                                      ? "Balance Available"
                                      : "Insufficient Balance"}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  disabled={!isSufficient}
                                  onClick={() => {
                                    setPaymentStep("processing");
                                    setTimeout(async () => {
                                      const updatedBalances = {
                                        xrp:
                                          vaultTokenSelected === "xrp"
                                            ? vaultBalances.xrp - 3.33
                                            : vaultBalances.xrp,
                                        ava:
                                          vaultTokenSelected === "ava"
                                            ? vaultBalances.ava - 1.98
                                            : vaultBalances.ava,
                                      };
                                      localStorage.setItem(
                                        "flydna_vault_balances",
                                        JSON.stringify(updatedBalances),
                                      );
                                      setVaultBalances(updatedBalances);

                                      window.dispatchEvent(
                                        new Event("flydna-vault-updated"),
                                      );

                                      setPaymentStep("success");
                                      await handlePurchaseSuccess(
                                        checkoutScene.id,
                                      );
                                    }, 1200);
                                  }}
                                  className={`w-full py-3 rounded-2xl text-xs font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-lg mt-1 ${
                                    isSufficient
                                      ? "bg-white hover:bg-slate-100 text-slate-950 cursor-pointer active:scale-[0.99]"
                                      : "bg-white/10 text-slate-500 cursor-not-allowed"
                                  }`}
                                >
                                  <ShieldCheck size={14} />
                                  <span>Authorize Vault Settlement</span>
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {paymentStep === "processing" && (
                    <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center">
                      <Loader2
                        size={32}
                        className="animate-spin text-white mb-4"
                      />
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        Authorizing Transaction
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Settling payment across secure clearing gateway...
                      </p>
                    </div>
                  )}

                  {paymentStep === "success" && (
                    <div className="relative z-10 flex flex-col items-center justify-center py-8 text-center">
                      <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                        <CheckCircle2 size={28} />
                      </div>
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Payment Confirmed
                      </h4>
                      <p className="text-xs text-slate-300 mt-1.5 max-w-xs leading-relaxed">
                        <strong className="text-white">
                          {checkoutScene.name}
                        </strong>{" "}
                        has been unlocked and added to your active atmosphere
                        stages.
                      </p>
                      <button
                        onClick={() => {
                          setCheckoutScene(null);
                          setPaymentStep("form");
                          setCheckoutName("");
                          setCheckoutCard("");
                          setCheckoutExpiry("");
                          setCheckoutCvc("");
                        }}
                        className="mt-6 px-6 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold tracking-tight transition cursor-pointer active:scale-[0.99]"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function ChatBubble({
  message,
  selectedContact,
}: {
  message: Message;
  selectedContact?: Contact;
}) {
  const mine = message.from === "me";

  // Reactively track theme so bubbles re-render when user toggles light/dark
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.getAttribute("data-theme") !== "light";
  });
  useEffect(() => {
    const update = () =>
      setIsDark(
        document.documentElement.getAttribute("data-theme") !== "light",
      );
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const renderMessageText = (text: string) => {
    if (!text) return null;

    if (text.startsWith("__voicenote__") && text.length > 15) {
      const url = text.replace("__voicenote__", "");
      return <VoiceNotePlayer url={url} />;
    }

    // Split into lines to handle headers and bullet points
    const lines = text.split("\n");

    // Helper to parse inline styles (links, bold, italic, code)
    const parseInline = (str: string) => {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          parts.push(str.substring(lastIndex, match.index));
        }
        parts.push({
          type: "link",
          label: match[1],
          url: match[2],
          key: match.index,
        });
        lastIndex = linkRegex.lastIndex;
      }
      if (lastIndex < str.length) {
        parts.push(str.substring(lastIndex));
      }

      const formatTextPart = (part: any, index: number) => {
        if (typeof part !== "string") {
          if (part.url?.startsWith("#map:")) {
            const [_, coordsStr, rawName] = part.url.split(":");
            const [latStr, lngStr] = (coordsStr || "").split(",");
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            const name = (rawName || part.label || "Location").replace(
              /\+/g,
              " ",
            );
            return (
              <div
                key={part.key}
                className="my-4 p-5 rounded-[26px] bg-[#090b1e]/75 backdrop-blur-3xl border border-purple-500/30 shadow-[0_12px_40px_rgba(168,85,247,0.35),_0_0_20px_rgba(168,85,247,0.2),_inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col gap-3.5 max-w-sm text-center"
              >
                <div className="flex flex-col items-center gap-1 border-b border-white/10 pb-2.5">
                  <span className="text-xs font-semibold text-slate-300 tracking-tight">
                    Location Coordinates
                  </span>
                  <span className="text-base font-bold text-white tracking-tight">
                    {name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300/80 mt-0.5">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                </div>
                <div className="relative h-24 w-full rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:14px_14px] opacity-30" />
                  <div className="absolute size-9 rounded-full border border-purple-400/50 animate-ping" />
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="size-4 rounded-full bg-cyan-400 shadow-[0_0_14px_#38bdf8] border-2 border-slate-950" />
                    <span className="text-[11px] font-semibold text-white bg-slate-950/90 px-3 py-0.5 rounded-full border border-purple-400/30 shadow-lg">
                      {name}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isNaN(lat) && !isNaN(lng)) {
                        window.dispatchEvent(
                          new CustomEvent("flydna-plot-map-location", {
                            detail: { lat, lng, name },
                          }),
                        );
                      }
                    }}
                    className="py-2.5 px-4 rounded-full bg-gradient-to-r from-cyan-500/30 via-purple-600/35 to-indigo-600/30 hover:from-cyan-400/40 hover:to-purple-500/45 border border-purple-400/40 text-cyan-200 text-xs font-medium backdrop-blur-md shadow-[0_4px_16px_rgba(168,85,247,0.3)] transition-all active:scale-95 cursor-pointer"
                  >
                    Plot on Map
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isNaN(lat) && !isNaN(lng)) {
                        window.dispatchEvent(
                          new CustomEvent("flydna-plot-map-location", {
                            detail: { lat, lng, name },
                          }),
                        );
                      }
                    }}
                    className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/12 text-white text-xs font-medium backdrop-blur-md shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Focus Radar
                  </button>
                </div>
                {[
                  "arena",
                  "stadium",
                  "center",
                  "theatre",
                  "theater",
                  "park",
                  "ballpark",
                  "dome",
                  "coliseum",
                ].some((k) => (name || "").toLowerCase().includes(k)) && (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("flydna-open-seating-chart", {
                          detail: {
                            event: {
                              name: name,
                              venue: name,
                              category: "Live Event",
                            },
                          },
                        }),
                      );
                    }}
                    className="w-full mt-1.5 py-2 px-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(245,158,11,0.35)] transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🎟️ View Seating Chart & Seats</span>
                  </button>
                )}
              </div>
            );
          }

          if (part.url?.startsWith("#payment:")) {
            const parts = part.url.split(":");
            const amount = parts[1] || "50";
            const item = (
              parts[2] ||
              part.label ||
              "Reservation / Service"
            ).replace(/\+/g, " ");

            return (
              <div
                key={part.key}
                className="my-4 p-5 rounded-[26px] bg-[#090b1e]/75 backdrop-blur-3xl border border-purple-500/30 shadow-[0_12px_40px_rgba(168,85,247,0.35),_0_0_20px_rgba(168,85,247,0.2),_inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col gap-3.5 max-w-sm text-center"
              >
                <div className="flex flex-col items-center gap-1 border-b border-white/10 pb-2.5">
                  <span className="text-xs font-semibold text-amber-300 tracking-tight">
                    Agent Settlement Authorization
                  </span>
                  <span className="text-base font-bold text-white tracking-tight">
                    {item}
                  </span>
                  <span className="text-xl font-bold text-amber-400 mt-1">
                    ${amount}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      btn.disabled = true;
                      btn.innerText = "Settling...";
                      setTimeout(() => {
                        btn.innerText = "Authorized";
                        btn.className =
                          "py-2.5 px-4 rounded-full bg-emerald-500 text-slate-950 text-xs font-semibold shadow-lg";
                        const numericAmount = parseFloat(amount) || 50;

                        recordTransaction({
                          type: "Rule #10 Agent Settlement",
                          note: `Authorized $${amount} for ${item}`,
                          amount: numericAmount,
                          currency: "USD",
                          method: "debit",
                          status: "Confirmed",
                        });

                        recordPurchase({
                          title: item,
                          category: item.toLowerCase().includes("flight")
                            ? "Flights"
                            : item.toLowerCase().includes("hotel")
                              ? "Stays"
                              : "Bookings",
                          amount: numericAmount,
                          merchant: "FlyDnA Concierge Settlement",
                          status: "Confirmed",
                        });

                        window.dispatchEvent(
                          new CustomEvent("flydna-new-notification", {
                            detail: {
                              message: `Rule #10 Authorized: $${amount} for ${item}`,
                            },
                          }),
                        );
                      }, 1200);
                    }}
                    className="py-2.5 px-4 rounded-full bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-xs font-medium backdrop-blur-md shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Authorize ${amount}
                  </button>
                  <button
                    type="button"
                    className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/12 text-slate-300 text-xs font-medium backdrop-blur-md shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          if (part.url?.startsWith("#flight:")) {
            const parts = part.url.split(":");
            const airline = (parts[1] || "Delta Air Lines")
              .replace(/\+/g, " ")
              .toUpperCase();
            const price = parts[2] || "480";
            const route = (parts[3] || "ATL ✈️ LAS")
              .replace(/-/g, " ")
              .replace(/\+/g, " ");

            return (
              <div
                key={part.key}
                className="my-4 p-5 rounded-[26px] bg-[#090b1e]/75 backdrop-blur-3xl border border-purple-500/30 shadow-[0_12px_40px_rgba(168,85,247,0.35),_0_0_20px_rgba(168,85,247,0.2),_inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col gap-3.5 max-w-sm text-center"
              >
                <div className="flex flex-col items-center gap-1 border-b border-white/10 pb-2.5">
                  <span className="text-xs font-semibold text-cyan-300 tracking-tight">
                    {airline}
                  </span>
                  <span className="text-base font-bold text-white tracking-tight">
                    {route} • First Class
                  </span>
                  <span className="text-xl font-bold text-emerald-400 mt-1">
                    ${price}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="/travel/pick-a-seat"
                    className="py-2.5 px-4 rounded-full bg-gradient-to-r from-cyan-500/30 via-purple-600/35 to-indigo-600/30 hover:from-cyan-400/40 hover:to-purple-500/45 border border-purple-400/40 text-cyan-200 text-xs font-medium backdrop-blur-md shadow-[0_4px_16px_rgba(168,85,247,0.3)] transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Select Seat
                  </a>
                  <a
                    href="/travel/flight-details"
                    className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/12 text-white text-xs font-medium backdrop-blur-md shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    View Details
                  </a>
                </div>
              </div>
            );
          }

          const otaDomains = [
            "kayak.com",
            "expedia.com",
            "skyscanner.com",
            "travala.com",
            "booking.com",
          ];
          const isOTA = otaDomains.some((d: string) => part.url?.includes(d));
          if (isOTA) {
            return (
              <a
                key={part.key}
                href={part.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-2.5 my-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition cursor-pointer group w-full"
              >
                <span className="text-sm text-slate-200 font-medium">
                  {part.label}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-slate-500 group-hover:text-slate-300 transition ml-3 flex-shrink-0"
                >
                  <path
                    d="M2 12L12 2M12 2H5M12 2V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            );
          }
          return (
            <a
              key={part.key}
              href={part.url}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#061426]/90 border border-cyan-400/35 hover:border-cyan-300 hover:bg-cyan-500/10 active:scale-95 transition-all text-xs font-black uppercase tracking-wider text-cyan-300 shadow-[0_4px_16px_rgba(0,191,255,0.15)] my-2 cursor-pointer"
            >
              <span>🎟️</span>
              <span>{part.label}</span>
            </a>
          );
        }

        const formatRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
        const subParts = [];
        let lastSubIdx = 0;
        let subMatch;

        while ((subMatch = formatRegex.exec(part)) !== null) {
          if (subMatch.index > lastSubIdx) {
            subParts.push(
              <span key={`txt-${lastSubIdx}`} className="whitespace-pre-line">
                {part.substring(lastSubIdx, subMatch.index)}
              </span>,
            );
          }

          const matchStr = subMatch[0];
          if (matchStr.startsWith("`") && matchStr.endsWith("`")) {
            subParts.push(
              <code
                key={`code-${subMatch.index}`}
                className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-200 font-mono text-xs"
              >
                {matchStr.slice(1, -1)}
              </code>,
            );
          } else if (matchStr.startsWith("**") && matchStr.endsWith("**")) {
            subParts.push(
              <strong
                key={`bold-${subMatch.index}`}
                className="font-extrabold text-white"
              >
                {matchStr.slice(2, -2)}
              </strong>,
            );
          } else if (matchStr.startsWith("*") && matchStr.endsWith("*")) {
            subParts.push(
              <em key={`em-${subMatch.index}`} className="italic">
                {matchStr.slice(1, -1)}
              </em>,
            );
          }

          lastSubIdx = formatRegex.lastIndex;
        }

        if (lastSubIdx < part.length) {
          subParts.push(
            <span key={`txt-${lastSubIdx}`} className="whitespace-pre-line">
              {part.substring(lastSubIdx)}
            </span>,
          );
        }

        return subParts.length > 0 ? (
          <span key={`sub-${index}`}>{subParts}</span>
        ) : (
          <span key={`sub-${index}`} className="whitespace-pre-line">
            {part}
          </span>
        );
      };

      return parts.length > 0
        ? parts.map((p, idx) => formatTextPart(p, idx))
        : formatTextPart(str, 0);
    };

    const renderLine = (line: string, lineIdx: number) => {
      const headingColor = isDark
        ? "text-white"
        : mine
          ? "text-white"
          : "text-slate-900";
      const listColor = isDark
        ? "text-slate-200"
        : mine
          ? "text-white"
          : "text-slate-700";
      // Header check
      if (line.startsWith("### ")) {
        return (
          <h3
            key={lineIdx}
            className={`text-sm font-extrabold mt-2 mb-1 ${headingColor}`}
          >
            {parseInline(line.substring(4))}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2
            key={lineIdx}
            className={`text-base font-black mt-3 mb-1.5 ${headingColor}`}
          >
            {parseInline(line.substring(3))}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1
            key={lineIdx}
            className={`text-lg font-black mt-4 mb-2 ${headingColor}`}
          >
            {parseInline(line.substring(2))}
          </h1>
        );
      }
      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={lineIdx} className={`ml-4 list-disc text-xs ${listColor}`}>
            {parseInline(line.substring(2))}
          </li>
        );
      }
      // Numbered lists
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li
            key={lineIdx}
            className={`ml-4 list-decimal text-xs ${listColor}`}
          >
            {parseInline(numMatch[2])}
          </li>
        );
      }

      // Regular line
      return (
        <p key={lineIdx} className="min-h-[1em] whitespace-pre-line">
          {parseInline(line)}
        </p>
      );
    };

    return (
      <div className="space-y-1">
        {lines.map((line, idx) => renderLine(line, idx))}
      </div>
    );
  };

  const senderName =
    message.senderName || selectedContact?.name || "FlyDnA Concierge";
  const avatarUrl =
    selectedContact?.avatarUrl || "/flydna_concierge_avatar.png";
  const isOnline = selectedContact
    ? selectedContact.status === "Online" ||
      selectedContact.status === "Typing..."
    : true;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      className={`flex items-end gap-2.5 my-3 ${mine ? "justify-end" : "justify-start"}`}
    >
      {!mine && (
        <div className="relative size-8 shrink-0 mb-0.5">
          <div className="relative size-full rounded-full overflow-hidden border border-[var(--glass-border)] bg-[var(--surface-color)] shadow-sm">
            <Image
              src={avatarUrl}
              alt={senderName}
              fill
              className="object-cover object-center"
            />
          </div>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 border border-[var(--surface-color)] shadow-[0_0_6px_#34d399]" />
          )}
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl pt-2.5 pb-1.5 text-sm shadow-lg md:max-w-[55%] relative overflow-hidden flex flex-col ${
          mine
            ? isDark
              ? "px-4 rounded-br-md border border-blue-500/60 bg-blue-600/90 backdrop-blur-md shadow-[0_4px_18px_rgba(0,105,255,0.3)]"
              : "px-4 rounded-br-md border border-blue-600 bg-blue-600 shadow-[0_4px_18px_rgba(59,130,246,0.4)]"
            : isDark
              ? "px-4 rounded-bl-md border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              : "px-4 rounded-bl-md border border-[var(--glass-border)] bg-[var(--surface-color)] shadow-sm"
        }`}
      >
        <div
          className={`break-words max-w-full font-medium tracking-wide flex flex-col items-start gap-1 ${
            mine
              ? "text-white"
              : isDark
                ? "text-white"
                : "text-[var(--text-main)]"
          }`}
        >
          {renderMessageText(message.text)}
        </div>

        {/* Timestamp on bottom-right */}
        <span
          className={`ml-auto inline-flex items-center gap-1 text-[9.5px] font-medium select-none mt-1 whitespace-nowrap ${
            mine
              ? isDark
                ? "text-slate-300/80"
                : "text-blue-100/90"
              : "text-slate-400 dark:text-slate-500 opacity-75"
          }`}
        >
          {message.time || "Just now"}
          {mine && (
            <CheckCheck
              size={13}
              className={
                isDark
                  ? "text-cyan-300 drop-shadow-[0_0_4px_rgba(0,229,255,0.5)]"
                  : "text-blue-200"
              }
            />
          )}
        </span>

        {/* Interactive Action Bar for Travel Agent Booking Confirmations */}
        {!mine &&
          message.text &&
          (message.text.includes("Confirmed") ||
            message.text.includes("Chauffeur") ||
            message.text.includes("Ref #")) && (
            <div className="mt-3 pt-2.5 border-t border-white/10 w-full flex flex-col gap-2 text-left">
              {(() => {
                const match = message.text.match(
                  /#?(FDNA-CAR-\d+|FLY-CAR-\d+|FDNA-[A-Z0-9]+)/i,
                );
                const refCode = match ? match[1] : "FDNA-CAR";
                const cancelTime = getRemainingCancelTime(
                  undefined,
                  message.time,
                );
                const totalMs = 2 * 60 * 60 * 1000;
                const pct = Math.max(
                  3,
                  Math.min(
                    100,
                    Math.round((cancelTime.msRemaining / totalMs) * 100),
                  ),
                );

                return (
                  <div className="flex flex-col gap-2">
                    {!cancelTime.isExpired ? (
                      <>
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between text-[9px] font-mono font-extrabold tracking-wider text-cyan-300 uppercase">
                            <span className="flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                              Time left to cancel...
                            </span>
                            <span className="text-cyan-200 font-black">
                              {cancelTime.text}
                            </span>
                          </div>
                          <div className="relative w-full h-2.5 rounded-full bg-slate-950/80 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)] p-[1px] flex items-center overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-300 transition-all duration-1000 relative shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                              style={{ width: `${pct}%` }}
                            >
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-cyan-100 border border-cyan-300 shadow-[0_0_6px_#fff]" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <button
                            onClick={(e) => {
                              const btn = e.currentTarget;
                              if (cancelBookingByRef(refCode)) {
                                btn.innerText = "✓ Cancelled & Refunded";
                                btn.className =
                                  "px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase";
                                btn.disabled = true;
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
                          >
                            ❌ Cancel Reservation
                          </button>
                          <Link
                            href="/finance"
                            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                          >
                            🧾 View Receipt
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[9px] font-mono font-semibold">
                          🔒 Lock Window Expired
                        </span>
                        <Link
                          href="/finance"
                          className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Receipt &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
      </div>
    </motion.div>
  );
}
