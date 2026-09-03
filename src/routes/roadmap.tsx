import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, EmptyState, LoadingState, MetricCard } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { careerPaths, roadmap, skillInsights } from "@/lib/career-intel";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Career Roadmap | SmartHire" },
      { name: "description", content: "A rule-based 30-day career roadmap built from your missing skills: topics, difficulty, duration, practice projects and certifications." },
      { property: "og:title", content: "Career Roadmap | SmartHire" },
      { property: "og:description", content: "Week-by-week learning plan plus alternative career paths and preparation times." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { result, loading } = useAnalysis();
  if (loading) return <LoadingState />;
  if (!result) return <EmptyState text="Upload a resume to generate your personalised career roadmap." />;

  const insights = skillInsights(result.profile, result.matches);
  const weeks = roadmap(insights, result.profile.predictedCategory);
  const paths = careerPaths(result.matches);

  return (
    <div className="space-y-8">
      <PageHeader icon={Compass} title="Your 30-day career roadmap" subtitle="Generated from the highest-demand skills missing from your resume — no guesswork, no generic advice." />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Plan length" value={`${weeks.length} weeks`} />
        <MetricCard label="Skills covered" value={weeks.length} tone="success" />
        <MetricCard label="Target role" value={result.profile.predictedCategory} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {weeks.map((week) => (
          <Card key={week.week} title={`Week ${week.week}: ${week.focus}`} subtitle={`${week.duration} · ${week.difficulty}`}>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={week.importance === "High" ? "destructive" : week.importance === "Medium" ? "warning" : "neutral"}>{week.importance} importance</Badge>
              <Badge tone="primary">{week.difficulty}</Badge>
              <Badge>{week.duration}</Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Topics</p>
              <ul className="mt-1.5 space-y-1">
                {week.topics.map((topic) => <li key={topic} className="text-xs text-muted-foreground">• {topic}</li>)}
              </ul>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-3 text-xs">
              <p><span className="font-semibold">Practice project:</span> {week.practiceProject}</p>
              <p className="mt-1"><span className="font-semibold">Certification:</span> {week.certification}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Possible career paths" subtitle="Alternative roles with current match, gaps and preparation time.">
        <div className="grid gap-4 md:grid-cols-2">
          {paths.map((path) => (
            <div key={path.role} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{path.role}</p>
                <Badge tone="primary">{path.match}% match</Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{path.openings} matching openings · ~{path.prepWeeks} weeks of preparation</p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">Required</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {path.requiredSkills.map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
              {path.missingSkills.length > 0 && (
                <>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">Missing</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {path.missingSkills.map((s) => <Badge key={s} tone="destructive">{s}</Badge>)}
                  </div>
                </>
              )}
              {path.projects.length > 0 && (
                <p className="mt-3 text-[11px] text-muted-foreground">Recommended projects: {path.projects.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
