import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

type Purchase = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  merchant: string;
};

type PurchaseHistoryProps = {
  purchaseSearch: string;
  setPurchaseSearch: (val: string) => void;
  purchaseFilter: string;
  setPurchaseFilter: (val: string) => void;
  filteredPurchases: Purchase[];
};

export default function PurchaseHistory({
  purchaseSearch,
  setPurchaseSearch,
  purchaseFilter,
  setPurchaseFilter,
  filteredPurchases,
}: PurchaseHistoryProps) {
  return (
    <div className="h-full flex flex-col glass-panel-heavy rounded-[26px] p-5 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="font-extrabold text-sm text-[var(--text-main)] tracking-wide text-left">
              Purchase History
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5 text-left">
              Travel & Customization Receipts
            </p>
          </div>
        </div>

        <div className="relative w-36">
          <input
            type="text"
            placeholder="Search purchases..."
            value={purchaseSearch}
            onChange={(e) => setPurchaseSearch(e.target.value)}
            className="w-full bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl pl-7 pr-2.5 py-3 text-xs text-[var(--text-main)] outline-none placeholder:text-slate-500 focus:border-[var(--accent-primary)]/40 transition font-semibold"
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
          <div className="glass-panel-light glass-sheen flex w-fit gap-1 p-1 rounded-2xl border border-[var(--glass-border)] max-w-full overflow-x-auto scrollbar-none backdrop-blur-[5px]">
            {["All", "Flights", "Stays", "Bookings", "Customizations"].map(
              (f) => {
                const isActive = purchaseFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setPurchaseFilter(f)}
                    className={`relative py-1.5 px-4 text-center text-xs font-semibold rounded-xl transition duration-300 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePurchaseFilter"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] border border-[var(--accent-primary)]/30 shadow-[var(--glow-primary)]"
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
        <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pt-14 pr-1.5 custom-scrollbar">
          <AnimatePresence initial={false}>
            {filteredPurchases.length > 0 ? (
              filteredPurchases.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-between items-center bg-[var(--bg-app)]/50 hover:bg-[var(--surface-color)]/70 p-3 rounded-2xl border border-[var(--glass-border)] transition duration-200 text-left text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-main)] font-extrabold truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-[var(--glass-border)] text-[var(--text-muted)] font-black uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                          item.status === "Confirmed"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1 font-semibold truncate">
                      Merchant: {item.merchant}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-bold font-mono">
                      {item.date}
                    </span>
                  </div>

                  <div className="text-right ml-3 flex-shrink-0">
                    <span className="font-black text-sm block text-[var(--text-main)]">
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 font-semibold">
                No purchases found.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
