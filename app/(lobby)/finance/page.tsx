"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, X } from "lucide-react";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useHeaderNav } from "@/hooks/useHeaderNav";

// Finance components
import AssetBalance from "@/components/finance/AssetBalance";
import TransactionsLedger from "@/components/finance/TransactionsLedger";
import PurchaseHistory from "@/components/finance/PurchaseHistory";
import CurrencyConverter from "@/components/finance/CurrencyConverter";
import CryptoSwapHub from "@/components/finance/CryptoSwapHub";
import FinancialCalculator from "@/components/finance/FinancialCalculator";
import CardVault from "@/components/finance/CardVault";
import TransmitPanel from "@/components/finance/TransmitPanel";
import { PREMIUM_SCENES } from "@/components/lobby/ChatPanel";
import { getStoredTransactions, getStoredPurchases, recordTransaction } from "@/lib/ledger";

export default function FinancePage() {
  const { isDarkMode, toggleDarkMode, activeTab, handleActiveTabChange } =
    useHeaderNav("Finance");
  const [activeCardSelect, setActiveCardSelect] = useState<
    "fiat" | "crypto" | null
  >(null);

  // Dynamic contacts list state and selection modals
  const [contactsList, setContactsList] = useState([
    {
      id: 101,
      name: "FlyDnA Concierge",
      initials: "FC",
      color: "from-cyan-300 to-blue-700",
      email: "concierge@flydna.io",
    },
    {
      id: 102,
      name: "FlyDnA Travel Agent",
      initials: "TA",
      color: "from-emerald-300 to-teal-700",
      email: "agent@flydna.io",
    },
    {
      id: 103,
      name: "FlyDnA Tech Support",
      initials: "TS",
      color: "from-fuchsia-300 to-purple-700",
      email: "support@flydna.io",
    },
    {
      id: 104,
      name: "Jah",
      initials: "J",
      color: "from-amber-300 to-red-600",
      email: "jah@flydna.io",
    },
  ]);
  const [showAllContactsModal, setShowAllContactsModal] = useState(false);
  const [transmitContactId, setTransmitContactId] = useState<number>(101);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    addContact(newContactName, newContactEmail);
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setShowAddContactModal(false);
  };

  const addContact = (name: string, email?: string) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const gradients = [
      "from-rose-300 to-red-700",
      "from-amber-300 to-orange-700",
      "from-teal-300 to-emerald-700",
      "from-sky-300 to-blue-700",
      "from-fuchsia-300 to-purple-700",
    ];
    const randomColor = gradients[Math.floor(Math.random() * gradients.length)];

    const newContact = {
      id: Date.now(),
      name,
      initials: initials || "U",
      color: randomColor,
      email: email || `${name.toLowerCase().replace(/\s+/g, "")}@flydna.io`,
    };

    setContactsList((prev) => [...prev, newContact]);
    setTransmitContactId(newContact.id);
  };

  // Determine which contacts to show in the visible row:
  const visibleContacts = useMemo(() => {
    const maxVisible = 3;
    const firstThree = contactsList.slice(0, maxVisible);
    const isSelectedVisible = firstThree.some(
      (c) => c.id === transmitContactId,
    );

    if (isSelectedVisible || contactsList.length <= maxVisible) {
      return firstThree;
    } else {
      const selectedContact = contactsList.find(
        (c) => c.id === transmitContactId,
      );
      if (selectedContact) {
        return [...contactsList.slice(0, maxVisible - 1), selectedContact];
      }
      return firstThree;
    }
  }, [contactsList, transmitContactId]);

  const remainingContacts = useMemo(() => {
    return contactsList.filter(
      (c) => !visibleContacts.some((vc) => vc.id === c.id),
    );
  }, [contactsList, visibleContacts]);

  const remainingCount = remainingContacts.length;

  // Wallet balances state
  const [wallets, setWallets] = useState({
    USD: 0.0,
    EUR: 0.0,
    DxA: 0.0,
  });

  const [selectedWallet, setSelectedWallet] = useState<"USD" | "EUR" | "DxA">(
    "USD",
  );

  // Top Up & Cash Out states
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [balanceAmountInput, setBalanceAmountInput] = useState("");

  // Card Vault states
  const [cards, setCards] = useState([
    {
      id: 1,
      type: "Visa",
      number: "4532 9821 0244 8921",
      holder: "Alex Mercer",
      expiry: "09/29",
      cvv: "492",
      theme: "from-blue-600 via-indigo-600 to-cyan-500",
      limit: 15000,
      balance: 4230,
      glowColor: "rgba(0,174,255,0.4)",
    },
    {
      id: 2,
      type: "American Express",
      number: "3782 1092 8824 1009",
      holder: "Alex Mercer",
      expiry: "12/30",
      cvv: "882",
      theme: "from-purple-600 via-pink-600 to-amber-500",
      limit: 50000,
      balance: 18450,
      glowColor: "rgba(168,85,247,0.4)",
    },
    {
      id: 3,
      type: "Mastercard",
      number: "5524 9901 2248 1198",
      holder: "Alex Mercer",
      expiry: "06/28",
      cvv: "331",
      theme: "from-[#081225] via-[#0d1c35] to-[#00E5FF]",
      limit: 100000,
      balance: 93420,
      glowColor: "rgba(34,211,238,0.4)",
    },
  ]);
  const [revealCardDetails, setRevealCardDetails] = useState(false);
  const [revealBalance, setRevealBalance] = useState(false);

  // Combined total net worth across wallets in USD equivalent
  const totalBalanceUSD = useMemo(() => {
    return wallets.USD + wallets.EUR * 1.09 + wallets.DxA * 1.25;
  }, [wallets]);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [newCardType, setNewCardType] = useState("Travel Gold");
  const [newCardTheme, setNewCardTheme] = useState("emerald");
  const [newCardLimit, setNewCardLimit] = useState("5000");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardHolder, setNewCardHolder] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCVV, setNewCardCVV] = useState("");

  // Calculator states
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcFormula, setCalcFormula] = useState("");
  const [calcNotification, setCalcNotification] = useState<string | null>(null);

  // Transmit States
  const [transmitAmount, setTransmitAmount] = useState("");
  const [transmitCurrency, setTransmitCurrency] = useState<string>("USD");
  const [transmitNote, setTransmitNote] = useState("");
  const [transmitStep, setTransmitStep] = useState<
    "idle" | "encrypting" | "broadcasting" | "success" | "error"
  >("idle");
  const [transmitSecureHash, setTransmitSecureHash] = useState("");
  const [transmitErrorMsg, setTransmitErrorMsg] = useState("");

  // Currency Converter (Fiat) states
  const [fiatAmount, setFiatAmount] = useState("100");
  const [fromFiat, setFromFiat] = useState("USD");
  const [toFiat, setToFiat] = useState("EUR");

  // Crypto Converter states
  const [cryptoAmount, setCryptoAmount] = useState("1");
  const [fromCrypto, setFromCrypto] = useState("BTC");
  const [toCrypto, setToCrypto] = useState("Ava");
  const [gasMode, setGasMode] = useState<"eco" | "standard" | "fast">(
    "standard",
  );

  // Ledger lists states (Standalone Search & Filters)
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState("All");
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState("All");

  const [transactions, setTransactions] = useState<
    {
      id: string;
      type: string;
      note: string;
      amount: number;
      currency: string;
      method: "credit" | "debit";
      timestamp: string;
      status: string;
    }[]
  >([]);

  const [purchases, setPurchases] = useState<
    {
      id: string;
      title: string;
      category: string;
      amount: number;
      date: string;
      status: string;
      merchant: string;
    }[]
  >([]);

  // Sync cards, backdrops, transactions, and purchases on mount
  useEffect(() => {
    const syncFinanceLedger = () => {
      setTransactions(getStoredTransactions());
      setPurchases(getStoredPurchases() as any);
    };

    syncFinanceLedger();
    window.addEventListener("flydna-ledger-updated", syncFinanceLedger);

    try {
      // 1. Load cards
      const storedCards = localStorage.getItem("flydna_finance_cards");
      if (storedCards) {
        setCards(JSON.parse(storedCards));
      } else {
        localStorage.setItem("flydna_finance_cards", JSON.stringify(cards));
      }

      // 2. Load backdrop purchases
      const storedPurchasedBackdrops = localStorage.getItem("flydna_purchased_scenes");
      if (storedPurchasedBackdrops) {
        const ids: number[] = JSON.parse(storedPurchasedBackdrops);
        const newPurchases = ids.map((id) => {
          const scene = PREMIUM_SCENES.find((s: any) => s.id === id);
          const name = scene ? scene.name : `Premium Motion Backdrop #${id}`;
          return {
            id: `pr-backdrop-${id}`,
            title: `${name} (Motion Backdrop)`,
            category: "Customizations",
            amount: 5.0,
            date: new Date().toISOString().split("T")[0],
            status: "Confirmed",
            merchant: "FlyDnA Backdrop Marketplace",
          };
        });
        if (newPurchases.length > 0) {
          setPurchases((prev) => {
            const filteredPrev = prev.filter((p) => !p.id.startsWith("pr-backdrop-"));
            return [...filteredPrev, ...newPurchases];
          });
        }
      }

      // 3. Load flight ticket purchases from travel search confirmed booking
      const confirmedRef = sessionStorage.getItem("confirmedBookingRef");
      if (confirmedRef) {
        const storedOffer = sessionStorage.getItem("selectedOffer");
        if (storedOffer) {
          const offer = JSON.parse(storedOffer);
          const outboundSlice = offer.slices?.[0];
          const firstSegment = outboundSlice?.segments?.[0];
          const lastSegment = outboundSlice?.segments?.[outboundSlice.segments.length - 1];

          if (firstSegment) {
            const originCode = firstSegment.origin?.iata_code || "DXB";
            const destCode = lastSegment?.destination?.iata_code || "CMB";
            const carrier = firstSegment.operating_carrier?.name || "Emirates Airlines";
            const total = Math.round(parseFloat(offer.total_amount)) || 850;

            const flightPurchase = {
              id: `pr-flight-${confirmedRef}`,
              title: `${originCode} to ${destCode} Flight Ticket`,
              category: "Flights",
              amount: total,
              date: new Date().toISOString().split("T")[0],
              status: "Confirmed",
              merchant: carrier,
            };

            setPurchases((prev) => {
              const filteredPrev = prev.filter((p) => p.id !== flightPurchase.id);
              return [flightPurchase, ...filteredPrev];
            });
          }
        }
      }
    } catch (err) {
      console.error("Error loading stored finance data:", err);
    }

    return () => {
      window.removeEventListener("flydna-ledger-updated", syncFinanceLedger);
    };
  }, []);

  // Helper for adding transactions dynamically
  const addTransaction = (
    type: string,
    amount: number,
    currency: string,
    method: "credit" | "debit",
    note: string,
  ) => {
    const newTx = {
      id: `tx-${Date.now()}`,
      type,
      note,
      amount,
      currency,
      method,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "Confirmed",
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Top Up balance processor
  const processTopUp = () => {
    const value = parseFloat(balanceAmountInput);
    if (isNaN(value) || value <= 0) return;

    setWallets((prev) => ({
      ...prev,
      [selectedWallet]: prev[selectedWallet] + value,
    }));
    addTransaction(
      "Top Up",
      value,
      selectedWallet,
      "credit",
      `Deposited into ${selectedWallet} wallet`,
    );

    setBalanceAmountInput("");
    setShowTopUp(false);
  };

  // Cash Out balance processor
  const processWithdraw = () => {
    const value = parseFloat(balanceAmountInput);
    if (isNaN(value) || value <= 0) return;

    if (wallets[selectedWallet] < value) {
      alert("Insufficient balance for withdrawal.");
      return;
    }

    setWallets((prev) => ({
      ...prev,
      [selectedWallet]: prev[selectedWallet] - value,
    }));
    addTransaction(
      "Withdrawal",
      value,
      selectedWallet,
      "debit",
      `Withdrew from ${selectedWallet} wallet`,
    );

    setBalanceAmountInput("");
    setShowWithdraw(false);
  };

  // Virtual Card Creator
  const createVirtualCard = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(newCardLimit) || 1000;
    const finalNumber =
      newCardNumber.trim() ||
      Array.from({ length: 4 }, () =>
        Math.floor(1000 + Math.random() * 9000),
      ).join(" ");
    const finalCVV =
      newCardCVV.trim() || String(Math.floor(100 + Math.random() * 900));
    const finalHolder = newCardHolder.trim() || "Alex Mercer";
    const finalExpiry = newCardExpiry.trim() || "07/31";

    let cardThemeGradient = "from-emerald-600 via-teal-600 to-cyan-500";
    let glowColor = "rgba(16,185,129,0.4)";
    if (newCardTheme === "crimson") {
      cardThemeGradient = "from-rose-600 via-red-600 to-orange-500";
      glowColor = "rgba(244,63,94,0.4)";
    } else if (newCardTheme === "violet") {
      cardThemeGradient = "from-violet-600 via-purple-600 to-pink-500";
      glowColor = "rgba(168,85,247,0.4)";
    } else if (newCardTheme === "blue") {
      cardThemeGradient = "from-blue-600 via-indigo-600 to-cyan-500";
      glowColor = "rgba(0,174,255,0.4)";
    }

    const newCard = {
      id: cards.length + 1,
      type: newCardType,
      number: finalNumber,
      holder: finalHolder,
      expiry: finalExpiry,
      cvv: finalCVV,
      theme: cardThemeGradient,
      limit: limit,
      balance: 0,
      glowColor: glowColor,
    };

    setCards((prev) => {
      const updated = [...prev, newCard];
      localStorage.setItem("flydna_finance_cards", JSON.stringify(updated));
      return updated;
    });
    setIsCreatingCard(false);
    setNewCardNumber("");
    setNewCardHolder("");
    setNewCardExpiry("");
    setNewCardCVV("");

    // Add transaction log
    addTransaction(
      "Vault Service",
      15.0,
      "USD",
      "debit",
      `Created virtual card: ${newCardType}`,
    );
    // Deduct issuing fee
    setWallets((prev) => ({ ...prev, USD: prev.USD - 15.0 }));
  };

  // Calculator processor
  const handleCalcBtn = (val: string) => {
    if (val === "C") {
      setCalcDisplay("0");
      setCalcFormula("");
      return;
    }

    if (val === "⌫") {
      if (calcDisplay.length <= 1) {
        setCalcDisplay("0");
      } else {
        setCalcDisplay(calcDisplay.slice(0, -1));
      }
      return;
    }

    if (val === "=") {
      try {
        const cleanedFormula = calcDisplay
          .replace(/×/g, "*")
          .replace(/÷/g, "/");
        if (/^[0-9+\-*/.() ]+$/.test(cleanedFormula)) {
          // eslint-disable-next-line no-eval
          const result = eval(cleanedFormula);
          setCalcDisplay(String(Number(result.toFixed(4))));
          setCalcFormula(calcDisplay + " =");
        } else {
          setCalcDisplay("Error");
        }
      } catch (err) {
        setCalcDisplay("Error");
      }
      return;
    }

    const ops = ["+", "-", "×", "÷"];
    if (ops.includes(val)) {
      const lastChar = calcDisplay.slice(-1);
      if (ops.includes(lastChar)) {
        setCalcDisplay(calcDisplay.slice(0, -1) + val);
      } else {
        setCalcDisplay(calcDisplay + val);
      }
      return;
    }

    if (calcDisplay === "0" || calcDisplay === "Error") {
      setCalcDisplay(val);
    } else {
      setCalcDisplay(calcDisplay + val);
    }
  };

  // Transmit execution flow
  const handleTransmit = () => {
    const amount = parseFloat(transmitAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransmitErrorMsg("Please enter a valid transmission amount.");
      setTransmitStep("error");
      return;
    }

    const availableBalance =
      wallets[transmitCurrency as keyof typeof wallets] ?? 100.0;

    if (availableBalance < amount) {
      setTransmitErrorMsg(
        `Insufficient ${transmitCurrency} balance. Required: ${amount}, Available: ${availableBalance}`,
      );
      setTransmitStep("error");
      return;
    }

    setTransmitStep("encrypting");
    const fakeHash =
      "SHA256-" +
      Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      )
        .join("")
        .toUpperCase();
    setTransmitSecureHash(fakeHash);

    setTimeout(() => {
      setTransmitStep("broadcasting");
      setTimeout(() => {
        setWallets((prev) => {
          const currentVal = prev[transmitCurrency as keyof typeof prev];
          if (currentVal !== undefined) {
            return {
              ...prev,
              [transmitCurrency]: currentVal - amount,
            };
          }
          return prev;
        });

        const contactName =
          contactsList.find((c) => c.id === transmitContactId)?.name ||
          "Contact";
        addTransaction(
          "Transfer",
          amount,
          transmitCurrency,
          "debit",
          `Sent to ${contactName}: ${transmitNote || "Secure Transfer"}`,
        );

        setTransmitStep("success");
        setTransmitAmount("");
        setTransmitNote("");
      }, 1500);
    }, 1200);
  };

  // Currency Exchange conversions rates lookup
  const fiatRates = {
    USD: {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 156.4,
      CAD: 1.37,
      SAR: 3.75,
      AED: 3.67,
      AUD: 1.5,
      CHF: 0.9,
      CNY: 7.25,
    },
    EUR: {
      USD: 1.09,
      EUR: 1.0,
      GBP: 0.86,
      JPY: 170.0,
      CAD: 1.49,
      SAR: 4.08,
      AED: 3.99,
      AUD: 1.63,
      CHF: 0.98,
      CNY: 7.88,
    },
    GBP: {
      USD: 1.27,
      EUR: 1.16,
      GBP: 1.0,
      JPY: 198.0,
      CAD: 1.73,
      SAR: 4.75,
      AED: 4.66,
      AUD: 1.9,
      CHF: 1.14,
      CNY: 9.18,
    },
    JPY: {
      USD: 0.0064,
      EUR: 0.0059,
      GBP: 0.0051,
      JPY: 1.0,
      CAD: 0.0088,
      SAR: 0.024,
      AED: 0.023,
      AUD: 0.0096,
      CHF: 0.0058,
      CNY: 0.046,
    },
    CAD: {
      USD: 0.73,
      EUR: 0.67,
      GBP: 0.58,
      JPY: 114.2,
      CAD: 1.0,
      SAR: 2.74,
      AED: 2.68,
      AUD: 1.09,
      CHF: 0.66,
      CNY: 5.29,
    },
    SAR: {
      USD: 0.27,
      EUR: 0.25,
      GBP: 0.21,
      JPY: 41.7,
      CAD: 0.36,
      SAR: 1.0,
      AED: 0.98,
      AUD: 0.4,
      CHF: 0.24,
      CNY: 1.93,
    },
    AED: {
      USD: 0.27,
      EUR: 0.25,
      GBP: 0.21,
      JPY: 42.6,
      CAD: 0.37,
      SAR: 1.02,
      AED: 1.0,
      AUD: 0.41,
      CHF: 0.25,
      CNY: 1.98,
    },
    AUD: {
      USD: 0.67,
      EUR: 0.61,
      GBP: 0.53,
      JPY: 104.3,
      CAD: 0.91,
      SAR: 2.5,
      AED: 2.45,
      AUD: 1.0,
      CHF: 0.6,
      CNY: 4.83,
    },
    CHF: {
      USD: 1.11,
      EUR: 1.02,
      GBP: 0.88,
      JPY: 173.8,
      CAD: 1.52,
      SAR: 4.17,
      AED: 4.08,
      AUD: 1.67,
      CHF: 1.0,
      CNY: 8.06,
    },
    CNY: {
      USD: 0.14,
      EUR: 0.13,
      GBP: 0.11,
      JPY: 21.6,
      CAD: 0.19,
      SAR: 0.52,
      AED: 0.51,
      AUD: 0.21,
      CHF: 0.12,
      CNY: 1.0,
    },
  };

  const calculatedFiatValue = useMemo(() => {
    const amount = parseFloat(fiatAmount);
    if (isNaN(amount) || amount <= 0) return "0.00";
    const rate =
      fiatRates[fromFiat as keyof typeof fiatRates]?.[
        toFiat as keyof (typeof fiatRates)[keyof typeof fiatRates]
      ] || 1.0;
    return (amount * rate).toFixed(2);
  }, [fiatAmount, fromFiat, toFiat, fiatRates]);

  // Crypto conversion rates (valued in USD)
  const cryptoUSDValues = {
    BTC: 67200.0,
    ETH: 3480.0,
    SOL: 145.0,
    Ava: 1.25,
    USD: 1.0,
    EUR: 1.09,
    GBP: 1.27,
    JPY: 0.0064,
    CAD: 0.73,
    SAR: 0.27,
    AED: 0.27,
    AUD: 0.67,
    CHF: 1.11,
    CNY: 0.14,
    XRP: 0.48,
    ADA: 0.38,
    DOT: 5.75,
    DOGE: 0.12,
    BNB: 580.0,
  };

  const calculatedCryptoValue = useMemo(() => {
    const amount = parseFloat(cryptoAmount);
    if (isNaN(amount) || amount <= 0) return "0.00";

    const fromUSDValue =
      cryptoUSDValues[fromCrypto as keyof typeof cryptoUSDValues] || 1.0;
    const toUSDValue =
      cryptoUSDValues[toCrypto as keyof typeof cryptoUSDValues] || 1.0;

    const rate = fromUSDValue / toUSDValue;
    return (amount * rate).toFixed(4);
  }, [cryptoAmount, fromCrypto, toCrypto, cryptoUSDValues]);

  // Gas estimations
  const calculatedGasFee = useMemo(() => {
    let gasPrice = 0.0012;
    if (gasMode === "eco") gasPrice = 0.0004;
    if (gasMode === "fast") gasPrice = 0.0035;

    const amount = parseFloat(cryptoAmount) || 0;
    return (gasPrice * (1 + amount * 0.02)).toFixed(5);
  }, [cryptoAmount, gasMode]);

  const swapCryptoSelect = () => {
    const temp = fromCrypto;
    setFromCrypto(toCrypto);
    setToCrypto(temp);
  };

  // Standing list queries
  const filteredTransactions = useMemo(() => {
    const query = txSearch.toLowerCase().trim();
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.note.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query);
      const matchesFilter =
        txFilter === "All" ||
        (txFilter === "Sent" && tx.method === "debit") ||
        (txFilter === "Received" && tx.method === "credit") ||
        (txFilter === "Bookings" && (tx.type.toLowerCase().includes("booking") || tx.type.toLowerCase().includes("settlement") || tx.type.toLowerCase().includes("chauffeur") || tx.note.toLowerCase().includes("transfer") || tx.note.toLowerCase().includes("flight") || tx.note.toLowerCase().includes("jet") || tx.note.toLowerCase().includes("charter"))) ||
        (txFilter === "Scene Purchases" && (tx.type.toLowerCase().includes("scene") || tx.note.toLowerCase().includes("backdrop")));


      return matchesSearch && matchesFilter;
    });
  }, [txSearch, txFilter, transactions]);

  const filteredPurchases = useMemo(() => {
    const query = purchaseSearch.toLowerCase().trim();
    return purchases.filter((pr) => {
      const matchesSearch =
        pr.title.toLowerCase().includes(query) ||
        pr.merchant.toLowerCase().includes(query);
      const matchesFilter =
        purchaseFilter === "All" || pr.category === purchaseFilter;

      return matchesSearch && matchesFilter;
    });
  }, [purchaseSearch, purchaseFilter, purchases]);

  return (
    <main className="w-full min-h-screen overflow-x-hidden pb-8 transition-colors duration-500 max-w-[1600px] mx-auto text-[var(--text-main)] bg-[var(--bg-app)]">
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
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

        {/* 3-Column Premium Dashboard Layout */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.2fr_2fr] items-stretch">
          {/* Asset Balance, Transactions Ledger, Purchase History */}
          <div className="relative w-full h-full">
            <div className="flex flex-col gap-6 w-full lg:absolute lg:inset-0">
              <AssetBalance
                totalBalanceUSD={totalBalanceUSD}
                revealBalance={revealBalance}
                setRevealBalance={setRevealBalance}
              />

              <div className="flex-1 min-h-0">
                <TransactionsLedger
                  txSearch={txSearch}
                  setTxSearch={setTxSearch}
                  txFilter={txFilter}
                  setTxFilter={setTxFilter}
                  filteredTransactions={filteredTransactions}
                />
              </div>

              <div className="flex-1 min-h-0">
                <PurchaseHistory
                  purchaseSearch={purchaseSearch}
                  setPurchaseSearch={setPurchaseSearch}
                  purchaseFilter={purchaseFilter}
                  setPurchaseFilter={setPurchaseFilter}
                  filteredPurchases={filteredPurchases}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 h-full">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 md:auto-rows-fr">
              <CurrencyConverter
                activeCardSelect={activeCardSelect}
                setActiveCardSelect={setActiveCardSelect}
                fiatAmount={fiatAmount}
                setFiatAmount={setFiatAmount}
                fromFiat={fromFiat}
                setFromFiat={setFromFiat}
                toFiat={toFiat}
                setToFiat={setToFiat}
                fiatRates={fiatRates}
                currencyLabels={{
                  USD: "USD — US Dollar",
                  EUR: "EUR — Euro",
                  GBP: "GBP — British Pound",
                  JPY: "JPY — Japanese Yen",
                  CAD: "CAD — Canadian Dollar",
                  SAR: "SAR — Saudi Riyal",
                  AED: "AED — UAE Dirham",
                  AUD: "AUD — Australian Dollar",
                  CHF: "CHF — Swiss Franc",
                  CNY: "CNY — Chinese Yuan",
                }}
                calculatedFiatValue={calculatedFiatValue}
              />

              <FinancialCalculator
                calcDisplay={calcDisplay}
                calcFormula={calcFormula}
                calcNotification={calcNotification}
                handleCalcBtn={handleCalcBtn}
              />

              <CryptoSwapHub
                activeCardSelect={activeCardSelect}
                setActiveCardSelect={setActiveCardSelect}
                cryptoAmount={cryptoAmount}
                setCryptoAmount={setCryptoAmount}
                fromCrypto={fromCrypto}
                setFromCrypto={setFromCrypto}
                toCrypto={toCrypto}
                setToCrypto={setToCrypto}
                cryptoUSDValues={cryptoUSDValues}
                swapCryptoSelect={swapCryptoSelect}
                calculatedCryptoValue={calculatedCryptoValue}
                cryptoLabels={{
                  BTC: "BTC — Bitcoin",
                  ETH: "ETH — Ethereum",
                  SOL: "SOL — Solana",
                  Ava: "AVA — Travala Token",
                  USD: "USD — US Dollar",
                  XRP: "XRP — Ripple",
                  ADA: "ADA — Cardano",
                  DOT: "DOT — Polkadot",
                  DOGE: "DOGE — Dogecoin",
                  BNB: "BNB — Binance Coin",
                }}
              />

              <CardVault
                isCreatingCard={isCreatingCard}
                setIsCreatingCard={setIsCreatingCard}
                cards={cards}
                revealCardDetails={revealCardDetails}
                setRevealCardDetails={setRevealCardDetails}
                newCardType={newCardType}
                setNewCardType={setNewCardType}
                newCardTheme={newCardTheme}
                setNewCardTheme={setNewCardTheme}
                newCardLimit={newCardLimit}
                setNewCardLimit={setNewCardLimit}
                newCardNumber={newCardNumber}
                setNewCardNumber={setNewCardNumber}
                newCardHolder={newCardHolder}
                setNewCardHolder={setNewCardHolder}
                newCardExpiry={newCardExpiry}
                setNewCardExpiry={setNewCardExpiry}
                newCardCVV={newCardCVV}
                setNewCardCVV={setNewCardCVV}
                createVirtualCard={createVirtualCard}
              />
            </div>

            <TransmitPanel
              transmitStep={transmitStep}
              setTransmitStep={setTransmitStep}
              transmitContactId={transmitContactId}
              setTransmitContactId={setTransmitContactId}
              visibleContacts={visibleContacts}
              remainingCount={remainingCount}
              setShowAllContactsModal={setShowAllContactsModal}
              setShowAddContactModal={setShowAddContactModal}
              transmitAmount={transmitAmount}
              setTransmitAmount={setTransmitAmount}
              transmitCurrency={transmitCurrency}
              setTransmitCurrency={setTransmitCurrency}
              transmitNote={transmitNote}
              setTransmitNote={setTransmitNote}
              handleTransmit={handleTransmit}
              transmitSecureHash={transmitSecureHash}
              transmitErrorMsg={transmitErrorMsg}
            />
          </div>
        </div>

        <Footer />
      </div>

      {/* All Contacts Modal Popup */}
      <AnimatePresence>
        {showAllContactsModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAllContactsModal(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-panel-heavy rounded-[30px] p-6 relative overflow-hidden bg-[var(--surface-color)]/95 border border-[var(--glass-border)] shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-[var(--text-main)] uppercase tracking-wider text-left">
                    All Contacts
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5 text-left">
                    Select a recipient node
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllContactsModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-[var(--glass-border)] hover:border-red-500/30 text-sm font-bold text-[var(--text-muted)] transition cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Scrollable grid list of all contacts */}
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar py-1">
                {contactsList.map((c) => {
                  const isSelected = transmitContactId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setTransmitContactId(c.id);
                        setShowAllContactsModal(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 text-[var(--text-main)] shadow-[var(--glow-primary)]"
                          : "bg-white/[0.01] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-white/[0.02] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <div
                        className={`size-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center font-bold text-sm text-white shadow-sm flex-shrink-0`}
                      >
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-sm text-[var(--text-main)] truncate">
                          {c.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 truncate mt-0.5">
                          {c.email}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal Popup */}
      <AnimatePresence>
        {showAddContactModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddContactModal(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm glass-panel-heavy rounded-[30px] p-6 relative overflow-hidden bg-[var(--surface-color)]/95 border border-[var(--glass-border)] shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                  <UserPlus size={18} />
                  <span className="font-bold text-sm uppercase tracking-wider">
                    Add Contact
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-[var(--glass-border)] hover:border-red-500/30 text-sm font-bold text-[var(--text-muted)] transition cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form
                onSubmit={handleCreateContact}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emma Watson"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="bg-[var(--bg-app)]/85 border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. emma@flydna.io"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="bg-[var(--bg-app)]/85 border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-0199"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="bg-[var(--bg-app)]/85 border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:brightness-110 active:scale-[0.98] transition text-white font-extrabold text-sm uppercase tracking-wider rounded-xl cursor-pointer shadow-[var(--glow-primary)] text-center"
                >
                  Create Recipient
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
