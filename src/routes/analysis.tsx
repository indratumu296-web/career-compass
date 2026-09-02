import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutDashboard, Check, X, Info } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, EmptyState, LoadingState, MetricCard, ProgressBar, ScoreRing } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { careerPaths, skillInsights } from "@/lib/career-intel";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Resume Analysis Dashboard | SmartHire" },
      { name: "description", content: "Resume quality score, ATS compatibility, predicted job category, employability index and profile strengths and weaknesses." },
      { property: "og:title", content: "Resume Analysis Dashboard | SmartHire" },
      { property: "og:description", content: "Your career dashboard: quality, ATS, employability and the best matching role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const { result, loading } = useAnalysis();

  if (loading) return <LoadingState />;
  if (!result) return <EmptyState text="Upload a resume to unlock the career dashboard, quality score and ATS check." />;

  const { profile, matches, audit } = result;
  const best = matches[0];
  const insights = skillInsights(profile, matches);
  const missing = insights.filter((i) => i.group === "missing");
  const priority = missing.filter((i) => i.priority === "High");
  const paths = careerPaths(matches);

  const strengths = [...new Set(matches.slice(0, 3).flatMap((m) => m.strengths))].slice(0, 5);
  const weaknesses = [...new Set(matches.slice(0, 3).flatMap((m) => m.weaknesses))].slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome back, ${profile.candidateName || "Candidate"}`}
        subtitle={`Predicted role: ${profile.predictedCategory} · analysed ${new Date(result.analyzedAt).toLocaleString()}`}
      />

      {result.cached && (
        <p className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground">
          <Info className="size-4 text-primary" /> Identical resume detected — cached embeddings reused for this analysis.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Overall match score" value={`${best?.score ?? 0}%`} progress={best?.score ?? 0} hint={best ? `Best: ${best.title}` : undefined} />
        <MetricCard label="Resume quality score" value={`${audit.qualityScore}%`} progress={audit.qualityScore} tone="success" hint="Structure, achievements, depth" />
        <MetricCard label="ATS compatibility" value={`${audit.atsScore}/100`} progress={audit.atsScore} tone="warning" hint="Keyword & parsing readiness" />
        <MetricCard label="Employability index" value={`${audit.employabilityScore}%`} progress={audit.employabilityScore} hint="Match 50% · quality 30% · ATS 20%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Recommended jobs" value={matches.length} hint={`${matches.filter((m) => m.score >= 60).length} above 60% match`} />
        <MetricCard label="Skills detected" value={profile.skills.length} hint={`${profile.projects.length} projects · ${profile.certifications.length} certifications`} />
        <MetricCard label="Missing skills" value={missing.length} tone="destructive" hint={`${priority.length} high priority`} />
        <MetricCard label="Recommended path" value={paths[0]?.role ?? "—"} hint={paths[0] ? `${paths[0].match}% average match` : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Predicted job category" subtitle="Classified from the parsed resume content.">
          <div className="flex items-center gap-6">
            <ScoreRing value={profile.categoryConfidence} label="confidence" />
            <div>
              <p className="text-xl font-bold">{profile.predictedCategory}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile.summary}</p>
            </div>
          </div>
        </Card>

        <Card title="Best matching job" subtitle="Top-ranked opportunity for this resume.">
          {best ? (
            <div className="space-y-3">
              <div className="flex items-center gap-5">
                <ScoreRing value={best.score} size={104} label="match" />
                <div>
                  <p className="text-lg font-bold">{best.title}</p>
                  <p className="text-sm text-muted-foreground">{best.company} · {best.location}</p>
                  <p className="text-sm text-muted-foreground">{best.salary}</p>
                </div>
              </div>
              <Link to="/jobs" className="secondary-button">See all recommendations</Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No jobs in the database yet.</p>
          )}
        </Card>

        <Card title="Career paths" subtitle="Roles ranked by average match.">
          <div className="space-y-3">
            {paths.slice(0, 5).map((path) => (
              <div key={path.role}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{path.role}</span>
                  <span className="text-muted-foreground">{path.match}%</span>
                </div>
                <ProgressBar value={path.match} tone={path.match >= 75 ? "success" : path.match >= 50 ? "primary" : "warning"} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile strengths">
          <ul className="space-y-2">
            {strengths.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                <Check className="size-4 shrink-0 text-success" /> {item}
              </li>
            ))}
            {!strengths.length && <p className="text-sm text-muted-foreground">No strengths generated yet.</p>}
          </ul>
        </Card>
        <Card title="Profile weaknesses">
          <ul className="space-y-2">
            {weaknesses.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                <X className="size-4 shrink-0 text-destructive" /> {item}
              </li>
            ))}
            {!weaknesses.length && <p className="text-sm text-muted-foreground">No weaknesses generated yet.</p>}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Resume quality breakdown" subtitle={`${audit.qualityScore}/100 across eight factors.`}>
          <div className="space-y-4">
            {audit.qualityFactors.map((factor) => (
              <div key={factor.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{factor.label}</span>
                  <span className="text-muted-foreground">{factor.score}/{factor.max}</span>
                </div>
                <ProgressBar value={(factor.score / factor.max) * 100} tone={factor.score / factor.max >= 0.7 ? "success" : factor.score / factor.max >= 0.4 ? "warning" : "destructive"} />
                <p className="mt-1 text-[11px] text-muted-foreground">{factor.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Extracted profile" subtitle="Everything the parser found in your document.">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Experience" value={`${profile.totalYearsExperience} yrs`} />
            <MetricCard label="Education" value={profile.educationLevel} hint={profile.educationField} />
          </div>
          <p className="mt-5 text-xs font-medium uppercase text-muted-foreground">Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => <Badge key={skill} tone="primary">{skill}</Badge>)}
          </div>
          {profile.certifications.length > 0 && (
            <>
              <p className="mt-5 text-xs font-medium uppercase text-muted-foreground">Certifications</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.certifications.map((c) => <Badge key={c} tone="success">{c}</Badge>)}
              </div>
            </>
          )}
          {profile.projects.length > 0 && (
            <>
              <p className="mt-5 text-xs font-medium uppercase text-muted-foreground">Projects</p>
              <ul className="mt-2 space-y-2">
                {profile.projects.map((p) => (
                  <li key={p.name} className="rounded-lg border border-border p-3 text-xs">
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 text-muted-foreground">{p.summary}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
