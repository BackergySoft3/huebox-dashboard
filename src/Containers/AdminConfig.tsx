import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Badge } from "../Components/Atoms/badge";
import {
  Sliders,
  DollarSign,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Clock,
  Zap,
  Lock,
  Unlock,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

function ConfigRow({
  label,
  value,
  badge,
  hint,
}: {
  label: string;
  value: string | number;
  badge?: { text: string; color: "green" | "amber" | "blue" | "red" };
  hint?: string;
}) {
  const badgeColors = {
    green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    blue: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    red: "bg-rose-500/10 text-rose-455 border border-rose-500/20",
  };
  return (
    <div className="flex items-start justify-between py-3 border-b border-border/20 last:border-0 gap-4 animate-fade-in">
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{label}</p>
        {hint && <p className="text-[9px] text-muted-foreground/45 mt-0.5 font-mono leading-normal">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs font-bold text-foreground">{value}</span>
        {badge && (
          <Badge className={`text-[9px] px-1.5 py-0 h-4.5 font-mono font-bold ${badgeColors[badge.color]}`}>
            {badge.text}
          </Badge>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-gradient-to-br from-card to-card/65 border-border/40 backdrop-blur-sm shadow-md rounded-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
      <div>
        <CardHeader className="pb-3 border-b border-border/25">
          <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200 uppercase font-bold">
            <Icon className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-[10px] font-mono text-slate-500 mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-2 pb-4 space-y-0 font-mono text-xs">{children}</CardContent>
      </div>
    </Card>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminConfig() {
  const queryClient = useQueryClient();

  // Static env values surfaced to UI (matches .env on server)
  const nodeEnv: string = import.meta.env.MODE ?? "development";
  const isProd = nodeEnv === "production";

  const { data: config, isLoading, error, refetch } = useQuery({
    queryKey: ["platform-config"],
    queryFn: () =>
      api.get("/api/bot/system/status").then((r) => r.data).catch(() => null),
    refetchInterval: 30000,
    retry: false,
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["platform-config"] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Platform Config</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Read-only view of server-side platform configuration. Edit via{" "}
            <code className="text-primary font-bold">.env</code> on the server.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs gap-2 font-bold shadow-sm shrink-0 cursor-pointer h-9"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Configuration
        </Button>
      </div>

      {/* Environment Banner */}
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border font-mono text-xs shadow-sm ${
          isProd
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-405"
            : "bg-amber-500/5 border-amber-500/20 text-amber-405"
        }`}
      >
        {isProd ? (
          <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
        ) : (
          <Unlock className="w-4 h-4 shrink-0 text-amber-400" />
        )}
        <span>
          <strong>NODE_ENV:</strong> {nodeEnv} &nbsp;—&nbsp;
          {isProd
            ? "Production hardening is active. Dev endpoints are blocked."
            : "Development mode active. Some security guards are relaxed."}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fee Configuration */}
        <SectionCard
          icon={Percent}
          title="FEE CONFIGURATION"
          description="Platform performance fee settings."
        >
          <ConfigRow
            label="Performance Fee Rate"
            value="20%"
            badge={{ text: "ACTIVE", color: "green" }}
            hint="Percentage of positive PnL collected as platform fee"
          />
          <ConfigRow
            label="Fee Collection Sub-Account"
            value="106891736"
            hint="Bybit sub-account UID that receives fees"
          />
          <ConfigRow
            label="Master Sub-Account UID"
            value="106905705"
            hint="Primary Bybit account for universal transfers"
          />
        </SectionCard>

        {/* JWT Configuration */}
        <SectionCard
          icon={Shield}
          title="JWT / AUTH CONFIG"
          description="Token expiry and session settings."
        >
          <ConfigRow
            label="Access Token Expiry"
            value="1h"
            badge={{ text: "SHORT", color: "blue" }}
            hint="JWT_ACCESS_EXPIRY"
          />
          <ConfigRow
            label="Refresh Token Expiry"
            value="30d"
            badge={{ text: "LONG", color: "amber" }}
            hint="JWT_REFRESH_EXPIRY"
          />
          <ConfigRow
            label="Access TTL (seconds)"
            value="3600"
            hint="JWT_ACCESS_TTL"
          />
          <ConfigRow
            label="Refresh TTL (seconds)"
            value="2592000"
            hint="JWT_REFRESH_TTL"
          />
        </SectionCard>

        {/* OTP Configuration */}
        <SectionCard
          icon={Zap}
          title="OTP CONFIGURATION"
          description="One-time password and rate limiting settings."
        >
          <ConfigRow
            label="OTP Expiry"
            value="120s"
            hint="OTP_EXPIRE_SECONDS"
          />
          <ConfigRow
            label="Max Attempts"
            value="200"
            hint="OTP_MAX_ATTEMPTS"
          />
          <ConfigRow
            label="Max Email Requests"
            value="10,000"
            hint="OTP_MAX_EMAIL_REQUESTS"
          />
          <ConfigRow
            label="Max IP Requests"
            value="10,000"
            hint="OTP_MAX_IP_REQUESTS"
          />
          <ConfigRow
            label="Rate Limit Bypass"
            value="Disabled"
            badge={{ text: "DEV ONLY", color: "amber" }}
            hint="DISABLE_OTP_RATE_LIMIT=true"
          />
        </SectionCard>

        {/* Payment / MoonPay */}
        <SectionCard
          icon={DollarSign}
          title="PAYMENT GATEWAY"
          description="MoonPay fiat-to-crypto on-ramp config."
        >
          <ConfigRow
            label="Provider"
            value="MoonPay"
            badge={{ text: "ACTIVE", color: "green" }}
          />
          <ConfigRow
            label="Environment"
            value="Sandbox"
            badge={{ text: "TEST", color: "amber" }}
            hint="Using buy-sandbox.moonpay.com"
          />
          <ConfigRow
            label="Publishable Key"
            value="pk_test_****"
            hint="MOONPAY_PUBLISHABLE_KEY (masked)"
          />
          <ConfigRow
            label="Deposit Network"
            value="TRC20"
            hint="BYBIT_MASTER_DEPOSIT_NETWORK"
          />
        </SectionCard>

        {/* Bybit Settings */}
        <SectionCard
          icon={Sliders}
          title="BYBIT SETTINGS"
          description="Exchange connection and auth mode."
        >
          <ConfigRow
            label="Auth Type"
            value="RSA"
            badge={{ text: "SECURE", color: "green" }}
            hint="BYBIT_AUTH_TYPE"
          />
          <ConfigRow
            label="Testnet Mode"
            value="Enabled"
            badge={{ text: "TESTNET", color: "amber" }}
            hint="BYBIT_TESTNET=true"
          />
          <ConfigRow
            label="Transfer Network"
            value="TRC20"
            hint="BYBIT_MASTER_DEPOSIT_NETWORK"
          />
        </SectionCard>

        {/* Infrastructure */}
        <SectionCard
          icon={Clock}
          title="INFRASTRUCTURE"
          description="AWS, EC2, and runtime configuration."
        >
          <ConfigRow label="AWS Region" value="ap-south-1" hint="AWS_REGION" />
          <ConfigRow
            label="EC2 Instance ID"
            value="i-07c493ce…"
            hint="BOT_EC2_INSTANCE_ID (masked)"
          />
          <ConfigRow
            label="Service Name"
            value="huebox-bot-dev"
            hint="BOT_SERVICE_NAME"
          />
          <ConfigRow
            label="Redis Host"
            value="127.0.0.1:6379"
            badge={{ text: "LOCAL", color: "blue" }}
            hint="REDIS_HOST + REDIS_PORT"
          />
          <ConfigRow label="Server Port" value="3000" hint="PORT" />
        </SectionCard>
      </div>

      {/* System Status Panel */}
      <Card className="bg-gradient-to-br from-card to-card/65 border-border/40 backdrop-blur-sm shadow-md rounded-xl">
        <CardHeader className="pb-3 border-b border-border/25">
          <CardTitle className="flex items-center justify-between font-mono text-xs tracking-wider text-slate-200">
            <span className="flex items-center gap-2 font-bold">
              <span className="flex gap-1.5 mr-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </span>
              <CheckCircle2 className="w-4 h-4 text-primary inline" />
              LIVE SYSTEM STATUS
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Real-time Output
            </span>
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-slate-500 mt-1">
            Real-time status parameters retrieved from GET /api/bot/system/status.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 font-mono text-xs">
          {isLoading ? (
            <div className="text-xs font-mono text-slate-500 py-6 text-center animate-pulse border border-dashed border-border/20 rounded-xl">
              Fetching system status…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-xs font-mono text-rose-400 py-3 px-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              {(error as any)?.response?.status === 403
                ? "Access denied — Super Admin privileges required."
                : "Unable to reach system status endpoint. Is the backend running?"}
            </div>
          ) : config ? (
            <div className="relative group/term">
              <div className="absolute top-2.5 right-3 opacity-0 group-hover/term:opacity-100 transition-opacity duration-200">
                <span className="text-[9px] font-mono bg-black/50 text-slate-400 px-2 py-0.5 rounded border border-border/20 uppercase">
                  config
                </span>
              </div>
              <pre className="bg-black/90 border border-border/30 p-4 rounded-xl text-slate-300 overflow-x-auto text-[11px] leading-relaxed font-mono font-medium max-h-72 shadow-inner">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-500 py-6 text-center border border-dashed border-border/20 rounded-xl">
              No status data available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="flex items-start gap-3 px-4 py-4 bg-rose-500/5 border border-rose-500/20 rounded-xl shadow-sm">
        <AlertTriangle className="w-4 h-4 text-rose-455 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[11px] font-mono text-rose-400/80 leading-relaxed">
          <strong className="text-foreground">Read-only view:</strong> To modify any platform settings, update the{" "}
          <code className="text-rose-350 font-bold">.env</code> file on the server and restart the NestJS
          service. Changes take effect immediately after restart.
        </p>
      </div>
    </div>
  );
}
