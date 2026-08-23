import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  Info,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartHire | Resume-to-Job Matching" },
      {
        name: "description",
        content:
          "Analyze your resume, discover matching jobs, and identify skill gaps with transparent classical machine learning.",
      },
      { property: "og:title", content: "SmartHire | Resume-to-Job Matching" },
      {
        property: "og:description",
        content: "Classical-ML resume analysis, ranked job matches, and practical skill-gap guidance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SmartHire,
});

type Job = {
  title: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  overlap: string[];
  gaps: string[];
  description: string;
};

const jobs: Job[] = [
  {
    title: "Senior Data Engineer",
    company: "Northstar Analytics",
    location: "Bengaluru · Hybrid",
    salary: "₹24L–₹34L",
    score: 92,
    overlap: ["Python", "SQL", "Apache Spark", "AWS"],
    gaps: ["Snowflake", "Terraform"],
    description: "Own batch and streaming data platforms, improve reliability, and guide warehouse architecture across product teams.",
  },
  {
    title: "Data Platform Engineer",
    company: "Orbit Systems",
    location: "Pune · Remote",
    salary: "₹20L–₹28L",
    score: 84,
    overlap: ["Python", "ETL", "Docker"],
    gaps: ["Kafka", "dbt", "Airflow"],
    description: "Build reusable ingestion frameworks and production-grade orchestration for high-volume analytical workloads.",
  },
  {
    title: "Cloud Data Developer",
    company: "Strataworks",
    location: "Hyderabad · On-site",
    salary: "₹18L–₹25L",
    score: 77,
    overlap: ["AWS", "SQL", "Pandas"],
    gaps: ["Redshift", "Kubernetes"],
    description: "Develop cloud-native pipelines and dimensional models for customer intelligence and financial reporting.",
  },
];

function SmartHire() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"ready" | "processing" | "complete">("ready");
  const [activeJob, setActiveJob] = useState<number | null>(0);

  const processResume = (name = fileName || "sample_resume.pdf") => {
    setFileName(name);
    setStatus("processing");
    window.setTimeout(() => setStatus("complete"), 900);
  };

  const reset = () => {
    setFileName("");
    setStatus("ready");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 h-14 border-b border-border bg-background/90 px-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#top" className="font-mono text-lg font-bold uppercase" aria-label="SmartHire home">
              SmartHire <span className="text-primary">/</span> <span className="font-normal text-muted-foreground">ML.v2</span>
            </a>
            <div className="hidden gap-6 text-sm font-medium md:flex">
              <a href="#dashboard" className="text-foreground">Dashboard</a>
              <a href="#matches" className="text-muted-foreground transition-colors hover:text-foreground">Job corpus</a>
              <a href="#guidance" className="text-muted-foreground transition-colors hover:text-foreground">Skill report</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded bg-muted px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-primary" /> Engine ready
            </div>
            <div className="grid size-8 place-items-center rounded-full border border-primary/20 bg-primary/10 font-mono text-xs font-bold text-primary">SH</div>
          </div>
        </div>
      </nav>

      <main id="top" className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-8 p-5 md:p-8 lg:p-10">
        <aside id="dashboard" className="col-span-12 space-y-8 lg:col-span-4">
          <section className="space-y-4 animate-in">
            <SectionLabel>01 / Analyze candidate</SectionLabel>
            <div
              className="group relative overflow-hidden rounded-xl border-2 border-dashed border-border p-7 text-center transition-colors hover:border-primary/50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) processResume(file.name);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setFileName(file.name);
                }}
              />
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
                {fileName ? <FileText className="size-6" /> : <Upload className="size-6" />}
              </div>
              <p className="text-sm font-semibold">{fileName || "Upload your resume"}</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX or TXT · up to 5 MB</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {fileName ? (
                  <>
                    <button className="primary-button" onClick={() => processResume()} disabled={status === "processing"}>
                      {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <BriefcaseBusiness className="size-4" />}
                      {status === "processing" ? "Analyzing…" : "Analyze resume"}
                    </button>
                    <button className="icon-button" onClick={reset} aria-label="Remove uploaded resume" title="Remove resume"><RotateCcw className="size-4" /></button>
                  </>
                ) : (
                  <>
                    <button className="primary-button" onClick={() => inputRef.current?.click()}><Upload className="size-4" /> Choose file</button>
                    <button className="secondary-button" onClick={() => processResume()}>Try sample</button>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-7 animate-in delay-1">
            <SectionLabel>02 / Predicted category</SectionLabel>
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold">Data Engineer</h2>
                <span className="shrink-0 rounded bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">94.6% CONF</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Strong signals in data pipelines, SQL, Python automation, distributed processing, and cloud infrastructure.</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="score-bar w-[95%]" /></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ModelBadge>TF-IDF</ModelBadge><ModelBadge>Logistic regression</ModelBadge><ModelBadge>Classical ML</ModelBadge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric value="7+ yrs" label="Experience" />
              <Metric value="18" label="Skills found" />
            </div>
          </section>
        </aside>

        <div className="col-span-12 space-y-8 lg:col-span-8 animate-in delay-2">
          <header id="matches" className="flex items-end justify-between gap-5">
            <div>
              <SectionLabel>03 / Job matching report</SectionLabel>
              <h1 className="mt-2 text-3xl font-bold">Top recommender matches</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">Ranked by cosine similarity between your resume and normalized job descriptions.</p>
            </div>
            <div className="hidden text-right sm:block"><p className="font-mono text-[10px] uppercase text-muted-foreground">Corpus size</p><p className="text-lg font-bold">5,496 jobs</p></div>
          </header>

          <div className="space-y-3">
            {jobs.map((job, index) => (
              <article key={job.title} className="rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 md:p-6">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex w-full shrink-0 items-center gap-3 sm:w-20 sm:flex-col sm:justify-center sm:gap-1">
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">Match</span>
                    <span className="text-3xl font-bold text-primary">{job.score}<span className="text-sm font-normal">%</span></span>
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-muted"><div className="score-bar" style={{ width: `${job.score}%` }} /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="text-lg font-bold">{job.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3" /> {job.location}<span>·</span>{job.salary}</p>
                      </div>
                      <button className="secondary-button self-start" onClick={() => setActiveJob(activeJob === index ? null : index)} aria-expanded={activeJob === index}>
                        Details <ChevronDown className={`size-4 transition-transform ${activeJob === index ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
                      <SkillList label="Top overlap" skills={job.overlap} type="match" />
                      <SkillList label="Skill gaps" skills={job.gaps} type="gap" />
                    </div>
                    {activeJob === index && (
                      <div className="mt-4 flex flex-col gap-4 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-relaxed text-muted-foreground">{job.description}</p>
                        <a href="#guidance" className="secondary-button shrink-0">Review gaps <ArrowUpRight className="size-4" /></a>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section id="guidance" className="space-y-5 pt-4 animate-in delay-3">
            <div className="flex items-center gap-3"><SectionLabel>04 / Strategic guidance</SectionLabel><div className="h-px flex-1 bg-border" /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="font-mono text-[10px] font-bold uppercase text-primary">Market signal</p>
                <h2 className="mt-2 font-bold">Benefits-rich opportunities</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The uploaded corpus contains 5,496 jobs with benefit records. Medical insurance and retirement plans are the most frequent indicators.</p>
                <div className="mt-5 space-y-3"><BenefitBar label="401(k)" value="32%" width="w-[84%]" /><BenefitBar label="Medical" value="15%" width="w-[55%]" /><BenefitBar label="Vision" value="14%" width="w-[49%]" /></div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="font-mono text-[10px] font-bold uppercase text-signal">Priority skill gap</p>
                <h2 className="mt-2 font-bold">Build Snowflake fluency</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Snowflake appears across your strongest matches but is absent from the resume. Add one warehouse project with ingestion, modeling, and cost controls.</p>
                <div className="mt-5 space-y-2">
                  {["Complete a hands-on warehouse project", "Quantify pipeline scale and reliability", "Add Terraform fundamentals"].map((item) => <div key={item} className="flex gap-2 text-xs"><Check className="size-4 shrink-0 text-primary" /><span>{item}</span></div>)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 rounded-lg border border-border bg-muted p-4 text-xs leading-relaxed text-muted-foreground"><Info className="size-4 shrink-0 text-primary" /><p>Scores are explainable recommendations, not hiring decisions. SmartHire uses TF-IDF, logistic regression, and cosine similarity—no generative AI.</p></div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-bold uppercase text-muted-foreground">{children}</p>;
}

function ModelBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium">{children}</span>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-lg border border-border bg-card p-4"><p className="text-lg font-bold">{value}</p><p className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">{label}</p></div>;
}

function SkillList({ label, skills, type }: { label: string; skills: string[]; type: "match" | "gap" }) {
  return <div><p className={`mb-2 font-mono text-[10px] uppercase ${type === "gap" ? "text-signal" : "text-muted-foreground"}`}>{label}</p><div className="flex flex-wrap gap-1.5">{skills.map((skill) => <span key={skill} className={type === "gap" ? "gap-badge" : "match-badge"}>{skill}</span>)}</div></div>;
}

function BenefitBar({ label, value, width }: { label: string; value: string; width: string }) {
  return <div><div className="mb-1 flex justify-between font-mono text-[9px] uppercase text-muted-foreground"><span>{label}</span><span>{value}</span></div><div className="h-1.5 rounded-full bg-muted"><div className={`h-full rounded-full bg-primary ${width}`} /></div></div>;
}