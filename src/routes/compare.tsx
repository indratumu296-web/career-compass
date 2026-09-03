import { createFileRoute } from "@tanstack/react-router";
import { Columns3 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, EmptyState, LoadingState, ScoreRing } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { comparisonRows, statusTone } from "@/lib/career-intel";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Jobs | SmartHire" },
      { name: "description", content: "Compare your resume side by side against multiple job requirements: skills, experience, education and certifications." },
      { property: "og:title", content: "Compare Jobs | SmartHire" },
      { property: "og:description", content: "Candidate versus requirement, category by category, for every job you select." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { result, loading } = useAnalysis();
  const [selected, setSelected] = useState<string[]>([]);

  if (loading) return <LoadingState />;
  if (!result) return <EmptyState text="Upload a resume to compare it against the jobs in the database." />;

  const matches = result.matches;
  const active = selected.length ? matches.filter((j) => selected.includes(j.id)) : matches.slice(0, 2);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-8">
      <PageHeader icon={Columns3} title="Compare jobs" subtitle="Pick the roles you care about and see exactly where you stand against each requirement." />

      <Card title="Select jobs" subtitle="Defaults to your two strongest matches.">
        <div className="flex flex-wrap gap-2">
          {matches.map((job) => {
            const on = selected.includes(job.id);
            return (
              <button
                key={job.id}
                onClick={() => toggle(job.id)}
                aria-pressed={on}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
              >
                {job.title} · {job.score}%
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {active.map((job) => (
          <Card key={job.id} title={job.title} subtitle={`${job.company} · ${job.location}`} action={<ScoreRing value={job.score} size={64} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 font-medium">Category</th>
                    <th className="py-2 font-medium">Candidate</th>
                    <th className="py-2 font-medium">Job requirement</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows(result.profile, job).map((row) => (
                    <tr key={row.category} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-medium">{row.category}</td>
                      <td className="py-2 text-muted-foreground">{row.candidate}</td>
                      <td className="py-2 text-muted-foreground">{row.requirement}</td>
                      <td className="py-2">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${statusTone[row.status]}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
