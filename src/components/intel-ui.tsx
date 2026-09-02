import { Link } from "@tanstack/react-router";
import { FileUp, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  progress,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  progress?: number;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const bar = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ScoreRing({ value, size = 120, label }: { value: number; size?: number; label?: string }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  const color = value >= 75 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold">{Math.round(value)}%</p>
        {label && <p className="text-[10px] uppercase text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const bar = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", destructive: "bg-destructive" }[tone];
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Card({ title, subtitle, action, children }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "success" | "warning" | "destructive" }) {
  const tones = {
    neutral: "border-border bg-muted text-muted-foreground",
    primary: "border-primary/20 bg-primary/10 text-primary",
    success: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/10 text-warning",
    destructive: "border-destructive/20 bg-destructive/10 text-destructive",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones}`}>{children}</span>;
}

export function EmptyState({ title = "No analysis yet", text }: { title?: string; text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border p-12 text-center">
      <FileUp className="size-8 text-muted-foreground" />
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
      <Link to="/upload" className="primary-button mt-5">
        Upload a resume
      </Link>
    </div>
  );
}

export function LoadingState({ text = "Analyzing your resume…" }: { text?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5">
        <LoaderCircle className="size-5 animate-spin text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">{text}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
