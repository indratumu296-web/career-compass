import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, EmptyState, LoadingState, MetricCard, ProgressBar, ScoreRing } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { tailorResume } from "@/lib/career-intel";

export const Route = createFileRoute("/optimizer")({
  head: () => ({
    meta: [
      { title: "Resume Optimizer & ATS Checker | SmartHire" },
      { name: "description", content: "ATS compatibility score, resume improvement suggestions and rule-based tailoring recommendations for any job you select." },
      { property: "og:title", content: "Resume Optimizer & ATS Checker | SmartHire" },
      { property: "og:description", content: "Fix ATS parsing issues, add missing keywords and tailor your resume to a specific role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OptimizerPage,
});

function OptimizerPage() {
  const { result, loading } = useAnalysis();
  const [jobId, setJobId] = useState<string | null>(null);

  if (loading) return <LoadingState />;
  if (!result) return <EmptyState text="Upload a resume to run the ATS check and get improvement suggestions." />;

  const { audit, matches, profile } = result;
  const job = matches.find((m) => m.id === jobId) ?? matches[0];
  const tailoring = job ? tailorResume(profile, job) : null;

  return (
    <div className="space-y-8">
      <PageHeader icon={Wrench} title="Resume optimizer" subtitle="Deterministic ATS scoring, weakness detection and template-based tailoring — no invented content." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="ATS compatibility" subtitle={`${audit.atsScore}/100 based on keywords, sections, headings, contact details and formatting.`}>
          <div className="flex items-center gap-6">
            <ScoreRing value={audit.atsScore} label="ATS" />
            <div className="flex-1 space-y-3">
              {audit.atsFactors.map((factor) => (
                <div key={factor.label}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="font-medium">{factor.label}</span>
                    <span className="text-muted-foreground">{factor.score}/{factor.max}</span>
                  </div>
                  <ProgressBar value={(factor.score / factor.max) * 100} tone={factor.score / factor.max >= 0.7 ? "success" : factor.score / factor.max >= 0.4 ? "warning" : "destructive"} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Improvement suggestions" subtitle="Ranked weaknesses detected in your document.">
          <ul className="space-y-2">
            {audit.suggestions.map((s) => (
              <li key={s.title} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">{s.title}</p>
                  <Badge tone={s.severity === "high" ? "destructive" : s.severity === "medium" ? "warning" : "neutral"}>{s.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </li>
            ))}
            {!audit.suggestions.length && <p className="text-sm text-muted-foreground">No weaknesses detected — your resume is in good shape.</p>}
          </ul>
        </Card>

        <div className="space-y-4">
          <MetricCard label="Resume quality" value={`${audit.qualityScore}%`} progress={audit.qualityScore} tone="success" />
          <MetricCard label="Employability index" value={`${audit.employabilityScore}%`} progress={audit.employabilityScore} />
          <MetricCard label="Keyword coverage" value={`${matches[0]?.matchingSkills.length ?? 0} matched`} hint={`${matches[0]?.missingSkills.length ?? 0} missing for the top job`} tone="warning" />
        </div>
      </div>

      <Card
        title="Tailor your resume for a specific job"
        subtitle="Rule-based recommendations — you stay the author."
        action={
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-xs"
            value={job?.id ?? ""}
            onChange={(e) => setJobId(e.target.value)}
            aria-label="Select job to tailor for"
          >
            {matches.map((m) => <option key={m.id} value={m.id}>{m.title} — {m.company}</option>)}
          </select>
        }
      >
        {tailoring && job ? (
          <div className="grid gap-5 md:grid-cols-2">
            <Section title="Keywords to include" items={tailoring.keywords} tone="primary" />
            <Section title="Skills to highlight" items={tailoring.highlightSkills} tone="success" />
            <Section title="Missing job requirements" items={tailoring.missingRequirements} tone="destructive" />
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Experience points to emphasise</p>
              <ul className="mt-2 space-y-1.5">
                {tailoring.experiencePoints.map((p) => <li key={p} className="text-xs text-muted-foreground">• {p}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Recommended project order</p>
              <ol className="mt-2 space-y-1.5">
                {tailoring.projectOrder.map((p, i) => <li key={p} className="text-xs text-muted-foreground">{i + 1}. {p}</li>)}
              </ol>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Suggested professional summary (template)</p>
              <p className="mt-2 rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">{tailoring.summary}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No jobs available to tailor against.</p>
        )}
      </Card>
    </div>
  );
}

function Section({ items, title, tone }: { items: string[]; title: string; tone: "primary" | "success" | "destructive" }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => <Badge key={item} tone={tone}>{item}</Badge>)}
        {!items.length && <p className="text-xs text-muted-foreground">None.</p>}
      </div>
    </div>
  );
}
