import LicensingGate from "./LicensingGate";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Coins,
  Zap,
} from "lucide-react";
import CustomSelect from "../shared/CustomSelect";

type Contact = {
  id: number;
  name: string;
  initials: string;
  color: string;
  email: string;
};

type TransmitPanelProps = {
  transmitStep: "idle" | "encrypting" | "broadcasting" | "success" | "error";
  setTransmitStep: (
    step: "idle" | "encrypting" | "broadcasting" | "success" | "error",
  ) => void;
  transmitContactId: number;
  setTransmitContactId: (id: number) => void;
  visibleContacts: Contact[];
  remainingCount: number;
  setShowAllContactsModal: (show: boolean) => void;
  setShowAddContactModal: (show: boolean) => void;
  transmitAmount: string;
  setTransmitAmount: (val: string) => void;
  transmitCurrency: string;
  setTransmitCurrency: (val: string) => void;
  transmitNote: string;
  setTransmitNote: (val: string) => void;
  handleTransmit: () => void;
  transmitSecureHash: string;
  transmitErrorMsg: string;
};

export default function TransmitPanel({
  transmitStep,
  setTransmitStep,
  transmitContactId,
  setTransmitContactId,
  visibleContacts,
  remainingCount,
  setShowAllContactsModal,
  setShowAddContactModal,
  transmitAmount,
  setTransmitAmount,
  transmitCurrency,
  setTransmitCurrency,
  transmitNote,
  setTransmitNote,
  handleTransmit,
  transmitSecureHash,
  transmitErrorMsg,
}: TransmitPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"fiat" | "crypto">("fiat");
  const [vaultXrp, setVaultXrp] = React.useState(1000.0);
  const [vaultAva, setVaultAva] = React.useState(500.0);
  const [fundAmount, setFundAmount] = React.useState("");
  const [fundToken, setFundToken] = React.useState<"xrp" | "ava">("xrp");

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("flydna_vault_balances");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.xrp === "number") setVaultXrp(parsed.xrp);
        if (typeof parsed.ava === "number") setVaultAva(parsed.ava);
      } else {
        localStorage.setItem(
          "flydna_vault_balances",
          JSON.stringify({ xrp: 1000.0, ava: 500.0 }),
        );
      }
    } catch {}
  }, []);

  const handleFundVault = () => {
    const val = parseFloat(fundAmount);
    if (isNaN(val) || val <= 0) return;

    const updated = {
      xrp: fundToken === "xrp" ? vaultXrp + val : vaultXrp,
      ava: fundToken === "ava" ? vaultAva + val : vaultAva,
    };

    setVaultXrp(updated.xrp);
    setVaultAva(updated.ava);
    localStorage.setItem("flydna_vault_balances", JSON.stringify(updated));
    setFundAmount("");

    // Trigger custom event to notify checkout page of updated vault balances
    window.dispatchEvent(new Event("flydna-vault-updated"));
  };

  return (
    <div className="glass-panel-heavy rounded-[26px] p-5 relative overflow-visible">
      <LicensingGate feature="Transmit" />
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="font-extrabold text-sm text-[var(--text-main)] tracking-wide text-left">
              Transmit
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-semibold mt-0.5 text-left">
              Send Instant Assets to Contacts
            </p>
          </div>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="grid grid-cols-2 gap-2 mb-4 bg-white/[0.02] p-1 rounded-xl border border-white/5">
        <button
          type="button"
          onClick={() => setActiveTab("fiat")}
          className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "fiat"
              ? "bg-[var(--accent-primary)] text-white shadow-sm"
              : "bg-transparent text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard size={12} /> Fiat Transmit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("crypto")}
          className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "crypto"
              ? "bg-[var(--accent-primary)] text-white shadow-sm"
              : "bg-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Coins size={12} /> Crypto Wallet
        </button>
      </div>

      {activeTab === "fiat" ? (
        <AnimatePresence mode="wait">
          {transmitStep === "idle" && (
            <motion.div
              key="idle-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-left">
                <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                  Select Receiver Node
                </span>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {visibleContacts.map((c) => {
                    const isSelected = transmitContactId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTransmitContactId(c.id)}
                        className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all flex-shrink-0 cursor-pointer min-w-[76px] ${
                          isSelected
                            ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/35 text-[var(--text-main)]"
                            : "bg-white/[0.01] border-white/5 text-[var(--text-muted)] hover:bg-white/[0.02] hover:text-[var(--text-main)]"
                        }`}
                      >
                        <div
                          className={`size-9 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center font-bold text-sm text-white shadow-sm`}
                        >
                          {c.initials}
                        </div>
                        <span className="text-xs font-bold max-w-[64px] truncate text-center">
                          {c.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}

                  {/* Count button for remaining contacts */}
                  {remainingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllContactsModal(true)}
                      className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] transition-all flex-shrink-0 cursor-pointer min-w-[76px]"
                      title="View all contacts"
                    >
                      <div className="size-9 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center font-bold text-sm text-[var(--accent-primary)] shadow-[var(--glow-primary)]">
                        +{remainingCount}
                      </div>
                      <span className="text-xs font-bold max-w-[64px] truncate text-center leading-tight">
                        More
                      </span>
                    </button>
                  )}

                  {/* Add Recipient button as the last place in the row */}
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(true)}
                    className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-white/10 hover:border-[var(--accent-primary)]/40 text-slate-500 hover:text-slate-300 transition-all flex-shrink-0 cursor-pointer min-w-[76px] bg-white/[0.01] hover:bg-white/[0.02]"
                  >
                    <div className="size-9 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                      <Plus size={16} />
                    </div>
                    <span className="text-xs font-bold max-w-[64px] truncate text-center leading-tight">
                      Add Recipient
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-left">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Amount to Transmit
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={transmitAmount}
                    onChange={(e) => setTransmitAmount(e.target.value)}
                    className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Asset Type
                  </label>
                  <CustomSelect
                    value={transmitCurrency}
                    onChange={(val) => setTransmitCurrency(val)}
                    options={[
                      "USD",
                      "EUR",
                      "GBP",
                      "JPY",
                      "CAD",
                      "SAR",
                      "AED",
                      "AUD",
                      "CHF",
                      "CNY",
                      "BTC",
                      "ETH",
                      "SOL",
                      "Ava",
                      "XRP",
                      "ADA",
                      "DOT",
                      "DOGE",
                      "BNB",
                    ]}
                    labels={{
                      USD: "USD ($)",
                      EUR: "EUR (€)",
                      GBP: "GBP (£)",
                      JPY: "JPY (¥)",
                      CAD: "CAD ($)",
                      SAR: "SAR (SR)",
                      AED: "AED (dh)",
                      AUD: "AUD ($)",
                      CHF: "CHF (Fr)",
                      CNY: "CNY (¥)",
                      BTC: "BTC (₿)",
                      ETH: "ETH (Ξ)",
                      SOL: "SOL (◎)",
                      Ava: "AVA (Travala)",
                      XRP: "XRP (✕)",
                      ADA: "ADA (₳)",
                      DOT: "DOT (●)",
                      DOGE: "DOGE (Ð)",
                      BNB: "BNB (BNB)",
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-[var(--glass-border)] text-sm font-bold bg-[var(--bg-app)]/80 text-[var(--text-muted)]"
                    align="right"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                  Transaction Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Travel payment / flight booking split"
                  value={transmitNote}
                  onChange={(e) => setTransmitNote(e.target.value)}
                  className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-semibold"
                />
              </div>

              <button
                onClick={handleTransmit}
                className="w-full py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:brightness-110 active:scale-[0.98] text-white text-sm font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[var(--glow-primary)]"
              >
                TRANSMIT NOW
              </button>
            </motion.div>
          )}

          {transmitStep === "encrypting" && (
            <motion.div
              key="encrypt-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center flex flex-col items-center justify-center gap-4"
            >
              {transmitCurrency === "XRP" ? (
                <>
                  <div className="relative size-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md animate-pulse" />
                    <Loader2
                      className="animate-spin text-blue-400 relative z-10"
                      size={32}
                    />
                  </div>
                  <div className="space-y-1.5 max-w-[280px]">
                    <h4 className="text-sm font-extrabold text-blue-400 uppercase tracking-wide">
                      RippleNet Pathfinding
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Establishing Interledger Protocol (ILP) trustline tunnel:
                    </p>
                    <div className="bg-[#06111f]/95 border border-white/10 px-2.5 py-1 rounded font-mono text-xs text-blue-400 select-all truncate mt-2">
                      {transmitSecureHash || "XRPL-ILP-TUNNEL"}
                    </div>
                  </div>
                </>
              ) : transmitCurrency === "Ava" ? (
                <>
                  <div className="relative size-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-pulse" />
                    <Loader2
                      className="animate-spin text-emerald-400 relative z-10"
                      size={32}
                    />
                  </div>
                  <div className="space-y-1.5 max-w-[280px]">
                    <h4 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wide">
                      Travala Smart Perks Check
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Connecting to Travala Smart Loyalty tier registry...
                    </p>
                    <div className="bg-[#06111f]/95 border border-white/10 px-2.5 py-1 rounded font-mono text-xs text-emerald-400 select-all truncate mt-2">
                      SMART-MEMBER-VERIFYING
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative size-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[var(--accent-primary)]/20 blur-md animate-pulse" />
                    <Loader2
                      className="animate-spin text-[var(--accent-primary)] relative z-10"
                      size={32}
                    />
                  </div>
                  <div className="space-y-1.5 max-w-[260px]">
                    <h4 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wide">
                      Generating Secure Key
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed">
                      Establishing encrypted point-to-point tunneling protocol:
                    </p>
                    <div className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] px-2.5 py-1 rounded font-mono text-xs text-[var(--accent-primary)] select-all truncate mt-2">
                      {transmitSecureHash}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {transmitStep === "broadcasting" && (
            <motion.div
              key="broadcast-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center flex flex-col items-center justify-center gap-4 w-full"
            >
              {transmitCurrency === "XRP" ? (
                <div className="w-full max-w-[340px] space-y-4 text-left">
                  <div className="flex items-center justify-between px-6 py-2.5 bg-blue-950/20 border border-blue-500/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/20 -translate-y-1/2" />
                    <motion.div
                      initial={{ left: "10%" }}
                      animate={{ left: "90%" }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                      className="absolute size-2.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa] -translate-y-1/2 top-1/2"
                    />
                    <div className="size-8 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center justify-center font-bold text-xs text-blue-400 relative z-10">
                      YOU
                    </div>
                    <div className="size-8 rounded-full bg-blue-950 border border-blue-500/30 flex items-center justify-center font-bold text-[10px] text-blue-300 relative z-10 animate-pulse">
                      XRPL
                    </div>
                    <div className="size-8 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center justify-center font-bold text-xs text-blue-400 relative z-10">
                      RCV
                    </div>
                  </div>
                  <div className="bg-[#030912]/95 border border-white/5 p-3 rounded-2xl font-mono text-[9px] text-blue-300/90 space-y-1 leading-normal max-h-[100px] overflow-y-auto custom-scrollbar select-none">
                    <div className="flex justify-between">
                      <span>&gt; Connecting to XRPL validator node...</span>
                      <span className="text-emerald-400">DONE</span>
                    </div>
                    <div>&gt; Generating trustline & escrow path...</div>
                    <div className="text-cyan-400">
                      &gt; Ripple Consensus Protocol (RCP) active...
                    </div>
                    <div className="text-slate-500 animate-pulse">
                      &gt; Sub-sampling nodes for validation...
                    </div>
                  </div>
                </div>
              ) : transmitCurrency === "Ava" ? (
                <div className="w-full max-w-[340px] space-y-4 text-left">
                  <div className="flex items-center justify-between px-6 py-2.5 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-500/20 -translate-y-1/2" />
                    <motion.div
                      initial={{ left: "10%" }}
                      animate={{ left: "90%" }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                      className="absolute size-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] -translate-y-1/2 top-1/2"
                    />
                    <div className="size-8 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center font-bold text-xs text-emerald-400 relative z-10">
                      YOU
                    </div>
                    <div className="size-8 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] text-emerald-300 relative z-10 animate-pulse">
                      SMART
                    </div>
                    <div className="size-8 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center font-bold text-xs text-emerald-400 relative z-10">
                      RCV
                    </div>
                  </div>
                  <div className="bg-[#030912]/95 border border-white/5 p-3 rounded-2xl font-mono text-[9px] text-emerald-300/90 space-y-1 leading-normal max-h-[100px] overflow-y-auto custom-scrollbar select-none">
                    <div className="flex justify-between">
                      <span>&gt; Validating AVA holding perks...</span>
                      <span className="text-emerald-400">SMART-4</span>
                    </div>
                    <div className="text-emerald-400">
                      &gt; Applying 8% Smart booking discount...
                    </div>
                    <div className="text-cyan-400">
                      &gt; Generating atomic Travala reward block...
                    </div>
                    <div className="text-slate-500 animate-pulse">
                      &gt; Crediting loyalty points to member ledger...
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative size-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-purple-400/20 blur-md animate-pulse" />
                    <div className="absolute inset-0 border border-[var(--accent-primary)]/40 rounded-full animate-ping" />
                    <RefreshCw
                      className="animate-spin-slow text-purple-400 relative z-10"
                      size={30}
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wide">
                      Broadcasting Assets
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-semibold max-w-[200px]">
                      Verifying nodes and updating local distributed ledger...
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {transmitStep === "success" && (
            <motion.div
              key="success-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center flex flex-col items-center justify-center gap-4"
            >
              <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Check size={28} className="animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wide">
                  Transmission Complete
                </h4>
                <p className="text-xs text-[var(--text-muted)] font-semibold max-w-[240px]">
                  Funds successfully sent. Secure token ledger has been updated.
                </p>
                <button
                  onClick={() => setTransmitStep("idle")}
                  className="mt-3 px-4 py-1.5 bg-white/[0.04] border border-[var(--glass-border)] hover:bg-white/10 hover:border-[var(--accent-primary)]/20 text-[var(--text-muted)] hover:text-white text-xs font-black rounded-lg transition cursor-pointer"
                >
                  OKAY
                </button>
              </div>
            </motion.div>
          )}

          {transmitStep === "error" && (
            <motion.div
              key="error-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center flex flex-col items-center justify-center gap-4"
            >
              <div className="size-14 rounded-full bg-red-500/10 border border-red-400/30 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1.5 max-w-[240px]">
                <h4 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wide">
                  Transmission Failed
                </h4>
                <p className="text-xs text-red-400/95 font-bold leading-relaxed">
                  {transmitErrorMsg}
                </p>
                <button
                  onClick={() => setTransmitStep("idle")}
                  className="mt-3 px-4 py-1.5 bg-white/[0.04] border border-[var(--glass-border)] hover:bg-white/10 text-[var(--text-muted)] hover:text-white text-xs font-black rounded-lg transition cursor-pointer"
                >
                  TRY AGAIN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <motion.div
          key="crypto-mode"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-left"
        >
          {/* Vault Balances */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-blue-950/10 border border-blue-500/10 flex flex-col">
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider">
                XRP Balance
              </span>
              <span className="text-lg font-black text-white mt-1">
                {vaultXrp.toFixed(2)} XRP
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                ${(vaultXrp * 1.5).toFixed(2)} USD
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-950/10 border border-amber-500/10 flex flex-col">
              <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
                AVA Balance
              </span>
              <span className="text-lg font-black text-white mt-1">
                {vaultAva.toFixed(2)} AVA
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                ${(vaultAva * 2.4).toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Funding Form */}
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Simulate Deposit / Fund Vault
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full bg-[var(--bg-app)]/85 border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[var(--accent-primary)]/50 transition font-bold"
                />
              </div>
              <div>
                <select
                  value={fundToken}
                  onChange={(e) =>
                    setFundToken(e.target.value as "xrp" | "ava")
                  }
                  className="w-full bg-[var(--bg-app)]/85 border border-[var(--glass-border)] rounded-xl px-2 py-2.5 text-xs text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]/50 transition font-bold"
                >
                  <option value="xrp">XRP</option>
                  <option value="ava">AVA</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFundVault}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5"
            >
              <Zap size={13} className="fill-current" /> Fund My Digital Vault
            </button>
          </div>

          {/* Public Deposit Addresses */}
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl border border-white/5 bg-slate-950/40 space-y-1">
              <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-wider">
                <span>XRP Ledger Deposit Address</span>
                <span className="text-[7px] text-blue-400 font-bold uppercase">
                  Public
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 break-all select-all">
                rYourFlyDnaXrpCorporateWalletAddress
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/5 bg-slate-950/40 space-y-1">
              <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-wider">
                <span>Ethereum AVA Recipient Address</span>
                <span className="text-[7px] text-amber-400 font-bold uppercase">
                  Public Contract
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 break-all select-all">
                0x4F4aC55F22481198A8824100918f08e34f
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
