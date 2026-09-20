import LicensingGate from "./LicensingGate";
import React from "react";
import { ArrowLeftRight } from "lucide-react";
import CustomSelect from "../shared/CustomSelect";

type CryptoSwapHubProps = {
  cryptoAmount: string;
  setCryptoAmount: (val: string) => void;
  fromCrypto: string;
  setFromCrypto: (val: string) => void;
  toCrypto: string;
  setToCrypto: (val: string) => void;
  calculatedCryptoValue: string;
  swapCryptoSelect: () => void;
  cryptoUSDValues: Record<string, number>;
  cryptoLabels: Record<string, string>;
  activeCardSelect: "fiat" | "crypto" | null;
  setActiveCardSelect: (val: "fiat" | "crypto" | null) => void;
};

export default function CryptoSwapHub({
  cryptoAmount,
  setCryptoAmount,
  fromCrypto,
  setFromCrypto,
  toCrypto,
  setToCrypto,
  calculatedCryptoValue,
  swapCryptoSelect,
  cryptoUSDValues,
  cryptoLabels,
  activeCardSelect,
  setActiveCardSelect,
}: CryptoSwapHubProps) {
  return (
    <div
      className={`h-full glass-panel-heavy rounded-[26px] p-5 relative overflow-visible transition-all duration-300 ${
        activeCardSelect === "crypto" ? "z-40" : "z-20"
      }`}
    >
      <LicensingGate feature="Crypto Swap" />
      <div className="flex items-center gap-2.5 mb-4 border-b border-white/5 pb-2.5">
        <div>
          <h3 className="font-extrabold text-sm tracking-wider text-[var(--text-main)] uppercase">
            Crypto Swap
          </h3>
          <div className="flex -space-x-2 mt-1 select-none">
            {[
              {
                label: "B",
                name: "Bitcoin",
                bg: "bg-[#f89e43]",
                text: "text-white",
                size: "text-sm",
                img: "/crypto/btc.svg",
              },
              {
                label: "E",
                name: "Ethereum",
                bg: "bg-[#f5c134]",
                text: "text-white",
                size: "text-sm",
                img: "/crypto/Ether.svg",
              },
              {
                label: "S",
                name: "Solana",
                bg: "bg-[#1a0f30]",
                text: "text-[var(--accent-primary)]",
                size: "text-[11px]",
                img: "/crypto/Solana.svg",
              },
              {
                label: "X",
                name: "XRP",
                bg: "bg-[#1565c0]",
                text: "text-white",
                size: "text-[11px]",
                img: "/crypto/XRP.svg",
              },
              {
                label: "A",
                name: "Ava",
                bg: "bg-[#e84142]",
                text: "text-white",
                size: "text-sm",
                img: "/crypto/ava.png",
              },
            ].map((coin, index) => (
              <div
                key={coin.name}
                className="relative group flex flex-col items-center transition-all duration-200 hover:z-40"
                style={{ zIndex: index + 1 }}
              >
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-800 border border-white/10 text-[10px] font-extrabold text-slate-200 tracking-wide shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">
                  {coin.name}
                </span>
                <div
                  className={`size-8 rounded-full ${coin.bg} flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:-translate-y-2 cursor-default border-2 border-slate-300`}
                >
                  {coin.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coin.img}
                      alt={coin.name}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <span
                      className={`${coin.size} font-bold ${coin.text} leading-none`}
                    >
                      {coin.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 text-left">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">
            Amount
          </label>
          <input
            type="number"
            value={cryptoAmount}
            onChange={(e) => setCryptoAmount(e.target.value)}
            className="bg-[var(--bg-app)]/80 border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]/50 transition font-bold"
          />
        </div>

        {/* Horizontal custom selector row */}
        <div className="flex items-end justify-between gap-3">
          {/* FROM COLUMN */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">
              FROM
            </label>
            <CustomSelect
              value={fromCrypto}
              onChange={setFromCrypto}
              options={Object.keys(cryptoUSDValues)}
              labels={cryptoLabels}
              className="px-4 py-3"
              onToggle={(isOpen) =>
                setActiveCardSelect(isOpen ? "crypto" : null)
              }
            />
          </div>

          {/* SWAP BUTTON */}
          <div className="flex-shrink-0 pb-0.5">
            <button
              type="button"
              onClick={swapCryptoSelect}
              className="size-11 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:brightness-110 text-white flex items-center justify-center shadow-[var(--glow-primary)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 outline-none"
            >
              <ArrowLeftRight size={18} />
            </button>
          </div>

          {/* TO COLUMN */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">
              TO
            </label>
            <CustomSelect
              value={toCrypto}
              onChange={setToCrypto}
              options={Object.keys(cryptoUSDValues)}
              labels={cryptoLabels}
              className="px-4 py-3"
              onToggle={(isOpen) =>
                setActiveCardSelect(isOpen ? "crypto" : null)
              }
            />
          </div>
        </div>

        {/* Conversion card adhering to application theme */}
        <div className="p-5 rounded-[22px] bg-[var(--bg-app)]/50 border border-[var(--glass-border)] space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-primary)]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="text-left">
            <div className="text-base font-extrabold text-[var(--text-main)] leading-tight">
              {parseFloat(cryptoAmount) || 0} {fromCrypto} ={" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] font-black">
                {calculatedCryptoValue}
              </span>{" "}
              {toCrypto}
            </div>

            <div className="text-xs text-[var(--text-muted)] font-semibold mt-1">
              1 {fromCrypto} ≈{" "}
              {(() => {
                const fromUSD = cryptoUSDValues[fromCrypto] || 1.0;
                const toUSD = cryptoUSDValues[toCrypto] || 1.0;
                return (fromUSD / toUSD).toFixed(5);
              })()}{" "}
              {toCrypto}
            </div>

            <div className="flex items-center gap-1.5 mt-3 border-t border-white/5 pt-2.5 text-[10px] text-slate-500 uppercase tracking-widest font-black">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live market rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
