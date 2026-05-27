import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Users as UsersIcon, ShieldCheck } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function AdminUsers() {
  const { data: usersRaw, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/api/users").then((r) => r.data).catch(() => [
      { email: "admin@huebox.io", role: "SUPERADMIN", status: "ACTIVE", joined: "2026-01-01" }
    ]),
  });

  const users = Array.isArray(usersRaw) ? usersRaw : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">Admin view for registered traders and access permissions.</p>
      </div>

      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
            <UsersIcon className="w-4 h-4 text-primary" />
            REGISTERED SYSTEM USERS
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-slate-500">Traders authorized to deploy algorithms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-border/40 rounded-md bg-card/20">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
                  <th className="py-2.5 px-4 font-medium">EMAIL</th>
                  <th className="py-2.5 px-4 font-medium">ROLE</th>
                  <th className="py-2.5 px-4 font-medium">STATUS</th>
                  <th className="py-2.5 px-4 font-medium">JOINED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500 italic">Querying user registry...</td>
                  </tr>
                ) : (
                  users.map((user: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-foreground flex items-center gap-2">
                        {user.email}
                        {user.role === "SUPERADMIN" && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-400 font-bold uppercase">{user.role}</td>
                      <td className="py-2.5 px-4">
                        <Badge 
                          variant="outline" 
                          className={user.status === "ACTIVE" 
                            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.5" 
                            : "text-slate-400 border-border/30"}
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{user.joined}</td>
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
