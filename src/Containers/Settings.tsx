import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Loader2, CreditCard, Globe, CheckCircle2, Sun, Monitor, Moon } from "lucide-react";
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

export function Settings() {
  const qc = useQueryClient();
  const [successMsg, setSuccessMsg] = useState("");
  const { theme, setTheme } = useThemeStore();

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
      if (userPrefs.preferredDepositProvider) {
        setDepositProvider(userPrefs.preferredDepositProvider);
      }
      if (userPrefs.preferredWithdrawProvider) {
        setWithdrawProvider(userPrefs.preferredWithdrawProvider);
      }
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">
          Manage your account appearance and payment settings.
        </p>
      </div>

      {/* Theme Selection Section */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-mono tracking-wider text-slate-200">
            THEME SETTINGS
          </CardTitle>
          <CardDescription className="text-xs font-mono text-slate-500">
            Customize the dashboard appearance theme.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex rounded-md bg-muted/40 p-1 border border-border/40 w-fit">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-sm transition-all cursor-pointer",
                theme === "light"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-sm transition-all cursor-pointer",
                theme === "system"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
              Auto
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-sm transition-all cursor-pointer",
                theme === "dark"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Provider preferences */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-mono tracking-wider text-slate-200">
            PAYMENT PREFERENCES
          </CardTitle>
          <CardDescription className="text-xs font-mono text-slate-500">
            Set your global default providers for fiat deposits and crypto withdrawals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Deposit Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-mono font-bold text-slate-300 border-b border-border/30 pb-2">
                  Default Deposit Provider (Fiat → Crypto)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {providers.map((p) => (
                    <div
                      key={`dep-${p.key}`}
                      onClick={() => setDepositProvider(p.key)}
                      className={cn(
                        "relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:bg-white/5",
                        depositProvider === p.key
                          ? "border-primary bg-primary/5"
                          : "border-border/40"
                      )}
                    >
                      <div className="flex flex-1">
                        <div className="flex flex-col">
                          <span className="block text-sm font-medium text-slate-200 mb-1">
                            {p.name}
                          </span>
                          <span className="mt-1 flex items-center text-[10px] text-slate-400 font-mono gap-1.5">
                            <CreditCard className="w-3 h-3" /> Fees: {p.fees}
                          </span>
                          <span className="mt-1 flex items-center text-[10px] text-slate-400 font-mono gap-1.5">
                            <Globe className="w-3 h-3" /> Regions: {p.regions}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-center pl-4">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center",
                            depositProvider === p.key
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          )}
                        >
                          {depositProvider === p.key && (
                            <div className="h-2 w-2 rounded-full bg-background" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Withdraw Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-mono font-bold text-slate-300 border-b border-border/30 pb-2">
                  Default Withdrawal Provider (Crypto → Fiat / On-chain)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {providers.map((p) => (
                    <div
                      key={`with-${p.key}`}
                      onClick={() => setWithdrawProvider(p.key)}
                      className={cn(
                        "relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:bg-white/5",
                        withdrawProvider === p.key
                          ? "border-primary bg-primary/5"
                          : "border-border/40"
                      )}
                    >
                      <div className="flex flex-1">
                        <div className="flex flex-col">
                          <span className="block text-sm font-medium text-slate-200 mb-1">
                            {p.name}
                          </span>
                          <span className="mt-1 flex items-center text-[10px] text-slate-400 font-mono gap-1.5">
                            <CreditCard className="w-3 h-3" /> Fees: {p.fees}
                          </span>
                          <span className="mt-1 flex items-center text-[10px] text-slate-400 font-mono gap-1.5">
                            <Globe className="w-3 h-3" /> Regions: {p.regions}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-center pl-4">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center",
                            withdrawProvider === p.key
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          )}
                        >
                          {withdrawProvider === p.key && (
                            <div className="h-2 w-2 rounded-full bg-background" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={updatePrefs.isPending}
                  className="font-mono text-xs"
                >
                  {updatePrefs.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving...
                    </>
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
