import { create } from "zustand";

interface BotState {
  status: "running" | "stalled" | "paused" | string;
  personality: string;
  heartbeat: string;
  activeGrids: number;
  cycleCounter: number;
  setBotStatus: (status: Partial<Omit<BotState, "setBotStatus">>) => void;
}

export const useBotStore = create<BotState>((set) => ({
  status: "stalled",
  personality: "balanced",
  heartbeat: "",
  activeGrids: 0,
  cycleCounter: 0,

  setBotStatus: (newStatus) => set((state) => ({
    ...state,
    ...newStatus
  }))
}));
