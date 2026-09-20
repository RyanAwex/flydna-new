/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatManager } from "@/backend/chatManager";
import { ChatManager as SocketApi } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import { useCall } from "@/context/CallContext";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Bell,
  X,
  Moon,
  Sun,
  Trash2,
  Menu,
  LogOut,
} from "lucide-react";
import { navItems } from "@/constants/data";
import OrbitalWeatherWidget from "./OrbitalWeatherWidget";
import Link from "next/link";
import {
  cancelBookingByRef,
  getRemainingCancelTime,
  recordPurchase,
} from "@/lib/ledger";

type HeaderProps = {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function Header({
  isDarkMode,
  onThemeToggle,
  setActiveTab,
}: HeaderProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const {
    isCallActive,
    isCalling,
    endCall,
    isCallMuted,
    setIsCallMuted,
    activeCallPartnerId,
  } = useCall();
  // Mute is now controlled via CallContext (isCallMuted / setIsCallMuted)
  const [speakerOn, setSpeakerOn] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Checkout Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<
    "form" | "processing" | "success"
  >("form");
  const [checkoutRail, setCheckoutRail] = useState<
    "stripe" | "vault" | "ava" | "xrp"
  >("stripe");

  // Stripe form
  const [stripeName, setStripeName] = useState("");
  const [stripeCard, setStripeCard] = useState("");
  const [stripeExpiry, setStripeExpiry] = useState("");
  const [stripeCvc, setStripeCvc] = useState("");

  // Web3 & Vault
  const [vaultBalances, setVaultBalances] = useState({ xrp: 1000, ava: 500 });
  const [vaultTokenSelected, setVaultTokenSelected] = useState<"xrp" | "ava">(
    "xrp",
  );
  const [linkedEvm, setLinkedEvm] = useState<string | null>(null);
  const [linkedXrp, setLinkedXrp] = useState<string | null>(null);
  const [web3WalletAddress, setWeb3WalletAddress] = useState("");
  const [web3TxHash, setWeb3TxHash] = useState("");
  const [isWeb3Checking, setIsWeb3Checking] = useState(false);
  const [web3Balance, setWeb3Balance] = useState("0");
  const [web3VerifyError, setWeb3VerifyError] = useState("");

  useEffect(() => {
    if (isCheckoutOpen) {
      try {
        const storedBalances = localStorage.getItem("flydna_vault_balances");
        if (storedBalances) {
          setVaultBalances(JSON.parse(storedBalances));
        }

        const evm = localStorage.getItem("flydna_linked_evm_wallet");
        const xrp = localStorage.getItem("flydna_linked_xrp_wallet");
        setLinkedEvm(evm);
        setLinkedXrp(xrp);

        if (checkoutRail === "ava" && evm) {
          setWeb3WalletAddress(evm);
        }
      } catch (err) {}
    }
  }, [isCheckoutOpen, checkoutRail]);

  const checkWeb3Balance = async (address: string) => {
    if (!address.startsWith("0x")) {
      return "0";
    }
    try {
      const res = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xa1faa43eeb20352ef4006c05a14f4ac55f224811&address=${address}&tag=latest`,
      );
      const data = await res.json();
      if (data.status === "1" && data.result) {
        return (parseFloat(data.result) / 1e18).toString();
      }
    } catch {}
    return (100 + Math.random() * 50).toString(); // Fallback simulation
  };

  const verifyXrpPayment = async () => {
    if (!web3TxHash.trim()) {
      setWeb3VerifyError("Please enter a transaction hash");
      return;
    }
    setIsWeb3Checking(true);
    setWeb3VerifyError("");

    try {
      const token = localStorage.getItem("flydna_token");
      const res = await fetch("/api/web3/verify-xrp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "auth-token": token || "",
        },
        body: JSON.stringify({
          txHash: web3TxHash,
          requiredXrp: (cartTotal / 1.5).toFixed(2),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCheckoutStep("success");
        // Record purchase to ledger
        const orderTitle =
          cartItems.length === 1
            ? cartItems[0].product.name
            : `Store Order (${cartItems.length} items)`;
        recordPurchase({
          title: orderTitle,
          category: "Store",
          amount: cartTotal,
          merchant: "FlyDnA Store",
        });
        // Clear cart
        localStorage.removeItem("flydna_cart");
        setCartItems([]);
        window.dispatchEvent(new Event("cart-updated"));
        window.dispatchEvent(
          new CustomEvent("flydna-new-notification", {
            detail: {
              id: `store-${Date.now()}`,
              type: "store",
              title: "🛍️ Order Confirmed",
              message:
                "Your purchase has been processed and is being prepared for shipping.",
              time: "Just Now",
            },
          }),
        );
      } else {
        setWeb3VerifyError(
          data.error ||
            "Transaction hash verification failed on XRP ledger client",
        );
      }
    } catch {
      // Offline fallback: verify mock hashes
      if (
        web3TxHash.toUpperCase() === "MOCK_SUCCESS" ||
        web3TxHash.length >= 10
      ) {
        setTimeout(() => {
          setCheckoutStep("success");
          // Record purchase to ledger
          const orderTitle =
            cartItems.length === 1
              ? cartItems[0].product.name
              : `Store Order (${cartItems.length} items)`;
          recordPurchase({
            title: orderTitle,
            category: "Store",
            amount: cartTotal,
            merchant: "FlyDnA Store",
          });
          localStorage.removeItem("flydna_cart");
          setCartItems([]);
          window.dispatchEvent(new Event("cart-updated"));
          window.dispatchEvent(
            new CustomEvent("flydna-new-notification", {
              detail: {
                id: `store-${Date.now()}`,
                type: "store",
                title: "🛍️ Order Confirmed",
                message:
                  "Your purchase has been processed and is being prepared for shipping.",
                time: "Just Now",
              },
            }),
          );
        }, 1500);
      } else {
        setWeb3VerifyError(
          "Transaction hash verification failed on XRPL Sandbox",
        );
      }
    } finally {
      setIsWeb3Checking(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("flydna_token"));
    };
    checkAuth();
    window.addEventListener("auth-changed", checkAuth);
    return () => window.removeEventListener("auth-changed", checkAuth);
  }, []);

  const DEFAULT_HISTORIAN_BRIEFS = [
    {
      id: "news_traveler_1",
      message:
        "📰 TheTravel News: TSA Expands Biometric Facial Recognition at Major Airport Hubs (ATL, JFK, LAX) for zero-wait security clearance.",
      time: "Aviation Digest",
      category: "traveler_news",
    },
    {
      id: "news_traveler_2",
      message:
        "✈️ TheTravel News: Emirates Unveils Ultra-Luxury First Class Suites featuring Zero-Gravity Seats and Virtual Room Windows for 2026.",
      time: "Luxury Fleet News",
      category: "traveler_news",
    },
    {
      id: "news_traveler_3",
      message:
        "🚘 TheTravel News: Signature FBOs Upgrade Private Jet Terminals with High-Speed EV Chauffeur Dispatch Systems Across North America.",
      time: "FBO & Ground Intel",
      category: "traveler_news",
    },
    {
      id: "hist_morning_1",
      message:
        "📜 FlyDnA Historian Brief (Morning): On this day in 1911, Hiram Bingham reached Machu Picchu. High-altitude luxury charters connect Cuzco to private mountain lodges today.",
      time: "Morning Briefing",
      category: "historian",
    },
    {
      id: "hist_afternoon_1",
      message:
        "🏛️ FlyDnA Historian Brief (Afternoon): Old San Juan's cobalt streets were paved with 18th-century Spanish galleon furnace slag. Cruise the cobblestones in a private exotic car.",
      time: "Afternoon Lore",
      category: "historian",
    },
    {
      id: "hist_evening_1",
      message:
        "🌅 FlyDnA Historian Brief (Evening): Rome's catacombs span 150km beneath modern traffic. Want to walk these ancient streets yourself? Tap your Travel Agent to map out your next expedition.",
      time: "Evening Spotlight",
      category: "historian",
    },
  ];

  const getStoredLocalNotifs = (): any[] => {
    if (typeof window === "undefined") return DEFAULT_HISTORIAN_BRIEFS;
    try {
      const raw = localStorage.getItem("flydna_notifications_list");
      return raw ? JSON.parse(raw) : DEFAULT_HISTORIAN_BRIEFS;
    } catch {
      return DEFAULT_HISTORIAN_BRIEFS;
    }
  };

  const saveLocalNotifs = (list: any[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "flydna_notifications_list",
        JSON.stringify(list.slice(0, 50)),
      );
    } catch {}
  };

  // Fetch real notifications from EC2 & merge with local store
  const fetchNotifications = async () => {
    const token = localStorage.getItem("flydna_token");
    let remote: any[] = [];
    if (token) {
      setNotifLoading(true);
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
        const res = await fetch(`${apiBase}/api/notifications/`, {
          headers: { Authorization: `Bearer ${token}`, "auth-token": token },
        });
        if (res.ok) {
          const data = await res.json();
          remote = Array.isArray(data) ? data : (data.data ?? []);
        }
      } catch (err) {
        console.warn("[FlyDnA] Failed to fetch notifications:", err);
      } finally {
        setNotifLoading(false);
      }
    }

    // Read local AFTER the network await to prevent race conditions wiping out new local notifications
    const local = getStoredLocalNotifs();
    const combined = [...local, ...remote];
    // Dedupe by real id only (never by text — identical texts are separate events)
    const unique = combined.filter(
      (item, idx, self) =>
        idx ===
        self.findIndex((t) => (t._id || t.id) === (item._id || item.id)),
    );
    // Newest first — deterministic regardless of source (local cache vs server)
    unique.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
    // Group identical texts into one row with a count (Telegram-style)
    const grouped: any[] = [];
    for (const item of unique) {
      const key = item.message || item.text || "";
      const existing = grouped.find(
        (g) =>
          (g.message || g.text || "") === key || (g._baseText || "") === key,
      );
      if (existing) {
        existing._count = (existing._count || 1) + 1;
        existing._baseText = key;
        existing.message = `${key} (${existing._count})`;
        if (item.fromUserId && !existing.fromUserId)
          existing.fromUserId = item.fromUserId;
        if (item.type === "message") existing.type = "message";
        if (item.createdAt) existing.createdAt = item.createdAt;
      } else {
        grouped.push({ ...item, _baseText: key });
      }
    }
    setNotifications(grouped);
    saveLocalNotifs(grouped);
  };

  // Close bell on any click outside the bell zone
  useEffect(() => {
    if (!isBellOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest("[data-bell-zone]")) return;
      setIsBellOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isBellOpen]);

  // Live bell: subscribe to shared socket for real-time notifications
  useEffect(() => {
    let tries = 0;
    let sock: any = null;
    const onNotif = (n: any) => {
      const from = String(n?.from || "");
      const item = {
        id: "live-" + Date.now(),
        message: n?.message || "",
        fromUserId: n?.fromUserId || null,
        type: n?.type || (from === "103" || from === "102" ? "news" : "system"),
        data: n?.link ? { link: n.link } : n?.data || null,
        createdAt: new Date().toISOString(),
        read: false,
      };
      if (!item.message) return;
      setNotifications((prev) => [item, ...prev].slice(0, 50));
      try {
        new Audio("/sounds/airplane-chime.wav").play().catch(() => {});
      } catch {}
    };
    const attach = () => {
      sock = SocketApi.getSocket && SocketApi.getSocket();
      if (!sock) {
        if (++tries < 10) setTimeout(attach, 1500);
        return;
      }
      sock.on("newNotification", onNotif);
    };
    attach();
    return () => {
      try {
        if (sock) sock.off("newNotification", onNotif);
      } catch {}
    };
  }, []);

  const handleClearAllNotifications = async () => {
    try {
      localStorage.removeItem("flydna_notifications_list");
    } catch {}
    setNotifications([]);
    saveLocalNotifs([]);
    const token = localStorage.getItem("flydna_token");
    if (!token) return;
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      await fetch(`${apiBase}/api/notifications/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "auth-token": token },
      });
    } catch (err) {
      console.warn("[FlyDnA] Failed to clear notifications:", err);
    }
  };

  const handleAcceptRequest = async (senderId: string, notifId: string) => {
    const token = localStorage.getItem("flydna_token");
    if (!token) return;
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const res = await fetch(
        `${apiBase}/api/contact-requests/accept-by-sender`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "auth-token": token || "",
          },
          body: JSON.stringify({ senderId }),
        },
      );
      if (res.ok) {
        setNotifications((prev) => {
          const updated = prev.filter((n) => n._id !== notifId);
          saveLocalNotifs(updated);
          return updated;
        });
        window.dispatchEvent(new Event("profile-settings-updated"));
      }
    } catch (err) {
      console.warn("Failed to accept contact request:", err);
    }
  };

  const handleDeclineRequest = async (senderId: string, notifId: string) => {
    const token = localStorage.getItem("flydna_token");
    if (!token) return;
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const res = await fetch(`${apiBase}/api/contacts/requests/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "auth-token": token || "",
        },
        body: JSON.stringify({ senderId }),
      });
      if (res.ok) {
        setNotifications((prev) => {
          const updated = prev.filter((n) => n._id !== notifId);
          saveLocalNotifs(updated);
          return updated;
        });
      }
    } catch (err) {
      console.warn("Failed to decline contact request:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNewNotif = (e: any) => {
      if (e.detail?.message) {
        const customNotif = {
          _id: `notif-${Date.now()}`,
          type: e.detail?.type || "system",
          fromUserId: e.detail?.fromUserId || null,
          title: e.detail?.title || "🎉 Booking Confirmed",
          message: e.detail.message,
          read: false,
          createdAt: new Date().toISOString(),
        };

        // Persist locally so fetchNotifications doesn't wipe it out
        const local = getStoredLocalNotifs();
        saveLocalNotifs([customNotif, ...local]);

        setNotifications((prev) => [customNotif, ...prev]);
      }

      fetchNotifications();

      // Play airplane cabin ding-dong chime
      try {
        const audio = new Audio("/sounds/airplane-chime.wav");
        audio.volume = 0.45;
        audio.play().catch(() => {});
      } catch {}
    };

    const handleOpenCheckout = (e: any) => {
      setIsCheckoutOpen(true);
      setCheckoutStep("form");
      if (e?.detail?.rail) setCheckoutRail(e.detail.rail);
    };

    window.addEventListener("flydna-new-notification", handleNewNotif);
    window.addEventListener(
      "flydna-open-checkout",
      handleOpenCheckout as EventListener,
    );
    return () => {
      window.removeEventListener("flydna-new-notification", handleNewNotif);
      window.removeEventListener(
        "flydna-open-checkout",
        handleOpenCheckout as EventListener,
      );
    };
  }, []);

  // Dynamic cart states and syncing logic
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const syncCart = () => {
      try {
        const savedCart = localStorage.getItem("flydna_cart");
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        } else {
          setCartItems([]);
        }
      } catch (e) {
        console.error("Failed to read from localStorage", e);
      }
    };

    syncCart();
    window.addEventListener("cart-updated", syncCart);
    return () => window.removeEventListener("cart-updated", syncCart);
  }, []);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) =>
        acc + parseFloat(item.product.price) * (item.quantity || 1),
      0,
    );
  }, [cartItems]);

  const removeFromCart = (productId: number) => {
    try {
      const updatedCart = cartItems.filter(
        (item) => item.product.id !== productId,
      );
      setCartItems(updatedCart);
      localStorage.setItem("flydna_cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.error(e);
    }
  };
  const activeTabFromPath = useMemo(() => {
    if (pathname === "/") return "Lobby";
    if (pathname.startsWith("/travel/character")) return "Character";
    if (pathname.startsWith("/travel/subscription")) return "Memberships";

    const match = navItems.find((item) => {
      if (
        item.label === "Lobby" ||
        item.label === "Character" ||
        item.label === "Memberships"
      )
        return false;
      const expectedPath = `/${item.label.toLowerCase()}`;
      return (
        pathname === expectedPath || pathname.startsWith(`${expectedPath}/`)
      );
    });
    return match ? match.label : "Lobby";
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] max-w-[1872px] z-[100] glass-panel-heavy rounded-[28px] px-6 py-3 transition-[top,background-color,border-color,box-shadow] duration-200 ease-in-out ${
          isScrolled
            ? "top-1.5 !bg-black/30 !backdrop-blur-[20px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            : "top-1.5 md:top-2 shadow-[0_15px_35px_rgba(0,0,0,0.25)]"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                FlyDnA
              </h1>
              <p className="text-[10px] font-medium text-cyan-400/80 tracking-wide hidden sm:block">
                Connect. Chat. Explore.
              </p>
            </div>
          </div>

          {/* Compact Call Bar */}
          {(isCallActive || isCalling) && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border mr-3 ${isCallActive ? "bg-emerald-500/10 border-emerald-400/20" : "bg-blue-500/10 border-blue-400/20"}`}
            >
              <span
                className={`size-1.5 rounded-full animate-pulse ${isCallActive ? "bg-emerald-400" : "bg-blue-400"}`}
              />
              <span
                className={`text-[11px] font-semibold ${isCallActive ? "text-emerald-400" : "text-blue-400"}`}
              >
                {isCalling && !isCallActive ? "Calling..." : "In Call"}
              </span>
              {isCallActive && (
                <button
                  onClick={() => {
                    setIsCallMuted(!isCallMuted);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${isCallMuted ? "bg-yellow-500/20 border-yellow-400/30 text-yellow-400" : "bg-white/5 border-white/10 text-slate-300"}`}
                >
                  {isCallMuted ? "Unmute" : "Mute"}
                </button>
              )}
              <button
                onClick={() =>
                  endCall(activeCallPartnerId || (window as any).__callTarget)
                }
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 border border-red-400/30 text-red-400 hover:bg-red-500/30 transition cursor-pointer"
              >
                End
              </button>
            </div>
          )}
          {/* macOS Dock-like navigation menu with sliding glass active tab */}
          <nav className="hidden xl:flex items-center justify-center gap-2 p-1.5 rounded-[22px] bg-white/[0.02] border border-white/5 shadow-inner backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === activeTabFromPath;

              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`group relative flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "text-[var(--accent-secondary)] dark:text-cyan-200"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/35 to-[var(--accent-secondary)]/25 border border-[var(--accent-primary)]/30 shadow-[0_0_20px_rgba(139,115,87,0.3),_inset_0_1px_1px_rgba(255,255,255,0.15)] dark:from-cyan-500/20 dark:to-blue-600/15 dark:border-cyan-400/30 dark:shadow-[0_0_15px_rgba(0,174,255,0.25),_inset_0_1px_1px_rgba(255,255,255,0.15)]"
                      transition={{
                        duration: 0.2,
                      }}
                    />
                  )}

                  <span className="relative z-10">
                    <Icon
                      size={17}
                      className={
                        isActive
                          ? "drop-shadow-[0_0_8px_rgba(139,115,87,0.95)] dark:drop-shadow-[0_0_8px_rgba(0,174,255,0.95)] text-[var(--accent-secondary)] dark:text-cyan-200"
                          : "opacity-80 transition group-hover:opacity-100 group-hover:scale-108"
                      }
                    />
                    {item.badge && (
                      <span className="absolute -right-3 -top-3 grid size-5 place-items-center rounded-full bg-[var(--accent-primary)] dark:bg-cyan-500 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(139,115,87,0.45)] dark:shadow-[0_2px_8px_rgba(0,174,255,0.45)]">
                        {item.badge}
                      </span>
                    )}
                  </span>

                  <span className="relative z-10 tracking-wide">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right operations styled as glass control items */}
          <div className="flex items-center justify-end gap-2 md:gap-3">
            {isAuthenticated ? (
              <>
                {/* Shopping Cart Button */}
                <div className={`relative ${isCartOpen ? "z-[9999]" : "z-50"}`}>
                  <button
                    onClick={() => {
                      setIsCartOpen(!isCartOpen);
                      setIsBellOpen(false);
                      setIsMenuOpen(false);
                    }}
                    className={`glass-button glass-sheen size-9.5 grid place-items-center rounded-full text-slate-200 hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all ${
                      isCartOpen ? "glass-button-active" : ""
                    }`}
                  >
                    {isCartOpen ? <X size={17} /> : <ShoppingCart size={17} />}
                  </button>
                  {!isCartOpen && cartCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 z-[60] grid size-5 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(0,229,255,0.6)] border border-cyan-300/25 pointer-events-none">
                      {cartCount}
                    </span>
                  )}
                </div>

                {/* Bell Notifications Button & Dropdown */}
                <div className="relative z-50" data-bell-zone>
                  <button
                    onClick={() => {
                      setIsBellOpen(!isBellOpen);
                      setIsCartOpen(false);
                      setIsMenuOpen(false);
                      if (!isBellOpen) fetchNotifications();
                    }}
                    className={`glass-button glass-sheen size-9.5 grid place-items-center rounded-full text-slate-200 hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all ${
                      isBellOpen ? "glass-button-active" : ""
                    }`}
                  >
                    {isBellOpen ? <X size={17} /> : <Bell size={17} />}
                  </button>
                  {!isBellOpen && notifications.length > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 z-[60] grid size-5 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(0,229,255,0.6)] border border-cyan-300/25 pointer-events-none">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}

                  <AnimatePresence>
                    {isBellOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 28,
                        }}
                        style={{
                          transformOrigin: "top",
                          background:
                            "linear-gradient(135deg, rgba(6, 17, 31, 0.9), rgba(11, 26, 48, 0.8))",
                        }}
                        className="fixed md:absolute left-1/2 md:left-auto right-auto md:right-0 -translate-x-1/2 md:translate-x-0 top-20 md:top-13 w-[calc(100vw-2rem)] max-w-[340px] md:w-[300px] h-[350px] overflow-hidden flex flex-col z-50 glass-panel-heavy border border-cyan-400/20 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.55)] rounded-2xl"
                      >
                        <div className="flex flex-col h-full p-4 text-white">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                            <div className="flex items-center gap-2 text-cyan-300">
                              <Bell size={18} />
                              <span className="font-bold text-base">
                                Notifications
                              </span>
                            </div>
                          </div>

                          {/* Notifications list */}
                          <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 text-sm scrollbar-none">
                            {notifLoading ? (
                              <div className="text-center text-slate-400/50 py-12 text-xs animate-pulse">
                                Loading notifications...
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="text-center text-slate-400/50 py-12 text-xs">
                                No notifications.
                              </div>
                            ) : (
                              notifications.map((item: any, i: number) => {
                                const isContactRequest =
                                  item.type === "contact_request" &&
                                  item.fromUserId;
                                const msgText = item.message ?? item.text ?? "";
                                const isBookingNotif =
                                  msgText.includes("Confirmed") ||
                                  msgText.includes("Chauffeur") ||
                                  msgText.includes("FDNA-CAR") ||
                                  msgText.includes("Ref #");
                                const match = msgText.match(
                                  /#?(FDNA-CAR-\d+|FLY-CAR-\d+|FDNA-[A-Z0-9]+)/i,
                                );
                                const refCode = match ? match[1] : "FDNA-CAR";
                                const nType = String(item.type || "system");
                                const notifHref =
                                  item?.data?.link ||
                                  (nType === "message" && item.fromUserId
                                    ? "/?chat=" + item.fromUserId
                                    : null) ||
                                  (nType === "purchase" ||
                                  isBookingNotif ||
                                  /Order Confirmed|Booking Confirmed|ORD-|purchase has been processed/i.test(
                                    msgText,
                                  )
                                    ? "/finance"
                                    : null);
                                const openNotif = () => {
                                  if (!notifHref) return;
                                  setIsBellOpen(false);
                                  try {
                                    if (String(notifHref).startsWith("http"))
                                      window.open(notifHref, "_blank");
                                    else window.location.href = notifHref;
                                  } catch {}
                                };

                                return (
                                  <div
                                    key={item._id ?? i}
                                    onClick={openNotif}
                                    className={`p-2.5 rounded-xl border flex flex-col gap-1 transition ${
                                      notifHref
                                        ? "cursor-pointer hover:border-cyan-400/40 hover:bg-white/[0.04]"
                                        : ""
                                    } ${
                                      !item.read
                                        ? "bg-white/[0.03] border-white/10"
                                        : "bg-white/[0.01] border-white/5 opacity-75"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <span className="text-slate-200 leading-snug text-xs">
                                        {msgText || "Notification"}
                                      </span>
                                      {!item.read && (
                                        <span className="size-1.5 rounded-full flex-shrink-0 mt-1 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                      )}
                                    </div>
                                    {isContactRequest && (
                                      <div className="flex gap-2 mt-1.5">
                                        <button
                                          onClick={() =>
                                            handleAcceptRequest(
                                              item.fromUserId,
                                              item._id,
                                            )
                                          }
                                          className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black hover:brightness-110 active:scale-95 transition text-[11px] font-extrabold uppercase cursor-pointer"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeclineRequest(
                                              item.fromUserId,
                                              item._id,
                                            )
                                          }
                                          className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95 transition text-[11px] font-extrabold uppercase cursor-pointer"
                                        >
                                          Decline
                                        </button>
                                      </div>
                                    )}
                                    {isBookingNotif && !isContactRequest && (
                                      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                                        {(() => {
                                          const cancelTime =
                                            getRemainingCancelTime(
                                              item.createdAtMs,
                                              item.createdAt || item.time,
                                            );
                                          const totalMs = 2 * 60 * 60 * 1000;
                                          const pct = Math.max(
                                            3,
                                            Math.min(
                                              100,
                                              Math.round(
                                                (cancelTime.msRemaining /
                                                  totalMs) *
                                                  100,
                                              ),
                                            ),
                                          );

                                          if (cancelTime.isExpired) {
                                            return (
                                              <div className="flex items-center justify-between">
                                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[8px] font-mono">
                                                  🔒 Lock Expired
                                                </span>
                                                <Link
                                                  href="/finance"
                                                  className="text-[9px] font-bold text-cyan-300 hover:underline"
                                                >
                                                  Receipt &rarr;
                                                </Link>
                                              </div>
                                            );
                                          }
                                          return (
                                            <div className="flex flex-col gap-1.5">
                                              <div className="flex flex-col gap-0.5 w-full">
                                                <div className="flex items-center justify-between text-[8px] font-mono font-extrabold tracking-wider text-cyan-300 uppercase">
                                                  <span className="flex items-center gap-1">
                                                    <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                                                    Time left to cancel...
                                                  </span>
                                                  <span className="text-cyan-200 font-black">
                                                    {cancelTime.text}
                                                  </span>
                                                </div>
                                                <div className="relative w-full h-2 rounded-full bg-slate-950/80 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)] p-[1px] flex items-center overflow-hidden">
                                                  <div
                                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-300 transition-all duration-1000 relative shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                                                    style={{ width: `${pct}%` }}
                                                  >
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-cyan-100 border border-cyan-300 shadow-[0_0_6px_#fff]" />
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                                <button
                                                  onClick={(e) => {
                                                    const btn = e.currentTarget;
                                                    if (
                                                      cancelBookingByRef(
                                                        refCode,
                                                      )
                                                    ) {
                                                      btn.innerText =
                                                        "✓ Cancelled";
                                                      btn.className =
                                                        "px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8px] font-black uppercase";
                                                      btn.disabled = true;
                                                    }
                                                  }}
                                                  className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 text-[8px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
                                                >
                                                  ❌ Cancel Ride
                                                </button>
                                                <Link
                                                  href="/finance"
                                                  className="text-[9px] font-bold text-cyan-300 hover:underline"
                                                >
                                                  View Receipt &rarr;
                                                </Link>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}

                                    <span className="text-xs text-slate-400 mt-1">
                                      {item.createdAt
                                        ? new Date(
                                            item.createdAt,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : (item.time ?? "")}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-white/10">
                            <button
                              onClick={handleClearAllNotifications}
                              disabled={notifications.length === 0}
                              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition font-bold text-sm cursor-pointer text-center text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth?mode=login"
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  Log In
                </Link>
                <Link
                  href="/onboarding"
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 shadow-[0_0_15px_rgba(0,174,255,0.35)] rounded-xl transition-all cursor-pointer"
                >
                  Register
                </Link>
              </div>
            )}

            <div
              onClick={onThemeToggle}
              className="relative hidden md:flex w-[76px] h-[38px] items-center rounded-full border border-white/10 bg-[#06111f]/60 p-[3px] shadow-inner backdrop-blur-md cursor-pointer hover:border-cyan-300/30 transition-all active:scale-95 select-none"
              role="button"
              aria-label="Toggle theme"
            >
              <motion.div
                className="absolute top-[3px] left-[3px] w-[30px] h-[30px] rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(0,174,255,0.6),_inset_0_1px_1.5px_rgba(255,255,255,0.3)]"
                animate={{ x: isDarkMode ? 0 : 38 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
              <div className="relative z-10 flex w-full h-full items-center">
                <span
                  className={`flex-1 h-full flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-400"}`}
                >
                  <Moon
                    size={13}
                    className={isDarkMode ? "-translate-x-[2px]" : ""}
                  />
                </span>
                <span
                  className={`flex-1 h-full flex items-center justify-center transition-colors duration-300 ${!isDarkMode ? "text-white" : "text-slate-400"}`}
                >
                  <Sun
                    size={13}
                    className={isDarkMode ? "" : "translate-x-[2px]"}
                  />
                </span>
              </div>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  if (!logoutConfirm) {
                    setLogoutConfirm(true);
                    setTimeout(() => setLogoutConfirm(false), 3000);
                    return;
                  }
                  localStorage.removeItem("flydna_token");
                  localStorage.removeItem("flydna_user");
                  localStorage.removeItem("flydna_profile");
                  try {
                    sessionStorage.clear();
                  } catch (e) {}
                  try {
                    ChatManager.disconnect();
                  } catch (e) {}
                  window.location.href = "/auth?mode=login";
                }}
                className={`hidden md:grid glass-button glass-sheen size-9.5 place-items-center rounded-full hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all border ${logoutConfirm ? "text-red-400 border-red-400/50 bg-red-500/10 animate-pulse" : "text-slate-200 hover:text-red-400 border-white/5"}`}
                title={
                  logoutConfirm ? "Tap again to confirm logout" : "Log Out"
                }
              >
                <LogOut size={17} />
              </button>
            )}

            {/* Mobile Menu Button & Dropdown */}
            <div className="relative z-50 xl:hidden">
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsCartOpen(false);
                  setIsBellOpen(false);
                }}
                className={`glass-button glass-sheen size-9.5 grid place-items-center rounded-full text-slate-200 hover:scale-105 active:scale-95 cursor-pointer relative z-50 transition-all ${
                  isMenuOpen ? "glass-button-active" : ""
                }`}
              >
                {isMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>

              {isMenuOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
              )}

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    style={{ transformOrigin: "top" }}
                    className="fixed md:absolute left-1/2 md:left-auto right-auto md:right-0 -translate-x-1/2 md:translate-x-0 top-20 md:top-13 w-[calc(100vw-2rem)] max-w-[340px] md:w-[240px] overflow-hidden flex flex-col z-50 glass-panel-heavy border border-cyan-400/20 bg-[#06111f]/94 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.55)] rounded-2xl p-3"
                  >
                    <div className="flex flex-col gap-1.5 text-white">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.label === activeTabFromPath;

                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              setActiveTab(item.label);
                              setIsMenuOpen(false);
                            }}
                            className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 cursor-pointer w-full text-left ${
                              isActive
                                ? "text-cyan-200 bg-gradient-to-br from-blue-600/35 to-cyan-500/25 border border-cyan-400/30 shadow-[0_0_15px_rgba(0,174,255,0.2)]"
                                : "text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent"
                            }`}
                          >
                            <Icon
                              size={18}
                              className={
                                isActive
                                  ? "drop-shadow-[0_0_8px_rgba(0,229,255,0.95)] text-cyan-200"
                                  : "opacity-80 transition group-hover:opacity-100"
                              }
                            />
                            <span className="relative z-10 tracking-wide">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="ml-auto grid size-5 place-items-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.45)]">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {!isAuthenticated && (
                        <>
                          {/* Divider */}
                          <div className="h-px bg-white/10 my-2 md:hidden" />
                          <div className="grid grid-cols-2 gap-2 px-1">
                            <Link
                              href="/auth?mode=login"
                              onClick={() => setIsMenuOpen(false)}
                              className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer"
                            >
                              Log In
                            </Link>
                            <Link
                              href="/onboarding"
                              onClick={() => setIsMenuOpen(false)}
                              className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 shadow-[0_0_15px_rgba(0,174,255,0.35)] rounded-xl transition-all cursor-pointer"
                            >
                              Register
                            </Link>
                          </div>
                        </>
                      )}

                      {isAuthenticated && (
                        <>
                          {/* Divider */}
                          <div className="h-px bg-white/10 my-2 md:hidden" />
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (!logoutConfirm) {
                                setLogoutConfirm(true);
                                setTimeout(() => setLogoutConfirm(false), 3000);
                                return;
                              }
                              localStorage.removeItem("flydna_token");
                              localStorage.removeItem("flydna_user");
                              localStorage.removeItem("flydna_profile");
                              try {
                                sessionStorage.clear();
                              } catch (e) {}
                              try {
                                ChatManager.disconnect();
                              } catch (e) {}
                              window.location.href = "/auth?mode=login";
                            }}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 cursor-pointer w-full text-left hover:bg-white/[0.04] border md:hidden ${logoutConfirm ? "text-red-300 border-red-400/50 bg-red-500/10 animate-pulse" : "text-red-400 hover:text-red-300 border-transparent"}`}
                          >
                            <LogOut size={18} className="opacity-80" />
                            <span className="relative z-10 tracking-wide">
                              {logoutConfirm
                                ? "Tap again to confirm"
                                : "Log Out"}
                            </span>
                          </button>
                        </>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-white/10 my-2 md:hidden" />

                      {/* Theme Toggle inside mobile menu (hidden on md and above since it's in header) */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 text-slate-300 md:hidden">
                        <span className="text-xs font-bold tracking-wide">
                          Theme
                        </span>
                        <div
                          onClick={onThemeToggle}
                          className="relative flex w-[76px] h-[38px] items-center rounded-full border border-white/10 bg-[#06111f]/60 p-[3px] shadow-inner backdrop-blur-md cursor-pointer hover:border-cyan-300/30 transition-all active:scale-95 select-none"
                          role="button"
                          aria-label="Toggle theme"
                        >
                          <motion.div
                            className="absolute top-[3px] left-[3px] w-[30px] h-[30px] rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(0,174,255,0.6),_inset_0_1px_1.5px_rgba(255,255,255,0.3)]"
                            animate={{ x: isDarkMode ? 0 : 38 }}
                            transition={{
                              type: "spring",
                              stiffness: 350,
                              damping: 25,
                            }}
                          />
                          <div className="relative z-10 flex w-full h-full items-center">
                            <span
                              className={`flex-1 h-full flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-400"}`}
                            >
                              <Moon
                                size={13}
                                className={
                                  isDarkMode ? "-translate-x-[2px]" : ""
                                }
                              />
                            </span>
                            <span
                              className={`flex-1 h-full flex items-center justify-center transition-colors duration-300 ${!isDarkMode ? "text-white" : "text-slate-400"}`}
                            >
                              <Sun
                                size={13}
                                className={
                                  isDarkMode ? "" : "translate-x-[2px]"
                                }
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      <OrbitalWeatherWidget />

      {/* E-commerce Store Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[10500] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            />

            {/* Viewport Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[500px] bg-[#06111f]/98 border border-cyan-400/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] rounded-3xl p-6 text-left overflow-hidden backdrop-blur-md"
            >
              {/* Ambience color */}
              <div className="absolute -top-12 -right-12 size-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛒</span>
                  <span>Store Checkout</span>
                </h4>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition"
                >
                  <X size={16} />
                </button>
              </div>

              {checkoutStep === "form" && (
                <>
                  {/* Cart summary */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 mb-4 flex flex-col gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex justify-between items-center text-xs text-slate-300"
                      >
                        <span className="font-semibold truncate max-w-[280px]">
                          {item.product.name} (Qty {item.quantity})
                        </span>
                        <span className="font-bold text-slate-100">
                          $
                          {(
                            parseFloat(item.product.price) * item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center border-t border-white/10 pt-2 text-xs font-black text-white">
                      <span>Grand Total:</span>
                      <span className="text-cyan-300 text-sm">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Rail Selectors */}
                  <div className="grid grid-cols-4 gap-1.5 mb-4 select-none">
                    <button
                      type="button"
                      onClick={() => setCheckoutRail("stripe")}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition border cursor-pointer flex items-center justify-center gap-1 ${
                        checkoutRail === "stripe"
                          ? "bg-white/5 border-cyan-400/40 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                          : "bg-transparent border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      💳 Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutRail("vault")}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition border cursor-pointer flex items-center justify-center gap-1 ${
                        checkoutRail === "vault"
                          ? "bg-white/5 border-emerald-400/40 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                          : "bg-transparent border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      🔒 Vault
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutRail("ava")}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition border cursor-pointer flex items-center justify-center gap-1 ${
                        checkoutRail === "ava"
                          ? "bg-white/5 border-amber-400/40 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                          : "bg-transparent border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      🪙 AVA
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutRail("xrp")}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition border cursor-pointer flex items-center justify-center gap-1 ${
                        checkoutRail === "xrp"
                          ? "bg-white/5 border-blue-400/40 text-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.15)]"
                          : "bg-transparent border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      🌐 XRP
                    </button>
                  </div>

                  {/* Stripe checkout form */}
                  {checkoutRail === "stripe" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setCheckoutStep("processing");
                        try {
                          const payToken = localStorage.getItem("flydna_token");
                          const payBase =
                            process.env.NEXT_PUBLIC_API_URL ||
                            "https://staging.flydna.io";
                          const payRes = await fetch(
                            `${payBase}/api/v1/payments/confirm-store-order`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...(payToken
                                  ? { Authorization: `Bearer ${payToken}` }
                                  : {}),
                              },
                              body: JSON.stringify({
                                items: cartItems.map((i) => ({
                                  name: i.product.name,
                                  price: i.product.price,
                                  quantity: i.quantity,
                                })),
                                total: cartTotal,
                                paymentMethod: "stripe",
                              }),
                            },
                          );
                          const payData = await payRes.json();
                          if (!payRes.ok || !payData.success) {
                            alert(
                              payData.error ||
                                "Checkout failed — please try again.",
                            );
                            setCheckoutStep("form");
                            return;
                          }
                        } catch (err) {
                          alert("Checkout failed — please try again.");
                          setCheckoutStep("form");
                          return;
                        }
                        setTimeout(() => {
                          setCheckoutStep("success");
                          // Record purchase to ledger
                          const orderTitle =
                            cartItems.length === 1
                              ? cartItems[0].product.name
                              : `Store Order (${cartItems.length} items)`;
                          recordPurchase({
                            title: orderTitle,
                            category: "Store",
                            amount: cartTotal,
                            merchant: "FlyDnA Store",
                          });
                          // Clear cart
                          localStorage.removeItem("flydna_cart");
                          setCartItems([]);
                          window.dispatchEvent(new Event("cart-updated"));
                          window.dispatchEvent(
                            new CustomEvent("flydna-new-notification", {
                              detail: {
                                id: `store-${Date.now()}`,
                                type: "store",
                                title: "🛍️ Order Confirmed",
                                message:
                                  "Your purchase has been processed and is being prepared for shipping.",
                                time: "Just Now",
                              },
                            }),
                          );
                        }, 2000);
                      }}
                      className="space-y-3 text-left"
                    >
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={stripeName}
                          onChange={(e) => setStripeName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-[#06111f]/95 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          required
                          value={stripeCard}
                          onChange={(e) =>
                            setStripeCard(
                              e.target.value.replace(/\D/g, "").slice(0, 16),
                            )
                          }
                          placeholder="4111-2222-3333-4444"
                          className="w-full bg-[#06111f]/95 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            required
                            value={stripeExpiry}
                            onChange={(e) => setStripeExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full bg-[#06111f]/95 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            CVC / CVV
                          </label>
                          <input
                            type="password"
                            required
                            value={stripeCvc}
                            onChange={(e) =>
                              setStripeCvc(
                                e.target.value.replace(/\D/g, "").slice(0, 3),
                              )
                            }
                            placeholder="•••"
                            className="w-full bg-[#06111f]/95 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 transition"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all mt-4"
                      >
                        Confirm Card Checkout
                      </button>
                    </form>
                  )}

                  {/* Vault checkout form */}
                  {checkoutRail === "vault" && (
                    <div className="space-y-3.5 text-left">
                      <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-950/10 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-emerald-300">
                          <span>FlyDnA Digital Vault Settlement</span>
                          <span>Zero Gas Fees</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black text-white border-t border-white/5 pt-2">
                          <span>Amount in Tokens</span>
                          <span>
                            {vaultTokenSelected === "xrp"
                              ? `${(cartTotal / 1.5).toFixed(2)} XRP`
                              : `${((cartTotal * 0.95) / 2.4).toFixed(2)} AVA (with 5% Perks)`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 select-none">
                        <button
                          type="button"
                          onClick={() => setVaultTokenSelected("xrp")}
                          className={`p-3 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                            vaultTokenSelected === "xrp"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                              : "bg-transparent border-white/5 text-slate-400 hover:bg-white/[0.02]"
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            XRP Vault
                          </span>
                          <span className="text-sm font-black text-white mt-0.5">
                            {vaultBalances.xrp.toFixed(2)} XRP
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVaultTokenSelected("ava")}
                          className={`p-3 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                            vaultTokenSelected === "ava"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : "bg-transparent border-white/5 text-slate-400 hover:bg-white/[0.02]"
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            AVA Vault
                          </span>
                          <span className="text-sm font-black text-white mt-0.5">
                            {vaultBalances.ava.toFixed(2)} AVA
                          </span>
                        </button>
                      </div>

                      {(() => {
                        const required =
                          vaultTokenSelected === "xrp"
                            ? parseFloat((cartTotal / 1.5).toFixed(2))
                            : parseFloat(((cartTotal * 0.95) / 2.4).toFixed(2));
                        const balance =
                          vaultTokenSelected === "xrp"
                            ? vaultBalances.xrp
                            : vaultBalances.ava;
                        const isSufficient = balance >= required;

                        return (
                          <>
                            <div className="p-3 rounded-xl border border-white/5 bg-slate-950/40 text-[10px] font-semibold text-slate-300 flex justify-between">
                              <span>
                                Required: {required}{" "}
                                {vaultTokenSelected.toUpperCase()}
                              </span>
                              <span>
                                Status:{" "}
                                {isSufficient ? (
                                  <span className="text-emerald-400 font-bold">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="text-red-400 font-bold">
                                    Insufficient
                                  </span>
                                )}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={!isSufficient}
                              onClick={() => {
                                setCheckoutStep("processing");
                                setTimeout(() => {
                                  const updatedBalances = {
                                    xrp:
                                      vaultTokenSelected === "xrp"
                                        ? vaultBalances.xrp - required
                                        : vaultBalances.xrp,
                                    ava:
                                      vaultTokenSelected === "ava"
                                        ? vaultBalances.ava - required
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

                                  setCheckoutStep("success");
                                  // Record purchase to ledger
                                  const orderTitle =
                                    cartItems.length === 1
                                      ? cartItems[0].product.name
                                      : `Store Order (${cartItems.length} items)`;
                                  recordPurchase({
                                    title: orderTitle,
                                    category: "Store",
                                    amount: cartTotal,
                                    merchant: "FlyDnA Store",
                                  });
                                  localStorage.removeItem("flydna_cart");
                                  setCartItems([]);
                                  window.dispatchEvent(
                                    new Event("cart-updated"),
                                  );
                                  window.dispatchEvent(
                                    new CustomEvent("flydna-new-notification", {
                                      detail: {
                                        id: `store-${Date.now()}`,
                                        type: "store",
                                        title: "🛍️ Order Confirmed",
                                        message:
                                          "Your purchase has been processed and is being prepared for shipping.",
                                        time: "Just Now",
                                      },
                                    }),
                                  );
                                }, 1500);
                              }}
                              className={`w-full py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer ${
                                isSufficient
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110"
                                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              🔒 Pay with FlyDnA Vault Balance
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* AVA token checkout */}
                  {checkoutRail === "ava" && (
                    <div className="space-y-3.5 text-left">
                      <div className="p-3.5 rounded-xl border border-amber-500/10 bg-amber-950/10 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-amber-300">
                          <span>AVA Loyalty Discount (5% Off)</span>
                          <span>- ${(cartTotal * 0.05).toFixed(2)} USD</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black text-white">
                          <span>Total Amount</span>
                          <span>
                            {((cartTotal * 0.95) / 2.4).toFixed(2)} AVA ($
                            {(cartTotal * 0.95).toFixed(2)} USD)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            Your EVM Wallet Address
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={web3WalletAddress}
                              onChange={(e) =>
                                setWeb3WalletAddress(e.target.value)
                              }
                              placeholder="0x..."
                              className="flex-1 bg-[#06111f]/95 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none font-mono focus:border-amber-400/40 transition"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                setIsWeb3Checking(true);
                                const bal =
                                  await checkWeb3Balance(web3WalletAddress);
                                setWeb3Balance(bal);
                                setIsWeb3Checking(false);
                              }}
                              className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[9px] font-black text-amber-400 hover:bg-amber-500/20 active:scale-95 transition uppercase tracking-wider"
                            >
                              {isWeb3Checking ? "Checking..." : "Check"}
                            </button>
                          </div>
                          {linkedEvm ? (
                            <button
                              type="button"
                              onClick={() => setWeb3WalletAddress(linkedEvm)}
                              className="text-[8px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded hover:bg-cyan-500/20 active:scale-95 transition mt-1.5 self-start inline-block uppercase tracking-wider"
                            >
                              🔗 Use Linked EVM Wallet ({linkedEvm.slice(0, 6)}
                              ...{linkedEvm.slice(-4)})
                            </button>
                          ) : (
                            <div className="text-[8px] text-slate-500 mt-1.5 font-semibold">
                              💡 No EVM wallet connected on Profile page. You
                              can link one in settings.
                            </div>
                          )}
                          {web3Balance !== "0" && (
                            <div className="text-[9px] text-amber-300 font-bold mt-1.5 flex justify-between">
                              <span>On-chain Balance:</span>
                              <span>
                                {parseFloat(web3Balance).toFixed(2)} AVA
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 rounded-xl border border-white/5 bg-slate-950/40">
                          <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            Travala Recipient Smart Contract Address
                          </label>
                          <div className="text-[9px] font-mono text-slate-300 break-all select-all">
                            0x4F4aC55F22481198A8824100918f08e34f
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutStep("processing");
                          setTimeout(() => {
                            setCheckoutStep("success");
                            // Record purchase to ledger
                            const orderTitle =
                              cartItems.length === 1
                                ? cartItems[0].product.name
                                : `Store Order (${cartItems.length} items)`;
                            recordPurchase({
                              title: orderTitle,
                              category: "Store",
                              amount: cartTotal,
                              merchant: "FlyDnA Store",
                            });
                            // Clear cart
                            localStorage.removeItem("flydna_cart");
                            setCartItems([]);
                            window.dispatchEvent(new Event("cart-updated"));
                            window.dispatchEvent(
                              new CustomEvent("flydna-new-notification", {
                                detail: {
                                  id: `store-${Date.now()}`,
                                  type: "store",
                                  title: "🛍️ Order Confirmed",
                                  message:
                                    "Your purchase has been processed and is being prepared for shipping.",
                                  time: "Just Now",
                                },
                              }),
                            );
                          }, 2000);
                        }}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 mt-2"
                      >
                        ⚡ Confirm & Pay with AVA
                      </button>
                    </div>
                  )}

                  {/* XRP token checkout */}
                  {checkoutRail === "xrp" && (
                    <div className="space-y-3.5 text-left">
                      <div className="p-3.5 rounded-xl border border-blue-500/10 bg-blue-950/10 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-blue-300">
                          <span>XRP Rate</span>
                          <span>1 XRP = $1.50</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black text-white border-t border-white/5 pt-2">
                          <span>Total Amount</span>
                          <span>
                            {(cartTotal / 1.5).toFixed(2)} XRP ($
                            {cartTotal.toFixed(2)} USD)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            Destination Corporate XRP Wallet
                          </label>
                          <div className="p-3 rounded-xl border border-white/5 bg-slate-950/40 text-[9px] font-mono text-slate-300 break-all select-all">
                            rYourFlyDnaXrpCorporateWalletAddress
                          </div>
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            Transaction Hash (TXID)
                          </label>
                          <input
                            type="text"
                            value={web3TxHash}
                            onChange={(e) => setWeb3TxHash(e.target.value)}
                            placeholder="E.g., 9F8D..."
                            className="w-full bg-[#06111f]/95 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none font-mono focus:border-blue-400/40 transition"
                          />
                          {linkedXrp ? (
                            <div className="text-[8px] text-slate-400 mt-1.5 font-semibold">
                              🔗 Linked XRP Wallet:{" "}
                              <span className="text-cyan-400 font-mono select-all">
                                {linkedXrp}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[8px] text-slate-500 mt-1.5 font-semibold">
                              💡 No XRPL wallet connected on Profile page. You
                              can link one in settings.
                            </div>
                          )}
                          {web3VerifyError && (
                            <div className="text-[9px] font-semibold text-red-400 mt-1.5">
                              ❌ {web3VerifyError}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={verifyXrpPayment}
                        disabled={isWeb3Checking}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 mt-2"
                      >
                        {isWeb3Checking
                          ? "Verifying Transaction..."
                          : "🌐 Verify XRP Payment"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {checkoutStep === "processing" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-6" />
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Processing Order
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Finalizing transaction ledger settlement...
                  </p>
                </div>
              )}

              {checkoutStep === "success" && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse text-2xl font-black">
                    ✓
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Checkout Successful
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1.5 px-4 leading-relaxed">
                    Thank you for your purchase! Your payment has been
                    successfully cleared and processed.
                  </p>
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setCheckoutStep("form");
                      setWeb3TxHash("");
                      setWeb3VerifyError("");
                    }}
                    className="mt-8 px-8 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black text-white uppercase tracking-widest cursor-pointer active:scale-95 transition"
                  >
                    Continue
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shopping Cart Sidebar (moved outside header to fix fixed positioning) */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}
      <div className="fixed inset-0 pointer-events-none z-[1001]">
        <AnimatePresence>
          {isCartOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              style={{
                background:
                  "linear-gradient(135deg, rgba(6, 17, 31, 0.98), rgba(11, 26, 48, 0.95))",
              }}
              className="absolute right-0 top-0 h-screen w-full sm:w-[380px] overflow-hidden flex flex-col pointer-events-auto border-l border-cyan-400/20 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.6)]"
            >
              <div className="flex flex-col h-full p-4 pt-6 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <ShoppingCart size={20} />
                    <span className="font-bold text-lg">Shopping Cart</span>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Cart Items list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm custom-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="text-center text-slate-400/50 py-12 text-xs">
                      Your cart is empty.
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex gap-3 items-center"
                      >
                        <div className="w-16 h-16 rounded-lg bg-black/20 border border-white/5 overflow-hidden shrink-0 shadow-inner">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col flex-1">
                          <div className="flex justify-between font-semibold text-sm">
                            <span
                              className="text-slate-200 truncate max-w-[140px]"
                              title={item.product.name}
                            >
                              {item.product.name}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-slate-400 hover:text-red-400 transition cursor-pointer shrink-0"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex justify-between items-end mt-1">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                {item.product.brand}
                              </span>
                              <span className="text-[11px] text-slate-500 mt-0.5">
                                Qty: {item.quantity}
                              </span>
                            </div>
                            <span className="text-cyan-300 text-sm font-bold">
                              $
                              {(
                                parseFloat(item.product.price) * item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-bold px-1">
                    <span>Total:</span>
                    <span className="text-cyan-300">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (cartItems.length > 0) {
                        setIsCheckoutOpen(true);
                        setIsCartOpen(false);
                      }
                    }}
                    disabled={cartItems.length === 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 active:scale-[0.98] transition font-bold text-sm shadow-[0_0_15px_rgba(0,174,255,0.4)] cursor-pointer text-center text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
