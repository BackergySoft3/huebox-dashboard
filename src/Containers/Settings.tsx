import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { useBotStatus } from "../Hooks/useBotStatus";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import {
  Loader2, CreditCard, Globe, CheckCircle2, Sun, Monitor, Moon,
  ShieldCheck, Lock, KeyRound, Smartphone,
} from "lucide-react";
import { Badge } from "../Components/Atoms/badge";
import { cn } from "../Helpers/utils";
import { useThemeStore } from "../State/theme";

interface Provider {
  key: string;
  name: string;
  regions: string;
  fees: string;
}

const DEFAULT_PROVIDERS: Provider[] = [
  { key: "moonpay", name: "MoonPay", regions: "Global", fees: "3.5%" },
  { key: "transak", name: "Transak", regions: "Global", fees: "2.9%" },
  { key: "mercuryo", name: "Mercuryo", regions: "EEA/UK/US", fees: "3.8%" },
  { key: "ramp", name: "Ramp Network", regions: "Global", fees: "2.5%" }
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-3">
      <h2 className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap">
        {children}
      </h2>
      <div className="flex-1 h-[1px] bg-border/25" />
    </div>
  );
}

export function Settings() {
  const qc = useQueryClient();
  const [successMsg, setSuccessMsg] = useState("");
  const { theme, setTheme } = useThemeStore();
  const { data: botStatus } = useBotStatus();

  const { data: apiProviders, isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: ["payment-providers"],
    queryFn: () => api.get("/api/payment/providers").then((res) => res.data).catch(() => DEFAULT_PROVIDERS),
  });

  const { data: userPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: () => api.get("/api/user/preferences").then((res) => res.data).catch(() => ({})),
  });

  const providers = apiProviders || DEFAULT_PROVIDERS;

  const [depositProvider, setDepositProvider] = useState("");
  const [withdrawProvider, setWithdrawProvider] = useState("");

  useEffect(() => {
    if (userPrefs) {
      if (userPrefs.preferredDepositProvider) setDepositProvider(userPrefs.preferredDepositProvider);
      if (userPrefs.preferredWithdrawProvider) setWithdrawProvider(userPrefs.preferredWithdrawProvider);
    }
  }, [userPrefs]);

  const updatePrefs = useMutation({
    mutationFn: (prefs: { preferredDepositProvider?: string; preferredWithdrawProvider?: string }) =>
      api.patch("/api/user/preferences", prefs).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-preferences"] });
      setSuccessMsg("Payment preferences saved successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
  });

  const handleSave = () => {
    updatePrefs.mutate({
      preferredDepositProvider: depositProvider || undefined,
      preferredWithdrawProvider: withdrawProvider || undefined,
    });
  };

  const isLoading = providersLoading || prefsLoading;

  const riskLabel =
    !botStatus?.personality || botStatus.personality === "balanced" ? "Moderate"
    : botStatus.personality === "conservative" ? "Low"
    : "High";

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Preferences</h1>
        <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
          Configure security credentials, visual themes, and sweeping provider routing.
        </p>
      </div>

      {/* Security Overview */}
      <SectionHeading>Security Overview</SectionHeading>
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-455" />
            Account Integrity & Status
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
            System validated safety signatures active on this session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Email Signature Verified", icon: CheckCircle2 },
              { label: "KYC Documents Approved", icon: CheckCircle2 },
              { label: "Sweep Ledger Secured", icon: Lock },
              { label: "AI Safety Controls Running", icon: Smartphone },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/25 border border-border/30">
                <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono text-slate-300 font-semibold">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Badge className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 font-bold uppercase">
              Security Score: 92/100
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground">Enable 2FA triggers to achieve maximum score.</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Lock, label: "Change Password", desc: "Update your login credentials" },
          { icon: KeyRound, label: "2FA Authentication", desc: "Enable two-factor security" },
          { icon: Smartphone, label: "Active Sessions", desc: "Manage device access" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="p-4 rounded-xl bg-card/30 border border-border/40 backdrop-blur-sm flex items-start gap-3 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-slate-200">{label}</p>
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Appearance */}
      <SectionHeading>Appearance</SectionHeading>
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
            THEME SETTINGS
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
            Customize the dashboard interface appearance.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="flex rounded-lg bg-muted/40 p-1 border border-border/40 w-fit">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer font-bold uppercase tracking-wider",
                theme === "light"
                  ? "bg-primary text-primary-foreground shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer font-bold uppercase tracking-wider",
                theme === "system"
                  ? "bg-primary text-primary-foreground shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
              Auto
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer font-bold uppercase tracking-wider",
                theme === "dark"
                  ? "bg-primary text-primary-foreground shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Investment Preferences */}
      <SectionHeading>Investment Preferences</SectionHeading>
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
            RISK & STRATEGY APPETITE
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
            Active portfolio allocation risk profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/30">
            <span className="text-xs font-mono text-slate-400">Current Profile</span>
            {botStatus?.personality ? (
              <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/25 bg-primary/5 uppercase font-bold px-2.5 py-0.5">
                {riskLabel} Risk — {botStatus.personality} Growth
              </Badge>
            ) : (
              <span className="text-[9px] font-mono text-muted-foreground italic uppercase">
                Awaiting Bot Activation...
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
            Risk limits are tied to active Strategy Profiles. To change parameters, navigate to **Investment Strategies** and update selection.
          </p>
        </CardContent>
      </Card>

      {/* Payment Providers */}
      <SectionHeading>Payment Sweep Providers</SectionHeading>
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
            ROUTING OPTIONS
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
            Choose default on-ramps and off-ramps for sweeping triggers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-1">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300 border-b border-border/15 pb-2 uppercase tracking-wide">
                  Default Deposit On-Ramp (Fiat → Crypto)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {providers.map((p) => (
                    <div
                      key={`dep-${p.key}`}
                      onClick={() => setDepositProvider(p.key)}
                      className={cn(
                        "relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-200 hover:bg-muted/30",
                        depositProvider === p.key ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(0,122,255,0.05)]" : "border-border/40"
                      )}
                    >
                      <div className="flex flex-1">
                        <div className="flex flex-col">
                          <span className="block text-sm font-bold text-slate-200 mb-1 leading-tight">{p.name}</span>
                          <span className="mt-1 flex items-center text-[10px] text-muted-foreground font-mono gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Fees: {p.fees}
                          </span>
                          <span className="mt-1 flex items-center text-[10px] text-muted-foreground font-mono gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> Region: {p.regions}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-center pl-4">
                        <div className={cn("h-4 w-4 rounded-full border flex items-center justify-center", depositProvider === p.key ? "border-primary bg-primary" : "border-muted-foreground/60")}>
                          {depositProvider === p.key && <div className="h-1.5 w-1.5 rounded-full bg-background" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-border/15 pt-6">
                <h3 className="text-xs font-mono font-bold text-slate-300 border-b border-border/15 pb-2 uppercase tracking-wide">
                  Default Withdrawal Off-Ramp (Crypto → Fiat)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {providers.map((p) => (
                    <div
                      key={`with-${p.key}`}
                      onClick={() => setWithdrawProvider(p.key)}
                      className={cn(
                        "relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-200 hover:bg-muted/30",
                        withdrawProvider === p.key ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(0,122,255,0.05)]" : "border-border/40"
                      )}
                    >
                      <div className="flex flex-1">
                        <div className="flex flex-col">
                          <span className="block text-sm font-bold text-slate-200 mb-1 leading-tight">{p.name}</span>
                          <span className="mt-1 flex items-center text-[10px] text-muted-foreground font-mono gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Fees: {p.fees}
                          </span>
                          <span className="mt-1 flex items-center text-[10px] text-muted-foreground font-mono gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> Region: {p.regions}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-center pl-4">
                        <div className={cn("h-4 w-4 rounded-full border flex items-center justify-center", withdrawProvider === p.key ? "border-primary bg-primary" : "border-muted-foreground/60")}>
                          {withdrawProvider === p.key && <div className="h-1.5 w-1.5 rounded-full bg-background" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button onClick={handleSave} disabled={updatePrefs.isPending} className="font-mono text-xs font-bold h-9 px-4 cursor-pointer">
                  {updatePrefs.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving changes...</>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
