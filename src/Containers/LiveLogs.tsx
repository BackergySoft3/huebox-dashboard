// FIX 4 — LiveLogs Reads Wrong Response Shape
// FIX 5 — WebSocket Subscribe/Unsubscribe Events Are Wrong
// B2 — Live Logs Panel Integration (Default Selection & Lifecycle)
import { useState, useEffect } from "react";
import { useLogStream } from "../Hooks/useLogStream";
import { useBotStore } from "../State/bot";
import { api } from "../Services/http.service";
import { useLogsStore } from "../State/logs";
import { useInstancesStore } from "../State/instances";
import { useAuthStore } from "../State/auth";
import { socket } from "../Services/SignalRService/connection";
import { nestLogApi } from "../Services/nestLogApi";
import { LogPanel } from "../Components/Organisms/LogPanel";
import { Card, CardHeader, CardTitle, CardContent } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import { Badge } from "../Components/Atoms/badge";
import { Select } from "../Components/Atoms/select";
import { Terminal, Download, Trash2, Search, PauseCircle, PlayCircle, SplitSquareHorizontal, Bot } from "lucide-react";

export function LiveLogs() {
  const { logBuffer, clearLogs, exportLogs } = useLogStream();
  const cycleCounter = useBotStore((state) => state.cycleCounter);
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  // ── Multi-instance logs logic ──────────────────────────────────────────────
  const user = useAuthStore((state) => state.user);
  const { instances, fetchInstances } = useInstancesStore();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // B2 Step 1 — Default selection fallback logic with null guard
  useEffect(() => {
    if (instances.length > 0 && !selectedInstanceId) {
      const defaultInstance = instances.find((i) => i.status === "running") ?? instances[0];
      setSelectedInstanceId(defaultInstance.instanceId);
    }
  }, [instances, selectedInstanceId]);

  // B2 Step 1 — Handle instance logs switching and socket subscription
  useEffect(() => {
    if (!selectedInstanceId || !user?.id) return;

    // Clear logs buffer on switch
    clearLogs();

    // Fetch initial logs for the instance (Fix 4)
    api.get(`/api/bot/system/logs?lines=250&instanceId=${selectedInstanceId}`)
      .then((res) => {
        const logs: string[] = res.data?.logs ?? [];
        const newLogs = logs
          .filter((line: string) => line.trim().length > 0)
          .map((line: string) => {
            const lower = line.toLowerCase();
            const level = lower.includes("error") ? "error" : lower.includes("warn") ? "warn" : "info";
            return {
              timestamp: new Date().toISOString(),
              message: line,
              level: level as "info" | "warn" | "error",
            };
          });
        useLogsStore.getState().addPythonLogsBatch(newLogs);
      })
      .catch((err) => console.warn("Failed to load initial logs for instance:", err));

    // JOIN room (Fix 5)
    socket?.emit("joinRoom", { instanceId: selectedInstanceId });

    return () => {
      // LEAVE room (Fix 5)
      const channel = `logs:${user.id}:${selectedInstanceId}`;
      socket?.emit("unsubscribe", { channel });
    };
  }, [selectedInstanceId, user?.id, clearLogs]);

  // Load NestJS logs on mount if empty
  useEffect(() => {
    if (useLogsStore.getState().logBuffer.nestjs.length === 0) {
      nestLogApi.getNestjsLogs(250)
        .then((res) => {
          if (res?.success && res.output) {
            const lines = res.output.split("\n");
            const newLogs = lines
              .filter((line: string) => line.trim())
              .map((line: string) => {
                const lower = line.toLowerCase();
                const level = lower.includes("error") ? "error" : lower.includes("warn") ? "warn" : "info";
                return {
                  timestamp: new Date().toISOString(),
                  message: line,
                  level: level as "info" | "warn" | "error",
                };
              });
            useLogsStore.getState().addNestLogsBatch(newLogs);
          }
        })
        .catch((err) => console.warn("Failed to load initial NestJS logs:", err));
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Panel Headers */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SplitSquareHorizontal className="w-8 h-8" /> Activity Center
            {cycleCounter > 0 && <Badge variant="default" className="ml-2">CYCLE {cycleCounter}</Badge>}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs font-mono">Live monitoring of your investment platform activity.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          {/* Instance Selector */}
          <div className="flex items-center gap-1 bg-background/35 border border-border/40 rounded-md px-2 py-0.5">
            <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
            <Select
              className="h-8 py-0 px-1.5 text-xs w-48 bg-transparent border-0 focus-visible:ring-0 text-foreground"
              value={selectedInstanceId || ""}
              onChange={(e) => setSelectedInstanceId(e.target.value || null)}
            >
              {instances.length === 0 ? (
                <option value="" className="bg-card text-foreground">No Active Instances</option>
              ) : (
                instances.map((inst) => (
                  <option key={inst.instanceId} value={inst.instanceId} className="bg-card text-foreground">
                    {/* B2 Step 4 — Option format: Balanced (…4f8a2c) */}
                    {inst.personality} ({inst.subAccountId ? `…${inst.subAccountId.slice(-6)}` : "No SubAccount"})
                  </option>
                ))
              )}
            </Select>
          </div>

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
        <Card className="flex flex-col min-h-0 bg-card/30 border-border/40 shadow-inner backdrop-blur-sm">
          <CardHeader className="py-2.5 px-4 border-b border-border/20 bg-muted/10 shrink-0">
            <CardTitle className="text-xs font-mono tracking-wider flex items-center text-primary">
              <Terminal className="w-3.5 h-3.5 mr-2" /> PLATFORM LOGS
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
        <Card className="flex flex-col min-h-0 bg-card/30 border-border/40 shadow-inner backdrop-blur-sm">
          <CardHeader className="py-2.5 px-4 border-b border-border/20 bg-muted/10 shrink-0">
            <CardTitle className="text-xs font-mono tracking-wider flex items-center text-emerald-400">
              <Terminal className="w-3.5 h-3.5 mr-2" /> STRATEGY ENGINE LOGS
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
