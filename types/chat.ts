import { LucideIcon } from "lucide-react";

export type Contact = {
  id: string;
  contactId?: string;
  isInvisible?: boolean;
  name: string;
  status: "Online" | "Typing..." | "Offline" | "Group";
  lastMessage: string;
  time: string;
  color: string;
  position: string;
  accent: string;
  isOfficial?: boolean;
  isPinned?: boolean;
  avatarUrl?: string;
  activeSceneId?: number;
  muted?: boolean;
  isGroup?: boolean;
  memberIds?: string[];
};

export type Message = {
  id: number;
  from: "me" | "them";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  senderId?: string;
  senderName?: string; // populated for incoming group messages so the bubble can show the real name
};

export type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
};
