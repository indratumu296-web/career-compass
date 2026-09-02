import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Compass, FileSearch, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Badge, Card } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartHire | Career Intelligence for Your Next Opportunity" },
      {
        name: "description",
        content:
          "Upload a resume and get explainable job matches, a resume quality and ATS score, a skill-gap report, a career roadmap and portfolio project ideas.",
      },
      { property: "og:title", content: "SmartHire | Career Intelligence Platform" },
      {
        property: "og:description",
        content: "Explainable job matching, ATS scoring, skill-gap visualisation and a personalised career roadmap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { icon: FileSearch, title: "Resume Analysis", text: "Extract skills, experience, education, projects and certifications, then score resume quality and ATS compatibility." },
  { icon: BarChart3, title: "Job Matching", text: "Every job in the database is scored with a transparent weighted formula plus semantic similarity — and each score is explained." },
  { icon: Compass, title: "Career Growth", text: "Turn the gaps into a week-by-week roadmap, portfolio project ideas and role-specific resume tailoring." },
];

const STEPS = [
  { n: 1, title: "Upload your resume", text: "PDF or TXT. Parsing runs server-side; nothing is hardcoded." },
  { n: 2, title: "Analyze your profile", text: "Quality score, ATS score, predicted category and employability index." },
  { n: 3, title: "Explore matching jobs", text: "Ranked matches with reasons, gaps and side-by-side comparison." },
  { n: 4, title: "Improve missing skills", text: "Priority skill gaps, a 30-day roadmap and project recommendations." },
];

function HomePage() {
  const { result } = useAnalysis();

  return (
    <div className="space-y-14">
      <section className="animate-in rounded-2xl border border-border bg-card p-8 shadow-card md:p-12">
        <Badge tone="primary">
          <Sparkles className="size-3" /> Career intelligence platform
        </Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          SmartHire — career intelligence for your next opportunity
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Upload one resume and get an explainable match score for every job, an ATS compatibility check, an interactive
          skill-gap report and a personalised learning roadmap — all recalculated from your document, never hardcoded.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/upload" className="primary-button">
            Upload resume <ArrowRight className="size-4" />
          </Link>
          <Link to={result ? "/analysis" : "/upload"} className="secondary-button">
            {result ? "Open dashboard" : "Try demo"}
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge><ShieldCheck className="size-3" /> Explainable scoring</Badge>
          <Badge><Target className="size-3" /> ATS compatibility</Badge>
          <Badge><Compass className="size-3" /> 30-day roadmap</Badge>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/40">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <Card title="How it works" subtitle="Four steps from a PDF to a career plan.">
        <ol className="grid gap-5 md:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.n} className="rounded-lg border border-border p-4">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step.n}</span>
              <p className="mt-3 text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
