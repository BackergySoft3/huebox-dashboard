import { useLogsStore } from "../store/logs";

export function useLogStream() {
  const { logBuffer, clearLogs } = useLogsStore();

  const exportLogs = () => {
    const sortedLogs = [
      ...logBuffer.nestjs.map((l) => ({ type: "NESTJS", ...l })),
      ...logBuffer.python.map((l) => ({ type: "PYTHON", ...l })),
    ]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((l) => `[${l.type}] [${new Date(l.timestamp).toLocaleString()}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");

    const blob = new Blob([sortedLogs], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `huebox-logs-${new Date().toISOString()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    logBuffer,
    clearLogs,
    exportLogs,
  };
}
