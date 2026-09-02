import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Braces,
  Compass,
  Download,
  FileSearch,
  GitCompare,
  Home,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Moon,
  Route as RouteIcon,
  Sun,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAnalysis } from "@/lib/analysis-store";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/upload", label: "Upload Resume", icon: Upload },
  { to: "/analysis", label: "Resume Analysis", icon: LayoutDashboard },
  { to: "/jobs", label: "Job Recommendations", icon: BarChart3 },
  { to: "/compare", label: "Compare Jobs", icon: GitCompare },
  { to: "/skills", label: "Skill Gap Report", icon: FileSearch },
  { to: "/roadmap", label: "Career Roadmap", icon: RouteIcon },
  { to: "/optimizer", label: "Resume Optimizer", icon: Wand2 },
  { to: "/projects", label: "Portfolio Projects", icon: Lightbulb },
  { to: "/report", label: "Download Report", icon: Download },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("smarthire-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefers;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("smarthire-theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { result, loading, fileName } = useAnalysis();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-border bg-sidebar transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">SH</span>
            <span className="text-base font-bold tracking-tight">SmartHire</span>
          </Link>
          <button className="icon-button lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 9rem)" }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold bg-primary/10 text-primary" }}
              activeOptions={{ exact: to === "/" }}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <span className={`size-2 rounded-full ${loading ? "animate-pulse bg-warning" : result ? "bg-success" : "bg-muted-foreground"}`} />
            <p className="truncate text-xs text-muted-foreground">
              {loading ? "Analyzing resume…" : result ? fileName || "Analysis ready" : "No resume analyzed"}
            </p>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="icon-button lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="size-4" />
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground sm:flex">
              <Braces className="size-3 text-primary" /> Career intelligence engine
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/upload" className="primary-button">
              <Upload className="size-4" /> Upload resume
            </Link>
            <button className="icon-button" onClick={toggle} aria-label="Toggle theme">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 md:p-8">{children}</main>
        <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground md:px-8">
          SmartHire — explainable career intelligence. Scores are recommendations, not hiring decisions.
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon?: typeof Compass }) {
  return (
    <div className="mb-8 flex items-start gap-4">
      {Icon && (
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
