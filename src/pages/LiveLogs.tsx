import { useState, useEffect } from "react";
import { useLogStream } from "../hooks/useLogStream";
import { useBotStore } from "../store/bot";
import { useLogsStore } from "../store/logs";
import { api } from "../lib/api";
import { LogPanel } from "../components/LogPanel";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Terminal, Download, Trash2, Search, PauseCircle, PlayCircle, SplitSquareHorizontal } from "lucide-react";

export function LiveLogs() {
  const { logBuffer, clearLogs, exportLogs } = useLogStream();
  const cycleCounter = useBotStore((state) => state.cycleCounter);
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (useLogsStore.getState().logBuffer.python.length === 0) {
      api.get("/api/bot/system/logs?lines=250")
        .then((res) => {
          if (res.data?.success && res.data.output) {
            const lines = res.data.output.split("\n");
            useLogsStore.getState().clearLogs();
            lines.forEach((line: string) => {
              if (line.trim()) {
                const lower = line.toLowerCase();
                const level = lower.includes("error") ? "error" : lower.includes("warn") ? "warn" : "info";
                useLogsStore.getState().addPythonLog({
                  timestamp: new Date().toISOString(),
                  message: line,
                  level,
                });
              }
            });
          }
        })
        .catch((err) => console.warn("Failed to load initial logs:", err));
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Panel Headers */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SplitSquareHorizontal className="w-8 h-8" /> Dual Log Stream
            {cycleCounter > 0 && <Badge variant="default" className="ml-2">CYCLE {cycleCounter}</Badge>}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs font-mono">Real-time split panel monitoring of system processes.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter logs..." 
              className="pl-8 h-9 text-xs" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setAutoScroll(!autoScroll)} className={autoScroll ? "text-primary border-primary/30" : "text-muted-foreground"}>
            {autoScroll ? <PauseCircle className="w-4 h-4 mr-1" /> : <PlayCircle className="w-4 h-4 mr-1" />}
            {autoScroll ? "Pause Scroll" : "Resume Scroll"}
          </Button>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Button variant="default" size="sm" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Panels Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* NestJS Panel */}
        <Card className="flex flex-col min-h-0 bg-[#0a0a0a]/60 border-border/40 shadow-inner backdrop-blur-sm">
          <CardHeader className="py-2.5 px-4 border-b border-border/20 bg-muted/10 shrink-0">
            <CardTitle className="text-xs font-mono tracking-wider flex items-center text-primary">
              <Terminal className="w-3.5 h-3.5 mr-2" /> NESTJS BACKEND LOGS
              <Badge variant="outline" className="ml-auto text-[10px] h-4 py-0 font-mono">
                {logBuffer.nestjs.length} LINES
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
            <LogPanel
              logs={logBuffer.nestjs}
              searchQuery={search}
              autoScroll={autoScroll}
              setAutoScroll={setAutoScroll}
            />
          </CardContent>
        </Card>

        {/* Python Panel */}
        <Card className="flex flex-col min-h-0 bg-[#0a0a0a]/60 border-border/40 shadow-inner backdrop-blur-sm">
          <CardHeader className="py-2.5 px-4 border-b border-border/20 bg-muted/10 shrink-0">
            <CardTitle className="text-xs font-mono tracking-wider flex items-center text-emerald-400">
              <Terminal className="w-3.5 h-3.5 mr-2" /> PYTHON ENGINE LOGS
              <Badge variant="outline" className="ml-auto text-[10px] h-4 py-0 font-mono">
                {logBuffer.python.length} LINES
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
            <LogPanel
              logs={logBuffer.python}
              searchQuery={search}
              autoScroll={autoScroll}
              setAutoScroll={setAutoScroll}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
