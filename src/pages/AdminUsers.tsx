import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { UserDrawer } from "../components/UserDrawer";
import {
  Users as UsersIcon, Search, Filter, ChevronLeft, ChevronRight,
  ShieldCheck, ShieldAlert, Shield, RefreshCw,
} from "lucide-react";
import { UserStatus } from "../enums/UserStatus.enum";
import { UserRole } from "../enums/UserRole.enum";

const STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.Active]:      "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  [UserStatus.Suspended]:   "text-amber-400 border-amber-500/20 bg-amber-500/5",
  [UserStatus.Blocked]:     "text-red-400 border-red-500/20 bg-red-500/5",
  [UserStatus.Restricted]:  "text-orange-400 border-orange-500/20 bg-orange-500/5",
  [UserStatus.SoftDeleted]: "text-slate-400 border-slate-500/20 bg-slate-500/5",
  [UserStatus.Deleted]:     "text-slate-400 border-slate-500/20 bg-slate-500/5",
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  [UserRole.SuperAdmin]: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
  [UserRole.Admin]:      <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />,
  [UserRole.User]:       <Shield className="w-3.5 h-3.5 text-slate-500" />,
};

const STATUS_OPTIONS = ["", ...Object.values(UserStatus)];
const ROLE_OPTIONS   = ["", ...Object.values(UserRole)];

export function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, search, statusFilter, roleFilter],
    queryFn: () =>
      api.get("/api/admin/users", {
        params: {
          page, limit: 20,
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
          ...(roleFilter && { role: roleFilter }),
        },
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const users: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {total} registered users · Admin view
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Search</label>
              <div className="flex gap-2">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Email, name…"
                  className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button size="sm" onClick={handleSearch} className="gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s || "All Statuses"}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r || "All Roles"}</option>
                ))}
              </select>
            </div>

            {(search || statusFilter || roleFilter) && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setRoleFilter(""); setPage(1); }}
                className="text-muted-foreground gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
            <UsersIcon className="w-4 h-4 text-primary" />
            REGISTERED SYSTEM USERS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
                  <th className="py-2.5 px-4 font-medium">EMAIL</th>
                  <th className="py-2.5 px-4 font-medium">ROLE</th>
                  <th className="py-2.5 px-4 font-medium">STATUS</th>
                  <th className="py-2.5 px-4 font-medium">KYC</th>
                  <th className="py-2.5 px-4 font-medium">JOINED</th>
                  <th className="py-2.5 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                      Querying user registry…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">No users found.</td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/10 transition-colors cursor-pointer group"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="py-2.5 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                            {user.email?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {ROLE_ICONS[user.role as UserRole]}
                          <span className={
                            user.role === UserRole.SuperAdmin ? "text-amber-400" :
                            user.role === UserRole.Admin      ? "text-sky-400"   : "text-slate-400"
                          }>{user.role}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className={`${STATUS_COLORS[user.status as UserStatus] ?? ""} px-1.5 py-0.5 text-[10px]`}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className={`px-1.5 py-0.5 text-[10px] ${
                          user.kycStatus === "APPROVED" ? "text-emerald-400 border-emerald-500/20" :
                          user.kycStatus === "REJECTED" ? "text-red-400 border-red-500/20" :
                          "text-slate-400 border-slate-500/20"
                        }`}>
                          {user.kycStatus ?? "—"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        <Button
                          variant="ghost" size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); setSelectedUserId(user.id); }}
                        >
                          View →
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground font-mono">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Drawer */}
      {selectedUserId && (
        <UserDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
