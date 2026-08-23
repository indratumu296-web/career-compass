import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileText,
  History,
  Info,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume, getAnalysisHistory } from "@/lib/smarthire.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartHire | AI Resume Match Scoring" },
      {
        name: "description",
        content:
          "Upload a resume and get AI-calculated match scores, matching and missing skills, strengths, weaknesses and confidence for every job in the database.",
      },
      { property: "og:title", content: "SmartHire | AI Resume Match Scoring" },
      {
        property: "og:description",
        content: "Semantic embeddings and weighted scoring rank every job against your uploaded resume in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SmartHire,
});

type AnalysisResult = Awaited<ReturnType<typeof analyzeResume>>;
type JobMatch = AnalysisResult["matches"][number];

function useDeviceId() {
  const [id, setId] = useState("");
  useEffect(() => {
    let existing = localStorage.getItem("smarthire-device-id");
    if (!existing) {
      existing = crypto.randomUUID();
      localStorage.setItem("smarthire-device-id", existing);
    }
    setId(existing);
  }, []);
  return id;
}

const readFile = (file: File) =>
  new Promise<{ text?: string; dataBase64?: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      reader.onload = () => resolve({ text: String(reader.result) });
      reader.readAsText(file);
    } else {
      reader.onload = () => resolve({ dataBase64: String(reader.result).split(",")[1] ?? "" });
      reader.readAsDataURL(file);
    }
  });

function SmartHire() {
  const inputRef = useRef<HTMLInputElement>(null);
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useServerFn(analyzeResume);
  const history = useServerFn(getAnalysisHistory);

  const historyQuery = useQuery({
    queryKey: ["analysis-history", deviceId],
    queryFn: () => history({ data: { deviceId } }),
    enabled: Boolean(deviceId),
  });

  const mutation = useMutation({
    mutationFn: async (target: File) => {
      const content = await readFile(target);
      return analyze({
        data: {
          deviceId,
          fileName: target.name,
          mimeType: target.type || "application/octet-stream",
          ...content,
        },
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setOpenJob(data.matches[0]?.id ?? null);
      queryClient.invalidateQueries({ queryKey: ["analysis-history", deviceId] });
    },
    onError: (err: Error) => setError(err.message || "Analysis failed. Please try again."),
  });

  const start = (target: File | null) => {
    if (!target) return;
    setError("");
    setResult(null);
    setFile(target);
    mutation.mutate(target);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const profile = result?.profile;
  const matches = result?.matches ?? [];
  const loading = mutation.isPending;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 h-14 border-b border-border bg-background/90 px-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#top" className="font-mono text-lg font-bold uppercase" aria-label="SmartHire home">
              SmartHire <span className="text-primary">/</span>{" "}
              <span className="font-normal text-muted-foreground">ML.v2</span>
            </a>
            <div className="hidden gap-6 text-sm font-medium md:flex">
              <a href="#dashboard" className="text-foreground">Dashboard</a>
              <a href="#matches" className="text-muted-foreground transition-colors hover:text-foreground">Job matches</a>
              <a href="#history" className="text-muted-foreground transition-colors hover:text-foreground">History</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded bg-muted px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground sm:flex">
              <span className={`size-1.5 rounded-full ${loading ? "animate-pulse bg-signal" : "bg-primary"}`} />
              {loading ? "Scoring" : "Engine ready"}
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
                start(event.dataTransfer.files[0] ?? null);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="sr-only"
                onChange={(event) => start(event.target.files?.[0] ?? null)}
              />
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
                {loading ? <LoaderCircle className="size-6 animate-spin" /> : file ? <FileText className="size-6" /> : <Upload className="size-6" />}
              </div>
              <p className="truncate text-sm font-semibold">{file?.name ?? "Upload your resume"}</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF or TXT · scored against every job in the database</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button className="primary-button" onClick={() => inputRef.current?.click()} disabled={loading}>
                  <Upload className="size-4" /> {file ? "Replace file" : "Choose file"}
                </button>
                {file && (
                  <button className="icon-button" onClick={reset} aria-label="Clear resume" title="Clear resume" disabled={loading}>
                    <RotateCcw className="size-4" />
                  </button>
                )}
              </div>
              {loading && (
                <div className="mt-5 space-y-2 text-left">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
                  </div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Extracting skills, experience, education, projects, certifications → embedding → scoring
                  </p>
                </div>
              )}
              {error && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-signal/10 p-3 text-left text-xs text-signal">
                  <AlertTriangle className="size-4 shrink-0" /> {error}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-7 animate-in delay-1">
            <SectionLabel>02 / Predicted category</SectionLabel>
            {loading ? (
              <SkeletonCard />
            ) : profile ? (
              <>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl font-bold">{profile.predictedCategory}</h2>
                    <span className="shrink-0 rounded bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">
                      {Math.round(profile.categoryConfidence)}% CONF
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.summary}</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="score-bar" style={{ width: `${Math.min(100, profile.categoryConfidence)}%` }} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ModelBadge>Semantic embeddings</ModelBadge>
                    <ModelBadge>Cosine similarity</ModelBadge>
                    <ModelBadge>Weighted scoring</ModelBadge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Metric value={`${profile.totalYearsExperience} yrs`} label="Experience" />
                  <Metric value={String(profile.skills.length)} label="Skills found" />
                  <Metric value={String(profile.projects.length)} label="Projects" />
                  <Metric value={String(profile.certifications.length)} label="Certifications" />
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">Extracted skills</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => <span key={skill} className="match-badge">{skill}</span>)}
                  </div>
                </div>
              </>
            ) : (
              <EmptyCard text="Upload a resume to extract skills, education, experience, projects, certifications and keywords." />
            )}
          </section>

          <section id="history" className="space-y-4 border-t border-border pt-7">
            <SectionLabel>
              <span className="inline-flex items-center gap-2"><History className="size-3" /> Analysis history</span>
            </SectionLabel>
            <div className="space-y-2">
              {(historyQuery.data ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No previous analyses yet.</p>
              )}
              {(historyQuery.data ?? []).map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold">{item.resumeName}</p>
                    <span className="font-mono text-[10px] text-primary">{item.topScore}%</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {item.category} · {item.topJob} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="col-span-12 space-y-8 lg:col-span-8 animate-in delay-2">
          <header id="matches" className="flex items-end justify-between gap-5">
            <div>
              <SectionLabel>03 / Job matching report</SectionLabel>
              <h1 className="mt-2 text-3xl font-bold">AI resume match scores</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Skills 40% · Experience 25% · Education 10% · Projects 10% · Certifications 5% · Keyword similarity 10%.
                Recalculated on every upload — nothing is hardcoded.
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Jobs scored</p>
              <p className="text-lg font-bold">{matches.length || "—"}</p>
            </div>
          </header>

          {result?.cached && (
            <p className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground">
              <Info className="size-4 text-primary" /> Identical resume detected — reused cached embeddings from{" "}
              {new Date(result.analyzedAt).toLocaleString()}.
            </p>
          )}

          <div className="space-y-3">
            {loading && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            {!loading && matches.length === 0 && (
              <EmptyCard text="Match percentages appear here after a resume is analyzed. Every score is computed from your document against the live job database." />
            )}
            {matches.map((job) => (
              <JobCard key={job.id} job={job} open={openJob === job.id} onToggle={() => setOpenJob(openJob === job.id ? null : job.id)} />
            ))}
          </div>

          <div className="flex gap-2 rounded-lg border border-border bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
            <Info className="size-4 shrink-0 text-primary" />
            <p>
              Scores are explainable recommendations, not hiring decisions. Resume parsing and semantic similarity run
              server-side; the weighted formula is deterministic and auditable per job.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function JobCard({ job, open, onToggle }: { job: JobMatch; open: boolean; onToggle: () => void }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 md:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex w-full shrink-0 items-center gap-3 sm:w-20 sm:flex-col sm:justify-center sm:gap-1">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Match</span>
          <span className="text-3xl font-bold text-primary">
            {job.score}
            <span className="text-sm font-normal">%</span>
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
            <div className="score-bar" style={{ width: `${job.score}%` }} />
          </div>
          <span className="font-mono text-[9px] uppercase text-muted-foreground">{job.confidence}% conf</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-bold">{job.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {job.location}
                <span>·</span>
                {job.salary}
              </p>
            </div>
            <button className="secondary-button self-start" onClick={onToggle} aria-expanded={open}>
              Details <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
            <SkillList label="Matching skills" skills={job.matchingSkills} type="match" />
            <SkillList label="Missing skills" skills={job.missingSkills} type="gap" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InsightList title="Strengths" items={job.strengths} icon={<Check className="size-3.5 shrink-0 text-primary" />} />
            <InsightList title="Weaknesses" items={job.weaknesses} icon={<X className="size-3.5 shrink-0 text-signal" />} />
          </div>

          {open && (
            <div className="mt-4 space-y-4 rounded-lg bg-muted p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">{job.description}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <ScoreRow label="Skills / 40" value={job.breakdown.skills} max={40} />
                <ScoreRow label="Experience / 25" value={job.breakdown.experience} max={25} />
                <ScoreRow label="Education / 10" value={job.breakdown.education} max={10} />
                <ScoreRow label="Projects / 10" value={job.breakdown.projects} max={10} />
                <ScoreRow label="Certifications / 5" value={job.breakdown.certifications} max={5} />
                <ScoreRow label="Keyword similarity / 10" value={job.breakdown.keywords} max={10} />
              </div>
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
                <TrendingUp className="size-3 text-primary" /> Cosine similarity {job.similarity}
              </p>
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
      <div className="mb-1 flex justify-between font-mono text-[9px] uppercase text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-background">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function InsightList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">{icon}<span>{item}</span></li>
        ))}
      </ul>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
      <Sparkles className="size-4 shrink-0 text-primary" />
      <p className="leading-relaxed">{text}</p>
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
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-lg font-bold">{value}</p>
      <p className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function SkillList({ label, skills, type }: { label: string; skills: string[]; type: "match" | "gap" }) {
  return (
    <div>
      <p className={`mb-2 font-mono text-[10px] uppercase ${type === "gap" ? "text-signal" : "text-muted-foreground"}`}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.length ? (
          skills.map((skill) => <span key={skill} className={type === "gap" ? "gap-badge" : "match-badge"}>{skill}</span>)
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </div>
    </div>
  );
}
