// FIX 2 — stopInstance Should Surface the Response Message
// FIX 3 — Optimistic Update Snapshot Rollback
import { create } from "zustand";
import { api } from "../Services/http.service";
import type { BotInstance, StartInstancePayload, InstanceStatus } from "../Interfaces/instances";

interface InstancesState {
  instances: BotInstance[];
  isLoading: boolean;
  hasFetched: boolean;
  error: string | null;

  // Actions
  setInstances: (instances: BotInstance[]) => void;
  fetchInstances: () => Promise<void>;
  startInstance: (payload: StartInstancePayload) => Promise<void>;
  pauseInstance: (instanceId: string) => Promise<void>;
  resumeInstance: (instanceId: string) => Promise<void>;
  stopInstance: (instanceId: string) => Promise<string>;
  deleteInstance: (instanceId: string) => Promise<void>;

  // Optimistic update helper
  _optimisticUpdate: (instanceId: string, status: InstanceStatus) => BotInstance[];
}

export const useInstancesStore = create<InstancesState>((set, get) => ({
  instances: [],
  isLoading: false,
  hasFetched: false,
  error: null,

  setInstances: (instances) => set({ instances }),

  _optimisticUpdate: (instanceId, newStatus) => {
    const snapshot = get().instances;
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.instanceId === instanceId ? { ...inst, status: newStatus } : inst
      ),
    }));
    return snapshot;
  },

  fetchInstances: async () => {
    if (!get().hasFetched) set({ isLoading: true, error: null });
    try {
      const res = await api.get("/api/bot/instances");
      set({ instances: Array.isArray(res.data) ? res.data : [], isLoading: false, hasFetched: true });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || "Failed to fetch bot instances.",
        hasFetched: true
      });
    }
  },

  startInstance: async (payload) => {
    await api.post("/api/bot/instances/start", payload);
    // Refetch the full list so every field (walletBalanceUsdt, heartbeatAlive, etc.) is populated
    await get().fetchInstances();
  },

  pauseInstance: async (instanceId) => {
    const snapshot = get()._optimisticUpdate(instanceId, "paused");
    try {
      await api.post(`/api/bot/instances/${instanceId}/pause`);
    } catch (err) {
      set({ instances: snapshot });
      await get().fetchInstances();
      throw err;
    }
  },

  resumeInstance: async (instanceId) => {
    const snapshot = get()._optimisticUpdate(instanceId, "running");
    try {
      await api.post(`/api/bot/instances/${instanceId}/resume`);
    } catch (err) {
      set({ instances: snapshot });
      await get().fetchInstances();
      throw err;
    }
  },

  stopInstance: async (instanceId) => {
    const snapshot = get()._optimisticUpdate(instanceId, "stopped");
    try {
      const res = await api.post(`/api/bot/instances/${instanceId}/stop`);
      const message: string = res.data?.message ?? "Instance stopped.";
      await get().fetchInstances();
      return message;
    } catch (err) {
      set({ instances: snapshot });
      await get().fetchInstances();
      throw err;
    }
  },

  deleteInstance: async (instanceId) => {
    await api.delete(`/api/bot/instances/${instanceId}`);
    await get().fetchInstances();
  },
}));
