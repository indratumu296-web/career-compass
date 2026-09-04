import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, EmptyState, LoadingState, MetricCard } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { careerPaths, roadmap, skillInsights } from "@/lib/career-intel";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Download Report | SmartHire" },
      { name: "description", content: "Export a full SmartHire career report: scores, job matches, skill gaps, roadmap and improvement suggestions." },
      { property: "og:title", content: "Download Report | SmartHire" },
      { property: "og:description", content: "Download or print your complete resume and career intelligence report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { result, loading } = useAnalysis();
  if (loading) return <LoadingState />;
  if (!result) return <EmptyState text="Upload a resume to generate a downloadable career report." />;

  const { profile, audit, matches } = result;
  const insights = skillInsights(profile, matches);
  const missing = insights.filter((i) => i.group === "missing");
  const weeks = roadmap(insights, profile.predictedCategory);
  const paths = careerPaths(matches);

  const lines = [
    "SMARTHIRE CAREER REPORT",
    `Generated: ${new Date(result.analyzedAt).toLocaleString()}`,
    `Candidate: ${profile.candidateName || "Candidate"}`,
    "",
    "SUMMARY",
    `Predicted role: ${profile.predictedCategory} (${profile.categoryConfidence}% confidence)`,
    `Overall match score: ${matches[0]?.score ?? 0}%`,
    `Resume quality score: ${audit.qualityScore}/100`,
    `ATS compatibility: ${audit.atsScore}/100`,
    `Employability index: ${audit.employabilityScore}/100`,
    `Skills detected: ${profile.skills.length} · Missing skills: ${missing.length}`,
    "",
    "JOB MATCHES",
    ...matches.map(
      (m, i) =>
        `${i + 1}. ${m.score}% — ${m.title} @ ${m.company} (${m.location}, ${m.salary})\n   Matching: ${m.matchingSkills.join(", ") || "—"}\n   Missing: ${m.missingSkills.join(", ") || "—"}`,
    ),
    "",
    "SKILL GAPS",
    ...missing.map((m) => `- ${m.skill} (${m.priority} priority, required by ${m.demand} jobs)`),
    "",
    "30-DAY ROADMAP",
    ...weeks.map((w) => `Week ${w.week}: ${w.focus} — ${w.difficulty}, ${w.duration}. Project: ${w.practiceProject}`),
    "",
    "CAREER PATHS",
    ...paths.map((p) => `- ${p.role}: ${p.match}% match, ~${p.prepWeeks} weeks prep`),
    "",
    "RESUME IMPROVEMENT SUGGESTIONS",
    ...audit.suggestions.map((s) => `- [${s.severity}] ${s.title}: ${s.detail}`),
  ];

  const download = () => {
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smarthire-report-${(profile.candidateName || "candidate").toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={Download} title="Download report" subtitle="Everything SmartHire found, in one exportable document." />

      <div className="flex flex-wrap gap-3">
        <button className="primary-button" onClick={download}>
          <Download className="size-4" /> Download report (.txt)
        </button>
        <button className="secondary-button" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / save as PDF
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Overall match" value={`${matches[0]?.score ?? 0}%`} progress={matches[0]?.score ?? 0} />
        <MetricCard label="Resume quality" value={`${audit.qualityScore}%`} progress={audit.qualityScore} tone="success" />
        <MetricCard label="ATS score" value={`${audit.atsScore}/100`} progress={audit.atsScore} tone="warning" />
        <MetricCard label="Employability" value={`${audit.employabilityScore}%`} progress={audit.employabilityScore} />
      </div>

      <Card title="Report preview" subtitle={`${lines.length} lines · plain text export`}>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Badge tone="primary">{matches.length} job matches</Badge>
          <Badge tone="destructive">{missing.length} skill gaps</Badge>
          <Badge tone="success">{weeks.length}-week roadmap</Badge>
        </div>
        <pre className="max-h-[32rem] overflow-auto rounded-lg bg-muted p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
          {lines.join("\n")}
        </pre>
      </Card>
    </div>
  );
}
