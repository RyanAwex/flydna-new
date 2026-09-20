import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Eye, EyeOff, Plus, Lock, X } from "lucide-react";

type CardItem = {
  id: number;
  type: string;
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
  theme: string;
  limit: number;
  balance: number;
  glowColor: string;
};

type CardVaultProps = {
  revealCardDetails: boolean;
  setRevealCardDetails: (val: boolean) => void;
  isCreatingCard: boolean;
  setIsCreatingCard: (val: boolean) => void;
  newCardType: string;
  setNewCardType: (val: string) => void;
  newCardLimit: string;
  setNewCardLimit: (val: string) => void;
  newCardTheme: string;
  setNewCardTheme: (val: string) => void;
  newCardNumber: string;
  setNewCardNumber: (val: string) => void;
  newCardHolder: string;
  setNewCardHolder: (val: string) => void;
  newCardExpiry: string;
  setNewCardExpiry: (val: string) => void;
  newCardCVV: string;
  setNewCardCVV: (val: string) => void;
  createVirtualCard: (e: React.FormEvent) => void;
  cards: CardItem[];
};

export default function CardVault({
  revealCardDetails,
  setRevealCardDetails,
  isCreatingCard,
  setIsCreatingCard,
  newCardType,
  setNewCardType,
  newCardLimit,
  setNewCardLimit,
  newCardTheme,
  setNewCardTheme,
  newCardNumber,
  setNewCardNumber,
  newCardHolder,
  setNewCardHolder,
  newCardExpiry,
  setNewCardExpiry,
  newCardCVV,
  setNewCardCVV,
  createVirtualCard,
  cards,
}: CardVaultProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardIsDown = useRef(false);
  const cardStartX = useRef(0);
  const cardScrollLeftVal = useRef(0);

  const prevCardsLengthRef = useRef(cards.length);
  useEffect(() => {
    if (cards.length > prevCardsLengthRef.current) {
      // eslint-disable-next-line react-hooks/immutability
      scrollToCardIndex(cards.length - 1);
    }
    prevCardsLengthRef.current = cards.length;
  }, [cards.length]);

  const handleCardMouseDown = (e: React.MouseEvent) => {
    if (!cardContainerRef.current) return;
    cardIsDown.current = true;
    cardStartX.current = e.pageX - cardContainerRef.current.offsetLeft;
    cardScrollLeftVal.current = cardContainerRef.current.scrollLeft;
  };

  const handleCardMouseMove = (e: React.MouseEvent) => {
    if (!cardIsDown.current || !cardContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - cardContainerRef.current.offsetLeft;
    const walk = (x - cardStartX.current) * 1.5; // Drag speed multiplier
    cardContainerRef.current.scrollLeft = cardScrollLeftVal.current - walk;
  };

  const handleCardMouseUpOrLeave = () => {
    cardIsDown.current = false;
  };

  const scrollToCardIndex = (idx: number) => {
    setActiveCardIndex(idx);
    if (cardContainerRef.current) {
      cardContainerRef.current.scrollTo({
        left: idx * 326, // card width (310px) + gap-4 (16px) = 326
        behavior: "smooth",
      });
    }
  };

  const handleCardScroll = () => {
    if (!cardContainerRef.current) return;
    const scrollLeft = cardContainerRef.current.scrollLeft;
    const idx = Math.round(scrollLeft / 326);
    if (idx !== activeCardIndex && idx >= 0 && idx < cards.length) {
      setActiveCardIndex(idx);
    }
  };

  return (
    <div className="h-full glass-panel-heavy rounded-[26px] p-5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h4 className="font-extrabold text-xs tracking-wider text-[var(--text-main)] uppercase">
              Card Vault
            </h4>
            <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">
              Saved Cards
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setRevealCardDetails(!revealCardDetails)}
            className="p-1.5 rounded-lg bg-white/[0.02] border border-[var(--glass-border)] hover:bg-white/10 hover:border-[var(--accent-primary)]/35 transition text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            title={
              revealCardDetails ? "Hide Card Details" : "Reveal Card Details"
            }
          >
            {revealCardDetails ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={() => setIsCreatingCard(true)}
            className={`p-1.5 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--glass-border)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 transition cursor-pointer ${
              isCreatingCard
                ? "bg-[var(--accent-primary)]/20 animate-pulse"
                : ""
            }`}
            title="Generate Virtual Card"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Dynamic Virtual Card Stack View */}
      <div className="relative min-h-[190px] flex flex-col justify-center items-center">
        <div className="w-full flex flex-col items-center">
          {/* Native scroll-snap container with mouse dragging */}
          <div
            ref={cardContainerRef}
            onMouseDown={handleCardMouseDown}
            onMouseMove={handleCardMouseMove}
            onMouseUp={handleCardMouseUpOrLeave}
            onMouseLeave={handleCardMouseUpOrLeave}
            onScroll={handleCardScroll}
            className="w-full max-w-[342px] overflow-x-auto scrollbar-none snap-x snap-mandatory flex gap-4 py-7 px-4 relative mx-auto rounded-2xl cursor-grab active:cursor-grabbing select-none"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {cards.length > 0 ? (
              cards.map((card, idx) => {
                const isActive = activeCardIndex === idx;
                return (
                  <div
                    key={card.id}
                    className={`flex-shrink-0 w-[310px] aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${card.theme} p-4 text-left flex flex-col justify-between relative overflow-hidden transition-all duration-500 ease-out select-none snap-center ${
                      isActive
                        ? "scale-100 opacity-100 z-10"
                        : "scale-[0.9] opacity-40 blur-[0.4px] select-none pointer-events-none"
                    }`}
                    style={{
                      boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.35)",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-white/90 uppercase tracking-widest">
                        {card.type}
                      </span>
                      <div className="size-6 rounded-md bg-white/10 border border-white/10 flex items-center justify-center">
                        <Lock size={11} className="text-white/60" />
                      </div>
                    </div>

                    <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-300 to-yellow-600 opacity-80 border border-amber-400/20 mt-1 relative">
                      <div className="absolute inset-x-1.5 top-1 bottom-1 border-r border-amber-800/20" />
                      <div className="absolute inset-y-1.5 left-1 right-1 border-b border-amber-800/20" />
                    </div>

                    <div className="text-lg font-bold text-white tracking-widest mt-1 font-mono">
                      {revealCardDetails
                        ? card.number
                        : `•••• •••• •••• ${card.number.slice(-4)}`}
                    </div>

                    <div className="flex justify-between items-end mt-1">
                      <div>
                        <span className="block text-[8px] text-white/60 uppercase">
                          Card Holder
                        </span>
                        <span className="text-xs font-black text-white truncate max-w-[150px] block">
                          {card.holder}
                        </span>
                      </div>

                      <div className="flex gap-4">
                        <div>
                          <span className="block text-[10px] text-white/60 uppercase">
                            Expires
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            {card.expiry}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-white/60 uppercase">
                            CVV
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            {revealCardDetails ? card.cvv : "•••"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl w-full text-center h-[196px] bg-white/[0.01]">
                <CreditCard size={28} className="text-slate-600 mb-2" />
                <span className="text-xs text-[var(--text-muted)] font-bold">
                  No saved cards in Vault
                </span>
                <span className="text-[9px] text-slate-500 mt-1 font-semibold">
                  Click the + icon to generate a virtual card or pay at checkout
                </span>
              </div>
            )}
          </div>

          {/* Card Selection Selector Dots */}
          {cards.length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              {cards.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => scrollToCardIndex(idx)}
                  className={`size-2.5 rounded-full transition-all cursor-pointer ${
                    activeCardIndex === idx
                      ? "bg-[var(--accent-primary)] w-5"
                      : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Centered Modal / Popup for Card Creation */}
      <AnimatePresence>
        {isCreatingCard && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCreatingCard(false);
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-lg bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-[30px] p-6 shadow-2xl relative text-left"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsCreatingCard(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--glass-border)] text-[var(--accent-primary)]">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[var(--text-main)]">
                    Create Virtual Card
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">
                    Enter details below or leave custom fields blank to
                    autogenerate.
                  </p>
                </div>
              </div>

              <form onSubmit={createVirtualCard} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                      Card Label / Type *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Travel Gold"
                      value={newCardType}
                      onChange={(e) => setNewCardType(e.target.value)}
                      className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 font-semibold transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                      Max Spending Limit ($) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={newCardLimit}
                      onChange={(e) => setNewCardLimit(e.target.value)}
                      className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 font-semibold transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                    Card Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4111 2222 3333 4444"
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(e.target.value)}
                    className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 font-mono transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                    Card Holder Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Mercer"
                    value={newCardHolder}
                    onChange={(e) => setNewCardHolder(e.target.value)}
                    className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 font-semibold transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY (e.g. 07/31)"
                      value={newCardExpiry}
                      onChange={(e) => setNewCardExpiry(e.target.value)}
                      className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 font-mono transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                      CVV Code (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 123"
                      value={newCardCVV}
                      onChange={(e) => setNewCardCVV(e.target.value)}
                      className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 font-mono transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                    Select Card Skin / Accent Style
                  </label>
                  <div className="flex gap-4 mt-1">
                    {[
                      {
                        name: "emerald",
                        class: "bg-emerald-500",
                        label: "Emerald Glow",
                      },
                      {
                        name: "crimson",
                        class: "bg-rose-500",
                        label: "Crimson Spark",
                      },
                      {
                        name: "violet",
                        class: "bg-purple-500",
                        label: "Violet Nebula",
                      },
                      {
                        name: "blue",
                        class: "bg-blue-500",
                        label: "Cyber Blue",
                      },
                    ].map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setNewCardTheme(theme.name)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                          newCardTheme === theme.name
                            ? "bg-white/10 border-white/20 text-[var(--text-main)]"
                            : "bg-transparent border-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                      >
                        <span
                          className={`size-3 rounded-full ${theme.class}`}
                        />
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCard(false)}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-sm font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-sm font-black rounded-xl hover:brightness-110 shadow-lg shadow-[var(--accent-primary)]/20 transition cursor-pointer"
                  >
                    CREATE VIRTUAL CARD ($15)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
