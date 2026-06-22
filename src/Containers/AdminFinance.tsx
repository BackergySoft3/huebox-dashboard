import { useQuery } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { DollarSign, TrendingUp, CreditCard, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "../Components/Atoms/button";
import { useState } from "react";
import { FinanceTab } from "../Enums/FinanceTab.enum";
import { TransactionStatus } from "../Enums/TransactionStatus.enum";
import { cn } from "../Helpers/utils";

const TX_STATUS_COLORS: Partial<Record<TransactionStatus, string>> = {
  [TransactionStatus.Completed]: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  [TransactionStatus.Pending]:   "text-amber-400 border-amber-500/20 bg-amber-500/10",
  [TransactionStatus.Failed]:    "text-rose-455 border-rose-500/20 bg-rose-500/10",
};

export function AdminFinance() {
  const [tab, setTab] = useState<FinanceTab>(FinanceTab.Transactions);
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: () => api.get("/api/admin/finance/stats").then((r) => r.data).catch(() => ({})),
  });

  const { data: txData, isLoading, refetch } = useQuery({
    queryKey: ["admin-finance", tab, page],
    queryFn: () =>
      api.get(`/api/admin/finance/${tab}`, { params: { page, limit: 20 } })
        .then((r) => r.data)
        .catch(() => ({ data: [], total: 0 })),
  });

  const items: any[] = txData?.data ?? [];

  const metricCards = [
    { label: "Total AUM", value: stats?.totalAum ?? "—", prefix: "$", icon: TrendingUp, color: "text-primary" },
    { label: "Fees This Month", value: stats?.feesThisMonth ?? "—", prefix: "$", icon: BarChart3, color: "text-emerald-400" },
    { label: "Total Deposited", value: stats?.totalDeposited ?? "—", prefix: "$", icon: DollarSign, color: "text-sky-400" },
    { label: "Net Revenue", value: stats?.netRevenue ?? "—", prefix: "$", icon: CreditCard, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Financial Operations</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">Platform-wide finance treasury and audits</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 font-mono text-xs font-bold shadow-sm shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {metricCards.map(({ label, value, prefix, icon: Icon, color }) => (
          <Card key={label} className="bg-card/30 border-border/40 shadow-sm hover:shadow transition-all duration-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-foreground uppercase tracking-wider font-extrabold">{label}</p>
                  <p className={cn("text-2xl font-bold mt-1.5 font-sans tracking-tight text-foreground", color)}>
                    {value !== "—" ? `${prefix}${typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : value}` : "—"}
                  </p>
                </div>
                <Icon className={cn("w-8 h-8 opacity-20", color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Table Ledger */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-0 border-b border-border/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2 font-bold">
              <DollarSign className="w-4 h-4 text-primary" /> FINANCIAL LEDGER AUDIT
            </CardTitle>
            <div className="flex overflow-x-auto scrollbar-none border-b sm:border-b-0 border-border/10 pb-px">
              {Object.values(FinanceTab).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setPage(1); }}
                  className={cn(
                    "px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-all cursor-pointer whitespace-nowrap",
                    tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground bg-muted/15 text-[9px] uppercase tracking-wider">
                  {tab === FinanceTab.Transactions && <>
                    <th className="py-3 px-4 font-semibold">TYPE</th>
                    <th className="py-3 px-4 font-semibold">AMOUNT (USDT)</th>
                    <th className="py-3 px-4 font-semibold">OPERATOR</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold">TIMESTAMP</th>
                  </>}
                  {tab === FinanceTab.Deposits && <>
                    <th className="py-3 px-4 font-semibold">OPERATOR</th>
                    <th className="py-3 px-4 font-semibold">AMOUNT</th>
                    <th className="py-3 px-4 font-semibold">ON-RAMP</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold">TIMESTAMP</th>
                  </>}
                  {tab === FinanceTab.Fees && <>
                    <th className="py-3 px-4 font-semibold">OPERATOR</th>
                    <th className="py-3 px-4 font-semibold">CUMULATIVE FEES</th>
                    <th className="py-3 px-4 font-semibold">LAST ACCRUED DATE</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/15">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic font-mono animate-pulse">Loading ledger entries...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-muted-foreground italic font-mono">No ledger movements found under this category.</td></tr>
                ) : (
                  items.map((item: any, i: number) => (
                    <tr key={item.id ?? i} className="hover:bg-muted/15 transition-colors">
                      {tab === FinanceTab.Transactions && <>
                        <td className="py-3.5 px-4 text-foreground font-bold uppercase text-[10px]">{item.type ?? "—"}</td>
                        <td className="py-3.5 px-4 text-foreground font-bold font-sans text-sm">${Number(item.amount ?? 0).toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-muted-foreground font-sans">{item.userEmail ?? item.userId ?? "—"}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border px-2 py-0.5", TX_STATUS_COLORS[item.status as TransactionStatus] ?? "")}>
                            {item.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground/60">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</td>
                      </>}
                      {tab === FinanceTab.Deposits && <>
                        <td className="py-3.5 px-4 text-muted-foreground font-sans">{item.userEmail ?? "—"}</td>
                        <td className="py-3.5 px-4 text-foreground font-bold font-sans text-sm">${Number(item.amount ?? 0).toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-foreground uppercase tracking-wider text-[10px]">{item.provider ?? "MoonPay"}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border px-2 py-0.5", TX_STATUS_COLORS[item.status as TransactionStatus] ?? "")}>
                            {item.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground/60">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</td>
                      </>}
                      {tab === FinanceTab.Fees && <>
                        <td className="py-3.5 px-4 text-muted-foreground font-sans">{item.userEmail ?? item.userId ?? "—"}</td>
                        <td className="py-3.5 px-4 text-primary font-bold font-sans text-sm">${Number(item.totalFees ?? 0).toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-muted-foreground/60">{item.lastFeeAt ? new Date(item.lastFeeAt).toLocaleString() : "—"}</td>
                      </>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
