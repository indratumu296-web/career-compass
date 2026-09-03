import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Check, ChevronDown, MapPin, Search, TrendingUp, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, EmptyState, LoadingState, ProgressBar, ScoreRing } from "@/components/intel-ui";
import { JobManager } from "@/components/JobManager";
import { useAnalysis } from "@/lib/analysis-store";
import { explainMatch, type JobMatch, type ResumeProfile } from "@/lib/career-intel";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Job Recommendations | SmartHire" },
      { name: "description", content: "Explainable job recommendations ranked by match percentage with matching skills, missing skills, strengths and confidence." },
      { property: "og:title", content: "Job Recommendations | SmartHire" },
      { property: "og:description", content: "Every match score explained: skills, experience, education, projects, certifications and semantic similarity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const { result, loading, reanalyze } = useAnalysis();
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const matches = result?.matches ?? [];
  const filtered = useMemo(
    () =>
      matches
        .filter((job) => job.score >= minScore)
        .filter((job) => `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(query.toLowerCase())),
    [matches, minScore, query],
  );

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={BarChart3}
        title="Job recommendations"
        subtitle="Skills 40% · Experience 25% · Education 10% · Projects 10% · Certifications 5% · Keyword similarity 10%. Sorted high to low."
      />

      {!result ? (
        <EmptyState text="Upload a resume to score every job in the database and see why each one is recommended." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
            <label className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search role, company or location"
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Search jobs"
              />
            </label>
            <label className="flex items-center gap-3 text-xs text-muted-foreground">
              Min match {minScore}%
              <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="accent-primary" />
            </label>
            <Badge tone="primary">{filtered.length} of {matches.length} jobs</Badge>
          </div>

          <div className="space-y-4">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} profile={result.profile} open={open === job.id} onToggle={() => setOpen(open === job.id ? null : job.id)} />
            ))}
            {!filtered.length && <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No jobs match these filters.</p>}
          </div>
        </>
      )}

      <JobManager onJobsChanged={reanalyze} />
    </div>
  );
}

function JobCard({ job, profile, open, onToggle }: { job: JobMatch; profile: ResumeProfile; open: boolean; onToggle: () => void }) {
  const { reasons, gaps } = explainMatch(profile, job);
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40 md:p-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <ScoreRing value={job.score} size={104} label="match" />
          <span className="text-[10px] uppercase text-muted-foreground">{job.confidence}% confidence</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{job.title}</h2>
              <p className="text-sm text-muted-foreground">{job.company}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {job.location} · {job.salary}
              </p>
            </div>
            <button className="secondary-button" onClick={onToggle} aria-expanded={open}>
              Details <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Why this job is recommended</p>
              <ul className="space-y-1.5">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-success" /> {reason}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Missing</p>
              <ul className="space-y-1.5">
                {gaps.length ? (
                  gaps.map((gap) => (
                    <li key={gap} className="flex gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="size-3.5 shrink-0 text-warning" /> {gap}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">No significant gaps detected.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.matchingSkills.map((s) => <Badge key={s} tone="success">{s}</Badge>)}
            {job.missingSkills.map((s) => <Badge key={s} tone="destructive">{s}</Badge>)}
          </div>

          {open && (
            <div className="mt-5 space-y-4 rounded-lg bg-muted p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">{job.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ScoreRow label="Skills / 40" value={job.breakdown.skills} max={40} />
                <ScoreRow label="Experience / 25" value={job.breakdown.experience} max={25} />
                <ScoreRow label="Education / 10" value={job.breakdown.education} max={10} />
                <ScoreRow label="Projects / 10" value={job.breakdown.projects} max={10} />
                <ScoreRow label="Certifications / 5" value={job.breakdown.certifications} max={5} />
                <ScoreRow label="Keyword similarity / 10" value={job.breakdown.keywords} max={10} />
              </div>
              <p className="flex items-center gap-2 text-[11px] uppercase text-muted-foreground">
                <TrendingUp className="size-3 text-primary" /> Cosine similarity {job.similarity}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Card title="Strengths">
                  <ul className="space-y-1.5">
                    {job.strengths.map((s) => <li key={s} className="text-xs text-muted-foreground">✓ {s}</li>)}
                  </ul>
                </Card>
                <Card title="Weaknesses">
                  <ul className="space-y-1.5">
                    {job.weaknesses.map((s) => <li key={s} className="text-xs text-muted-foreground">! {s}</li>)}
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <ProgressBar value={(value / max) * 100} />
    </div>
  );
}
