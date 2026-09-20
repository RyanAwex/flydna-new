import React from "react";

import CustomSelect from "../shared/CustomSelect";

type CurrencyConverterProps = {
  fiatAmount: string;
  setFiatAmount: (val: string) => void;
  fromFiat: string;
  setFromFiat: (val: string) => void;
  toFiat: string;
  setToFiat: (val: string) => void;
  calculatedFiatValue: string;
  fiatRates: Record<string, Record<string, number>>;
  currencyLabels: Record<string, string>;
  activeCardSelect: "fiat" | "crypto" | null;
  setActiveCardSelect: (val: "fiat" | "crypto" | null) => void;
};

export default function CurrencyConverter({
  fiatAmount,
  setFiatAmount,
  fromFiat,
  setFromFiat,
  toFiat,
  setToFiat,
  calculatedFiatValue,
  fiatRates,
  currencyLabels,
  activeCardSelect,
  setActiveCardSelect,
}: CurrencyConverterProps) {
  return (
    <div
      className={`h-full glass-panel-heavy rounded-[26px] p-5 relative overflow-visible transition-all duration-300 ${
        activeCardSelect === "fiat" ? "z-40" : "z-20"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-4 border-b border-white/5 pb-2.5">
        <div>
          <h3 className="font-extrabold text-sm tracking-wider text-[var(--text-main)] uppercase">
            Currency Converter
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">
            Live exchange estimations
          </p>
        </div>
      </div>

      <div className="space-y-4 text-left">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
            Amount
          </label>
          <input
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-bold"
          />
        </div>

        {/* Stacked custom dropdowns for narrow, taller UI */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Source Currency
            </label>
            <CustomSelect
              value={fromFiat}
              onChange={setFromFiat}
              options={Object.keys(fiatRates)}
              labels={currencyLabels}
              className="rounded-xl px-4 py-3"
              onToggle={(isOpen) => setActiveCardSelect(isOpen ? "fiat" : null)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Target Currency
            </label>
            <CustomSelect
              value={toFiat}
              onChange={setToFiat}
              options={Object.keys(fiatRates)}
              labels={currencyLabels}
              className="rounded-xl px-4 py-3"
              onToggle={(isOpen) => setActiveCardSelect(isOpen ? "fiat" : null)}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--bg-app)]/50 border border-[var(--glass-border)] flex justify-between items-center">
          <div>
            <span className="block text-[10px] text-[var(--text-muted)] uppercase font-extrabold">
              Value
            </span>
            <span className="text-lg font-black text-[var(--text-main)] font-mono block mt-0.5">
              {calculatedFiatValue} {toFiat}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--accent-primary)] font-black font-mono">
              1 {fromFiat} ={" "}
              {fiatRates[fromFiat]?.[toFiat]?.toFixed(3) || "1.000"} {toFiat}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
