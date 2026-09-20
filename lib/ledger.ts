/**
 * FlyDnA Financial Ledger & Receipt Manager
 * Manages global purchases, transactions, Rule #10 Web3 receipts, and Card Vault settlements.
 */

export type TransactionRecord = {
  id: string;
  type: string;
  note: string;
  amount: number;
  currency: string;
  method: "credit" | "debit";
  timestamp: string;
  createdAtMs?: number;
  status: string;
};

export type PurchaseRecord = {
  id: string;
  title: string;
  category: "Flights" | "Stays" | "Bookings" | "Customizations" | "Store";
  amount: number;
  date: string;
  createdAtMs?: number;
  status: string;
  merchant: string;
  flydnaFee?: number;
};

// Start with empty clean ledger for new users to maintain 100% trust & security
const DEFAULT_TRANSACTIONS: TransactionRecord[] = [];
const DEFAULT_PURCHASES: PurchaseRecord[] = [];

export function getStoredTransactions(): TransactionRecord[] {
  if (typeof window === "undefined") return DEFAULT_TRANSACTIONS;
  try {
    const raw = localStorage.getItem("flydna_finance_transactions");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return DEFAULT_TRANSACTIONS;
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
}

export function getStoredPurchases(): PurchaseRecord[] {
  if (typeof window === "undefined") return DEFAULT_PURCHASES;
  try {
    const raw = localStorage.getItem("flydna_finance_purchases");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return DEFAULT_PURCHASES;
  } catch {
    return DEFAULT_PURCHASES;
  }
}

export function recordTransaction(tx: Omit<TransactionRecord, "id" | "timestamp" | "status"> & { id?: string; timestamp?: string; createdAtMs?: number; status?: string }) {
  if (typeof window === "undefined") return;
  const current = getStoredTransactions();
  const newRecord: TransactionRecord = {
    id: tx.id || `tx-${Date.now()}`,
    type: tx.type,
    note: tx.note,
    amount: tx.amount,
    currency: tx.currency,
    method: tx.method,
    timestamp: tx.timestamp || new Date().toISOString().slice(0, 16).replace("T", " "),
    createdAtMs: tx.createdAtMs || Date.now(),
    status: tx.status || "Confirmed",
  };
  const updated = [newRecord, ...current];
  try {
    localStorage.getItem("flydna_finance_transactions");
    localStorage.setItem("flydna_finance_transactions", JSON.stringify(updated));
    window.dispatchEvent(new Event("flydna-ledger-updated"));
  } catch (e) {
    console.error("[Ledger] Error saving transaction:", e);
  }
}

export function recordPurchase(pr: Omit<PurchaseRecord, "id" | "date" | "status"> & { id?: string; date?: string; createdAtMs?: number; status?: string }) {
  if (typeof window === "undefined") return;
  const current = getStoredPurchases();
  const newRecord: PurchaseRecord = {
    id: pr.id || `pr-${Date.now()}`,
    title: pr.title,
    category: pr.category,
    amount: pr.amount,
    date: pr.date || new Date().toISOString().split("T")[0],
    createdAtMs: pr.createdAtMs || Date.now(),
    status: pr.status || "Confirmed",
    merchant: pr.merchant,
    flydnaFee: pr.flydnaFee ?? Math.round(pr.amount * 0.025 * 100) / 100,
  };

  const updated = [newRecord, ...current];
  try {
    localStorage.setItem("flydna_finance_purchases", JSON.stringify(updated));
    window.dispatchEvent(new Event("flydna-ledger-updated"));
  } catch (e) {
    console.error("[Ledger] Error saving purchase:", e);
  }
}

export function cancelBookingByRef(refCode: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const purchases = getStoredPurchases();
    let target = purchases.find((p) => p.title.includes(refCode) || p.id.includes(refCode));
    
    // If not exact match, get the most recent confirmed booking
    if (!target) {
      target = purchases.find((p) => p.status === "Confirmed" && p.category === "Bookings");
    }

    if (target) {
      target.status = "Cancelled";
      localStorage.setItem("flydna_finance_purchases", JSON.stringify(purchases));

      recordTransaction({
        type: "Booking Refund / Cancellation",
        note: `Full Refund for ${target.title} (Ref #${refCode})`,
        amount: target.amount,
        currency: "USD",
        method: "credit",
        status: "Refunded",
      });

      window.dispatchEvent(
        new CustomEvent("flydna-new-notification", {
          detail: {
            message: `⚠️ Reservation Ref #${refCode} successfully cancelled. Full refund of $${target.amount.toFixed(2)} USD credited to your account!`,
          },
        })
      );
      window.dispatchEvent(new Event("flydna-ledger-updated"));
      return true;
    }
  } catch (e) {
    console.error("[Ledger] Error cancelling booking:", e);
  }
  return false;
}

const CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

export function getRemainingCancelTime(createdMs?: number, timestampStr?: string): { isExpired: boolean; text: string; msRemaining: number } {
  let createdTime = createdMs;
  if (!createdTime && timestampStr) {
    const parsed = Date.parse(timestampStr);
    if (!isNaN(parsed)) createdTime = parsed;
  }
  if (!createdTime) createdTime = Date.now();

  const expiresAt = createdTime + CANCELLATION_WINDOW_MS;
  const now = Date.now();
  const msRemaining = expiresAt - now;

  if (msRemaining <= 0) {
    return { isExpired: true, text: "🔒 Window Expired", msRemaining: 0 };
  }

  const totalSec = Math.floor(msRemaining / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const text = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return { isExpired: false, text, msRemaining };
}


