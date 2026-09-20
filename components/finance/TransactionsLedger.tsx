import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plane, Car, Building2, Send, CreditCard } from "lucide-react";

import { cancelBookingByRef, getRemainingCancelTime } from "@/lib/ledger";

type Transaction = {
  id: string;
  type: string;
  note: string;
  amount: number;
  currency: string;
  method: string;
  timestamp: string;
  createdAtMs?: number;
  status: string;
};

type TransactionsLedgerProps = {
  txSearch: string;
  setTxSearch: (val: string) => void;
  txFilter: string;
  setTxFilter: (val: string) => void;
  filteredTransactions: Transaction[];
};

export default function TransactionsLedger({
  txSearch,
  setTxSearch,
  txFilter,
  setTxFilter,
  filteredTransactions,
}: TransactionsLedgerProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full flex flex-col glass-panel-heavy rounded-[26px] p-5 relative overflow-hidden bg-[radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.06),transparent_50%)]">
      <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="font-extrabold text-sm text-[var(--text-main)] tracking-wide text-left">
              Transactions
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5 text-left">
              Asset Transfer History
            </p>
          </div>
        </div>

        <div className="relative w-36">
          <input
            type="text"
            placeholder="Search transactions..."
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            className="w-full bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none placeholder:text-slate-500 focus:border-[var(--accent-primary)]/40 transition font-semibold"
          />
          <Search
            size={11}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>
      </div>

      {/* Relative container for floating header and list */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Sliding Glass Filter Tabs (Floating Container) */}
        <div className="absolute top-0 left-0 right-0 z-10 pb-3 bg-transparent">
          <div className="glass-panel-light glass-sheen flex w-fit gap-1 p-1 rounded-2xl border border-[var(--glass-border)] shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-[5px]">
            {["All", "Sent", "Received", "Bookings", "Scene Purchases"].map(
              (f) => {
                const isActive = txFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`relative py-1.5 px-4 text-center text-xs font-semibold rounded-xl transition duration-300 cursor-pointer ${
                      isActive
                        ? "text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTxFilter"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent-primary)]/70 to-[var(--accent-secondary)]/50 border border-[var(--accent-primary)]/30 shadow-[var(--glow-primary)]"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                        }}
                      />
                    )}
                    <span className="relative z-10">{f}</span>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto pt-14 pr-1 scrollbar-none custom-scrollbar flex flex-col">
          <AnimatePresence initial={false}>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {filteredTransactions.map((item) => {
                  const isDebit = item.method === "debit";
                  const isFlight =
                    item.type.toLowerCase().includes("flight") ||
                    item.note.toLowerCase().includes("flight");
                  const isCar =
                    item.type.toLowerCase().includes("chauffeur") ||
                    item.note.toLowerCase().includes("transfer") ||
                    item.note.toLowerCase().includes("car");
                  const isHotel =
                    item.type.toLowerCase().includes("hotel") ||
                    item.type.toLowerCase().includes("stay");
                  const isTransfer =
                    item.type.toLowerCase().includes("transfer") ||
                    item.type.toLowerCase().includes("transmit");

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="group relative bg-[#0F172A]/70 hover:bg-[#1E293B]/80 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all duration-200 text-left"
                    >
                      {/* Top Row: Icon + Title + Status + Amount */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Directional Icon Badge */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isDebit
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {isFlight ? (
                              <Plane className="w-4 h-4" />
                            ) : isCar ? (
                              <Car className="w-4 h-4" />
                            ) : isHotel ? (
                              <Building2 className="w-4 h-4" />
                            ) : isTransfer ? (
                              <Send className="w-4 h-4" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </div>

                          {/* Transaction Type & Badges */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-bold text-sm tracking-tight truncate">
                                {item.type}
                              </span>
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                                {item.currency}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 border ${
                                  item.status === "Confirmed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 font-medium truncate mt-1">
                              {item.note}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Time */}
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <span
                            className={`font-mono font-bold text-sm tracking-tight ${
                              isDebit ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {isDebit ? "-" : "+"}$
                            {item.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-mono mt-1">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* Refund / Cancellation Window (If Applicable) */}
                      {(() => {
                        const isBooking =
                          item.status === "Confirmed" &&
                          (item.type.includes("Chauffeur") ||
                            item.type.includes("Settlement") ||
                            item.note.includes("Transfer") ||
                            item.note.includes("Booking"));
                        if (!isBooking) return null;
                        const cancelTime = getRemainingCancelTime(
                          item.createdAtMs,
                          item.timestamp,
                        );
                        const totalMs = 2 * 60 * 60 * 1000;
                        const pct = Math.max(
                          3,
                          Math.min(
                            100,
                            Math.round(
                              (cancelTime.msRemaining / totalMs) * 100,
                            ),
                          ),
                        );

                        return (
                          <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800/80">
                            {!cancelTime.isExpired ? (
                              <>
                                <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                      Cancellation Lock
                                    </span>
                                    <span>{cancelTime.text}</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                    <div
                                      className="h-full bg-cyan-400 transition-all duration-1000"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const btn = e.currentTarget;
                                    const match = item.note.match(
                                      /#?(FDNA-CAR-\d+|FLY-CAR-\d+|FDNA-[A-Z0-9]+)/i,
                                    );
                                    const refCode = match
                                      ? match[1]
                                      : "FDNA-CAR";
                                    if (cancelBookingByRef(refCode)) {
                                      btn.innerText = "Refunded";
                                      btn.className =
                                        "px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10.5px] font-medium";
                                      btn.disabled = true;
                                    }
                                  }}
                                  className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-[10.5px] font-medium transition cursor-pointer shrink-0"
                                >
                                  Cancel Booking
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Cancellation window expired
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 font-medium text-xs">
                No transactions found.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
