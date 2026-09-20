import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, X, MessageSquare, Video, Mail } from "lucide-react";
import { ChatManager } from "@/backend/chatManager";
import Avatar from "../shared/Avatar";
import { Contact } from "@/types/chat";
import { getAuthToken, BASE_URL } from "@/lib/api";

type ContactsCardProps = {
  selectedMeetingContact: string;
  setSelectedMeetingContact: (id: string) => void;
  isMeetingActive: boolean;
  setIsMeetingActive: (active: boolean) => void;
  selectedGroupContacts: string[];
  setSelectedGroupContacts: React.Dispatch<React.SetStateAction<string[]>>;
  setMeetingType: (mode: string) => void;
  triggerMeetingAlert: (msg: string) => void;
};

export default function ContactsCard({
  selectedMeetingContact,
  setSelectedMeetingContact,
  isMeetingActive,
  setIsMeetingActive,
  selectedGroupContacts,
  setSelectedGroupContacts,
  setMeetingType,
  triggerMeetingAlert,
}: ContactsCardProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  type GoogleSyncResult = {
    registered: { userId: string; name: string; phone: string; profileImage?: string; email: string }[];
    unregistered: { name: string; phone: string; email: string }[];
  };
  const [googleSyncResults, setGoogleSyncResults] = useState<GoogleSyncResult | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set());
  const [manualAddError, setManualAddError] = useState<string | null>(null);
  const [isManualAdding, setIsManualAdding] = useState(false);

  useEffect(() => {
    const sync = () => {
      setContacts([...ChatManager.getContacts()]);
    };
    sync();
    const unsubscribe = ChatManager.subscribe(sync);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "GOOGLE_CONTACTS_SYNC") return;
      const synced = event.data.contacts || [];
      setIsSyncingGoogle(true);
      try {
        const token = getAuthToken();
        const res = await fetch(`${BASE_URL}/api/contacts/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}`, "auth-token": token } : {}),
          },
          body: JSON.stringify({ contacts: synced }),
        });
        const data = await res.json();
        if (data?.data) {
          setGoogleSyncResults(data.data);
        }
      } catch (err) {
        console.warn("[FlyDnA] Google contacts sync failed:", err);
      } finally {
        setIsSyncingGoogle(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleGoogleImport = () => {
    const token = getAuthToken();
    if (!token) return;
    setGoogleSyncResults(null);
    window.open(
      `${BASE_URL}/api/google/auth?token=${encodeURIComponent(token)}`,
      "googleContactsAuth",
      "width=500,height=600"
    );
  };

  const handleAddSyncedContact = async (userId: string) => {
    const token = getAuthToken();
    try {
      await fetch(`${BASE_URL}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}`, "auth-token": token } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      setAddedUserIds((prev) => new Set(prev).add(userId));
      ChatManager.refreshContacts();
    } catch (err) {
      console.warn("[FlyDnA] Failed to add synced contact:", err);
    }
  };

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getContactSubtitle = (contact: Contact) => {
    if (contact.isOfficial) {
      if (contact.id === "101") return "VIP Lifestyle & Reservations • 24/7";
      if (contact.id === "102") return "Flights & Travel Desk";
      return "Technical Support";
    }
    if (contact.isGroup) {
      return contact.lastMessage || `${contact.memberIds?.length || 2} members`;
    }
    const extra = contact as Contact & { phone?: string; phoneNumber?: string; email?: string };
    return extra.phone || extra.phoneNumber || extra.email || `@${contact.name.replace(/\s+/g, "").toLowerCase()}`;
  };

  const getStatusColor = (status: string) => {
    if (status === "Online" || status === "Typing...") {
      return "bg-emerald-400 shadow-[0_0_8px_#34d399]";
    } else if (status === "Away") {
      return "bg-amber-400 shadow-[0_0_8px_#fbbf24]";
    } else {
      return "bg-slate-500";
    }
  };

  return (
    <div className="glass-panel-heavy rounded-[26px] p-4 pb-3 flex flex-col relative h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">
            Contacts
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            People you connect with most
          </p>
        </div>
        <div className="flex gap-2 h-full">
          <div className="relative z-50">
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsAddContactOpen(false);
              }}
              className={`glass-button glass-sheen size-9 sm:size-10 grid place-items-center rounded-full text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition cursor-pointer ${
                isSearchOpen
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  : ""
              }`}
              title="Search Contacts"
            >
              <Search size={15} />
            </button>

            {isSearchOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSearchOpen(false)}
              />
            )}

            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-11 w-[260px] h-fit overflow-hidden flex flex-col z-50 glass-panel-heavy border border-cyan-400/20 bg-[#06111f]/96 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.5)] rounded-2xl"
                >
                  <div className="flex flex-col p-4 text-white">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <Search size={15} />
                        <span className="font-bold text-xs">
                          Search Contacts
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-full pl-3.5 pr-8 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                          autoFocus
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 size-5 rounded-full glass-button grid place-items-center text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-50">
            <button
              onClick={() => {
                setIsAddContactOpen(!isAddContactOpen);
                setIsSearchOpen(false);
              }}
              className={`glass-button glass-sheen size-9 sm:size-10 grid place-items-center rounded-full text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition cursor-pointer ${
                isAddContactOpen
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  : ""
              }`}
              title="Add Contact"
            >
              <UserPlus size={15} />
            </button>

            {isAddContactOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsAddContactOpen(false)}
              />
            )}

            <AnimatePresence>
              {isAddContactOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-11 w-[260px] h-fit overflow-hidden flex flex-col z-50 glass-panel-heavy border border-cyan-400/20 bg-[#06111f]/96 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.5)] rounded-2xl"
                >
                  <div className="flex flex-col p-4 text-white">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <UserPlus size={15} />
                        <span className="font-bold text-xs">Add Contact</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={handleGoogleImport}
                        disabled={isSyncingGoogle}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-1 rounded-full glass-button glass-sheen hover:border-cyan-400/40 transition font-bold text-xs text-slate-200 disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-95"
                      >
                        <Mail size={13} />
                        {isSyncingGoogle ? "Syncing..." : "Import Google Contacts"}
                      </button>

                      {googleSyncResults && (
                        <div className="mb-2 max-h-[140px] overflow-y-auto flex flex-col gap-1.5 border-b border-white/10 pb-2">
                          <p className="text-[10px] text-slate-500 text-center py-1">
                            Checked {googleSyncResults.registered.length + googleSyncResults.unregistered.length} contacts —{" "}
                            {googleSyncResults.registered.length} on FlyDnA
                          </p>
                          {googleSyncResults.registered.map((c) => (
                            <div
                              key={c.userId}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-full bg-white/[0.03]"
                            >
                              <span className="text-xs text-slate-200 truncate">{c.name}</span>
                              {addedUserIds.has(c.userId) ? (
                                <span className="text-[10px] font-semibold text-emerald-400 shrink-0">Added</span>
                              ) : (
                                <button
                                  onClick={() => handleAddSyncedContact(c.userId)}
                                  className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 shrink-0 cursor-pointer px-2.5 py-0.5 rounded-full glass-button border-cyan-400/30"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="Name..."
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                      />
                      <input
                        type="email"
                        placeholder="Email..."
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                      />
                      <input
                        type="text"
                        placeholder="Phone Number..."
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                      />
                      {manualAddError && (
                        <p className="text-[10px] text-red-400 -mt-1 text-left leading-tight">{manualAddError}</p>
                      )}
                      <button
                        disabled={isManualAdding}
                        onClick={async () => {
                          if (!newContactName.trim() && !newContactEmail.trim() && !newContactPhone.trim()) return;
                          setManualAddError(null);
                          setIsManualAdding(true);
                          try {
                            const token = getAuthToken();
                            const res = await fetch(`${BASE_URL}/api/contacts/sync`, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...(token ? { Authorization: `Bearer ${token}`, "auth-token": token } : {}),
                              },
                              body: JSON.stringify({
                                contacts: [{ name: newContactName, email: newContactEmail, phone: newContactPhone }],
                              }),
                            });
                            const data = await res.json();
                            const match = data?.data?.registered?.[0];
                            if (match?.userId) {
                              await fetch(`${BASE_URL}/api/contacts`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  ...(token ? { Authorization: `Bearer ${token}`, "auth-token": token } : {}),
                                },
                                body: JSON.stringify({ userId: match.userId }),
                              });
                              ChatManager.refreshContacts();
                              setIsAddContactOpen(false);
                              setNewContactName("");
                              setNewContactEmail("");
                              setNewContactPhone("");
                            } else {
                              // Local test fallback if not a registered DB user
                              ChatManager.addContact({
                                name: newContactName,
                                email: newContactEmail,
                                phone: newContactPhone,
                              });
                              setIsAddContactOpen(false);
                              setNewContactName("");
                              setNewContactEmail("");
                              setNewContactPhone("");
                            }
                          } catch {
                            // Offline fallback
                            ChatManager.addContact({
                              name: newContactName,
                              email: newContactEmail,
                              phone: newContactPhone,
                            });
                            setIsAddContactOpen(false);
                            setNewContactName("");
                            setNewContactEmail("");
                            setNewContactPhone("");
                          } finally {
                            setIsManualAdding(false);
                          }
                        }}
                        className="w-full py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 active:scale-[0.98] transition font-bold text-xs cursor-pointer text-center text-white shadow-[0_0_15px_rgba(0,174,255,0.35)] mt-1"
                      >
                        {isManualAdding ? "Syncing..." : "Add Contact"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-1.5 overflow-y-auto pr-1.5 flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredContacts.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedMeetingContact(c.id)}
            className={`flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border transition-all duration-200 cursor-pointer ${
              selectedMeetingContact === c.id
                ? "border-cyan-400/40 bg-cyan-500/[0.03] shadow-[0_0_15px_rgba(0,174,255,0.15)]"
                : "border-white/5 hover:border-cyan-400/20 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Avatar
                  name={c.name}
                  gradient={c.color}
                  size="sm"
                  avatarUrl={c.avatarUrl}
                />
                <span
                  className={`absolute bottom-0 right-0 size-2.5 rounded-full border border-[#06111f] ${getStatusColor(c.status)}`}
                />
              </div>
              <div className="text-left">
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-200 justify-start">
                  <span>{c.name}</span>
                  {c.isOfficial && (
                    <span
                      className="p-0.5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-shrink-0"
                      title="Official Account"
                    >
                      <svg
                        className="size-2.5 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </span>
                  )}
                </span>
                <span className="block text-xs font-semibold text-slate-500 mt-0.5 truncate max-w-[180px]">
                  {getContactSubtitle(c)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMeetingContact(c.id);
                }}
                className={`glass-button glass-sheen size-9 grid place-items-center rounded-full text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition cursor-pointer ${
                  selectedMeetingContact === c.id
                    ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                    : "hover:border-cyan-400/30 hover:text-cyan-300"
                }`}
                title="Send Message"
              >
                <MessageSquare size={15} />
              </button>
              {!c.isOfficial && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMeetingActive) {
                      if (c.id === selectedMeetingContact) {
                        triggerMeetingAlert(`${c.name} is the meeting host.`);
                      } else if (selectedGroupContacts.includes(c.id)) {
                        setSelectedGroupContacts(
                          selectedGroupContacts.filter((id) => id !== c.id),
                        );
                        triggerMeetingAlert(`${c.name} left the video call.`);
                      } else {
                        const totalContactsCount =
                          1 + selectedGroupContacts.length;
                        if (totalContactsCount >= 4) {
                          triggerMeetingAlert(
                            "Max meeting limit of 5 people reached.",
                          );
                        } else {
                          setSelectedGroupContacts([
                            ...selectedGroupContacts,
                            c.id,
                          ]);
                          triggerMeetingAlert(`${c.name} joined the video call.`);
                        }
                      }
                    } else {
                      setSelectedMeetingContact(c.id);
                      setMeetingType("Video Call");
                      setIsMeetingActive(true);
                      setSelectedGroupContacts([]);
                      triggerMeetingAlert(`Video call started with ${c.name}.`);
                    }
                  }}
                  className={`glass-button glass-sheen size-9 grid place-items-center rounded-full text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition cursor-pointer ${
                    isMeetingActive &&
                    (c.id === selectedMeetingContact ||
                      selectedGroupContacts.includes(c.id))
                      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                      : "hover:border-cyan-400/30 hover:text-cyan-300"
                  }`}
                  title={
                    isMeetingActive &&
                    (c.id === selectedMeetingContact ||
                      selectedGroupContacts.includes(c.id))
                      ? "Remove from Call"
                      : "Start Video Meeting"
                  }
                >
                  <Video size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
