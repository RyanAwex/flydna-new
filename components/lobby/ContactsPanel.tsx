/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  X,
  Users,
  Download,
  Lock,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import { Contact } from "@/types/chat";
import Avatar from "../shared/Avatar";
import { ChatManager } from "@/backend/chatManager";
import { getAuthToken, BASE_URL } from "@/lib/api";

type ContactsPanelProps = {
  contacts: Contact[];
  selectedId: string | null;
  filter: "All" | "Favorites" | "Online";
  onFilterChange: (filter: "All" | "Favorites" | "Online") => void;
  onSelect: (id: string) => void;
  onRemove?: (contactId: string) => void;
};

export default function ContactsPanel({
  contacts,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
  onRemove,
}: ContactsPanelProps) {
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isPhonePrivacyActive, setIsPhonePrivacyActive] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  type GoogleSyncResult = {
    registered: {
      userId: string;
      name: string;
      phone: string;
      profileImage?: string;
      email: string;
    }[];
    unregistered: { name: string; phone: string; email: string }[];
  };
  const [googleSyncResults, setGoogleSyncResults] =
    useState<GoogleSyncResult | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type === "google-contacts-import-error") {
        console.warn(
          "[FlyDnA] Google contacts import error:",
          event.data.error,
        );
        alert(
          `Google Import Failed: ${event.data.error || "Missing credentials"}`,
        );
        return;
      }
      if (event.data?.type !== "google-contacts-imported") return;
      const contactsList = event.data.contacts || [];
      setIsSyncingGoogle(true);
      try {
        const token = getAuthToken();
        const res = await fetch(`${BASE_URL}/api/contacts/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}`, "auth-token": token }
              : {}),
          },
          body: JSON.stringify({ contacts: contactsList }),
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
    const popup = window.open(
      `${BASE_URL}/api/google/auth?token=${token}`,
      "google-contacts-import",
      "width=500,height=600,scrollbars=yes",
    );
    if (!popup) {
      console.warn("[FlyDnA] Popup blocked");
      alert("Please allow popups to import your Google Contacts.");
      return;
    }
    setIsSyncingGoogle(true);
  };

  const handleAddSyncedContact = async (userId: string) => {
    const token = getAuthToken();
    try {
      await fetch(`${BASE_URL}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: JSON.stringify({ userId }),
      });
      setAddedUserIds((prev) => new Set(prev).add(userId));
      ChatManager.refreshContacts();
    } catch (err) {
      console.warn("[FlyDnA] Failed to add synced contact:", err);
    }
  };

  const [invitedEmails, setInvitedEmails] = useState<Set<string>>(new Set());
  const [isInvitingEmails, setIsInvitingEmails] = useState<Set<string>>(
    new Set(),
  );

  const handleInviteContact = async (name: string, email: string) => {
    if (!email) return;
    setIsInvitingEmails((prev) => new Set(prev).add(email));
    try {
      const token = getAuthToken();
      await fetch(`${BASE_URL}/api/contacts/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: JSON.stringify({ contacts: [{ name, email }] }),
      });
      setInvitedEmails((prev) => new Set(prev).add(email));
    } catch (err) {
      console.warn("[FlyDnA] Failed to send invite:", err);
    } finally {
      setIsInvitingEmails((prev) => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
    }
  };

  const handleInviteAll = async () => {
    if (!googleSyncResults || !googleSyncResults.unregistered.length) return;

    const contactsToInvite = googleSyncResults.unregistered
      .filter((c) => c.email && !invitedEmails.has(c.email))
      .map((c) => ({ name: c.name, email: c.email }));

    if (!contactsToInvite.length) return;

    contactsToInvite.forEach((c) =>
      setIsInvitingEmails((prev) => new Set(prev).add(c.email)),
    );

    try {
      const token = getAuthToken();
      await fetch(`${BASE_URL}/api/contacts/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: JSON.stringify({ contacts: contactsToInvite }),
      });
      setInvitedEmails((prev) => {
        const next = new Set(prev);
        contactsToInvite.forEach((c) => next.add(c.email));
        return next;
      });
    } catch (err) {
      console.warn("[FlyDnA] Failed to send bulk invites:", err);
    } finally {
      setIsInvitingEmails((prev) => {
        const next = new Set(prev);
        contactsToInvite.forEach((c) => next.delete(c.email));
        return next;
      });
    }
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newContactQuery, setNewContactQuery] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [manualAddError, setManualAddError] = useState<string | null>(null);
  const [isManualAdding, setIsManualAdding] = useState(false);

  // Group creation states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isGroupCreating, setIsGroupCreating] = useState(false);
  const [groupCreateError, setGroupCreateError] = useState<string | null>(null);

  // 3 Official fixed contacts (Concierge, Travel Agent, Tech Support)
  const officialContacts = useMemo(() => {
    const findOfficial = (
      id: string,
      fallbackName: string,
      fallbackColor: string,
      avatarUrl: string,
    ): Contact => {
      const existing = contacts.find(
        (c) =>
          String(c.id) === id ||
          c.name
            .toLowerCase()
            .includes(fallbackName.toLowerCase().replace("flydna ", "")),
      );
      if (existing) {
        return {
          ...existing,
          isOfficial: true,
          isPinned: true,
          status: "Online" as const,
          accent: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
        };
      }
      return {
        id,
        name: fallbackName,
        status: "Online" as const,
        lastMessage:
          id === "101"
            ? "Welcome to FlyDnA Concierge service."
            : id === "102"
              ? "Ready to assist you with your travels."
              : "System status: fully functional.",
        time: "",
        color: fallbackColor,
        position: "Official Staff",
        accent: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
        isOfficial: true,
        isPinned: true,
        avatarUrl,
      };
    };

    return [
      findOfficial(
        "101",
        "FlyDnA Concierge",
        "from-amber-400 to-yellow-600",
        "/flydna_concierge_avatar.png",
      ),
      findOfficial(
        "102",
        "FlyDnA Travel Agent",
        "from-emerald-400 to-teal-600",
        "/flydna_travel_agent_avatar.png",
      ),
      findOfficial(
        "103",
        "FlyDnA Tech Support",
        "from-blue-400 to-indigo-600",
        "/flydna_tech_support_avatar.png",
      ),
    ];
  }, [contacts]);

  // Regular contacts & groups (excluding the 3 official contacts)
  const regularContacts = useMemo(() => {
    const officialIds = new Set(["101", "102", "103"]);
    return contacts.filter(
      (c) => !officialIds.has(String(c.id)) && !c.isOfficial,
    );
  }, [contacts]);

  // Advanced Fuzzy Search Engine over Name, Username/Handle, Phone, and Email
  const cleanQuery = searchQuery
    .trim()
    .toLowerCase()
    .replace(/[@\s\-\(\)\.]/g, "");
  const filterFn = (contact: Contact) => {
    if (!cleanQuery) return true;
    const nameMatch = contact.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const handle =
      (contact as any).username ||
      (contact as any).handle ||
      contact.name.replace(/\s+/g, "").toLowerCase();
    const handleMatch = handle.toLowerCase().includes(cleanQuery);
    const phoneRaw =
      (contact as any).phone || (contact as any).phoneNumber || "";
    const phoneClean = phoneRaw.replace(/[^\d]/g, "");
    const phoneMatch =
      phoneClean.includes(cleanQuery) ||
      phoneRaw.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = ((contact as any).email || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return nameMatch || handleMatch || phoneMatch || emailMatch;
  };

  const filteredOfficial = officialContacts.filter(filterFn);
  const filteredRegular = regularContacts.filter(filterFn);

  const handleManualAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactQuery.trim()) return;
    setIsManualAdding(true);
    setManualAddError(null);

    const token = getAuthToken();
    try {
      const searchRes = await fetch(
        `${BASE_URL}/api/contacts/search?q=${encodeURIComponent(newContactQuery.trim())}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {},
        },
      );
      const searchData = await searchRes.json();
      const targetUser =
        searchData?.data?.[0] || searchData?.users?.[0] || searchData?.user;

      if (!targetUser) {
        setManualAddError("No user found with that username, email, or phone");
        setIsManualAdding(false);
        return;
      }

      setFoundUser(targetUser);
    } catch (err: any) {
      setManualAddError(err.message || "Failed to add contact");
    } finally {
      setIsManualAdding(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsGroupCreating(true);
    setGroupCreateError(null);

    const token = getAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}`, "auth-token": token }
            : {}),
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          memberIds: selectedMembers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create group");
      }

      setNewGroupName("");
      setSelectedMembers([]);
      setIsCreateGroupOpen(false);
      ChatManager.refreshContacts();
    } catch (err: any) {
      setGroupCreateError(err.message || "Failed to create group");
    } finally {
      setIsGroupCreating(false);
    }
  };

  const renderContactCard = (
    contact: Contact,
    idx: number,
    isFixedOfficial = false,
  ) => {
    const isDeletable =
      !contact.isOfficial &&
      !["101", "102", "103"].includes(String(contact.id)) &&
      (contact.isGroup || Boolean(onRemove));

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (contact.isGroup) {
        if (
          !window.confirm(
            `Leave ${contact.name}? You'll stop receiving messages.`,
          )
        )
          return;
        try {
          const token = getAuthToken();
          const res = await fetch(`${BASE_URL}/api/groups/${contact.id}`, {
            method: "DELETE",
            headers: {
              ...(token
                ? { Authorization: `Bearer ${token}`, "auth-token": token }
                : {}),
            },
          });
          if (res.ok) window.location.reload();
          else alert("Could not leave group.");
        } catch {
          alert("Could not leave group.");
        }
      } else if (onRemove) {
        if (window.confirm(`Remove ${contact.name} from your contacts?`)) {
          onRemove((contact as any).contactId || contact.id);
        }
      }
    };

    const avatarSrc = contact.isGroup
      ? (contact as any).groupAvatar || contact.avatarUrl
      : contact.avatarUrl ||
        (contact as any).profileImage ||
        (contact as any).profilePicture;

    const unreadCount = Number((contact as any).unread || 0);

    return (
      <div
        key={`${contact.id}-${idx}`}
        onClick={() => onSelect(contact.id)}
        className={`group relative flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors duration-150 cursor-pointer select-none ${
          selectedId === contact.id
            ? "border-cyan-400/30 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
            : isFixedOfficial
              ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
              : "border-transparent bg-transparent hover:bg-white/[0.04] hover:border-white/5"
        }`}
      >
        {/* 1. Unified Avatar Container - exactly size-10 (40px) with hover-to-delete overlay */}
        <div className="relative size-10 shrink-0 group/avatar">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={contact.name}
              className="size-full rounded-full object-cover border border-white/10"
            />
          ) : contact.isGroup ? (
            <div className="size-full rounded-full bg-slate-800/80 border border-white/10 grid place-items-center text-slate-300">
              <Users size={17} />
            </div>
          ) : (
            <div
              className={`size-full rounded-full bg-gradient-to-br ${contact.color || "from-slate-700 to-slate-800"} border border-white/10 grid place-items-center text-xs font-semibold text-white uppercase`}
            >
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}

          {/* Status Indicator */}
          {contact.status === "Online" && (
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[#06111f] group-hover/avatar:opacity-0 transition-opacity" />
          )}

          {/* Delete Contact overlay on profile pic hover */}
          {isDeletable && (
            <button
              type="button"
              onClick={handleDelete}
              className="absolute inset-0 rounded-full bg-red-600/85 text-white opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md z-10"
              title={contact.isGroup ? "Leave group" : "Remove contact"}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* 2. Middle Content Column: Clean Unified Typography */}
        <div className="min-w-0 flex-1">
          {/* Contact Name & Clean Badges */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-sm font-semibold text-white">
              {contact.name}
            </span>
            {contact.isOfficial && (
              <ShieldCheck size={13} className="text-cyan-400 shrink-0" />
            )}
          </div>

          {/* Subtitle / Handle / Message Snippet */}
          <p className="truncate text-xs text-slate-400 mt-0.5">
            {contact.isOfficial
              ? contact.id === "101"
                ? "VIP Lifestyle & Reservations • 24/7"
                : contact.id === "102"
                  ? "Flights & Travel Desk"
                  : "Technical Support"
              : contact.isGroup
                ? contact.lastMessage ||
                  `${contact.memberIds?.length || 2} members`
                : isPhonePrivacyActive
                  ? `@${(contact as any).username || (contact as any).handle || contact.name.replace(/\s+/g, "").toLowerCase()}`
                  : `${(contact as any).phone || (contact as any).phoneNumber || `@${contact.name.replace(/\s+/g, "").toLowerCase()}`}`}
          </p>
        </div>

        {/* 3. Right Action Column: Time and Unread Count */}
        <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5">
          {contact.time ? (
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap min-h-[18px]">
              {contact.time}
            </span>
          ) : (
            <div className="min-h-[18px]" />
          )}

          {/* Bottom Row: Fully Rounded Circular Unread Badge */}
          {unreadCount > 0 ? (
            <span className="min-w-5 h-5 px-1 rounded-full aspect-square bg-cyan-500 text-[10px] font-extrabold text-slate-950 flex items-center justify-center shadow-sm shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : (
            <div className="size-5" />
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="glass-panel-heavy h-full flex flex-col overflow-hidden rounded-[26px] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
      {/* Sleek Layout Header matching Hector's Screenshot */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent tracking-tight">
          Contacts
        </h2>

        {/* Action Buttons: [ 🔍 Search ] [ 👤+ Add Contact ] [ ⋯ More Options ] */}
        <div className="flex items-center gap-2.5">
          {/* 1. Search Icon Button */}
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsAddContactOpen(false);
                setIsCreateGroupOpen(false);
                setIsMoreMenuOpen(false);
              }}
              className={`glass-button glass-sheen size-10 grid place-items-center rounded-full text-slate-300 hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all ${
                isSearchOpen ? "glass-button-active" : ""
              }`}
              title="Search Contacts"
            >
              {isSearchOpen ? <X size={19} /> : <Search size={19} />}
            </button>

            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-12 w-[270px] h-fit overflow-hidden flex flex-col z-50 glass-panel-heavy border border-cyan-400/20 bg-[#06111f]/94 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 text-white"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="font-bold text-sm text-cyan-300">
                      Search Contacts
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Username, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Add Contact Dropdown Icon Button */}
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => {
                setIsAddContactOpen(!isAddContactOpen);
                setIsSearchOpen(false);
                setIsCreateGroupOpen(false);
                setIsMoreMenuOpen(false);
              }}
              className={`glass-button glass-sheen size-10 grid place-items-center rounded-full text-slate-300 hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all ${
                isAddContactOpen ? "glass-button-active" : ""
              }`}
              title="Add New Contact"
            >
              <UserPlus size={19} />
            </button>

            <AnimatePresence>
              {isAddContactOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-12 w-[310px] h-fit overflow-hidden flex flex-col z-50 bg-[#06111f]/98 border border-cyan-500/30 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[22px] p-5 text-white"
                >
                  {/* Title */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <span className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <UserPlus size={17} className="text-cyan-300" /> Add New
                      Contact
                    </span>
                    <button
                      onClick={() => setIsAddContactOpen(false)}
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleManualAddContact} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Username, email, or phone..."
                      value={newContactQuery}
                      onChange={(e) => setNewContactQuery(e.target.value)}
                      className="w-full bg-[#030914] border border-cyan-500/25 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60 transition shadow-inner"
                    />

                    {foundUser && (
                      <div className="flex flex-col items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-cyan-400/10 text-center my-1">
                        <div className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&>*]:w-full [&>*]:h-full">
                          <Avatar
                            name={foundUser.name}
                            gradient={foundUser.color}
                            size="md"
                            avatarUrl={
                              foundUser.profileImage || foundUser.avatarUrl
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-extrabold text-white truncate max-w-[200px]">
                            {foundUser.name}
                          </span>
                          <span className="text-[10px] text-cyan-300 font-bold">
                            {foundUser.email || "FlyDnA Member"}
                          </span>
                        </div>
                        {contacts.some(
                          (c) => String(c.id) === String(foundUser.userId),
                        ) ? (
                          <span className="text-xs text-slate-400 font-semibold mt-1">
                            Already in your contacts
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleAddSyncedContact(foundUser.userId)
                            }
                            className="w-full mt-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                          >
                            + Add to Contacts
                          </button>
                        )}
                      </div>
                    )}

                    {manualAddError && (
                      <span className="text-xs text-red-400 block text-center font-semibold">
                        {manualAddError}
                      </span>
                    )}

                    {!foundUser && (
                      <button
                        type="submit"
                        disabled={isManualAdding}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-xs uppercase tracking-wider text-white transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isManualAdding ? "Searching..." : "Search User"}
                      </button>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Horizontal Three Dots Button (Far Right) */}
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => {
                setIsMoreMenuOpen(!isMoreMenuOpen);
                setIsSearchOpen(false);
                setIsAddContactOpen(false);
              }}
              className={`glass-button glass-sheen size-10 grid place-items-center rounded-full text-slate-300 hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all ${
                isMoreMenuOpen ? "glass-button-active" : ""
              }`}
              title="More Actions"
            >
              <MoreHorizontal size={19} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-12 w-[235px] overflow-hidden flex flex-col z-50 glass-panel-heavy border border-cyan-400/25 bg-[#06111f]/95 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-2xl p-2 text-white"
                >
                  {/* Create New Group */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsCreateGroupOpen(true);
                    }}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/10 transition text-left text-xs font-semibold text-slate-200 hover:text-white cursor-pointer group"
                  >
                    <div className="size-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-500/30 transition shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold truncate">
                        Create New Group
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        Start group chat
                      </span>
                    </div>
                  </button>

                  {/* Google Contacts Import */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleGoogleImport();
                    }}
                    disabled={isSyncingGoogle}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/10 transition text-left text-xs font-semibold text-slate-200 hover:text-white cursor-pointer group disabled:opacity-50"
                  >
                    <div className="size-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-500/30 transition shrink-0">
                      <Download
                        size={16}
                        className={isSyncingGoogle ? "animate-spin" : ""}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold truncate">Google Import</span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {isSyncingGoogle ? "Syncing..." : "Sync contacts"}
                      </span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-white/10" />

                  {/* Privacy Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhonePrivacyActive(!isPhonePrivacyActive);
                    }}
                    className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-white/10 transition text-left text-xs font-semibold text-slate-200 hover:text-white cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                          isPhonePrivacyActive
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <Lock size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">
                          Phone Privacy
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {isPhonePrivacyActive
                            ? "Numbers hidden"
                            : "Numbers visible"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        isPhonePrivacyActive
                          ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                          : "bg-slate-800/60 border-white/10 text-slate-500"
                      }`}
                    >
                      {isPhonePrivacyActive ? "LOCKED" : "OFF"}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Create Group Chat Popover */}
            <AnimatePresence>
              {isCreateGroupOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-12 w-[310px] h-fit overflow-hidden flex flex-col z-50 bg-[#06111f]/98 border border-cyan-500/30 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[22px] p-5 text-white"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <span className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Users size={17} className="text-cyan-300" /> Create Group
                      Chat
                    </span>
                    <button
                      onClick={() => setIsCreateGroupOpen(false)}
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Group Name..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-[#030914] border border-cyan-500/25 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60 transition shadow-inner"
                      required
                    />

                    <div className="max-h-36 overflow-y-auto space-y-1 contacts-scrollbar border border-white/5 p-1.5 rounded-xl bg-slate-950/60">
                      {contacts
                        .filter((c) => !c.isGroup && !c.isOfficial)
                        .map((c, idx) => (
                          <label
                            key={`${c.id}-${idx}`}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(c.id)}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setSelectedMembers((prev) => [...prev, c.id]);
                                else
                                  setSelectedMembers((prev) =>
                                    prev.filter((id) => id !== c.id),
                                  );
                              }}
                              className="accent-cyan-400 rounded"
                            />
                            <span className="font-semibold truncate text-slate-200">
                              {c.name}
                            </span>
                          </label>
                        ))}
                    </div>

                    {groupCreateError && (
                      <span className="text-red-400 text-xs block text-center font-semibold">
                        {groupCreateError}
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isGroupCreating}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-xs uppercase tracking-wider text-white transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isGroupCreating ? "Creating..." : "Create Group"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Google Sync Floating Results (if active) */}
      {googleSyncResults && (
        <div className="mb-3 p-3 rounded-2xl bg-[#081528] border border-cyan-500/30 text-white shadow-xl max-h-56 overflow-y-auto navy-cyan-scrollbar">
          <div className="flex justify-between items-center border-b border-white/10 pb-1.5 sticky top-0 bg-slate-900/95 z-10">
            <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">
              📥 Google Contacts Sync
            </span>
            <button
              onClick={() => setGoogleSyncResults(null)}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-white text-[10px] block mt-2">
              Registered on FlyDnA ({googleSyncResults.registered.length})
            </span>
            {googleSyncResults.registered.length === 0 ? (
              <span className="text-slate-400 block text-[11px]">
                No registered members found.
              </span>
            ) : (
              googleSyncResults.registered.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-white block text-xs truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono block truncate">
                      {user.email ||
                        (isPhonePrivacyActive
                          ? user.phone?.replace(/\d(?=\d{4})/g, "*")
                          : user.phone)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddSyncedContact(user.userId)}
                    disabled={addedUserIds.has(user.userId)}
                    className="px-2.5 py-1 rounded-md bg-cyan-500 text-slate-950 font-black text-[9px] uppercase tracking-wider hover:bg-cyan-400 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {addedUserIds.has(user.userId) ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              ))
            )}
          </div>

          {googleSyncResults.unregistered.length > 0 && (
            <div className="space-y-1.5 mt-4 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-300 text-[10px] block">
                  Not on FlyDnA ({googleSyncResults.unregistered.length})
                </span>
                <button
                  onClick={handleInviteAll}
                  className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] hover:bg-purple-500/30 transition cursor-pointer font-semibold uppercase"
                >
                  Invite All
                </button>
              </div>

              {googleSyncResults.unregistered.map((contact, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-white block text-xs truncate">
                      {contact.name || "Unknown"}
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono block truncate">
                      {contact.email ||
                        (isPhonePrivacyActive
                          ? contact.phone?.replace(/\d(?=\d{4})/g, "*")
                          : contact.phone)}
                    </span>
                  </div>
                  {contact.email ? (
                    <button
                      onClick={() =>
                        handleInviteContact(contact.name, contact.email)
                      }
                      disabled={
                        invitedEmails.has(contact.email) ||
                        isInvitingEmails.has(contact.email)
                      }
                      className="px-2.5 py-1 rounded-md bg-purple-500 text-white font-black text-[9px] uppercase tracking-wider hover:bg-purple-400 transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {invitedEmails.has(contact.email)
                        ? "✓ Invited"
                        : isInvitingEmails.has(contact.email)
                          ? "..."
                          : "Invite"}
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-500">No Email</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs matching Screenshot 1: [ All ] [ Favorites ] [ 🟢 Online ] */}
      <div className="mb-4 flex items-center justify-between gap-1 rounded-full bg-white/[0.03] p-1.5 border border-white/10 backdrop-blur-sm max-w-[260px] shrink-0">
        {(["All", "Favorites", "Online"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onFilterChange(tab)}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              filter === tab
                ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "Online" && (
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            )}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Scoped styles to hide scrollbar while preserving scroll functionality */}
      <style>{`
        .contacts-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
        }
        .contacts-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
          overflow-x: hidden !important;
        }
      `}</style>

      {/* Scrollable list of contacts with the 3 important contacts at the top */}
      <div
        className={`contacts-scrollbar flex-1 space-y-2.5 overflow-y-auto overflow-x-hidden pt-1 px-1 pr-1 transition-all duration-300 ${isPhonePrivacyActive ? "blur-[6px] opacity-60 hover:blur-none hover:opacity-100" : ""}`}
      >
        {/* 3 Important Contacts at the Top (Concierge, Travel Agent, Tech Support) */}
        {filteredOfficial.map((contact, idx) =>
          renderContactCard(contact, idx, true),
        )}

        {/* Regular contacts & groups */}
        {filteredRegular.map((contact, idx) =>
          renderContactCard(contact, idx + filteredOfficial.length, false),
        )}

        {filteredOfficial.length === 0 && filteredRegular.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-xs">
            <span>
              {searchQuery
                ? `No contacts match "${searchQuery}"`
                : "No contacts found"}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
