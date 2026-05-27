import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Users as UsersIcon, ShieldCheck } from "lucide-react";

export function Users() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">Admin view for registered traders and API keys.</p>
      </div>

      <Card className="bg-card/40 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5 text-primary" /> Active Users</CardTitle>
          <CardDescription>Platform users and their account statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-bold flex items-center gap-2">
                    admin@huebox.io <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </td>
                  <td className="py-3 px-4 text-emerald-500 font-mono">SUPERADMIN</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-500">ACTIVE</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono">2026-01-01</td>
                </tr>
                {/* Placeholder for future rows fetched from /api/users */}
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground italic text-sm">
                    Additional user management features will be integrated once the backend endpoints are available.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
