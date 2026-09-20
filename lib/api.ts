import { Contact, Message } from "@/types/chat";
import { contacts as initialContacts, messages as initialMessages } from "@/constants/data";
import { io, Socket } from "socket.io-client";
import { encryptMessage, decryptMessage, isEncryptedPayload } from "./crypto";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("flydna_token");
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("flydna_token", token);
  }
};

export const clearAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("flydna_token");
    localStorage.removeItem("flydna_user");
  }
};

const getHeaders = (customHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["auth-token"] = token;
  }
  return headers;
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}, fallbackData: T): Promise<T> {
  const token = getAuthToken();
  const isPublic = ["/api/auth/"].some((prefix) => endpoint.startsWith(prefix));
  if (!token && !isPublic) return fallbackData;

  const url = `${BASE_URL}${endpoint}`;
  const headers = getHeaders((options.headers as Record<string, string>) || {});

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      try {
        const errorData = await response.clone().json();
        if (errorData?.error === 'SESSION_REVOKED') {
          clearAuthToken();
          if (typeof window !== "undefined") {
            alert("You have been logged out because this account was accessed from another device.");
            window.location.href = "/auth";
          }
        }
      } catch (e) {}
      return fallbackData;
    }

    if (!response.ok) return fallbackData;
    
    const data = await response.json();
    if (data && typeof data === "object" && (data.success === true || data.status === "success") && "data" in data) {
      return data.data as T;
    }
    return data as T;
  } catch (error) {
    return fallbackData;
  }
}

class ChatManagerClass {
  private contacts: Contact[] = [...initialContacts];
  private chatThreads: Record<string, Message[]> = { 1: [...initialMessages] };
  private listeners: Set<() => void> = new Set();
  private isLoaded = false;
  private socket: Socket | null = null;

  disconnect() {
    try { this.socket?.disconnect(); } catch (e) {}
    this.socket = null;
  }

  wake() {
    try { this.socket?.disconnect(); } catch (e) {}
    this.socket = null;
    this.chatThreads = {};
    this.initSocket();
    this.fetchRealContacts();
    this.notify();
  }
  private incomingCallListeners: Set<(call: any) => void> = new Set();
  private callAcceptedListeners: Set<(data: any) => void> = new Set();
  private callEndedListeners: Set<(data?: any) => void> = new Set();
  private incomingPttListeners: Set<(data: any) => void> = new Set();
  private pttEndedListeners: Set<() => void> = new Set();

  onIncomingCall(listener: (call: any) => void): () => void {
    this.incomingCallListeners.add(listener);
    return () => this.incomingCallListeners.delete(listener);
  }
  onCallAccepted(listener: (data: any) => void): () => void {
    this.callAcceptedListeners.add(listener);
    return () => this.callAcceptedListeners.delete(listener);
  }

  onCallEnded(listener: (data?: any) => void): () => void {
    this.callEndedListeners.add(listener);
    return () => this.callEndedListeners.delete(listener);
  }

  onIncomingPTT(listener: (data: any) => void): () => void {
    this.incomingPttListeners.add(listener);
    return () => this.incomingPttListeners.delete(listener);
  }

  onPTTEnded(listener: () => void): () => void {
    this.pttEndedListeners.add(listener);
    return () => this.pttEndedListeners.delete(listener);
  }


  getSocket(): Socket | null {
    return this.socket;
  }

  private initSocket() {
    if (this.socket) return;
    const token = getAuthToken();
    if (!token) return;

    const socket = io(BASE_URL, { transports: ["websocket", "polling"] });
    this.socket = socket;

    socket.on("connect", () => {
      let userId = "";
      try {
        const raw = localStorage.getItem("flydna_user");
        if (raw) userId = JSON.parse(raw)?._id || "";
      } catch (e) {}
      socket.emit("authenticate", { token, userId });
    });

    socket.on("force_logout", (data: any) => {
      localStorage.removeItem("flydna_token");
      localStorage.removeItem("flydna_user");
      if (typeof window !== "undefined") {
        alert("You have been logged out because this account was accessed from another device.");
        window.location.href = "/auth";
      }
    });

    socket.on("incomingMessage", async (data: any) => {
      const myId = this.getCurrentUserId();
      const fromId = data.fromUserId || data.from;
      const threadId = fromId === myId ? data.toUserId : fromId;
      const rawText = data.message || data.text || "";
      const decryptedText = await decryptMessage(rawText);

      const msg: Message = {
        id: Date.now(),
        from: fromId === myId ? "me" : "them",
        text: decryptedText,
        time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };
      this.chatThreads[threadId] = [...(this.chatThreads[threadId] || []), msg];
      this.notify();

      if (fromId !== myId) {
        const contactName = this.contacts.find(c => c.id === fromId)?.name || "Contact";
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("flydna-new-notification", {
            detail: { message: `💬 New message from ${contactName}: "${msg.text.substring(0, 30)}${msg.text.length > 30 ? '...' : ''}"` }
          }));
        }
      }
    });

    const handleIncomingCall = (data: any) => {
      if (!data) return;
      const myId = String(this.getCurrentUserId() || "");
      const callerId = String(data.callerId || data.fromUserId || "");

      // Ignore self-originated call events on the caller's own client
      if (callerId && myId && callerId === myId) return;

      const callerName = data?.callerName || data?.fromUserObj?.name || "Contact";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("flydna-new-notification", {
          detail: { message: `📞 Incoming ${data?.isVideoEnabled ? 'video' : 'voice'} call from ${callerName}` }
        }));
      }
      this.incomingCallListeners.forEach((l) => l(data));
    };

    socket.on("incomingCallHandler", handleIncomingCall);
    socket.on("incomingCall", handleIncomingCall);
    socket.on("call", handleIncomingCall);

    const handleCallAccepted = (data: any) => {
      this.callAcceptedListeners.forEach((l) => l(data));
    };
    socket.on("incomingCallAcceptEventHandler", handleCallAccepted);
    socket.on("callAccepted", handleCallAccepted);

    const handleCallEnded = (data?: any) => {
      this.callEndedListeners.forEach((l) => l(data));
    };
    socket.on("callEnded", handleCallEnded);
    socket.on("endCall", handleCallEnded);
    socket.on("callCancelled", handleCallEnded);

    const handleIncomingPTT = (data: any) => {
      if (!data) return;
      this.incomingPttListeners.forEach((l) => l(data));
    };
    socket.on("incomingPTT", handleIncomingPTT);
    socket.on("ptt", handleIncomingPTT);

    const handlePTTEnded = () => {
      this.pttEndedListeners.forEach((l) => l());
    };
    socket.on("pttEnded", handlePTTEnded);


    socket.on("contactsUpdated", () => {
      this.fetchRealContacts();
    });

    const handleSceneUpdate = (data: any) => {
      if (typeof window !== "undefined" && data) {
        window.dispatchEvent(new CustomEvent("flydna-scene-updated", {
          detail: {
            userId: String(data.userId || data.fromUserId || ""),
            sceneId: Number(data.sceneId),
            hatId: data.hatId,
            isGroup: !!data.isGroup,
            groupId: data.groupId ? String(data.groupId) : undefined
          }
        }));
      }
    };
    socket.on("userSceneChanged", handleSceneUpdate);
    socket.on("userSceneUpdated", handleSceneUpdate);

    socket.on("newNotification", (data: any) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("flydna-new-notification", {
          detail: { message: data.message || "New notification" }
        }));
      }
    });

    const handleStatusUpdate = (data: any) => {
      const userId = data?.userId || data?.id || data?.fromUserId;
      const rawStatus = data?.status || (data?.online ? "online" : "offline");
      if (!userId) return;

      this.contacts = this.contacts.map((c) => {
        // Official 24/7 AI Staff (Concierge, Travel Agent, Tech Support) always stay Online
        if (["101", "102", "103"].includes(String(c.id)) || c.isOfficial) {
          return {
            ...c,
            status: "Online",
            isInvisible: false,
            accent: "bg-emerald-400 shadow-[0_0_8px_#34d399]"
          };
        }

        if (String(c.id) === String(userId)) {
          const isOnline = rawStatus === "online" || rawStatus === "live" || rawStatus === "Online";
          const isInvisible = rawStatus === "invisible";
          return {
            ...c,
            status: isInvisible ? "Offline" : (isOnline ? "Online" : "Offline"),
            isInvisible,
            accent: isOnline && !isInvisible ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-500"
          };
        }
        return c;
      });
      this.notify();
    };

    socket.on("userStatusChanged", handleStatusUpdate);
    socket.on("userOnline", (data: any) => handleStatusUpdate({ ...data, status: "online" }));
    socket.on("userOffline", (data: any) => handleStatusUpdate({ ...data, status: "offline" }));

    socket.on("incomingGroupMessage", (data: any) => {
      const myId = this.getCurrentUserId();
      const fromId = data.from || data.fromUserId || data.senderId;
      const threadId = data.to || data.toUserId || data.groupId;

      if (fromId === myId) return;

      const msgText = data.text || data.message || data.content || "";
      // Resolve sender name: check loaded contacts first, fall back to whatever the server sent
      const resolvedSenderName =
        this.contacts.find(c => c.id === fromId)?.name ||
        data.senderName ||
        data.fromUserName ||
        data.fromUser?.name ||
        undefined;

      const msg: Message = {
        id: data._id || Date.now(),
        from: "them",
        text: msgText,
        time: new Date(data.timestamp || data.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
        senderId: fromId,
        senderName: resolvedSenderName,
      };
      this.chatThreads[threadId] = [...(this.chatThreads[threadId] || []), msg];

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("flydna-group-message", {
          detail: { message: { id: msg.id, text: msgText }, senderId: fromId, senderName: resolvedSenderName }
        }));
      }
      const groupName = this.contacts.find(c => c.id === threadId)?.name || "Group";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("flydna-new-notification", {
          detail: { message: `${resolvedSenderName || "New message"} in ${groupName}`, fromUserId: String(threadId), type: "message" }
        }));
      }
      this.notify();
    });

    socket.on("groupCreated", (group: any) => {
      this.fetchRealContacts();
    });

    socket.on("groupMembersUpdated", (data: any) => {
      this.fetchRealContacts();
    });

    socket.on("connect_error", (e) => {
      console.warn("[FlyDnA] Socket connect error:", e.message);
    });
  }


  private saveThreadsToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("flydna_chat_threads", JSON.stringify(this.chatThreads));
    } catch (e) {
      console.error("[FlyDnA] Error saving chat threads:", e);
    }
  }

  private loadThreadsFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("flydna_chat_threads");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          this.chatThreads = { ...this.chatThreads, ...parsed };
        }
      }
    } catch (e) {
      console.error("[FlyDnA] Error loading chat threads:", e);
    }
  }

  async verifySession(): Promise<boolean> {
    const token = getAuthToken();
    if (!token) return false;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-auth-token": token,
        },
      });
      if (!res.ok) return true;
      const data = await res.json();

      if (data?.valid && data?.user) {
        if (typeof window !== "undefined") {
          const current = localStorage.getItem("flydna_user");
          if (!current) {
            localStorage.setItem("flydna_user", JSON.stringify(data.user));
          }
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  loadData() {
    if (this.isLoaded) return;
    this.isLoaded = true;

    if (typeof window !== "undefined") {
      try {
        const cachedRaw = localStorage.getItem("flydna_cached_contacts");
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached) && cached.length > 0) {
            const officialContacts = this.contacts.filter((c) => c.isOfficial);
            this.contacts = [...officialContacts, ...cached];
          }
        }
      } catch {}
    }

    this.verifySession();
    this.loadThreadsFromStorage();
    this.initSocket();
    this.fetchRealContacts();

    if (typeof window !== "undefined") {
      const handleProfileSettingsUpdate = () => {
        this.fetchRealContacts();
      };
      window.addEventListener("profile-settings-updated", handleProfileSettingsUpdate);
      window.addEventListener("flydna-preferences-changed", handleProfileSettingsUpdate);
      window.addEventListener("storage", handleProfileSettingsUpdate);
    }
  }

  refreshContacts() {
    this.fetchRealContacts();
  }

  private async fetchRealContacts() {
    try {
      const officialContacts = this.contacts.filter((c) => c.isOfficial);
      const [real, groupsRes, previewsRes] = await Promise.all([
        apiFetch<any[]>("/api/contacts", {}, []),
        apiFetch<any[]>("/api/groups", {}, []).catch(() => []),
        apiFetch<any[]>("/api/chat/previews", {}, []).catch(() => []),
      ]);

      const myId = this.getCurrentUserId();
      
      const previewMap: Record<string, any> = {};
      (Array.isArray(previewsRes) ? previewsRes : []).forEach((p: any) => { previewMap[String(p._id)] = p; });
      const fmtPreviewTime = (iso: string) => {
        try {
          const d = new Date(iso); const now = new Date();
          if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          if (now.getTime() - d.getTime() < 6 * 86400000) return d.toLocaleDateString([], { weekday: "short" });
          return d.toLocaleDateString([], { month: "short", day: "numeric" });
        } catch { return ""; }
      };
      let isUserInvisible = false;
      if (typeof window !== "undefined") {
        try {
          const togglesRaw = localStorage.getItem("flydna_pref_toggles");
          if (togglesRaw) {
            const toggles = JSON.parse(togglesRaw);
            isUserInvisible = toggles.privacyMode === false;
          }
        } catch {}
      }

      const mapped: Contact[] = (Array.isArray(real) ? real : []).map((c) => {
        const uId = String(c.userId || c._id || c.id || "");
        const isMe = uId === myId || c.userId === myId || c._id === myId;
        const status = isMe
          ? (isUserInvisible ? "Offline" : "Online")
          : (c.is_online ? "Online" : "Offline");
        const isOnline = status === "Online";

        return {
          id: uId,
          contactId: String(c.contactId || uId),
          name: c.name || "Unknown",
          status,
          lastMessage: (() => {
            const p = previewMap[uId];
            if (!p) return status;
            const text = p.lastType ? "\ud83c\udfa4 Voice note" : (p.lastMessage || "");
            return String(p.lastFrom) === String(myId) ? `you: ${text}` : text;
          })(),
          time: (() => { const p = previewMap[uId]; return p && p.lastAt ? fmtPreviewTime(p.lastAt) : ""; })(),
          unread: (() => { const p = previewMap[uId]; return (p && p.unread) || 0; })(),
          color: "from-cyan-400 to-blue-500",
          position: isMe ? "You" : "Traveler",
          accent: isOnline ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-500",
          isOfficial: false,
          avatarUrl: c.profileImage || c.img || undefined,
          activeSceneId: Number(c.activeSceneId || c.selectedSceneId || 3),
        };
      });

      let groupContacts: Contact[] = [];
      if (Array.isArray(groupsRes)) {
        groupContacts = groupsRes.map((g) => ({
          id: g._id,
          name: g.groupName,
          status: "Group",
          lastMessage: "Group Chat",
          time: "",
          color: "from-purple-500 to-indigo-500",
          position: "Group Chat",
          accent: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
          isOfficial: false,
          isGroup: true,
          memberIds: g.memberIds,
          avatarUrl: undefined,
        }));
      }

      this.contacts = [...officialContacts, ...groupContacts, ...mapped];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("flydna_cached_contacts", JSON.stringify([...groupContacts, ...mapped]));
        } catch {}
      }
      this.notify();
    } catch (err) {
      console.warn("[FlyDnA] Failed to fetch real contacts:", err);
      this.notify();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    this.loadData();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveThreadsToStorage();
    this.listeners.forEach((l) => l());
  }

  getContacts(): Contact[] {
    return Array.isArray(this.contacts) ? this.contacts : [];
  }

  updateUserScene(sceneId: number | string, hatId?: string, contactId?: string, isGroup?: boolean) {
    const sId = Number(sceneId);
    if (this.socket && this.socket.connected) {
      this.socket.emit("updateUserScene", { sceneId: sId, hatId, contactId, isGroup, toUserId: contactId });
      this.socket.emit("sceneUpdate", { sceneId: sId, hatId, toUserId: contactId, groupId: isGroup ? contactId : undefined, isGroup });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("flydna-scene-updated", {
          detail: {
            userId: this.getCurrentUserId(),
            sceneId: sId,
            hatId,
          },
        })
      );
    }
  }

  addLocalContact(newContact: Partial<Contact> & { name: string }): Contact {
    const id = newContact.id || `usr_custom_${Date.now()}`;
    const contact: Contact = {
      id,
      name: newContact.name,
      status: newContact.status || "Online",
      lastMessage: "Connected",
      time: "Just now",
      color: newContact.color || "from-cyan-400 to-blue-500",
      position: "Traveler",
      accent: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
      isOfficial: false,
      avatarUrl: newContact.avatarUrl,
    };
    this.contacts = [...this.contacts.filter((c) => c.id !== id), contact];
    this.notify();
    return contact;
  }

  getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("flydna_user");
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user?._id || null;
    } catch {
      return null;
    }
  }

  getMessages(contactId: string): Message[] {
    if (this.chatThreads[contactId] === undefined) {
      this.chatThreads[contactId] = [];
    }
    this.fetchRealMessages(contactId);
    return Array.isArray(this.chatThreads[contactId]) ? this.chatThreads[contactId] : [];
  }

  private async fetchRealMessages(contactId: string) {
    if (["101", "102", "103"].includes(contactId)) return;
    try {
      const myId = this.getCurrentUserId();
      const contact = this.contacts.find((c) => c.id === contactId);

      if (contact?.isGroup) {
        const real = await apiFetch<any[]>(`/api/groups/${contactId}/messages`, {}, []);
        const mapped: Message[] = (Array.isArray(real) ? real : []).map((m) => ({
          id: m._id || Date.now(),
          from: m.senderId === myId ? "me" : "them",
          text: m.content || "",
          time: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
          status: "read",
          senderId: m.senderId,
          // Forward sender name from history API — try common field shapes
          senderName: m.senderId === myId
            ? undefined
            : (m.senderName || m.fromUser?.name || m.sender?.name ||
               this.contacts.find(c => c.id === m.senderId)?.name),
        }));
        this.chatThreads[contactId] = mapped;
        this.notify();
        return;
      }

      const real = await apiFetch<any[]>(`/api/chat?userId=${contactId}`, {}, []);
      const mapped: Message[] = (Array.isArray(real) ? real : []).map((m) => ({
        id: m._id || Date.now(),
        from: m.fromUserId === myId ? "me" : "them",
        text: m.text || "",
        time: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        status: "read",
      }));
      this.chatThreads[contactId] = mapped;
      this.notify();
    } catch (err) {
      console.warn("[FlyDnA] Failed to fetch real messages:", err);
    }
  }

  private updateMessageStatus(contactId: string, msgId: number, status: "sent" | "delivered" | "read") {
    const thread = this.chatThreads[contactId];
    if (!thread) return;
    const updated = thread.map((m) => {
      if (m.id === msgId) {
        return { ...m, status };
      }
      return m;
    });
    this.chatThreads[contactId] = updated;
    this.notify();
  }

  async createGroup(groupName: string, memberIds: string[]): Promise<any> {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/api/groups/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}`, "auth-token": token } : {}),
      },
      body: JSON.stringify({ groupName, memberIds }),
    });
    if (!res.ok) throw new Error("Failed to create group");
    const responseJson = await res.json();
    const group = responseJson.data || responseJson;
    
    if (this.socket?.connected && group._id) {
      this.socket.emit("joinGroup", group._id);
    }
    
    await this.fetchRealContacts();
    return group;
  }

  async sendMessage(contactId: string, text: string) {
    if (!text.trim()) return;
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const tempMsg: Message = { id: Date.now(), from: "me", text: text.trim(), time: timeString, status: "sent" };
    this.chatThreads[contactId] = [...(this.chatThreads[contactId] || []), tempMsg];
    this.notify();

    const msgId = tempMsg.id;
    setTimeout(() => {
      this.updateMessageStatus(contactId, msgId, "delivered");
    }, 450);

    const contact = this.contacts.find((c) => c.id === contactId);
    if (contact?.isGroup) {
      setTimeout(() => {
        this.updateMessageStatus(contactId, msgId, "read");
      }, 1200);

      if (this.socket?.connected) {
        this.socket.emit("sendGroupMessage", { groupId: contactId, content: text.trim() });
        if (typeof window !== "undefined") {
          let myName = "You";
          try { myName = JSON.parse(localStorage.getItem("flydna_user") || "{}")?.name || "You"; } catch (e) {}
          window.dispatchEvent(new CustomEvent("flydna-group-message", {
            detail: { message: { id: msgId, text: text.trim() }, senderId: this.getCurrentUserId(), senderName: myName }
          }));
        }
      }
      return;
    }

    if (["101", "102", "103"].includes(contactId)) {
      setTimeout(() => {
        this.updateMessageStatus(contactId, msgId, "read");
      }, 1000);
    } else {
      setTimeout(() => {
        this.updateMessageStatus(contactId, msgId, "read");
      }, 2500);
    }

    if (this.socket?.connected) {
      if (["101", "102", "103"].includes(contactId)) {
        this.socket.emit("chatMessage", { toUserId: contactId, message: text.trim(), type: "text" });
      } else {
        const encryptedText = await encryptMessage(text.trim());
        this.socket.emit("chatMessage", { toUserId: contactId, message: encryptedText, type: "text" });
      }
    }
    if (["101", "102", "103"].includes(contactId)) {
      if (contactId === "101" || contactId === "102" || contactId === "103") {
        // Retrieve dynamic message history for backoffice agents
        const thread = this.chatThreads[contactId] || [];
        const messagesToSend = thread.map(m => ({
          role: m.from === "me" ? "user" : "assistant",
          content: m.text
        }));

        let userName: string | undefined;
        if (typeof window !== "undefined") {
          try {
            const rawUser = localStorage.getItem("flydna_user");
            if (rawUser) {
              userName = JSON.parse(rawUser).name || JSON.parse(rawUser).username;
            }
          } catch {}
        }

        const endpoint = 
          contactId === "101" ? "/api/concierge/chat" :
          contactId === "102" ? "/api/travel/chat" :
          "/api/support/chat";

        const agentName = 
          contactId === "101" ? "Concierge" :
          contactId === "102" ? "Travel Agent" :
          "Tech Support";

        try {
          const staffToken = typeof window !== "undefined" ? localStorage.getItem("flydna_token") : null;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}) },
            body: JSON.stringify({ messages: messagesToSend, userName })
          });
          const data = await res.json();
          if (data && data.reply) {
            const replyMsg: Message = {
              id: Date.now() + 1,
              from: "them",
              text: data.reply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "read"
            };
            this.chatThreads[contactId] = [...this.chatThreads[contactId], replyMsg];
            this.notify();

            // Auto-plot live map when AI includes location coordinates or mentions major landmarks in reply
            if (typeof window !== "undefined") {
              let targetLocation: { lat: number; lng: number; name: string } | null = null;

              if (replyMsg.text.includes("#map:")) {
                const matches = replyMsg.text.match(/#map:([^,\)]+),([^,\)]+),?([^\)]*)/g);
                if (matches && matches.length > 0) {
                  const firstMatch = matches[0].replace("#map:", "");
                  const [latStr, lngStr, rawName] = firstMatch.split(",");
                  const lat = parseFloat(latStr);
                  const lng = parseFloat(lngStr);
                  const name = (rawName || "AI Mapped Destination").replace(/\+/g, " ");
                  if (!isNaN(lat) && !isNaN(lng)) {
                    targetLocation = { lat, lng, name };
                  }
                }
              }

              // Fallback landmark detector for smart-board map interaction
              if (!targetLocation) {
                const lower = replyMsg.text.toLowerCase();
                if (lower.includes("state farm arena") || lower.includes("hawks")) {
                  targetLocation = { lat: 33.7573, lng: -84.3963, name: "State Farm Arena" };
                } else if (lower.includes("mercedes-benz") || lower.includes("falcons")) {
                  targetLocation = { lat: 33.7554, lng: -84.4010, name: "Mercedes-Benz Stadium" };
                } else if (lower.includes("truist park") || lower.includes("braves")) {
                  targetLocation = { lat: 33.8908, lng: -84.4678, name: "Truist Park" };
                } else if (lower.includes("ponce city")) {
                  targetLocation = { lat: 33.7725, lng: -84.3656, name: "Ponce City Market" };
                }
              }

              if (targetLocation) {
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent("flydna-plot-map-location", {
                      detail: targetLocation,
                    })
                  );
                }, 400);
              }
            }

            // ═══════════════════════════════════════════════════════════════
            // 🤝 AI STAFF CROSS-CONSULT — Automatic Specialist Tag-In
            // When a user's message spans multiple domains, the primary bot
            // tags in the relevant specialist who adds their own reply.
            // ═══════════════════════════════════════════════════════════════
            if (typeof window !== "undefined" && data.reply) {
              const userMsg = (messagesToSend[messagesToSend.length - 1]?.content || "").toLowerCase();
              const botReply = data.reply.toLowerCase();
              
              type ConsultSpec = { id: string; name: string; endpoint: string; intro: string };
              const specialists: Record<string, ConsultSpec> = {
                "101": { id: "101", name: "FlyDnA Concierge", endpoint: "/api/concierge/chat", intro: "I was looped in by our team." },
                "102": { id: "102", name: "FlyDnA Travel Agent", endpoint: "/api/travel/chat", intro: "I was brought in to assist with this." },
                "103": { id: "103", name: "FlyDnA Tech Support", endpoint: "/api/support/chat", intro: "I was tagged in to help diagnose this." },
              };

              const crossDomainRules: { keywords: string[]; targetId: string }[] = []; const _disabledRules = [
                // Concierge topics → tag in 101
                { keywords: ["restaurant", "reservation", "dinner", "lunch", "food", "eat", "bar", "nightclub", "club", "event", "ticket", "concert", "show"], targetId: "101" },
                // Travel Agent topics → tag in 102
                { keywords: ["flight", "fly", "airline", "airport", "hotel", "itinerary", "trip", "vacation", "travel", "book a flight", "plane"], targetId: "102" },
                // Tech Support topics → tag in 103
                { keywords: ["bug", "glitch", "crash", "error", "not working", "broken", "can't login", "password", "reset", "lag", "slow", "mute not"], targetId: "103" },
              ];

              const optOutPhrases = [
                "don't loop", "do not loop", "don't tag", "do not tag", 
                "no other parties", "single chat", "don't add", "stop tagging", 
                "no tag", "stop looping", "without looping", "don't cross"
              ];
              const userWantsNoLoop = optOutPhrases.some(p => userMsg.includes(p));

              const taggedSpecialists: ConsultSpec[] = [];
              if (!userWantsNoLoop) {
                for (const rule of crossDomainRules) {
                  if (rule.targetId === contactId) continue; // Don't tag yourself
                  const matchesUser = rule.keywords.some(k => userMsg.includes(k));
                  const matchesReply = botReply.includes("travel agent") || botReply.includes("concierge") || botReply.includes("tech support");
                  if (matchesUser || matchesReply) {
                    const spec = specialists[rule.targetId];
                    if (spec && !taggedSpecialists.find(s => s.id === spec.id)) {
                      taggedSpecialists.push(spec);
                    }
                  }
                }
              }

              // Inject specialist follow-up replies with a natural delay
              for (let si = 0; si < taggedSpecialists.length; si++) {
                const spec = taggedSpecialists[si];
                const delay = 1500 + (si * 1200); // Stagger each specialist

                setTimeout(async () => {
                  try {
                    // Build a context-aware prompt for the specialist
                    const consultMessages = [
                      { role: "user", content: `[Cross-consult from ${agentName}] A member asked: "${messagesToSend[messagesToSend.length - 1]?.content}". ${spec.intro} Please provide your specialized input in 2-3 sentences.` }
                    ];

                    const consultRes = await fetch(spec.endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ messages: consultMessages, userName })
                    });
                    const consultData = await consultRes.json();
                    if (consultData?.reply) {
                      const consultReply: Message = {
                        id: Date.now() + si + 100,
                        from: "them",
                        text: `📋 **${spec.name}** *(tagged in)*:\n\n${consultData.reply}`,
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        status: "read"
                      };
                      this.chatThreads[contactId] = [...(this.chatThreads[contactId] || []), consultReply];
                      this.notify();

                      // Airplane chime for the specialist tag-in
                      window.dispatchEvent(new CustomEvent("flydna-new-notification", {
                        detail: { message: `${spec.name} joined the conversation` }
                      }));
                    }
                  } catch (e) {
                    console.warn(`[FlyDnA] Cross-consult with ${spec.name} failed:`, e);
                  }
                }, delay);
              }
            }

            // Trigger visual notification event
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("flydna-new-notification", {
                detail: { message: `New message from ${agentName}: "${replyMsg.text.substring(0, 30)}${replyMsg.text.length > 30 ? '...' : ''}"` }
              }));
            }
          }
        } catch (err) {
          console.warn(`[FlyDnA] ${agentName} agent endpoint communication failed:`, err);
        }
      }
      return;
    }

    const token = getAuthToken();
    try {
      await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}`, "auth-token": token } : {}),
        },
        body: JSON.stringify({ userId: contactId, text: text.trim() }),
      });
    } catch (err) {
      console.warn("[FlyDnA] Failed to send message:", err);
    }
  }

  injectAgentMessage(contactId: string, text: string) {
    if (!text.trim()) return;
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const incomingMsg: Message = {
      id: Date.now(),
      from: "them",
      text: text.trim(),
      time: timeString,
      status: "read",
    };
    this.chatThreads[contactId] = [...(this.chatThreads[contactId] || []), incomingMsg];
    this.notify();
  }

  addContact(contactData: { name: string; email: string; phone: string }) {

    const newId = Date.now().toString();
    const newContact: Contact = {
      id: newId,
      name: contactData.name,
      avatarUrl: undefined,
      color: "from-cyan-400 to-blue-500",
      accent: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
      position: "Traveler",
      status: "Online",
      lastMessage: "Added to contacts",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOfficial: false,
    };
    this.contacts = [...this.contacts, newContact];
    this.notify();
  }

  isMuted(contactId: string): boolean {
    const contact = this.contacts.find((c) => c.id === contactId);
    return contact?.muted ?? false;
  }

  muteContact(contactId: string) {
    const contact = this.contacts.find((c) => c.id === contactId);
    if (!contact) return;
    const newMuted = !contact.muted;
    this.contacts = this.contacts.map((c) =>
      c.id === contactId ? { ...c, muted: newMuted } : c
    );
    this.notify();
    // Call API stub (fire-and-forget; swap URL for EC2 endpoint when ready)
    muteContactApi(contactId, newMuted).catch((err) =>
      console.warn("[FlyDnA] muteContact API call failed:", err)
    );
  }

  clearHistory(contactId: string) {
    if (["101", "102", "103"].includes(contactId)) {
      console.warn("[FlyDnA] FlyDnA Official Staff chat threads cannot be cleared.");
      return;
    }
    this.chatThreads[contactId] = [];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("flydna_chat_threads", JSON.stringify(this.chatThreads));
      } catch {}
    }
    this.notify();

    if (this.socket && this.socket.connected) {
      this.socket.emit("chatCleared", {
        contactId,
        userId: this.getCurrentUserId(),
      });
    }

    clearHistoryApi(contactId).catch((err) =>
      console.warn("[FlyDnA] clearHistory API call failed:", err)
    );
  }
}

export const ChatManager = new ChatManagerClass();

// ─── API Stub Functions ───────────────────────────────────────────────────────
// These call Next.js API routes today. When EC2 endpoints are ready,
// just swap BASE_URL + endpoint path below.

async function muteContactApi(contactId: string, muted: boolean): Promise<void> {
  const token = getAuthToken();
  await fetch(`/api/chat/mute`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ contactId, muted }),
  });
}

async function clearHistoryApi(contactId: string): Promise<void> {
  const token = getAuthToken();
  await fetch(`/api/chat/history/${contactId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// Auth Endpoints
export async function login(identifier: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const body = await res.json();
  if (res.ok) {
    const payload = body.data || body;
    if (payload.token) setAuthToken(payload.token);
    setTimeout(() => { try { ChatManager.wake(); } catch (e) {} }, 150);
    return { token: payload.token, user: payload };
  }
  throw new Error(body.message || body.error || "Login failed");
}

export async function register(profileData: any) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
  const body = await res.json();
  if (res.ok) {
    const payload = body.data || body;
    if (payload.token) setAuthToken(payload.token);
    setTimeout(() => { try { ChatManager.wake(); } catch (e) {} }, 150);
    return { token: payload.token, user: payload };
  }
  throw new Error(body.message || body.error || "Registration failed");
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json();
  if (res.ok) {
    return body;
  }
  throw new Error(body.message || body.error || "Password reset request failed");
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const body = await res.json();
  if (res.ok) {
    return body;
  }
  throw new Error(body.message || body.error || "Failed to reset password");
}



