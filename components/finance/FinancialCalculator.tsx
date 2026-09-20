import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

type FinancialCalculatorProps = {
  calcDisplay: string;
  calcFormula: string;
  calcNotification: string | null;
  handleCalcBtn: (key: string) => void;
};

export default function FinancialCalculator({
  calcDisplay,
  calcFormula,
  calcNotification,
  handleCalcBtn,
}: FinancialCalculatorProps) {
  return (
    <div className="h-full glass-panel-heavy rounded-[26px] p-5 relative overflow-hidden">
      <div className="flex items-center gap-2.5 mb-4 border-b border-white/5 pb-2.5">
        <div>
          <h3 className="font-extrabold text-sm tracking-wider text-[var(--text-main)] uppercase">
            Financial Calculator
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">
            Fast operations panel
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-2xl p-3 text-right mb-3 min-h-[56px] flex flex-col justify-end">
        <div className="text-xs font-extrabold text-slate-500 tracking-wide select-none font-mono">
          {calcFormula || "\u00A0"}
        </div>
        <div className="text-2xl font-black text-[var(--accent-primary)] font-mono tracking-tight break-all overflow-hidden select-all mt-0.5">
          {calcDisplay}
        </div>
      </div>

      <AnimatePresence>
        {calcNotification && (
          <motion.div
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-2 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-xs text-[var(--accent-primary)] font-bold text-center mb-3 flex items-center gap-1.5 justify-center"
          >
            <Info size={11} className="flex-shrink-0" />
            <span>{calcNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 gap-2">
        {[
          "C",
          "⌫",
          "÷",
          "×",
          "7",
          "8",
          "9",
          "-",
          "4",
          "5",
          "6",
          "+",
          "1",
          "2",
          "3",
          "=",
          "0",
          ".",
        ].map((key) => {
          let cellSpan = "col-span-1";
          let btnColor =
            "bg-white/[0.02] border-white/5 text-[var(--text-muted)] hover:bg-white/[0.05]";

          if (key === "=") {
            cellSpan = "row-span-2 col-span-1 h-full";
            btnColor =
              "bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white border-transparent hover:brightness-110 shadow-[var(--glow-primary)]";
          }
          if (key === "0") {
            cellSpan = "col-span-2";
          }
          if (key === "C" || key === "⌫") {
            btnColor =
              "bg-white/[0.04] border border-[var(--glass-border)] text-red-400 hover:bg-red-500/10";
          }
          if (["+", "-", "×", "÷"].includes(key)) {
            btnColor =
              "bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10";
          }

          return (
            <button
              key={key}
              onClick={() => handleCalcBtn(key)}
              className={`py-2.5 rounded-xl border font-mono font-bold text-sm cursor-pointer transition active:scale-95 flex items-center justify-center ${btnColor} ${cellSpan}`}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
