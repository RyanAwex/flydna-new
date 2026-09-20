import { Home, User, Plane, Wallet, ShoppingBag, Compass } from "lucide-react";
import { Contact, Message, NavItem } from "../types/chat";

export const contacts: Contact[] = [
  {
    id: "101",
    name: "FlyDnA Concierge",
    status: "Online",
    lastMessage: "Welcome to FlyDnA Concierge service.",
    time: "",
    color: "from-amber-400 to-yellow-600",
    position: "left-[50%] top-[50%]",
    accent: "bg-emerald-400",
    isOfficial: true,
    isPinned: true,
    avatarUrl: "/flydna_concierge_avatar.png",
  },
  {
    id: "102",
    name: "FlyDnA Travel Agent",
    status: "Online",
    lastMessage: "Ready to assist you with your travels.",
    time: "",
    color: "from-emerald-400 to-teal-600",
    position: "left-[30%] top-[30%]",
    accent: "bg-emerald-400",
    isOfficial: true,
    isPinned: true,
    avatarUrl: "/flydna_travel_agent_avatar.png",
  },
  {
    id: "103",
    name: "FlyDnA Tech Support",
    status: "Online",
    lastMessage: "System status: fully functional.",
    time: "",
    color: "from-blue-400 to-indigo-600",
    position: "left-[70%] top-[70%]",
    accent: "bg-emerald-400",
    isOfficial: true,
    isPinned: true,
    avatarUrl: "/flydna_tech_support_avatar.png",
  },
];

export const messages: Message[] = [
  { id: 1, from: "them", text: "See you soon!", time: "9:41 PM" },
  {
    id: 2,
    from: "me",
    text: "Can’t wait! Where should we meet?",
    time: "9:42 PM",
  },
  {
    id: 3,
    from: "them",
    text: "How about our usual spot? ☕",
    time: "9:43 PM",
  },
  { id: 4, from: "me", text: "Sounds perfect! 🙂", time: "9:44 PM" },
  { id: 5, from: "them", text: "Great! I’ll meet you there.", time: "9:45 PM" },
];

export const navItems: NavItem[] = [
  { label: "Lobby", icon: Home, active: true },
  { label: "Profile", icon: User },
  { label: "Finance", icon: Wallet },
  { label: "Travel", icon: Plane },
  { label: "Store", icon: ShoppingBag },
  { label: "NASC", icon: Compass },
  { label: "Memberships", icon: Wallet },
];
