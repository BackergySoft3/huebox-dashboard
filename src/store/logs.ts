import { create } from "zustand";

export interface LogLine {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error" | "debug" | "action";
}

interface LogsState {
  logBuffer: {
    nestjs: LogLine[];
    python: LogLine[];
  };
  addNestLog: (log: Omit<LogLine, "id">) => void;
  addPythonLog: (log: Omit<LogLine, "id">) => void;
  addNestLogsBatch: (logs: Omit<LogLine, "id">[]) => void;
  addPythonLogsBatch: (logs: Omit<LogLine, "id">[]) => void;
  clearLogs: () => void;
}

const MAX_LOGS = 5000;

export const useLogsStore = create<LogsState>((set) => ({
  logBuffer: {
    nestjs: [],
    python: [],
  },

  addNestLog: (log) => set((state) => {
    const newLog: LogLine = {
      ...log,
      id: `${Date.now()}-${Math.random()}`
    };
    return {
      logBuffer: {
        ...state.logBuffer,
        nestjs: [...state.logBuffer.nestjs, newLog].slice(-MAX_LOGS)
      }
    };
  }),

  addPythonLog: (log) => set((state) => {
    const newLog: LogLine = {
      ...log,
      id: `${Date.now()}-${Math.random()}`
    };
    return {
      logBuffer: {
        ...state.logBuffer,
        python: [...state.logBuffer.python, newLog].slice(-MAX_LOGS)
      }
    };
  }),

  addNestLogsBatch: (logs) => set((state) => {
    const newLogs: LogLine[] = logs.map((log, index) => ({
      ...log,
      id: `${Date.now()}-${index}-${Math.random()}`
    }));
    return {
      logBuffer: {
        ...state.logBuffer,
        nestjs: [...state.logBuffer.nestjs, ...newLogs].slice(-MAX_LOGS)
      }
    };
  }),

  addPythonLogsBatch: (logs) => set((state) => {
    const newLogs: LogLine[] = logs.map((log, index) => ({
      ...log,
      id: `${Date.now()}-${index}-${Math.random()}`
    }));
    return {
      logBuffer: {
        ...state.logBuffer,
        python: [...state.logBuffer.python, ...newLogs].slice(-MAX_LOGS)
      }
    };
  }),

  clearLogs: () => set(() => ({
    logBuffer: { nestjs: [], python: [] }
  }))
}));
