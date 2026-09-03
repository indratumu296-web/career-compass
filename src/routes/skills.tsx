import { createFileRoute } from "@tanstack/react-router";
import { Radar as RadarIcon } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, EmptyState, LoadingState, ProgressBar } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { radarData, skillInsights, type SkillInsight } from "@/lib/career-intel";

export const Route = createFileRoute("/skills")({
  head: () => ({
    meta: [
      { title: "Skill Gap Report | SmartHire" },
      { name: "description", content: "Interactive skill-gap report: strong, matching, partial and missing skills with priority labels, demand and importance scores." },
      { property: "og:title", content: "Skill Gap Report | SmartHire" },
      { property: "og:description", content: "Radar chart, progress bars and prioritised skill gaps drawn from live job requirements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkillsPage,
});

const GROUPS: { key: SkillInsight["group"]; title: string; tone: "success" | "primary" | "warning" | "destructive"; text: string }[] = [
  { key: "strong", title: "Strong skills", tone: "success", text: "In your resume and in high demand across matched jobs." },
  { key: "matching", title: "Matching skills", tone: "primary", text: "Present in your resume and required by at least one job." },
  { key: "partial", title: "Partial skills", tone: "warning", text: "Related evidence found, but not clearly demonstrated." },
  { key: "missing", title: "Missing skills", tone: "destructive", text: "Required by jobs you match but absent from your resume." },
];

function SkillsPage() {
  const { result, loading } = useAnalysis();
  if (loading) return <LoadingState />;
  if (!result) return <EmptyState text="Upload a resume to build the skill-gap report." />;

  const insights = skillInsights(result.profile, result.matches);
  const radar = radarData(insights);
  const missing = insights.filter((i) => i.group === "missing").sort((a, b) => b.importance - a.importance);
  const high = missing.filter((i) => i.priority === "High");
  const medium = missing.filter((i) => i.priority === "Medium");

  return (
    <div className="space-y-8">
      <PageHeader icon={RadarIcon} title="Skill gap report" subtitle="Every skill required by your matched jobs, grouped, prioritised and scored by market demand." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Skill coverage radar" subtitle="Your coverage versus market demand.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="75%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Demand" dataKey="importance" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.15} />
                <Radar name="Coverage" dataKey="coverage" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Your coverage</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warning" /> Market demand</span>
          </div>
        </Card>

        <Card title="Priority skills to learn" subtitle="Ranked by how many matched jobs require them.">
          <div className="space-y-4">
            <PriorityList title="High priority" items={high} />
            <PriorityList title="Medium priority" items={medium} />
            {!missing.length && <p className="text-sm text-muted-foreground">No gaps detected — your resume covers every required skill.</p>}
          </div>
        </Card>

        <Card title="Skill importance" subtitle="Required versus available across all matched jobs.">
          <div className="space-y-3">
            {insights.slice(0, 12).map((item) => (
              <div key={item.skill}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium capitalize">{item.skill}</span>
                  <span className="text-muted-foreground">{item.demand} jobs · {item.importance}% importance</span>
                </div>
                <ProgressBar value={item.coverage} tone={item.coverage >= 80 ? "success" : item.coverage >= 40 ? "warning" : "destructive"} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {GROUPS.map((group) => {
          const items = insights.filter((i) => i.group === group.key);
          return (
            <Card key={group.key} title={`${group.title} (${items.length})`} subtitle={group.text}>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => <Badge key={item.skill} tone={group.tone}>{item.skill}</Badge>)}
                {!items.length && <p className="text-xs text-muted-foreground">None.</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PriorityList({ title, items }: { title: string; items: SkillInsight[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <ol className="mt-2 space-y-1.5">
        {items.slice(0, 6).map((item, i) => (
          <li key={item.skill} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
            <span className="font-medium capitalize">{i + 1}. {item.skill}</span>
            <span className="text-muted-foreground">{item.demand} jobs</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
