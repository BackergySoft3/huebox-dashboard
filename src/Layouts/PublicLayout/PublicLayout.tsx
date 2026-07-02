import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../State/auth";
import { useThemeStore } from "../../State/theme";
import { Sun, Moon, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "../../Components/Atoms/button";

const HueBoxLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-activity w-6 h-6 shrink-0 text-[#42E2D5]"
    aria-hidden="true"
  >
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
  </svg>
);

export function PublicLayout() {
  const { theme, setTheme } = useThemeStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Sticky Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 z-50">
            <HueBoxLogo />
            <span className="font-bold tracking-wider text-lg font-heading text-foreground">
              HUEBOX
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/academy"
              className={`text-sm font-semibold transition-colors ${
                isActive("/academy")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Academy
            </Link>
            <Link
              to="/terms"
              className={`text-sm font-semibold transition-colors ${
                isActive("/terms")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Terms & Conditions
            </Link>
          </nav>

          {/* Right actions: Theme toggle + Sign In / Dashboard */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {accessToken ? (
              <Button asChild size="sm" className="font-semibold">
                <Link to="/">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="font-semibold">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2.5 md:hidden z-50">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md md:hidden transition-colors duration-300">
          <div className="flex flex-col h-full pt-24 px-6 pb-8 space-y-6">
            <Link
              to="/academy"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-bold tracking-wide transition-colors ${
                isActive("/academy") ? "text-primary" : "text-foreground"
              }`}
            >
              Academy
            </Link>
            <Link
              to="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-bold tracking-wide transition-colors ${
                isActive("/terms") ? "text-primary" : "text-foreground"
              }`}
            >
              Terms & Conditions
            </Link>

            <div className="h-px bg-border/40 my-2" />

            {accessToken ? (
              <Button asChild className="w-full font-semibold" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full font-semibold" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main content page area */}
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border/40 bg-card/20 transition-colors duration-300 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            
            {/* Brand column */}
            <div className="md:col-span-5 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <HueBoxLogo />
                <span className="font-bold tracking-wider text-lg font-heading text-foreground">
                  HUEBOX
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Automated grid-trading bot infrastructure powered by advanced AI. Keep custody of your funds in your isolated trading account while optimizing your trading.
              </p>
            </div>

            {/* Navigation column */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold tracking-widest text-foreground uppercase">
                Platform
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/academy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    Academy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/glossary" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    Trading Glossary
                  </Link>
                </li>
              </ul>
            </div>

            {/* Disclaimer column */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold tracking-widest text-foreground uppercase">
                Legal Disclaimer
              </h4>
              <p className="text-[12px] text-muted-foreground leading-relaxed font-sans">
                HueBox is an automated software utility. We do not solicit investments, custody user funds, or offer financial advisory services. Algorithmic and cryptocurrency trading involves high operational and financial risk. Past results are no guarantee of future returns.
              </p>
            </div>

          </div>

          <div className="border-t border-border/20 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} HueBox. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-[11px] text-muted-foreground/60">
                100% Free Public Education
              </span>
              <span className="text-[11px] text-muted-foreground/60">
                Non-Custodial Service
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
