import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "google/gemini-3.7-flash";
const EMBED_MODEL = "openai/text-embedding-3-small";

export type ResumeSignals = {
  hasSummarySection: boolean;
  hasSkillsSection: boolean;
  hasExperienceSection: boolean;
  hasProjectsSection: boolean;
  hasCertificationsSection: boolean;
  hasEducationSection: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinks: boolean;
  usesStandardHeadings: boolean;
  measurableAchievements: number;
  strongActionVerbs: number;
  approxWordCount: number;
  riskyFormatting: boolean;
};

export type ResumeProfile = {
  candidateName: string;
  predictedCategory: string;
  categoryConfidence: number;
  totalYearsExperience: number;
  skills: string[];
  educationLevel: "none" | "diploma" | "bachelor" | "master" | "doctorate";
  educationField: string;
  projects: { name: string; summary: string; skills: string[] }[];
  certifications: string[];
  keywords: string[];
  summary: string;
  signals?: ResumeSignals;
};

export type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  min_years: number;
  education: string;
  certifications: string[];
  embedding: number[] | null;
  updated_at?: string;
};

export type JobMatch = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  score: number;
  confidence: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    projects: number;
    certifications: number;
    keywords: number;
  };
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
};

const WEIGHTS = {
  skills: 40,
  experience: 25,
  education: 10,
  projects: 10,
  certifications: 5,
  keywords: 10,
};

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project.");
  return key;
}

async function gateway(path: string, body: unknown) {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<any>;
}

export async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidateName: { type: "string" },
    predictedCategory: { type: "string" },
    categoryConfidence: { type: "number" },
    totalYearsExperience: { type: "number" },
    skills: { type: "array", items: { type: "string" } },
    educationLevel: { type: "string", enum: ["none", "diploma", "bachelor", "master", "doctorate"] },
    educationField: { type: "string" },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          summary: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
        },
        required: ["name", "summary", "skills"],
      },
    },
    certifications: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    signals: {
      type: "object",
      additionalProperties: false,
      properties: {
        hasSummarySection: { type: "boolean" },
        hasSkillsSection: { type: "boolean" },
        hasExperienceSection: { type: "boolean" },
        hasProjectsSection: { type: "boolean" },
        hasCertificationsSection: { type: "boolean" },
        hasEducationSection: { type: "boolean" },
        hasEmail: { type: "boolean" },
        hasPhone: { type: "boolean" },
        hasLinks: { type: "boolean" },
        usesStandardHeadings: { type: "boolean" },
        measurableAchievements: { type: "number" },
        strongActionVerbs: { type: "number" },
        approxWordCount: { type: "number" },
        riskyFormatting: { type: "boolean" },
      },
      required: [
        "hasSummarySection",
        "hasSkillsSection",
        "hasExperienceSection",
        "hasProjectsSection",
        "hasCertificationsSection",
        "hasEducationSection",
        "hasEmail",
        "hasPhone",
        "hasLinks",
        "usesStandardHeadings",
        "measurableAchievements",
        "strongActionVerbs",
        "approxWordCount",
        "riskyFormatting",
      ],
    },
  },
  required: [
    "candidateName",
    "predictedCategory",
    "categoryConfidence",
    "totalYearsExperience",
    "skills",
    "educationLevel",
    "educationField",
    "projects",
    "certifications",
    "keywords",
    "summary",
    "signals",
  ],
} as const;

export async function extractProfile(content:
  | { kind: "text"; text: string }
  | { kind: "file"; fileName: string; mimeType: string; dataBase64: string }): Promise<ResumeProfile> {
  const userContent =
    content.kind === "text"
      ? [{ type: "text", text: `Resume text:\n\n${content.text.slice(0, 120000)}` }]
      : [
          { type: "text", text: "Extract the structured profile from this resume document." },
          {
            type: "file",
            file: {
              filename: content.fileName,
              file_data: `data:${content.mimeType};base64,${content.dataBase64}`,
            },
          },
        ];

  const data = await gateway("/chat/completions", {
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a resume parser. Extract facts only from the document; never invent skills, certifications or experience. totalYearsExperience is the total professional years (use 0 for students). categoryConfidence is 0-100. keywords should list 20-40 distinctive domain terms found in the resume. signals must describe the document itself: which sections exist, whether contact details and links are present, whether headings are standard ATS headings, how many bullet points contain measurable results (numbers, %, currency), how many bullets start with a strong action verb, the approximate word count, and riskyFormatting=true when tables, columns, images or unusual symbols would confuse an ATS parser.",
      },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "resume_profile", strict: true, schema: EXTRACTION_SCHEMA },
    },
  });

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Could not read the resume. Try a text-based PDF or TXT file.");
  return JSON.parse(raw) as ResumeProfile;
}

export async function embed(inputs: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < inputs.length; i += 64) {
    const batch = inputs.slice(i, i + 64).map((t) => t.slice(0, 20000));
    const data = await gateway("/embeddings", { model: EMBED_MODEL, input: batch });
    const sorted = [...data.data].sort((a: any, b: any) => a.index - b.index);
    out.push(...sorted.map((d: any) => d.embedding as number[]));
  }
  return out;
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");

function skillHit(skill: string, pool: string[]) {
  const target = norm(skill);
  return pool.some((candidate) => {
    const c = norm(candidate);
    return c === target || (target.length > 3 && (c.includes(target) || target.includes(c)));
  });
}

const EDU_RANK: Record<string, number> = { none: 0, diploma: 1, bachelor: 2, master: 3, doctorate: 4 };

function requiredEduRank(text: string) {
  const t = text.toLowerCase();
  if (t.includes("phd") || t.includes("doctor")) return 4;
  if (t.includes("master") || t.includes("mba") || t.includes("m.tech")) return 3;
  if (t.includes("bachelor") || t.includes("b.tech") || t.includes("degree")) return 2;
  if (t.includes("diploma")) return 1;
  return 0;
}

export function jobText(job: JobRow) {
  return [
    job.title,
    job.company,
    job.description,
    `Required skills: ${job.required_skills.join(", ")}`,
    `Preferred skills: ${job.preferred_skills.join(", ")}`,
    `Education: ${job.education}`,
    `Certifications: ${job.certifications.join(", ")}`,
    `Minimum experience: ${job.min_years} years`,
  ].join("\n");
}

export function resumeText(profile: ResumeProfile) {
  return [
    `Category: ${profile.predictedCategory}`,
    profile.summary,
    `Skills: ${profile.skills.join(", ")}`,
    `Experience: ${profile.totalYearsExperience} years`,
    `Education: ${profile.educationLevel} in ${profile.educationField}`,
    `Certifications: ${profile.certifications.join(", ")}`,
    `Projects: ${profile.projects.map((p) => `${p.name}: ${p.summary} (${p.skills.join(", ")})`).join(" | ")}`,
    `Keywords: ${profile.keywords.join(", ")}`,
  ].join("\n");
}

export function scoreJob(profile: ResumeProfile, job: JobRow, similarity: number) {
  const resumeSkills = [...profile.skills, ...profile.projects.flatMap((p) => p.skills)];
  const matchingSkills = job.required_skills.filter((s) => skillHit(s, resumeSkills));
  const matchingPreferred = job.preferred_skills.filter((s) => skillHit(s, resumeSkills));
  const missingSkills = [
    ...job.required_skills.filter((s) => !skillHit(s, resumeSkills)),
    ...job.preferred_skills.filter((s) => !skillHit(s, resumeSkills)),
  ];

  const requiredRatio = job.required_skills.length ? matchingSkills.length / job.required_skills.length : 0;
  const preferredRatio = job.preferred_skills.length ? matchingPreferred.length / job.preferred_skills.length : 0;
  const skills = Math.min(1, requiredRatio * 0.8 + preferredRatio * 0.2 + (requiredRatio === 1 ? 0.1 : 0));

  const experience = job.min_years <= 0
    ? profile.totalYearsExperience > 0 ? 1 : 0.8
    : Math.min(1, profile.totalYearsExperience / job.min_years);

  const need = requiredEduRank(job.education);
  const have = EDU_RANK[profile.educationLevel] ?? 0;
  const education = need === 0 ? 1 : Math.max(0, Math.min(1, 1 - (need - have) * 0.35));

  const projectPool = profile.projects.flatMap((p) => [p.name, p.summary, ...p.skills]);
  const projectSignals = job.required_skills.filter((s) => skillHit(s, projectPool)).length;
  const projects = profile.projects.length === 0
    ? 0
    : Math.min(1, 0.4 + (job.required_skills.length ? projectSignals / job.required_skills.length : 0) * 0.6);

  const certifications = job.certifications.length
    ? job.certifications.filter((c) => skillHit(c, profile.certifications)).length / job.certifications.length
    : profile.certifications.length > 0
      ? 1
      : 0.5;

  const keywords = Math.max(0, Math.min(1, (similarity - 0.15) / 0.7));

  const breakdown = {
    skills: skills * WEIGHTS.skills,
    experience: experience * WEIGHTS.experience,
    education: education * WEIGHTS.education,
    projects: projects * WEIGHTS.projects,
    certifications: certifications * WEIGHTS.certifications,
    keywords: keywords * WEIGHTS.keywords,
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const evidence =
    (profile.skills.length >= 5 ? 0.3 : 0.15) +
    (profile.projects.length > 0 ? 0.2 : 0) +
    (profile.totalYearsExperience > 0 ? 0.2 : 0.05) +
    Math.min(0.3, Math.max(0, similarity) * 0.4);

  return {
    breakdown: Object.fromEntries(
      Object.entries(breakdown).map(([k, v]) => [k, Math.round(v * 10) / 10]),
    ) as JobMatch["breakdown"],
    score: Math.round(score),
    confidence: Math.round(Math.min(0.98, evidence) * 100),
    matchingSkills: [...matchingSkills, ...matchingPreferred],
    missingSkills,
  };
}

export async function generateInsights(
  profile: ResumeProfile,
  scored: { id: string; title: string; company: string; score: number; matchingSkills: string[]; missingSkills: string[] }[],
) {
  const data = await gateway("/chat/completions", {
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a hiring analyst. For each job, write 2 concise strengths and 2 concise weaknesses for this candidate, grounded strictly in the provided data. Max 12 words each. Return JSON.",
      },
      {
        role: "user",
        content: JSON.stringify({
          candidate: {
            category: profile.predictedCategory,
            years: profile.totalYearsExperience,
            education: `${profile.educationLevel} ${profile.educationField}`,
            skills: profile.skills,
            certifications: profile.certifications,
            projects: profile.projects.map((p) => p.name),
          },
          jobs: scored,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "job_insights",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                },
                required: ["id", "strengths", "weaknesses"],
              },
            },
          },
          required: ["items"],
        },
      },
    },
  });

  const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? '{"items":[]}');
  const map = new Map<string, { strengths: string[]; weaknesses: string[] }>();
  for (const item of parsed.items ?? []) map.set(item.id, { strengths: item.strengths, weaknesses: item.weaknesses });
  return map;
}

export async function loadJobs(): Promise<JobRow[]> {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("id,title,company,location,salary,description,required_skills,preferred_skills,min_years,education,certifications,embedding,updated_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as JobRow[];
}

/** Fingerprint of the live job set, so edited/added/removed jobs invalidate cached analyses. */
export async function jobsSignature(jobs: JobRow[]) {
  const raw = jobs
    .map((j) => `${j.id}:${j.updated_at ?? ""}`)
    .sort()
    .join("|");
  return sha256(raw);
}

export async function cacheJobEmbedding(id: string, embedding: number[]) {
  await supabaseAdmin.from("jobs").update({ embedding: embedding as never }).eq("id", id);
}

/* ------------------------------------------------------------------ */
/* Resume quality + ATS compatibility (deterministic, rule-based)      */
/* ------------------------------------------------------------------ */

export type Suggestion = { title: string; detail: string; severity: "high" | "medium" | "low" };

export type ResumeAudit = {
  qualityScore: number;
  atsScore: number;
  employabilityScore: number;
  qualityFactors: { label: string; score: number; max: number; note: string }[];
  atsFactors: { label: string; score: number; max: number; note: string }[];
  suggestions: Suggestion[];
};

const DEFAULT_SIGNALS: ResumeSignals = {
  hasSummarySection: false,
  hasSkillsSection: true,
  hasExperienceSection: true,
  hasProjectsSection: false,
  hasCertificationsSection: false,
  hasEducationSection: true,
  hasEmail: false,
  hasPhone: false,
  hasLinks: false,
  usesStandardHeadings: true,
  measurableAchievements: 0,
  strongActionVerbs: 0,
  approxWordCount: 500,
  riskyFormatting: false,
};

export function auditResume(profile: ResumeProfile, topMatches: JobMatch[]): ResumeAudit {
  const s = { ...DEFAULT_SIGNALS, ...(profile.signals ?? {}) };
  const suggestions: Suggestion[] = [];

  const cap = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)));

  const skillScore = cap((Math.min(profile.skills.length, 15) / 15) * 20, 20);
  const projectScore = cap(Math.min(profile.projects.length, 3) * 5, 15);
  const achievementScore = cap(Math.min(s.measurableAchievements, 6) * 2.5, 15);
  const verbScore = cap(Math.min(s.strongActionVerbs, 8) * 1.5, 12);
  const summaryScore = s.hasSummarySection ? 10 : 0;
  const certScore = profile.certifications.length ? 8 : 0;
  const eduScore = s.hasEducationSection ? 8 : 0;
  const lengthScore =
    s.approxWordCount >= 350 && s.approxWordCount <= 900 ? 12 : s.approxWordCount < 350 ? 5 : 6;

  const qualityFactors = [
    { label: "Technical skill coverage", score: skillScore, max: 20, note: `${profile.skills.length} skills detected` },
    { label: "Projects", score: projectScore, max: 15, note: `${profile.projects.length} projects listed` },
    { label: "Measurable achievements", score: achievementScore, max: 15, note: `${s.measurableAchievements} quantified bullets` },
    { label: "Strong action verbs", score: verbScore, max: 12, note: `${s.strongActionVerbs} bullets with strong verbs` },
    { label: "Professional summary", score: summaryScore, max: 10, note: s.hasSummarySection ? "Present" : "Missing" },
    { label: "Certifications", score: certScore, max: 8, note: `${profile.certifications.length} certifications` },
    { label: "Education section", score: eduScore, max: 8, note: s.hasEducationSection ? "Present" : "Missing" },
    { label: "Length", score: lengthScore, max: 12, note: `~${s.approxWordCount} words` },
  ];
  const qualityScore = Math.round(qualityFactors.reduce((a, f) => a + f.score, 0));

  const best = topMatches[0];
  const jobKeywords = best ? [...best.matchingSkills, ...best.missingSkills] : [];
  const keywordCoverage = jobKeywords.length ? best!.matchingSkills.length / jobKeywords.length : 0.5;

  const atsFactors = [
    { label: "Job keyword coverage", score: cap(keywordCoverage * 30, 30), max: 30, note: best ? `${best.matchingSkills.length}/${jobKeywords.length} keywords for ${best.title}` : "Upload jobs to measure" },
    { label: "Required sections", score: cap(([s.hasSummarySection, s.hasSkillsSection, s.hasExperienceSection, s.hasEducationSection, s.hasProjectsSection].filter(Boolean).length / 5) * 20, 20), max: 20, note: "Summary, skills, experience, education, projects" },
    { label: "Standard headings", score: s.usesStandardHeadings ? 10 : 3, max: 10, note: s.usesStandardHeadings ? "ATS-readable headings" : "Non-standard headings detected" },
    { label: "Contact information", score: (s.hasEmail ? 6 : 0) + (s.hasPhone ? 4 : 0) + (s.hasLinks ? 5 : 0), max: 15, note: [s.hasEmail && "email", s.hasPhone && "phone", s.hasLinks && "links"].filter(Boolean).join(", ") || "No contact details found" },
    { label: "Skill density", score: cap((Math.min(profile.skills.length, 12) / 12) * 15, 15), max: 15, note: `${profile.skills.length} parsable skills` },
    { label: "Parsable formatting", score: s.riskyFormatting ? 2 : 10, max: 10, note: s.riskyFormatting ? "Tables/columns/graphics may break parsing" : "Clean single-column layout" },
  ];
  const atsScore = Math.round(atsFactors.reduce((a, f) => a + f.score, 0));

  const avgTop = topMatches.length
    ? topMatches.slice(0, 5).reduce((a, j) => a + j.score, 0) / Math.min(5, topMatches.length)
    : 0;
  const employabilityScore = Math.round(avgTop * 0.5 + qualityScore * 0.3 + atsScore * 0.2);

  if (!s.hasSummarySection)
    suggestions.push({ title: "Add a professional summary", detail: `Open with 2-3 lines positioning you as a ${profile.predictedCategory}, naming your top three skills and years of experience.`, severity: "high" });
  if (s.measurableAchievements < 3)
    suggestions.push({ title: "Add measurable results", detail: "Quantify at least three bullets — volumes processed, latency reduced, revenue influenced, or percentage improvements.", severity: "high" });
  if (profile.projects.length < 2)
    suggestions.push({ title: "Include two relevant projects", detail: "Recruiters and ATS both reward a projects section; describe the stack, your role and the outcome.", severity: "high" });
  if (profile.skills.length < 10)
    suggestions.push({ title: "Expand the skills section", detail: "List tools, languages and platforms explicitly — keyword matching is literal in most ATS systems.", severity: "medium" });
  if (!profile.certifications.length)
    suggestions.push({ title: "Add certifications", detail: "Even one recognised certification improves the certification component of every match score.", severity: "medium" });
  if (s.strongActionVerbs < 5)
    suggestions.push({ title: "Strengthen your action verbs", detail: "Replace 'responsible for' and 'worked on' with Built, Designed, Automated, Migrated, Reduced.", severity: "medium" });
  if (best && best.missingSkills.length)
    suggestions.push({ title: `Close the keyword gap for ${best.title}`, detail: `Add these where you genuinely have experience: ${best.missingSkills.slice(0, 5).join(", ")}.`, severity: "high" });
  if (s.riskyFormatting)
    suggestions.push({ title: "Simplify the layout", detail: "Remove tables, columns, text boxes and icons; use a single-column layout with standard headings.", severity: "medium" });
  if (s.approxWordCount > 900)
    suggestions.push({ title: "Trim the resume", detail: `~${s.approxWordCount} words is long. Cut older roles to one line each and target 500-800 words.`, severity: "low" });
  if (!s.hasEmail || !s.hasPhone)
    suggestions.push({ title: "Add complete contact details", detail: "Include a professional email, a phone number and a LinkedIn or portfolio link in the header.", severity: "low" });

  return { qualityScore, atsScore, employabilityScore, qualityFactors, atsFactors, suggestions };
}
