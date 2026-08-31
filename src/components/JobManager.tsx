import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { deleteJob, listJobs, saveJob } from "@/lib/smarthire.functions";

type Job = Awaited<ReturnType<typeof listJobs>>[number];

type Draft = {
  id?: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requiredSkills: string;
  preferredSkills: string;
  minYears: number;
  education: string;
  certifications: string;
};

const blank: Draft = {
  title: "",
  company: "",
  location: "",
  salary: "",
  description: "",
  requiredSkills: "",
  preferredSkills: "",
  minYears: 0,
  education: "",
  certifications: "",
};

const toDraft = (job: Job): Draft => ({
  id: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  salary: job.salary,
  description: job.description,
  requiredSkills: job.requiredSkills.join(", "),
  preferredSkills: job.preferredSkills.join(", "),
  minYears: job.minYears,
  education: job.education,
  certifications: job.certifications.join(", "),
});

export function JobManager({ onJobsChanged }: { onJobsChanged: () => void }) {
  const queryClient = useQueryClient();
  const list = useServerFn(listJobs);
  const save = useServerFn(saveJob);
  const remove = useServerFn(deleteJob);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  const jobsQuery = useQuery({ queryKey: ["jobs"], queryFn: () => list() });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    onJobsChanged();
  };

  const saveMutation = useMutation({
    mutationFn: (value: Draft) => save({ data: value }),
    onSuccess: () => {
      setDraft(null);
      setError("");
      invalidate();
    },
    onError: (err: Error) => setError(err.message || "Could not save the job."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message || "Could not delete the job."),
  });

  const jobs = jobsQuery.data ?? [];
  const busy = saveMutation.isPending || deleteMutation.isPending;

  return (
    <section id="jobs" className="space-y-4 border-t border-border pt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Briefcase className="size-3" /> Job database ({jobs.length})
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Add, edit or remove postings. Every resume is scored against this live set.
          </p>
        </div>
        <button className="primary-button shrink-0" onClick={() => { setError(""); setDraft({ ...blank }); }} disabled={busy}>
          <Plus className="size-4" /> Add job
        </button>
      </div>

      {error && <p className="rounded-lg bg-signal/10 p-3 text-xs text-signal">{error}</p>}

      {draft && (
        <JobForm
          draft={draft}
          setDraft={setDraft}
          busy={saveMutation.isPending}
          onCancel={() => setDraft(null)}
          onSave={() => saveMutation.mutate(draft)}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {jobsQuery.isLoading && <p className="text-xs text-muted-foreground">Loading jobs…</p>}
        {!jobsQuery.isLoading && jobs.length === 0 && (
          <p className="text-xs text-muted-foreground">No jobs yet — add one to start matching.</p>
        )}
        {jobs.map((job) => (
          <div key={job.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{job.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {job.company} · {job.location} · {job.salary}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  className="icon-button"
                  aria-label={`Edit ${job.title}`}
                  title="Edit job"
                  disabled={busy}
                  onClick={() => { setError(""); setDraft(toDraft(job)); }}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${job.title}`}
                  title="Delete job"
                  disabled={busy}
                  onClick={() => deleteMutation.mutate(job.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.requiredSkills.slice(0, 6).map((skill) => (
                <span key={skill} className="match-badge">{skill}</span>
              ))}
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase text-muted-foreground">
              Min {job.minYears} yrs · {job.education || "Any education"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function JobForm({
  draft,
  setDraft,
  busy,
  onCancel,
  onSave,
}: {
  draft: Draft;
  setDraft: (value: Draft) => void;
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });

  return (
    <form
      className="space-y-4 rounded-xl border border-primary/30 bg-card p-5 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{draft.id ? "Edit job posting" : "New job posting"}</p>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Close form">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Job title" value={draft.title} onChange={(v) => set("title", v)} required />
        <Field label="Company" value={draft.company} onChange={(v) => set("company", v)} required />
        <Field label="Location" value={draft.location} onChange={(v) => set("location", v)} required />
        <Field label="Salary range" value={draft.salary} onChange={(v) => set("salary", v)} required />
        <Field label="Education required" value={draft.education} onChange={(v) => set("education", v)} placeholder="Bachelor's degree" />
        <div>
          <label className="font-mono text-[10px] uppercase text-muted-foreground" htmlFor="minYears">
            Minimum years
          </label>
          <input
            id="minYears"
            type="number"
            min={0}
            max={50}
            value={draft.minYears}
            onChange={(event) => set("minYears", Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <Field label="Required skills (comma separated)" value={draft.requiredSkills} onChange={(v) => set("requiredSkills", v)} placeholder="Python, SQL, Airflow" required />
      <Field label="Preferred skills (comma separated)" value={draft.preferredSkills} onChange={(v) => set("preferredSkills", v)} placeholder="dbt, Snowflake" />
      <Field label="Certifications (comma separated)" value={draft.certifications} onChange={(v) => set("certifications", v)} placeholder="AWS Certified Data Engineer" />

      <div>
        <label className="font-mono text-[10px] uppercase text-muted-foreground" htmlFor="description">
          Job description
        </label>
        <textarea
          id="description"
          rows={5}
          required
          minLength={20}
          value={draft.description}
          onChange={(event) => set("description", event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary"
          placeholder="Responsibilities, requirements and context used for semantic matching."
        />
      </div>

      <div className="flex gap-2">
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Saving…" : draft.id ? "Save changes" : "Create job"}
        </button>
        <button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase text-muted-foreground">{label}</label>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
