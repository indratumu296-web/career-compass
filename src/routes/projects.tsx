import { createFileRoute } from "@tanstack/react-router";
import { FolderGit2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, EmptyState, LoadingState } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { projectIdeas, skillInsights } from "@/lib/career-intel";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Portfolio Projects | SmartHire" },
      { name: "description", content: "Portfolio project recommendations that close the specific skill gaps found between your resume and your matched jobs." },
      { property: "og:title", content: "Portfolio Projects | SmartHire" },
      { property: "og:description", content: "Build the right projects: each recommendation targets skills missing from your resume." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { result, loading } = useAnalysis();
  if (loading) return <LoadingState />;
  if (!result) return <EmptyState text="Upload a resume to get portfolio project recommendations for your skill gaps." />;

  const insights = skillInsights(result.profile, result.matches);
  const missing = insights.filter((i) => i.group === "missing").map((i) => i.skill);
  const ideas = projectIdeas(missing, result.profile.predictedCategory);

  return (
    <div className="space-y-8">
      <PageHeader icon={FolderGit2} title="Portfolio projects" subtitle="Each project is selected because it covers skills your matched jobs require and your resume does not show." />

      <div className="grid gap-5 md:grid-cols-2">
        {ideas.map((idea) => (
          <Card key={idea.title} title={idea.title} subtitle={idea.why}>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Skills covered</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {idea.skills.map((s) => <Badge key={s} tone="primary">{s}</Badge>)}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Build steps</p>
            <ol className="mt-2 space-y-1.5">
              {idea.steps.map((step, i) => (
                <li key={step} className="text-xs text-muted-foreground">{i + 1}. {step}</li>
              ))}
            </ol>
          </Card>
        ))}
        {!ideas.length && <p className="text-sm text-muted-foreground">No gaps found — your portfolio already covers the required skills.</p>}
      </div>
    </div>
  );
}
