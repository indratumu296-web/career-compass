import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, FileText, History, Upload, RotateCcw, Wand2 } from "lucide-react";
import { useRef } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Card, LoadingState } from "@/components/intel-ui";
import { useAnalysis } from "@/lib/analysis-store";
import { SAMPLE_RESUME } from "@/lib/sample-resume";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Resume | SmartHire" },
      { name: "description", content: "Upload a PDF or TXT resume and SmartHire extracts skills, experience, education, projects and certifications." },
      { property: "og:title", content: "Upload Resume | SmartHire" },
      { property: "og:description", content: "Parse your resume and score it against every live job posting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { analyze, loading, error, fileName, result, clear, history } = useAnalysis();

  const start = (file: File | null) => {
    if (!file) return;
    analyze(file);
    navigate({ to: "/analysis" });
  };

  const demo = () => {
    const file = new File([SAMPLE_RESUME], "sample-data-analyst-resume.txt", { type: "text/plain" });
    start(file);
  };

  return (
    <div>
      <PageHeader
        icon={Upload}
        title="Upload resume"
        subtitle="PDF or TXT. Parsing, scoring and the skill-gap report all run from your document — no demo values."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div
            className="group rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              start(e.dataTransfer.files[0] ?? null);
            }}
          >
            <input ref={inputRef} type="file" accept=".pdf,.txt,.md" className="sr-only" onChange={(e) => start(e.target.files?.[0] ?? null)} />
            <div className="mx-auto grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
              {fileName ? <FileText className="size-6" /> : <Upload className="size-6" />}
            </div>
            <p className="mt-4 text-base font-semibold">{fileName || "Drag & drop your resume"}</p>
            <p className="mt-1 text-sm text-muted-foreground">or choose a file — PDF, TXT or Markdown</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button className="primary-button" onClick={() => inputRef.current?.click()} disabled={loading}>
                <Upload className="size-4" /> {fileName ? "Replace file" : "Choose file"}
              </button>
              <button className="secondary-button" onClick={demo} disabled={loading}>
                <Wand2 className="size-4" /> Try demo resume
              </button>
              {result && (
                <button className="icon-button" onClick={clear} aria-label="Clear analysis" title="Clear analysis">
                  <RotateCcw className="size-4" />
                </button>
              )}
            </div>
            {error && (
              <p className="mt-6 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-left text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0" /> {error}
              </p>
            )}
          </div>

          {loading && (
            <div className="mt-6">
              <LoadingState text="Extracting skills, experience, education, projects and certifications…" />
            </div>
          )}
        </div>

        <Card title="Analysis history" subtitle="Your last 10 analyses on this device.">
          <div className="space-y-2">
            {history.length === 0 && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <History className="size-3.5" /> No previous analyses yet.
              </p>
            )}
            {history.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold">{item.resumeName}</p>
                  <Badge tone="primary">{item.topScore}%</Badge>
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {item.category} · {item.topJob}
                </p>
                <p className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
