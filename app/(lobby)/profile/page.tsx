/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Eye,
  Globe,
  DollarSign,
  Plane,
  User,
  MapPin,
  Settings,
  X,
  Video,
  Wallet,
  Link2,
  Camera,
  Hotel,
  PlaneTakeoff,
} from "lucide-react";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useHeaderNav } from "@/hooks/useHeaderNav";

// Profile components
import UserIdentityCard from "@/components/profile/UserIdentityCard";
import FlightTrackerCard from "@/components/profile/FlightTrackerCard";
import ChatPanel from "@/components/lobby/ChatPanel";
import BroadcastNetworkCard from "@/components/profile/BroadcastNetworkCard";
import VideoCallPopup from "@/components/profile/VideoCallPopup";
import ContactsCard from "@/components/profile/ContactsCard";
import { useSearchStore } from "@/utils/states/useSearchStore";

import { ChatManager } from "@/backend/chatManager";
import { Message } from "@/types/chat";

export default function ProfilePage() {
  const { isDarkMode, toggleDarkMode, activeTab, handleActiveTabChange } =
    useHeaderNav("Profile");

  const { selectedOffer, selectedSeat, hotelLocation } = useSearchStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"evm" | "xrp">("evm");
  const [scannerStatus, setScannerStatus] = useState<
    "searching" | "detected" | "success"
  >("searching");
  const [scannedAddress, setScannedAddress] = useState("");

  const [linkedEvm, setLinkedEvm] = useState<string | null>(null);
  const [linkedXrp, setLinkedXrp] = useState<string | null>(null);

  const [isEditingEvm, setIsEditingEvm] = useState(false);
  const [isEditingXrp, setIsEditingXrp] = useState(false);

  const [inputEvm, setInputEvm] = useState(
    "0x71C2298120448921B55E40292819E08e34f8921E",
  );
  const [inputXrp, setInputXrp] = useState(
    "rXrpMOCKaddress77218921024489218921",
  );

  useEffect(() => {
    const loadLinkedWallets = () => {
      setLinkedEvm(localStorage.getItem("flydna_linked_evm_wallet"));
      setLinkedXrp(localStorage.getItem("flydna_linked_xrp_wallet"));
    };
    loadLinkedWallets();
    window.addEventListener("flydna-wallets-linked", loadLinkedWallets);
    return () => {
      window.removeEventListener("flydna-wallets-linked", loadLinkedWallets);
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scannerOpen) {
      setScannerStatus("searching");

      // Start webcam stream
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }

          // Automatically succeed after 3 seconds of active scanning
          const timer = setTimeout(() => {
            setScannerStatus("detected");
            setTimeout(() => {
              setScannerStatus("success");

              const resolvedAddress =
                scannerTarget === "evm"
                  ? "0x71C2298120448921B55E40292819E08e34f8921E"
                  : "rXrpMOCKaddress77218921024489218921";

              if (scannerTarget === "evm") {
                setInputEvm(resolvedAddress);
                localStorage.setItem(
                  "flydna_linked_evm_wallet",
                  resolvedAddress,
                );
                setLinkedEvm(resolvedAddress);
              } else {
                setInputXrp(resolvedAddress);
                localStorage.setItem(
                  "flydna_linked_xrp_wallet",
                  resolvedAddress,
                );
                setLinkedXrp(resolvedAddress);
              }

              window.dispatchEvent(new Event("flydna-wallets-linked"));

              setTimeout(() => {
                // Stop camera tracks
                if (streamRef.current) {
                  streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
                  streamRef.current = null;
                }
                setScannerOpen(false);
                setScannerStatus("searching");
              }, 1000);
            }, 1000);
          }, 3000);

          return () => clearTimeout(timer);
        })
        .catch((err) => {
          console.warn(
            "Camera permission denied, using simulated delay loop:",
            err,
          );
          // Fallback if camera is blocked or missing
          const timer = setTimeout(() => {
            setScannerStatus("detected");
            setTimeout(() => {
              setScannerStatus("success");

              const resolvedAddress =
                scannerTarget === "evm"
                  ? "0x71C2298120448921B55E40292819E08e34f8921E"
                  : "rXrpMOCKaddress77218921024489218921";

              if (scannerTarget === "evm") {
                setInputEvm(resolvedAddress);
                localStorage.setItem(
                  "flydna_linked_evm_wallet",
                  resolvedAddress,
                );
                setLinkedEvm(resolvedAddress);
              } else {
                setInputXrp(resolvedAddress);
                localStorage.setItem(
                  "flydna_linked_xrp_wallet",
                  resolvedAddress,
                );
                setLinkedXrp(resolvedAddress);
              }

              window.dispatchEvent(new Event("flydna-wallets-linked"));

              setTimeout(() => {
                setScannerOpen(false);
                setScannerStatus("searching");
              }, 1000);
            }, 1000);
          }, 4000);

          return () => clearTimeout(timer);
        });
    } else {
      // Manual cancellation: close camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [scannerOpen, scannerTarget]);

  const handleSaveEvm = () => {
    if (!inputEvm.trim()) return;
    localStorage.setItem("flydna_linked_evm_wallet", inputEvm);
    setLinkedEvm(inputEvm);
    setIsEditingEvm(false);
    window.dispatchEvent(new Event("flydna-wallets-linked"));
  };

  const handleDisconnectEvm = () => {
    localStorage.removeItem("flydna_linked_evm_wallet");
    setLinkedEvm(null);
    window.dispatchEvent(new Event("flydna-wallets-linked"));
  };

  const handleSaveXrp = () => {
    if (!inputXrp.trim()) return;
    localStorage.setItem("flydna_linked_xrp_wallet", inputXrp);
    setLinkedXrp(inputXrp);
    setIsEditingXrp(false);
    window.dispatchEvent(new Event("flydna-wallets-linked"));
  };

  const handleDisconnectXrp = () => {
    localStorage.removeItem("flydna_linked_xrp_wallet");
    setLinkedXrp(null);
    window.dispatchEvent(new Event("flydna-wallets-linked"));
  };

  const [userProfile, setUserProfile] = useState({
    name: "",
    handle: "",
    email: "",
    phone: "",
    password: "[PASSWORD]",
    birthday: "",
    address: "",
    city: "",
    state: "",
    country: "",
    flydnaId: "FDNA-2048",
    rating: 4.9,
    verifiedTraveler: false,
    avatarUrl: "",
    trips: 12,
    calls: 48,
  });

  // Preference Toggle States
  const [prefToggles, setPrefToggles] = useState({
    notifications: true,
    privacyMode: true,
    twoFactor: true,
    gpsTracking: true,
  });

  // Selector preference states
  const [preferences, setPreferences] = useState({
    language: "English",
    currency: "USD ($)",
    travelClass: "First Class",
    meetingAvailability: "Contacts Only",
  });

  // Draft states for Profile & Preferences Modal (Task 1)
  const [draftProfile, setDraftProfile] = useState({ ...userProfile });
  const [draftToggles, setDraftToggles] = useState({ ...prefToggles });
  const [draftPreferences, setDraftPreferences] = useState({ ...preferences });

  useEffect(() => {
    if (isSettingsOpen) {
      setDraftProfile({ ...userProfile });
      setDraftToggles({ ...prefToggles });
      setDraftPreferences({ ...preferences });
    }
  }, [isSettingsOpen, prefToggles, preferences, userProfile]);

  useEffect(() => {
    try {
      // Load custom profile and toggles if saved previously
      const storedProfile = localStorage.getItem("flydna_profile");
      const storedToggles = localStorage.getItem("flydna_pref_toggles");
      const storedPreferences = localStorage.getItem("flydna_preferences");

      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
      if (storedToggles) {
        setPrefToggles(JSON.parse(storedToggles));
      }
      if (storedPreferences) {
        setPreferences(JSON.parse(storedPreferences));
      }

      const onboardingData = localStorage.getItem("flydna_onboarding");
      const userData = localStorage.getItem("flydna_user");

      let parsedOnboarding: any = null;
      let parsedUser: any = null;

      if (onboardingData) {
        parsedOnboarding = JSON.parse(onboardingData);
      }
      if (userData) {
        parsedUser = JSON.parse(userData);
      }

      setUserProfile((prev) => {
        const onboardingProfile = parsedOnboarding?.personalProfile || {};
        return {
          ...prev,
          name: parsedUser?.name || onboardingProfile.name || prev.name,
          handle:
            parsedUser?.username || onboardingProfile.username || prev.handle,
          email: parsedUser?.email || onboardingProfile.email || prev.email,
          phone: parsedUser?.phone || onboardingProfile.phone || prev.phone,
          birthday: parsedUser?.dob || onboardingProfile.dob || prev.birthday,
          country:
            parsedUser?.country ||
            onboardingProfile.nationality ||
            prev.country,
          flydnaId: parsedUser?.flydnaId || prev.flydnaId,
          rating: parsedUser?.rating ?? prev.rating,
          verifiedTraveler:
            parsedUser?.verifiedTraveler ?? prev.verifiedTraveler,
          avatarUrl: parsedUser?.profileImage || prev.avatarUrl || "",
        };
      });

      if (parsedOnboarding?.travelPreferences?.preferredClass) {
        setPreferences((prev) => ({
          ...prev,
          travelClass: parsedOnboarding.travelPreferences.preferredClass,
        }));
      }
    } catch (err) {
      console.error("Error loading stored data in profile page:", err);
    }
  }, []);

  // Meetings component states
  const [selectedMeetingContact, setSelectedMeetingContact] = useState("101");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  useEffect(() => {
    const sync = () => {
      setChatMessages([...ChatManager.getMessages(selectedMeetingContact)]);
    };
    sync();
    const unsubscribe = ChatManager.subscribe(sync);
    return () => unsubscribe();
  }, [selectedMeetingContact]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    ChatManager.sendMessage(selectedMeetingContact, chatInput);
    setChatInput("");
  };

  const selectedContact = React.useMemo(() => {
    return (
      ChatManager.getContacts().find((c) => c.id === selectedMeetingContact) ??
      null
    );
  }, [selectedMeetingContact]);

  const [meetingType, setMeetingType] = useState("Video Call");
  const [meetingAlert, setMeetingAlert] = useState<string | null>(null);
  const [selectedGroupContacts, setSelectedGroupContacts] = useState<string[]>(
    [],
  );
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallVideoOff, setIsCallVideoOff] = useState(false);
  const [isCallSpeakerMuted, setIsCallSpeakerMuted] = useState(false);

  // Active meeting speaker cycling
  useEffect(() => {
    if (!isMeetingActive) {
      setActiveSpeakerId(null);
      return;
    }

    const activeContactIds = [
      selectedMeetingContact,
      ...selectedGroupContacts.filter((id) => id !== selectedMeetingContact),
    ];
    const allIds = ["__self__", ...activeContactIds]; // "__self__" represents the current user

    setActiveSpeakerId(selectedMeetingContact);

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allIds.length);
      setActiveSpeakerId(allIds[randomIndex]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isMeetingActive, selectedMeetingContact, selectedGroupContacts]);

  const toggleDraftPref = (key: keyof typeof draftToggles) => {
    const newVal = !draftToggles[key];
    setDraftToggles((prev) => ({ ...prev, [key]: newVal }));
    // Wire stealth mode immediately on toggle
    if (key === "privacyMode") {
      const socket = ChatManager.getSocket();
      const newStatus = newVal ? "online" : "invisible";
      console.log(
        "[Stealth] socket:",
        !!socket,
        "connected:",
        socket?.connected,
        "newStatus:",
        newStatus,
      );
      if (socket) {
        socket.emit("setStatus", { status: newStatus });
      }
    }
  };

  const handleSaveSettings = () => {
    setUserProfile(draftProfile);
    setPrefToggles(draftToggles);
    setPreferences(draftPreferences);

    localStorage.setItem("flydna_pref_toggles", JSON.stringify(draftToggles));
    localStorage.setItem(
      "flydna_preferences",
      JSON.stringify(draftPreferences),
    );
    localStorage.setItem("flydna_profile", JSON.stringify(draftProfile));

    // Wire stealth mode to backend
    const socket = ChatManager.getSocket();
    if (socket) {
      const newStatus = draftToggles.privacyMode ? "online" : "invisible";
      socket.emit("setStatus", { status: newStatus });
    }

    // Sync profile updates (including profile image) to backend
    (async () => {
      try {
        const token = localStorage.getItem("flydna_token");
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
        await fetch(`${apiBase}/api/user/updateProfile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "auth-token": token || "",
          },
          body: JSON.stringify({
            name: draftProfile.name,
            image: draftProfile.avatarUrl,
            country: draftProfile.country,
            city: draftProfile.city,
            state: draftProfile.state,
          }),
        });
      } catch (err) {
        console.warn("[Profile] Failed to sync to backend:", err);
      }
    })();

    try {
      const userData = localStorage.getItem("flydna_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.name = draftProfile.name;
        parsed.username = draftProfile.handle;
        parsed.email = draftProfile.email;
        parsed.phone = draftProfile.phone;
        parsed.profileImage = draftProfile.avatarUrl;
        parsed.trips = draftProfile.trips;
        parsed.calls = draftProfile.calls;
        localStorage.setItem("flydna_user", JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }

    setIsSettingsOpen(false);
    window.dispatchEvent(new Event("flydna-preferences-changed"));
    window.dispatchEvent(new Event("auth-changed"));
  };

  const handleProfileUpdate = (updates: Partial<typeof userProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("flydna_profile", JSON.stringify(next));

      try {
        const userData = localStorage.getItem("flydna_user");
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.name = next.name;
          parsed.username = next.handle;
          parsed.email = next.email;
          parsed.phone = next.phone;
          parsed.profileImage = next.avatarUrl;
          parsed.trips = next.trips;
          parsed.calls = next.calls;
          localStorage.setItem("flydna_user", JSON.stringify(parsed));
        }
      } catch (e) {
        console.error(e);
      }

      // Auto-sync updating avatar and details to backend directly
      (async () => {
        try {
          const token = localStorage.getItem("flydna_token");
          const apiBase =
            process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
          await fetch(`${apiBase}/api/user/updateProfile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "auth-token": token || "",
            },
            body: JSON.stringify({
              name: next.name,
              image: next.avatarUrl,
              country: next.country,
              city: next.city,
              state: next.state,
            }),
          });
        } catch (err) {
          console.warn(
            "[Profile Auto-Sync] Failed to persist updates to backend:",
            err,
          );
        }
      })();

      window.dispatchEvent(new Event("auth-changed"));
      return next;
    });
  };

  const triggerMeetingAlert = (message: string) => {
    setMeetingAlert(message);
    setTimeout(() => {
      setMeetingAlert(null);
    }, 4000);
  };

  return (
    <main className="w-full min-h-screen overflow-x-hidden pb-1 transition-colors duration-500 max-w-[1600px] mx-auto text-[var(--text-main)] bg-[var(--bg-app)]">
      {/* Animated glowing liquid blobs background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute left-1/4 -top-20 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-1)_0%,transparent_70%)] animate-blob-1" />
        <div className="absolute right-10 top-32 h-[450px] w-[450px] bg-[radial-gradient(circle,var(--blob-color-2)_0%,transparent_70%)] animate-blob-2" />
        <div className="absolute -bottom-20 left-1/3 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-3)_0%,transparent_70%)] animate-blob-3" />
      </div>

      <div className="relative z-10 w-full mx-auto flex min-h-screen flex-col gap-7 p-4 md:p-6 pt-20 md:pt-24">
        <Header
          isDarkMode={isDarkMode}
          onThemeToggle={toggleDarkMode}
          activeTab={activeTab}
          setActiveTab={handleActiveTabChange}
        />

        {/* Floating Meeting Alert Container */}
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
          <AnimatePresence>
            {meetingAlert && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl glass-panel-heavy border-cyan-400/30 shadow-[0_10px_30px_rgba(0,174,255,0.25)] max-w-sm"
              >
                <Video size={20} className="text-cyan-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Meeting Console
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {meetingAlert}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MAIN PROFILE DASHBOARD AREA */}
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-20 items-stretch">
            <div className="xl:col-span-5 h-full">
              <UserIdentityCard
                userProfile={userProfile}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                onProfileUpdate={handleProfileUpdate}
                isStealth={!prefToggles.privacyMode}
              />
            </div>

            <div className="xl:col-span-10 glass-panel-heavy rounded-[28px] p-6 lg:p-7 flex flex-col relative overflow-hidden bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 h-full justify-between gap-5 text-left">
              {!isMeetingActive ? (
                <>
                  {/* Header Area with Integrated Active Host Indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div>
                        <h3 className="font-bold text-lg text-[var(--text-main)] tracking-tight">
                          Meetings
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                          Direct encrypted audio & video sessions
                        </p>
                      </div>
                    </div>

                    {/* Active Host Profile Chip */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                      <div className="size-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-[8px] text-white">
                        {userProfile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-xs text-[var(--text-main)] font-semibold">
                        {userProfile.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xl bg-cyan-500/20 text-cyan-300 uppercase tracking-wider">
                        Host
                      </span>
                    </div>
                  </div>

                  {/* Main Interactive Controls */}
                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.3fr_1fr] items-start flex-1">
                    {/* Left: Contact Selection List (Aligned top to bottom) */}
                    <div className="flex flex-col justify-start gap-2.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Select Participants
                        </span>
                        <span className="text-xs font-semibold text-cyan-400">
                          {selectedGroupContacts.length > 0
                            ? `${selectedGroupContacts.length} participant${selectedGroupContacts.length > 1 ? "s" : ""} selected`
                            : "Choose who to invite"}
                        </span>
                      </div>

                      <div className="flex flex-col justify-start gap-2 overflow-y-auto pr-1 max-h-[190px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {(() => {
                          const validContacts =
                            ChatManager.getContacts().filter(
                              (c) =>
                                !c.isGroup &&
                                c.status !== "Group" &&
                                !c.isOfficial &&
                                !["101", "102", "103"].includes(c.id),
                            );

                          if (validContacts.length === 0) {
                            return (
                              <div className="py-8 px-4 text-center rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-1.5">
                                <span className="text-xs font-semibold text-[var(--text-main)]">
                                  No contacts yet
                                </span>
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  Add contacts from the contacts panel to invite
                                  them to meetings
                                </span>
                              </div>
                            );
                          }

                          return validContacts.map((c) => {
                            const isSelected = selectedGroupContacts.includes(
                              c.id,
                            );
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedGroupContacts(
                                      selectedGroupContacts.filter(
                                        (id) => id !== c.id,
                                      ),
                                    );
                                  } else {
                                    setSelectedGroupContacts([
                                      ...selectedGroupContacts,
                                      c.id,
                                    ]);
                                  }
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer border ${
                                  isSelected
                                    ? "bg-cyan-500/15 border-cyan-400/30 text-[var(--text-main)] shadow-sm"
                                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`size-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center font-bold text-[11px] text-white shadow-sm shrink-0`}
                                  >
                                    {c.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold">
                                      {c.name}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                      {c.status || "Contact"}
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className={`size-5 rounded-lg border flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "bg-cyan-500 border-cyan-400 text-white shadow-sm"
                                      : "border-white/20 bg-black/20"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      className="size-3 text-white stroke-[3px]"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 12.75l6 6 9-13.5"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Right: Meeting Mode & Start Session Action */}
                    <div className="flex flex-col justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="space-y-3">
                        <span className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Call Mode
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {["Video Call", "Voice Call"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setMeetingType(type)}
                              className={`py-3 px-3 text-xs font-bold rounded-xl transition cursor-pointer text-center border ${
                                meetingType === type
                                  ? "bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-sm"
                                  : "bg-white/[0.02] border-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/[0.06]"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>

                        {/* Selected Count Summary */}
                        <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span>Total in Room:</span>
                          <span className="font-bold text-[var(--text-main)]">
                            {selectedGroupContacts.length + 1} People
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={selectedGroupContacts.length === 0}
                        onClick={() => {
                          if (selectedGroupContacts.length === 0) return;
                          setIsMeetingActive(true);
                          triggerMeetingAlert(
                            `Meeting session initiated. Mode: ${meetingType}`,
                          );
                        }}
                        className={`w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition text-center ${
                          selectedGroupContacts.length === 0
                            ? "bg-white/[0.04] text-slate-500 border border-white/5 cursor-not-allowed opacity-50 shadow-none"
                            : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-[0.98] text-white cursor-pointer shadow-lg shadow-cyan-500/20"
                        }`}
                      >
                        Start Session
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-3 h-full">
                  <div className="size-14 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/10">
                    <Video size={26} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wide">
                      Encrypted Call In Progress
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-1 max-w-sm mx-auto leading-relaxed">
                      Your point-to-point meeting session is active with
                      encrypted WebRTC telemetry.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMeetingActive(false);
                        setSelectedGroupContacts([]);
                      }}
                      className="mt-4 px-6 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 transition text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                      <span>End Meeting</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="xl:col-span-5 h-full">
              <BroadcastNetworkCard />
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 xl:grid-cols-20 items-stretch">
            <div className="xl:col-span-5 h-[500px]">
              <ContactsCard
                selectedMeetingContact={selectedMeetingContact}
                setSelectedMeetingContact={setSelectedMeetingContact}
                isMeetingActive={isMeetingActive}
                setIsMeetingActive={setIsMeetingActive}
                selectedGroupContacts={selectedGroupContacts}
                setSelectedGroupContacts={setSelectedGroupContacts}
                setMeetingType={setMeetingType}
                triggerMeetingAlert={triggerMeetingAlert}
              />
            </div>

            <div className="xl:col-span-10 h-[500px]">
              <ChatPanel
                selectedContact={selectedContact}
                chatMessages={chatMessages}
                input={chatInput}
                onInputChange={setChatInput}
                onSend={handleSend}
                hideScenes={true}
                className="h-full"
              />
            </div>

            <div className="xl:col-span-5 h-[500px]">
              <FlightTrackerCard />
            </div>
          </div>
          <div className="w-full text-left mt-8">
            <div className="border-b border-white/5 pb-2 mb-4">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">
                Wallets & Travel Itineraries
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Connected settlement wallets, live flight alerts, and hotel
                reservations
              </p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Card 1: EVM Wallet Connector */}
              <div className="glass-panel-heavy rounded-[22px] p-4 flex flex-col justify-between min-w-[310px] max-w-[310px] flex-shrink-0 text-left border-l-4 border-l-cyan-400">
                {isEditingEvm ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet size={12} className="text-cyan-400" /> Link EVM
                      Wallet
                    </span>
                    <input
                      type="text"
                      value={inputEvm}
                      onChange={(e) => setInputEvm(e.target.value)}
                      className="w-full bg-[#06111f]/90 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-400/40 transition"
                    />
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={handleSaveEvm}
                        className="px-2.5 py-1 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition cursor-pointer"
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScannerTarget("evm");
                          setScannerStatus("searching");
                          setScannerOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                      >
                        <Camera size={11} /> Scan
                      </button>
                      <button
                        onClick={() => setIsEditingEvm(false)}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 text-slate-400 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : linkedEvm ? (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Wallet size={12} className="text-cyan-400" /> EVM
                        Wallet Linked
                      </span>
                      <span className="text-[8px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <div className="mt-2.5 bg-[#06111f]/95 border border-white/10 rounded-xl p-2.5 font-mono text-[9px] font-bold tracking-widest text-emerald-400 select-all leading-normal">
                      {linkedEvm
                        .match(/.{1,4}/g)
                        ?.slice(0, 5)
                        .join(" ")}
                      <br />
                      {linkedEvm
                        .match(/.{1,4}/g)
                        ?.slice(5)
                        .join(" ")}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
                      Linked to MetaMask. Ready for instant AVA checkout.
                    </p>
                    <button
                      onClick={handleDisconnectEvm}
                      className="mt-3 px-3 py-1 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet size={12} className="text-cyan-400" /> EVM Wallet
                      Link
                    </div>
                    <h4 className="text-sm font-bold text-slate-400 mt-1.5">
                      No EVM Wallet connected
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Link your wallet to unlock automated checkout & travel
                      loyalty rewards.
                    </p>
                    <button
                      onClick={() => setIsEditingEvm(true)}
                      className="mt-3 px-3 py-1.5 bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Link2 size={11} /> Link EVM Wallet
                    </button>
                  </div>
                )}
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-3 border-t border-white/5 mt-2 flex justify-between">
                  <span>METAMASK / TRUST</span>
                  <span>EVM NETWORK</span>
                </div>
              </div>

              {/* Card 2: XRPL Wallet Connector */}
              <div className="glass-panel-heavy rounded-[22px] p-4 flex flex-col justify-between min-w-[310px] max-w-[310px] flex-shrink-0 text-left border-l-4 border-l-purple-500">
                {isEditingXrp ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe size={12} className="text-purple-400" /> Link XRPL
                      Wallet
                    </span>
                    <input
                      type="text"
                      value={inputXrp}
                      onChange={(e) => setInputXrp(e.target.value)}
                      className="w-full bg-[#06111f]/90 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-400/40 transition"
                    />
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={handleSaveXrp}
                        className="px-2.5 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-purple-500/30 transition cursor-pointer"
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScannerTarget("xrp");
                          setScannerStatus("searching");
                          setScannerOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                      >
                        <Camera size={11} /> Scan
                      </button>
                      <button
                        onClick={() => setIsEditingXrp(false)}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 text-slate-400 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : linkedXrp ? (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Globe size={12} className="text-purple-400" /> XRPL
                        Wallet Linked
                      </span>
                      <span className="text-[8px] text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <div className="mt-2.5 bg-[#06111f]/95 border border-white/10 rounded-xl p-2.5 font-mono text-[9px] font-bold tracking-widest text-blue-400 select-all leading-normal">
                      {linkedXrp
                        .match(/.{1,4}/g)
                        ?.slice(0, 5)
                        .join(" ")}
                      <br />
                      {linkedXrp
                        .match(/.{1,4}/g)
                        ?.slice(5)
                        .join(" ")}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
                      Linked to Gem / XUMM. Ready for fast cross-border
                      payments.
                    </p>
                    <button
                      onClick={handleDisconnectXrp}
                      className="mt-3 px-3 py-1 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe size={12} className="text-purple-400" /> XRPL
                      Wallet Link
                    </div>
                    <h4 className="text-sm font-bold text-slate-400 mt-1.5">
                      No XRPL Wallet connected
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Link your wallet to unlock zero-latency international
                      settlement.
                    </p>
                    <button
                      onClick={() => setIsEditingXrp(true)}
                      className="mt-3 px-3 py-1.5 bg-purple-500/10 border border-purple-400/20 hover:bg-purple-500/20 text-purple-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Link2 size={11} /> Link XRPL Wallet
                    </button>
                  </div>
                )}
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-3 border-t border-white/5 mt-2 flex justify-between">
                  <span>GEM / XUMM APP</span>
                  <span>RIPPLE LEDGER</span>
                </div>
              </div>

              {/* Card 4: Flight Alert (Travel Update) */}
              <div className="glass-panel-heavy rounded-[22px] p-4 flex flex-col justify-between min-w-[240px] max-w-[240px] flex-shrink-0 text-left border-l-4 border-l-amber-500">
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PlaneTakeoff size={12} /> Flight Alert
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mt-1 truncate">
                    {selectedOffer
                      ? `${selectedOffer.slices?.[0]?.segments?.[0]?.operating_carrier?.name || "Delta Air Lines"} (${selectedOffer.slices?.[0]?.segments?.[0]?.operating_carrier?.iata_code || "DL"}${selectedOffer.slices?.[0]?.segments?.[0]?.marketing_carrier_flight_number || "452"})`
                      : "DL452 Flight Telemetry"}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {selectedOffer
                      ? `Seat ${selectedSeat || "02A"} • Gate T04 • On Schedule`
                      : "Atlanta (ATL) to Las Vegas (LAS) • Gate T04 On Time"}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-3 border-t border-white/5 mt-2 flex justify-between">
                  <span>GATE T04</span>
                  <span>LIVE GPS</span>
                </div>
              </div>

              {/* Card 5: Travel Update */}
              <div className="glass-panel-heavy rounded-[22px] p-4 flex flex-col justify-between min-w-[240px] max-w-[240px] flex-shrink-0 text-left border-l-4 border-l-emerald-500">
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Hotel size={12} /> Hotel Reservation
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mt-1 truncate">
                    Star Sky Park KLCC
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {hotelLocation?.city
                      ? `${hotelLocation.city} (${hotelLocation.code})`
                      : "Kuala Lumpur, Malaysia"}{" "}
                    • Key Ready
                  </p>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-3 border-t border-white/5 mt-2 flex justify-between">
                  <span>CONFIRMED</span>
                  <span>DIGITAL KEY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />

        {/* Video Call Popup overlay */}
        <AnimatePresence>
          {isMeetingActive && (
            <VideoCallPopup
              isMeetingActive={isMeetingActive}
              setIsMeetingActive={setIsMeetingActive}
              selectedMeetingContact={selectedMeetingContact}
              setSelectedMeetingContact={setSelectedMeetingContact}
              selectedGroupContacts={selectedGroupContacts}
              setSelectedGroupContacts={setSelectedGroupContacts}
              activeSpeakerId={activeSpeakerId}
              isCallMuted={isCallMuted}
              setIsCallMuted={setIsCallMuted}
              isCallVideoOff={isCallVideoOff}
              setIsCallVideoOff={setIsCallVideoOff}
              isCallSpeakerMuted={isCallSpeakerMuted}
              setIsCallSpeakerMuted={setIsCallSpeakerMuted}
            />
          )}
        </AnimatePresence>

        {/* Preferences Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSettingsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="relative w-full max-w-[420px] md:max-w-[850px] max-h-[85vh] overflow-y-auto z-10 glass-panel-heavy border border-[var(--accent-primary)]/25 bg-[var(--surface-color)]/96 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-md rounded-3xl p-6 text-left scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
                  <div className="flex items-center gap-2 text-[var(--accent-primary)] dark:text-cyan-400">
                    <Settings size={18} />
                    <span className="font-extrabold text-base tracking-wide">
                      Profile & Preferences
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-[var(--glass-border)] hover:border-red-500/30 text-sm font-bold text-[var(--text-muted)] transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-col gap-6 text-xs font-bold text-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Section 1: Change User Info */}
                    <div className="space-y-3 md:col-span-2">
                      <span className="block text-xs font-black text-[var(--accent-primary)] dark:text-cyan-400 uppercase tracking-wider">
                        User Information
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={draftProfile.name}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Username
                          </label>
                          <input
                            type="text"
                            value={draftProfile.handle}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                handle: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={draftProfile.email}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                email: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={draftProfile.phone}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                phone: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Password
                          </label>
                          <input
                            type="password"
                            value={draftProfile.password}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                password: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Birthday
                          </label>
                          <input
                            type="date"
                            value={draftProfile.birthday}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                birthday: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold text-[var(--text-main)] scheme-dark"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Address
                          </label>
                          <input
                            type="text"
                            value={draftProfile.address}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                address: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            City
                          </label>
                          <input
                            type="text"
                            value={draftProfile.city}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                city: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-[10px] uppercase">
                            Country
                          </label>
                          <input
                            type="text"
                            value={draftProfile.country}
                            onChange={(e) =>
                              setDraftProfile({
                                ...draftProfile,
                                country: e.target.value,
                              })
                            }
                            className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right column: Sections 2 & 3 */}
                    <div className="space-y-6 md:col-span-1">
                      {/* Section 2: Current Options (Language, Currency, Seating, Availability) */}
                      <div className="space-y-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                        <span className="block text-xs font-black text-[var(--accent-primary)] dark:text-cyan-400 uppercase tracking-wider">
                          Preferences Configuration
                        </span>

                        <div className="space-y-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                          {[
                            {
                              label: "Language",
                              key: "language",
                              opts: ["English", "French", "Arabic", "Spanish"],
                              icon: Globe,
                            },
                            {
                              label: "Preferred Currency",
                              key: "currency",
                              opts: [
                                "USD ($)",
                                "EUR (€)",
                                "MAD (dh)",
                                "BTC (₿)",
                              ],
                              icon: DollarSign,
                            },
                            {
                              label: "Travel Seating Class",
                              key: "travelClass",
                              opts: [
                                "First Class",
                                "Business Class",
                                "Economy Class",
                              ],
                              icon: Plane,
                            },
                            {
                              label: "Meeting Availability",
                              key: "meetingAvailability",
                              opts: ["Contacts Only", "Public", "Invite Only"],
                              icon: User,
                            },
                          ].map((sel) => (
                            <div
                              key={sel.key}
                              className="flex flex-col gap-1.5"
                            >
                              <div className="flex items-center gap-2 text-slate-400">
                                <sel.icon
                                  size={13}
                                  className="text-[var(--accent-primary)]/80 dark:text-cyan-400/80"
                                />
                                <span className="text-[10px] uppercase tracking-wider">
                                  {sel.label}
                                </span>
                              </div>
                              <div className="relative w-full">
                                <select
                                  value={
                                    draftPreferences[
                                      sel.key as keyof typeof draftPreferences
                                    ]
                                  }
                                  onChange={(e) =>
                                    setDraftPreferences((p: any) => ({
                                      ...p,
                                      [sel.key]: e.target.value,
                                    }))
                                  }
                                  className="w-full bg-[var(--bg-app)]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-bold select-none outline-none focus:border-[var(--accent-primary)]/50 dark:focus:border-cyan-400/50 cursor-pointer"
                                >
                                  {sel.opts.map((opt) => (
                                    <option
                                      key={opt}
                                      value={opt}
                                      className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold"
                                    >
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Toggle options */}
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-xs font-black text-[var(--accent-primary)] dark:text-cyan-400 uppercase tracking-wider">
                          Privacy & Notifications
                        </span>

                        <div className="space-y-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                          {[
                            {
                              label: "Smart Notifications",
                              key: "notifications",
                              icon: Bell,
                            },
                            {
                              label: "Online Status",
                              key: "privacyMode",
                              icon: Eye,
                            },
                            {
                              label: "GPS Location",
                              key: "gpsTracking",
                              icon: MapPin,
                              hasSubtext: true,
                              subtext:
                                "Allow trusted contacts to see your live location",
                            },
                          ].map((tog) => (
                            <div key={tog.key} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <tog.icon size={14} />
                                  <span className="leading-snug text-xs">
                                    {tog.label}
                                  </span>
                                </div>

                                <div
                                  onClick={() =>
                                    toggleDraftPref(tog.key as any)
                                  }
                                  className={`relative flex w-10 h-5.5 items-center rounded-full p-0.5 shadow-inner cursor-pointer transition ${
                                    draftToggles[
                                      tog.key as keyof typeof draftToggles
                                    ]
                                      ? "bg-[var(--accent-primary)] dark:bg-cyan-500"
                                      : "bg-slate-300 dark:bg-slate-700"
                                  }`}
                                  role="button"
                                >
                                  <motion.div
                                    className="size-4.5 rounded-full bg-white shadow-sm"
                                    animate={{
                                      x: draftToggles[
                                        tog.key as keyof typeof draftToggles
                                      ]
                                        ? 18
                                        : 0,
                                    }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 25,
                                    }}
                                  />
                                </div>
                              </div>
                              {tog.hasSubtext && (
                                <span className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                                  {tog.subtext}
                                </span>
                              )}
                              {tog.key === "gpsTracking" &&
                                draftToggles.gpsTracking && (
                                  <div className="mt-2.5 w-full p-3.5 rounded-2xl bg-[var(--surface-color)]/60 backdrop-blur-xl border border-[var(--glass-border)] shadow-sm flex flex-col gap-2 animate-fade-in text-left">
                                    <div className="flex items-center gap-2">
                                      <span className="relative flex size-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full size-2 bg-emerald-400"></span>
                                      </span>
                                      <span className="text-[11px] font-bold text-[var(--text-main)] tracking-tight">
                                        GPS Positioning Active
                                      </span>
                                    </div>

                                    <div className="flex flex-col gap-0.5 pl-3 border-l-2 border-[var(--accent-primary)]/50">
                                      <span className="text-[11px] font-semibold text-[var(--text-main)] font-mono tracking-tight">
                                        33.8138° N, -83.8802° W
                                      </span>
                                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                        FlyDnA Node (ATL) • Encrypted Signal
                                      </span>
                                    </div>
                                  </div>
                                )}
                              {tog.key === "gpsTracking" &&
                                !draftToggles.gpsTracking && (
                                  <div className="mt-1.5 w-full flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)]">
                                    <span className="size-1.5 rounded-full bg-slate-500/60" />
                                    <span>Location sharing is paused</span>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Save/Close Actions */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={handleSaveSettings}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] dark:from-cyan-500 dark:to-blue-600 hover:brightness-110 active:scale-95 transition font-bold text-xs cursor-pointer text-center text-white shadow-[0_0_15px_rgba(139,115,87,0.35)] dark:shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                    >
                      SAVE & CLOSE
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* QR Scanner Modal Overlay */}
        <AnimatePresence>
          {scannerOpen && (
            <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setScannerOpen(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
              />

              {/* Viewfinder Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="relative w-full max-w-[420px] bg-[#06111f] border border-cyan-400/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center overflow-hidden"
              >
                {/* Neon Background Ambience */}
                <div className="absolute -top-12 -right-12 size-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>📷</span>
                    <span>QR Address Scanner</span>
                  </h4>
                  <button
                    onClick={() => setScannerOpen(false)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Viewfinder Video Simulation Window */}
                <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl bg-black border border-white/10 overflow-hidden flex flex-col items-center justify-center shadow-inner">
                  {/* Viewfinder glowing green corners */}
                  <div className="absolute top-4 left-4 size-5 border-t-2 border-l-2 border-emerald-400 z-20" />
                  <div className="absolute top-4 right-4 size-5 border-t-2 border-r-2 border-emerald-400 z-20" />
                  <div className="absolute bottom-4 left-4 size-5 border-b-2 border-l-2 border-emerald-400 z-20" />
                  <div className="absolute bottom-4 right-4 size-5 border-b-2 border-r-2 border-emerald-400 z-20" />

                  {/* Real video feed stream element */}
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none z-0"
                    playsInline
                    muted
                  />

                  {/* Moveable Red/Green scanning laser line */}
                  {scannerStatus === "searching" && (
                    <motion.div
                      animate={{ y: [-100, 100] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                      }}
                      className="absolute left-4 right-4 h-0.5 bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.8)] z-10"
                    />
                  )}

                  {/* Simulated Camera Feed - static grid overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none z-10" />

                  {/* Status Overlay */}
                  {scannerStatus === "searching" && (
                    <div className="z-10 flex flex-col items-center gap-2">
                      <div className="size-12 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 animate-spin" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded animate-pulse">
                        Scanning QR...
                      </span>
                    </div>
                  )}

                  {scannerStatus === "detected" && (
                    <div className="z-10 flex flex-col items-center gap-2">
                      <div className="size-12 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 animate-bounce">
                        ⚡
                      </div>
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
                        QR Detected
                      </span>
                    </div>
                  )}

                  {scannerStatus === "success" && (
                    <div className="z-10 flex flex-col items-center gap-2">
                      <div className="size-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-lg font-black animate-scale-in">
                        ✓
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Linked Successfully
                      </span>
                    </div>
                  )}
                </div>

                {/* Simulated Scan Details */}
                <div className="mt-5 space-y-2 text-left">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Scanner Controller
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Point your device&apos;s camera at the QR code displayed on
                    your wallet extension. The camera finder will resolve the
                    token address.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (streamRef.current) {
                        streamRef.current
                          .getTracks()
                          .forEach((track) => track.stop());
                        streamRef.current = null;
                      }
                      setScannerOpen(false);
                    }}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
