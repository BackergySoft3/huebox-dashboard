import { create } from "zustand";
import { api } from "../Services/http.service";

// ── Types ─────────────────────────────────────────────────────────────────

export interface LedgerBalance {
  availableBalance: number;
  pendingBalance: number;
  depositMemo?: string;
}

export interface DepositInfo {
  masterDepositAddress: string;
  memo: string;
  supportedCoins: string[];
  supportedNetworks: string[];
  warning: string;
}

export interface WithdrawalResult {
  withdrawalId: string;
  status: "submitted" | "pending_approval";
  message: string;
}

// ── Store Interface ────────────────────────────────────────────────────────

interface FundingState {
  balance: LedgerBalance | null;
  depositInfo: DepositInfo | null;
  history: { items: any[]; total: number; pages: number } | null;
  isBalanceLoading: boolean;
  isDepositInfoLoading: boolean;
  isHistoryLoading: boolean;
  isWithdrawing: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  fetchDepositInfo: () => Promise<void>;
  fetchHistory: (page: number, limit?: number) => Promise<void>;
  initiateWithdrawal: (
    amount: number,
    destinationAddress: string,
    network: string,
    coin?: string
  ) => Promise<WithdrawalResult>;
  clearError: () => void;
}

// ── Zustand Store ─────────────────────────────────────────────────────────

export const useFundingStore = create<FundingState>((set) => ({
  balance: null,
  depositInfo: null,
  history: null,
  isBalanceLoading: false,
  isDepositInfoLoading: false,
  isHistoryLoading: false,
  isWithdrawing: false,
  error: null,

  fetchBalance: async () => {
    set({ isBalanceLoading: true, error: null });
    try {
      const res = await api.get<LedgerBalance>("/api/funding/balance");
      set({ balance: res.data, isBalanceLoading: false });
    } catch (err: any) {
      set({
        isBalanceLoading: false,
        error: err?.response?.data?.message ?? "Failed to fetch balance.",
      });
    }
  },

  fetchDepositInfo: async () => {
    set({ isDepositInfoLoading: true, error: null });
    try {
      const res = await api.get<DepositInfo>("/api/funding/deposit-info");
      set({ depositInfo: res.data, isDepositInfoLoading: false });
    } catch (err: any) {
      set({
        isDepositInfoLoading: false,
        error: err?.response?.data?.message ?? "Failed to fetch deposit information.",
      });
    }
  },

  fetchHistory: async (page: number, limit = 20) => {
    set({ isHistoryLoading: true, error: null });
    try {
      const res = await api.get<{ items: any[]; total: number; pages: number }>(
        `/api/funding/history?page=${page}&limit=${limit}`
      );
      set({ history: res.data, isHistoryLoading: false });
    } catch (err: any) {
      set({
        isHistoryLoading: false,
        error: err?.response?.data?.message ?? "Failed to fetch transaction history.",
      });
    }
  },

  initiateWithdrawal: async (amount, destinationAddress, network, coin = "USDT") => {
    set({ isWithdrawing: true, error: null });
    try {
      const res = await api.post<WithdrawalResult>("/api/funding/withdraw", {
        amount,
        destinationAddress,
        network,
        coin,
      });
      set({ isWithdrawing: false });
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Withdrawal failed. Please try again.";
      set({ isWithdrawing: false, error: msg });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
}));
