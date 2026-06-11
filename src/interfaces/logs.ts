import { LogLevel } from "../enums/LogLevel.enum";

export { LogLevel };

export interface LogLine {
  id: string;
  timestamp: string;
  message: string;
  level: LogLevel;
}

export interface LogBuffer {
  nestjs: LogLine[];
  python: LogLine[];
}

export interface LogsState {
  logBuffer: LogBuffer;
  addNestLog: (log: Omit<LogLine, "id">) => void;
  addPythonLog: (log: Omit<LogLine, "id">) => void;
  addNestLogsBatch: (logs: Omit<LogLine, "id">[]) => void;
  addPythonLogsBatch: (logs: Omit<LogLine, "id">[]) => void;
  clearLogs: () => void;
}

export interface NestjsLogsResponse {
  success: boolean;
  logPath: string;
  lines: number;
  output: string;
}
