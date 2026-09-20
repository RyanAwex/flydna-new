import { useState } from "react";
import { useRouter } from "next/navigation";
import { navItems } from "@/constants/data";
import { useTheme } from "@/context/ThemeContext";

// Maps a nav label to its route path.
const labelToPath: Record<string, string> = {
  Lobby: "/",
  Profile: "/profile",
  Finance: "/finance",
  Travel: "/travel",
  Character: "/travel/character",
  Memberships: "/travel/subscription",
  Store: "/store",
  NASC: "/nasc"
};

export function useHeaderNav(initialTab: string) {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleActiveTabChange = (tab: string) => {
    setActiveTab(tab);
    const path = labelToPath[tab];
    if (path) router.push(path);
  };

  return {
    isDarkMode,
    toggleDarkMode,
    activeTab,
    handleActiveTabChange,
  };
}
