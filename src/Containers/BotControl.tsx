import { useState, useEffect } from "react";
import { useBotStatus } from "../Hooks/useBotStatus";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Play, Pause, Settings2, HeartPulse, AlertTriangle, FastForward, X, Sparkles, SlidersHorizontal, Loader2 } from "lucide-react";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { Badge } from "../Components/Atoms/badge";
import type { FilterResult } from "../Interfaces/components";
import { Personality } from "../Enums/Personality.enum";

const PERSONALITY_OPTIONS: { value: Personality; label: string }[] = [
  { value: Personality.Moderate,   label: "Conservative" },
  { value: Personality.Balanced,   label: "Balanced"     },
  { value: Personality.Aggressive, label: "Aggressive"   },
];

const FILTER_TO_SELECT_MAP: Partial<Record<Personality, Personality>> = {
  [Personality.Safe]:       Personality.Moderate,
  [Personality.Aggressive]: Personality.Aggressive,
  [Personality.Insane]:     Personality.Aggressive,
  [Personality.Hunter]:     Personality.Aggressive,
  [Personality.Sentient]:   Personality.Balanced,
};

const getMappedProfileLabel = (key: string) => {
  const selectValue = FILTER_TO_SELECT_MAP[key as Personality] ?? Personality.Balanced;
  if (selectValue === Personality.Moderate) return "Conservative";
  if (selectValue === Personality.Balanced) return "Balanced";
  if (selectValue === Personality.Aggressive) return "Aggressive";
  return "Balanced";
};

export function BotControl() {
  const queryClient = useQueryClient();
  const { data: status } = useBotStatus();
  const [personality, setPersonality] = useState<string>(Personality.Balanced);
  const [filters, setFilters] = useState<{
    duration: "short_term" | "medium_term" | "long_term" | null;
    returnMin: 5 | 10 | 20 | 30 | null;
    risk: "low" | "moderate" | "high" | null;
  }>({ duration: null, returnMin: null, risk: null });

  const [filterResults, setFilterResults] = useState<FilterResult[] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: "deposit" | "pause" | "resume" | null;
    title: string;
    description: string;
    warningText?: string;
  }>({
    isOpen: false,
    type: null,
    title: "",
    description: "",
  });

  useEffect(() => {
    if (status?.personality) {
      setPersonality(status.personality);
    }
  }, [status]);

  // Mutations
  const actionMutation = useMutation({
    mutationFn: (action: "pause" | "resume") => api.post(`/api/bot/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    },
  });

  const personalityMutation = useMutation({
    mutationFn: (val: string) => api.post("/api/bot/select", { personality: val }),
    onSuccess: (_, val) => {
      setPersonality(val);
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
    },
  });

  const simulateMutation = useMutation({
    mutationFn: () => api.post("/api/bot/dev/simulate-deposit", { amount: 1000 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    },
  });

  const filterMutation = useMutation({
    mutationFn: () =>
      api.post("/api/bot/filter", {
        duration: filters.duration,
        returnMin: filters.returnMin,
        risk: filters.risk,
      }),
    onSuccess: (res) => {
      setFilterResults(res.data.results);
      setFilterOpen(false);
    },
  });

  const handleApplyFilters = () => {
    if (filters.duration && filters.returnMin && filters.risk) {
      filterMutation.mutate();
    }
  };

  const handleFilterResultSelect = (filterKey: string) => {
    const mappedValue = FILTER_TO_SELECT_MAP[filterKey as Personality] ?? Personality.Balanced;
    handleSelectPersonality(mappedValue);
  };

  const handleActionClick = (action: "pause" | "resume") => {
    setConfirmState({
      isOpen: true,
      type: action,
      title: action === "pause" ? "Pause Trading Bot" : "Resume Trading Bot",
      description: action === "pause" 
        ? "This will halt signal execution and grid placement loop."
        : "This will start scanning signals and resuming orders.",
      warningText: action === "pause" ? "Active grids will be left unattended until resumed." : undefined
    });
  };

  const handleSimulateClick = () => {
    setConfirmState({
      isOpen: true,
      type: "deposit",
      title: "Simulate Deposit Webhook",
      description: "Triggering this mock deposit webhook will instruct the backend to spawn the Python engine processes.",
      warningText: "This action is only intended for development mode. Use caution."
    });
  };

  const handleConfirmAction = async () => {
    if (confirmState.type === "pause") {
      await actionMutation.mutateAsync("pause");
    } else if (confirmState.type === "resume") {
      await actionMutation.mutateAsync("resume");
    } else if (confirmState.type === "deposit") {
      await simulateMutation.mutateAsync();
    }
  };

  const handleSelectPersonality = (val: string) => {
    personalityMutation.mutate(val);
  };

  const loading = actionMutation.isPending || personalityMutation.isPending || simulateMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-sans">Bot Control</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">Manage system status and trade policies.</p>
      </div>

      {/* Filter Panel Section */}
      <div className="bg-card/30 border border-border/40 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-slate-200">AI Personality Matcher</h3>
            <p className="text-[11px] font-mono text-slate-400">Filter and match bot configurations to your trading profile.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="font-mono text-xs hover:bg-slate-800"
          onClick={() => setFilterOpen(true)}
        >
          <Sparkles className="w-3.5 h-3.5 mr-2 text-primary animate-pulse" />
          Match Bot
        </Button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {filterOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* Collapsible Filter Panel */}
      <div className={`
        /* Mobile: Bottom Sheet */
        fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-slate-100 rounded-t-2xl shadow-2xl p-6 border-t border-border/40
        transition-transform duration-300 ease-in-out
        ${filterOpen ? "translate-y-0" : "translate-y-full"}
        
        /* Desktop: Inline Panel */
        md:static md:translate-y-0 md:z-auto md:shadow-none md:rounded-xl md:border md:border-border/40 md:mt-2 md:bg-card/30 md:text-slate-100 md:backdrop-blur-sm md:p-6
        ${filterOpen ? "md:block" : "md:hidden"}
      `}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-border/25">
          <div>
            <h3 className="text-md font-semibold font-mono tracking-tight text-slate-200">Configure Filter Preferences</h3>
            <p className="text-xs text-slate-400 font-mono">Select one option from each category below to match bot personalities.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => {
                setFilters({ duration: null, returnMin: null, risk: null });
                setFilterResults(null);
              }}
              className="text-xs font-mono font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Clear all
            </button>
            <button 
              type="button"
              onClick={() => setFilterOpen(false)}
              className="text-slate-400 hover:text-slate-200 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {/* Duration */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Duration</h4>
            <div className="space-y-2">
              {[
                { value: "short_term", label: "Short term (1–7 days)" },
                { value: "medium_term", label: "Medium term (7–30 days)" },
                { value: "long_term", label: "Long term (30+ days)" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, duration: prev.duration === opt.value ? null : opt.value as any }))}
                  className="flex items-center gap-3 cursor-pointer select-none text-left w-full focus:outline-none"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    filters.duration === opt.value 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-slate-950 border-slate-800 text-transparent"
                  }`}>
                    <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-xs font-mono text-slate-300 hover:text-slate-200">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Return */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Return</h4>
            <div className="space-y-2">
              {[
                { value: 5, label: "Above 5%" },
                { value: 10, label: "Above 10%" },
                { value: 20, label: "Above 20%" },
                { value: 30, label: "Above 30%" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, returnMin: prev.returnMin === opt.value ? null : opt.value as any }))}
                  className="flex items-center gap-3 cursor-pointer select-none text-left w-full focus:outline-none"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    filters.returnMin === opt.value 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-slate-950 border-slate-800 text-transparent"
                  }`}>
                    <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-xs font-mono text-slate-300 hover:text-slate-200">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Risk</h4>
            <div className="space-y-2">
              {[
                { value: "low", label: "Low risk" },
                { value: "moderate", label: "Moderate" },
                { value: "high", label: "High risk" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, risk: prev.risk === opt.value ? null : opt.value as any }))}
                  className="flex items-center gap-3 cursor-pointer select-none text-left w-full focus:outline-none"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    filters.risk === opt.value 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-slate-950 border-slate-800 text-transparent"
                  }`}>
                    <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-xs font-mono text-slate-300 hover:text-slate-200">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/20 pt-4 gap-3">
          <div>
            {(!filters.duration || !filters.returnMin || !filters.risk) ? (
              <p className="text-xs text-amber-500 font-mono">Select one option from each section</p>
            ) : (
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All criteria selected. Ready to match.
              </p>
            )}
            {filterMutation.isError && (
              <p className="text-xs text-destructive font-mono mt-1">Could not load recommendations. Try again.</p>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterOpen(false)}
              className="text-xs font-mono border-border/40 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!filters.duration || !filters.returnMin || !filters.risk || filterMutation.isPending}
              onClick={handleApplyFilters}
              className="text-xs font-mono bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto flex justify-center items-center gap-2"
            >
              {filterMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Recommendation Results Grid */}
      {filterResults && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-mono text-sm font-semibold text-slate-200">Recommended Personalities</h3>
            <button
              type="button"
              onClick={() => {
                setFilters({ duration: null, returnMin: null, risk: null });
                setFilterResults(null);
              }}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              Clear Results
            </button>
          </div>

          {filterResults.length === 0 ? (
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce" />
              <div className="space-y-1">
                <h4 className="font-mono text-sm font-bold text-slate-200">No Match Found</h4>
                <p className="font-mono text-[11px] text-slate-400 max-w-xs">No personalities match your filters. Try adjusting your preferences.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilters({ duration: null, returnMin: null, risk: null });
                  setFilterResults(null);
                }}
                className="font-mono text-xs hover:bg-slate-800"
              >
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterResults.map((result) => {
                const mappedSelectValue = FILTER_TO_SELECT_MAP[result.key as Personality] ?? Personality.Balanced;
                const isSelected = personality === mappedSelectValue;
                
                return (
                  <Card key={result.key} className="bg-card/30 border-border/40 backdrop-blur-sm relative flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="capitalize font-mono text-sm text-slate-200">
                          {result.label}
                        </CardTitle>
                        {result.tag && (
                          <Badge className={result.tag === "Best match" ? "bg-primary text-primary-foreground font-mono text-[9px] px-1.5 py-0.5" : "bg-slate-600 hover:bg-slate-600 text-white font-mono text-[9px] px-1.5 py-0.5"}>
                            {result.tag}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-[10px] font-mono text-slate-500">Matched Score: {result.matchScore}/3</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 font-mono text-xs text-slate-300 pb-4">
                      <hr className="border-border/20 mb-3" />
                      <div className="flex justify-between items-center border-b border-border/10 pb-1.5">
                        <span className="text-slate-500">Leverage</span>
                        <span className="font-bold text-foreground">{result.stats.leverage}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/10 pb-1.5">
                        <span className="text-slate-500">Take Profit</span>
                        <span className="font-bold text-foreground">{result.stats.takeProfit}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/10 pb-1.5">
                        <span className="text-slate-500">Stop Loss</span>
                        <span className="font-bold text-foreground">{result.stats.stopLoss}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/10 pb-1.5">
                        <span className="text-slate-500">Hold Limit</span>
                        <span className="font-bold text-foreground">{result.stats.holdLimit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Risk Tier</span>
                        <span className="font-bold text-foreground">{result.stats.riskTier}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col pt-0 pb-4">
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="w-full font-mono text-xs"
                        onClick={() => handleFilterResultSelect(result.key)}
                        disabled={loading}
                      >
                        {isSelected ? "Active" : "Select this bot →"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-2 text-center font-mono">
                        Runs as: {getMappedProfileLabel(result.key)} profile
                      </p>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pulse State */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <HeartPulse className="w-4 h-4 text-primary animate-pulse" />
              ENGINE PULSE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-xs text-slate-300">
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-foreground capitalize">{status?.status || "stalled"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Personality</span>
              <span className="font-bold text-foreground capitalize">{status?.personality || "balanced"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Bybit Sub-Account</span>
              <span className="font-bold text-foreground">{status?.bybitAccount?.uid || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Sub-Account Balance</span>
              <span className="font-bold text-emerald-400">{status?.bybitAccount?.balance !== undefined ? `$${status.bybitAccount.balance.toFixed(2)}` : "$0.00"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Heartbeat</span>
              <span>{status?.lastHeartbeat || status?.heartbeat ? new Date(status.lastHeartbeat || status.heartbeat).toLocaleTimeString() : "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Live ROI</span>
              <span className="font-bold text-emerald-400">{status?.live_roi ? `+${status.live_roi.toFixed(2)}%` : "0.00%"}</span>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3 pt-2">
            <Button 
              variant={status?.status === "paused" ? "default" : "outline"}
              className="flex-1 font-mono text-xs"
              onClick={() => handleActionClick("resume")}
              disabled={loading || status?.status === "running"}
            >
              <Play className="w-3.5 h-3.5 mr-2" /> Resume
            </Button>
            <Button 
              variant={status?.status === "running" ? "destructive" : "outline"}
              className="flex-1 font-mono text-xs"
              onClick={() => handleActionClick("pause")}
              disabled={loading || status?.status !== "running"}
            >
              <Pause className="w-3.5 h-3.5 mr-2" /> Pause
            </Button>
          </CardFooter>
        </Card>

        {/* Personality Config */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <Settings2 className="w-4 h-4 text-primary" />
              POLICY PROFILE
            </CardTitle>
            <CardDescription className="text-[10px] font-mono text-slate-500">Select active bot strategy profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 font-mono text-xs">
              {PERSONALITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={personality === opt.value ? "default" : "outline"}
                  className="justify-start capitalize font-mono text-xs"
                  onClick={() => handleSelectPersonality(opt.value)}
                  disabled={loading}
                >
                  {opt.label}
                  {personality === opt.value && <span className="ml-auto text-[10px] text-primary">Active</span>}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Developer Override */}
        <Card className="bg-card/30 border-destructive/20 shadow-[0_0_20px_rgba(var(--destructive),0.05)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive font-mono text-xs tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              OVERRIDE TOOLS
            </CardTitle>
            <CardDescription className="text-[10px] font-mono text-slate-500">Spawning mechanisms and testing helpers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 font-mono text-xs border-destructive/30"
              onClick={handleSimulateClick}
              disabled={loading}
            >
              <FastForward className="w-3.5 h-3.5 mr-2" /> Simulate Deposit
            </Button>
          </CardContent>
        </Card>
      </div>

      {confirmState.isOpen && (
        <ConfirmModal
          title={confirmState.title}
          description={confirmState.warningText ? `${confirmState.description} ${confirmState.warningText}` : confirmState.description}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
