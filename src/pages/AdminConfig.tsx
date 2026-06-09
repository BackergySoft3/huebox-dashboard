import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
    green: "bg-emerald-500/20 text-emerald-400 border-transparent",
    amber: "bg-amber-500/20 text-amber-400 border-transparent",
    blue: "bg-sky-500/20 text-sky-400 border-transparent",
    red: "bg-red-500/20 text-red-400 border-transparent",
  };
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/20 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-mono text-slate-400">{label}</p>
        {hint && <p className="text-[10px] text-slate-600 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs font-bold text-foreground">{value}</span>
        {badge && (
          <Badge className={`text-[9px] px-1.5 py-0 h-4 font-mono ${badgeColors[badge.color]}`}>
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
    <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-[10px] font-mono text-slate-500">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-0 font-mono text-xs">{children}</CardContent>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Config</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Read-only view of server-side platform configuration. Edit via{" "}
            <code className="text-primary">.env</code> on the server.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs gap-2"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Environment Banner */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border font-mono text-xs ${
          isProd
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}
      >
        {isProd ? (
          <Lock className="w-4 h-4 shrink-0" />
        ) : (
          <Unlock className="w-4 h-4 shrink-0" />
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
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            LIVE SYSTEM STATUS
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-slate-500">
            Real-time status from GET /api/bot/system/status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-xs font-mono text-slate-500 py-4 text-center animate-pulse">
              Fetching system status…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 py-2">
              <AlertTriangle className="w-4 h-4" />
              {(error as any)?.response?.status === 403
                ? "Access denied — Super Admin privileges required."
                : "Unable to reach system status endpoint. Is the backend running?"}
            </div>
          ) : config ? (
            <pre className="bg-black/60 p-4 rounded border border-border/20 text-slate-400 overflow-x-auto text-[11px] leading-relaxed font-mono max-h-64">
              {JSON.stringify(config, null, 2)}
            </pre>
          ) : (
            <div className="text-xs font-mono text-slate-500 py-4 text-center">
              No status data available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="flex items-start gap-3 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <p className="text-[11px] font-mono text-red-400/80 leading-relaxed">
          <strong>Read-only view.</strong> To modify any platform settings, update the{" "}
          <code className="text-red-300">.env</code> file on the server and restart the NestJS
          service. Changes take effect immediately after restart.
        </p>
      </div>
    </div>
  );
}
