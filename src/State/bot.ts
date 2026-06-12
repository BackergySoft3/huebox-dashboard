import { create } from "zustand";
import type { BotState } from "../Interfaces/bot";

export type { BotState };

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
