import React from "react";
import { Eye, EyeOff } from "lucide-react";

type AssetBalanceProps = {
  totalBalanceUSD: number;
  revealBalance: boolean;
  setRevealBalance: (val: boolean) => void;
};

export default function AssetBalance({
  totalBalanceUSD,
  revealBalance,
  setRevealBalance,
}: AssetBalanceProps) {
  return (
    <div className="glass-panel-heavy rounded-[26px] p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h4 className="font-extrabold text-xs tracking-wider text-[var(--text-main)] uppercase">
              Asset Balance
            </h4>
            <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">
              Net Vault Worth
            </p>
          </div>
        </div>

        <button
          onClick={() => setRevealBalance(!revealBalance)}
          className="p-2 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] hover:bg-white/10 hover:border-[var(--accent-primary)]/30 transition text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
          title={revealBalance ? "Hide Balance" : "Reveal Balance"}
        >
          {revealBalance ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="py-4 text-left">
        <span className="text-[var(--text-muted)] text-sm font-semibold tracking-wide block uppercase">
          Total Ledger Value
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-black text-[var(--text-main)] tracking-tight select-all">
            {revealBalance
              ? `$${totalBalanceUSD.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "●●●●●●●●"}
          </span>
          {revealBalance && (
            <span className="text-sm font-bold text-[var(--accent-primary)] ml-1">
              USD
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
