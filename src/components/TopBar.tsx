import { useBotStore } from "../store/bot";
import { useAuthStore } from "../store/auth";
import { StatusBadge } from "./StatusBadge";
import { Heart, RefreshCw, User } from "lucide-react";

export function TopBar() {
  const { status, cycleCounter, heartbeat } = useBotStore();
  const user = useAuthStore((state) => state.user);

  const formattedHeartbeat = heartbeat
    ? new Date(heartbeat).toLocaleTimeString()
    : "N/A";

  return (
    <header className="h-14 border-b border-border bg-card/20 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Bot Status & Quick stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
        </div>

        {cycleCounter > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded border border-border/50">
            <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            <span>CYCLE:</span>
            <span className="text-foreground font-bold">{cycleCounter}</span>
          </div>
        )}

        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
          <span>HEARTBEAT:</span>
          <span className="text-foreground">{formattedHeartbeat}</span>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        {user?.email && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/20 px-2.5 py-1 rounded-md border border-border/30">
            <User className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </div>
        )}
      </div>
    </header>
  );
}
