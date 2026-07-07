import { Link } from "react-router-dom";
import { useBotStore } from "../../State/bot";
import { useAuthStore } from "../../State/auth";
import { StatusBadge } from "../../Components/Organisms/StatusBadge";
import { UserAvatar } from "../../Components/Organisms/UserAvatar";
import { Heart, RefreshCw, Shield, ShieldCheck, Menu, Sun, Moon } from "lucide-react";
import { useThemeStore } from "../../State/theme";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { status, cycleCounter, heartbeat } = useBotStore();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin)();
  const { theme, setTheme } = useThemeStore();

  const formattedHeartbeat = heartbeat
    ? new Date(heartbeat).toLocaleTimeString()
    : "Awaiting first signal...";

  // Show first name if available, fallback to email prefix
  const displayName = user?.firstName || (user?.email ? user.email.split("@")[0] : "");

  return (
    <header className="h-14 border-b border-border bg-card/20 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      {/* Left: hamburger (mobile) + admin label OR bot status */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* H-05: Mobile hamburger button */}
        <button
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* H-07: Single admin label on left only, no duplicate on right */}
        {isAdmin ? (
          <div className="flex items-center gap-2">
            {isSuperAdmin ? (
              <div
                className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-md"
                title="You are logged in as Super Administrator"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SUPER ADMIN PANEL</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/30 px-3 py-1 rounded-md"
                title="You are logged in as Administrator"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>ADMIN PANEL</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
            </div>

            {/* M-01: Tooltip explaining CYCLE counter */}
            {cycleCounter > 0 && (
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded border border-border/50"
                title="Number of completed trading cycles in the current session"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                <span>CYCLE:</span>
                <span className="text-foreground font-bold">{cycleCounter}</span>
              </div>
            )}

            {/* M-01: Tooltip explaining HEARTBEAT */}
            <div
              className="hidden md:flex items-center gap-1.5 text-xs font-mono text-muted-foreground"
              title="Last time the AI engine sent a status signal. Updates every 30 seconds when active."
            >
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
              <span>HEARTBEAT:</span>
              <span className="text-foreground">{formattedHeartbeat}</span>
            </div>
          </>
        )}
      </div>

      {/* Right: user display name — H-07: no duplicate role badge */}
      <div className="flex items-center gap-3">
        {/* L-01: Theme toggle for discoverability */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {user?.email && (
          <Link
            to="/profile"
            className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/20 px-2 py-1 rounded-md border border-border/30 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all duration-150"
            title="View profile"
          >
            <UserAvatar avatarUrl={user.avatarUrl} email={user.email} />
            <span>{displayName}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
