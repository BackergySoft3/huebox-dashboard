import { useBotStatus } from "../hooks/useBotStatus";
import { useBotStore } from "../store/bot";
import { BotStepper } from "../components/BotStepper";
import { ActiveGridsTable } from "../components/ActiveGridsTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Brain, GitMerge } from "lucide-react";

export function Progress() {
  const { data: status } = useBotStatus();
  const cycleCounter = useBotStore((state) => state.cycleCounter);

  const grids = status?.grids || [
    { symbol: "BTCUSDT", direction: "LONG", entryPrice: 65400.5, leverage: 10, margin: 50.0, deployedAt: new Date().toISOString() },
    { symbol: "ETHUSDT", direction: "SHORT", entryPrice: 3420.1, leverage: 10, margin: 25.0, deployedAt: new Date().toISOString() }
  ];

  const cycleStats = status?.cycleStats || { 
    scanned: 154, 
    hot: 12, 
    fundingChecked: true 
  };

  const llmRec = status?.llmRecommendation || { 
    action: "HOLD", 
    confidence: 0.89, 
    reasoning: "BTC volume profile suggests consolidation before breakout." 
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress & Deployed Grids</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">Granular view of the trading engine's lifecycle and active deployments.</p>
        </div>
        {cycleCounter > 0 && (
          <Badge variant="default" className="text-xs font-mono py-1 px-3">
            CYCLE {cycleCounter}
          </Badge>
        )}
      </div>

      {/* Visual Stepper */}
      <BotStepper />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cycle Stats */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <GitMerge className="w-4 h-4 text-primary" />
              CYCLE SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-xs text-slate-300">
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Coins Scanned</span>
              <span className="font-bold text-foreground">{cycleStats?.scanned || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Hot Signals</span>
              <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 px-1.5 h-5 text-[10px]">
                {cycleStats?.hot || 0} HOT
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Funding Rates Status</span>
              {cycleStats?.fundingChecked ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-transparent hover:bg-emerald-500/20 text-[10px] h-5 font-mono">
                  VERIFIED
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] h-5 font-mono">
                  PENDING
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LLM Recommendation */}
        <Card className="bg-card/30 border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <Brain className="w-4 h-4 text-primary animate-pulse" />
              STRATEGY COPILOT
            </CardTitle>
            <CardDescription className="text-[10px] font-mono text-slate-500">Latest LLM contextual recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-xs text-slate-300">
            {llmRec ? (
              <>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-slate-500">Suggested Action</span>
                  <Badge variant={llmRec.action === "LONG" ? "default" : llmRec.action === "SHORT" ? "destructive" : "secondary"} className="h-5 text-[10px]">
                    {llmRec.action}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-slate-500">Confidence Score</span>
                  <span className="font-bold text-primary">{(llmRec.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-black/35 p-3 rounded border border-border/20 text-slate-400 italic text-[11px] leading-relaxed">
                  "{llmRec.reasoning}"
                </div>
              </>
            ) : (
              <div className="text-slate-500 italic text-center py-6">Awaiting cognitive recommendations...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Grids Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-mono tracking-wider text-slate-200">ACTIVE POSITION DEPLOYMENTS</CardTitle>
        </CardHeader>
        <CardContent>
          <ActiveGridsTable grids={grids} />
        </CardContent>
      </Card>
    </div>
  );
}
