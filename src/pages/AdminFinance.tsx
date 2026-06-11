import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { DollarSign, TrendingUp, CreditCard, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { FinanceTab } from "../enums/FinanceTab.enum";
import { TransactionStatus } from "../enums/TransactionStatus.enum";

const TX_STATUS_COLORS: Partial<Record<TransactionStatus, string>> = {
  [TransactionStatus.Completed]: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  [TransactionStatus.Pending]:   "text-amber-400 border-amber-500/20 bg-amber-500/5",
  [TransactionStatus.Failed]:    "text-red-400 border-red-500/20 bg-red-500/5",
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Operations</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">Platform-wide finance dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, prefix, icon: Icon, color }) => (
          <Card key={label} className="bg-card/30 border-border/40">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${color}`}>
                    {value !== "—" ? `${prefix}${typeof value === "number" ? value.toLocaleString() : value}` : "—"}
                  </p>
                </div>
                <Icon className={`w-7 h-7 ${color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-xs tracking-wider text-slate-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> LEDGER
            </CardTitle>
            <div className="flex">
              {Object.values(FinanceTab).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setPage(1); }}
                  className={`px-4 py-2 text-xs font-mono uppercase border-b-2 transition-colors ${
                    tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
                  {tab === FinanceTab.Transactions && <>
                    <th className="py-2.5 px-4">TYPE</th>
                    <th className="py-2.5 px-4">AMOUNT</th>
                    <th className="py-2.5 px-4">USER</th>
                    <th className="py-2.5 px-4">STATUS</th>
                    <th className="py-2.5 px-4">DATE</th>
                  </>}
                  {tab === FinanceTab.Deposits && <>
                    <th className="py-2.5 px-4">USER</th>
                    <th className="py-2.5 px-4">AMOUNT</th>
                    <th className="py-2.5 px-4">PROVIDER</th>
                    <th className="py-2.5 px-4">STATUS</th>
                    <th className="py-2.5 px-4">DATE</th>
                  </>}
                  {tab === FinanceTab.Fees && <>
                    <th className="py-2.5 px-4">USER</th>
                    <th className="py-2.5 px-4">TOTAL FEES</th>
                    <th className="py-2.5 px-4">LAST FEE DATE</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-500 italic">Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-500">No records found.</td></tr>
                ) : (
                  items.map((item: any, i: number) => (
                    <tr key={item.id ?? i} className="hover:bg-muted/10 transition-colors">
                      {tab === FinanceTab.Transactions && <>
                        <td className="py-2.5 px-4 text-slate-300">{item.type ?? "—"}</td>
                        <td className="py-2.5 px-4 text-foreground font-bold">{item.amount ?? "—"} USDT</td>
                        <td className="py-2.5 px-4 text-slate-400">{item.userEmail ?? item.userId ?? "—"}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className={`text-[10px] ${TX_STATUS_COLORS[item.status as TransactionStatus] ?? ""}`}>
                            {item.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td>
                      </>}
                      {tab === FinanceTab.Deposits && <>
                        <td className="py-2.5 px-4 text-slate-400">{item.userEmail ?? "—"}</td>
                        <td className="py-2.5 px-4 text-foreground font-bold">${item.amount ?? "—"}</td>
                        <td className="py-2.5 px-4 text-slate-300">{item.provider ?? "MoonPay"}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className={`text-[10px] ${TX_STATUS_COLORS[item.status as TransactionStatus] ?? ""}`}>
                            {item.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td>
                      </>}
                      {tab === FinanceTab.Fees && <>
                        <td className="py-2.5 px-4 text-slate-400">{item.userEmail ?? item.userId ?? "—"}</td>
                        <td className="py-2.5 px-4 text-amber-400 font-bold">{item.totalFees ?? "—"} USDT</td>
                        <td className="py-2.5 px-4 text-slate-500">{item.lastFeeAt ? new Date(item.lastFeeAt).toLocaleDateString() : "—"}</td>
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
