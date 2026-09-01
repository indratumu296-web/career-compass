import type { analyzeResume } from "./smarthire.functions";

export type AnalysisResult = Awaited<ReturnType<typeof analyzeResume>>;
export type JobMatch = AnalysisResult["matches"][number];
export type ResumeProfile = AnalysisResult["profile"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");

export function hasSkill(skill: string, pool: string[]) {
  const t = norm(skill);
  return pool.some((c) => {
    const n = norm(c);
    return n === t || (t.length > 3 && (n.includes(t) || t.includes(n)));
  });
}

/* ---------------- Explainability ---------------- */

export type Explanation = { reasons: string[]; gaps: string[] };

export function explainMatch(profile: ResumeProfile, job: JobMatch): Explanation {
  const reasons: string[] = [];
  const gaps: string[] = [];

  if (job.matchingSkills.length)
    reasons.push(`${job.matchingSkills.length} matching skills (${job.matchingSkills.slice(0, 4).join(", ")})`);
  const minYears = job.minYears ?? 0;
  if (profile.totalYearsExperience >= minYears)
    reasons.push(
      minYears > 0
        ? `Experience level fits — ${profile.totalYearsExperience} yrs vs ${minYears}+ required`
        : `Open to your experience level (${profile.totalYearsExperience} yrs)`,
    );
  else gaps.push(`${minYears - profile.totalYearsExperience} more years of experience typically expected`);

  if (job.breakdown.education >= 8) reasons.push("Education requirement satisfied");
  else if (job.educationRequirement) gaps.push(`Education preferred: ${job.educationRequirement}`);

  if (job.similarity >= 0.6) reasons.push(`Strong semantic similarity with the job description (${job.similarity})`);
  else if (job.similarity >= 0.4) reasons.push(`Moderate similarity with the job description (${job.similarity})`);
  else gaps.push("Resume language differs from this job description");

  if (job.breakdown.projects >= 6) reasons.push("Projects demonstrate the required stack");
  else gaps.push("Few projects evidencing the required stack");

  if (job.breakdown.certifications >= 4) reasons.push("Certification expectations met");

  for (const skill of job.missingSkills.slice(0, 6)) gaps.push(skill);
  return { reasons, gaps };
}

/* ---------------- Resume vs job comparison ---------------- */

export type CompareRow = {
  category: string;
  candidate: string;
  requirement: string;
  status: "Strong" | "Match" | "Partial" | "Missing";
};

export function comparisonRows(profile: ResumeProfile, job: JobMatch): CompareRow[] {
  const pool = [...profile.skills, ...profile.projects.flatMap((p) => p.skills)];
  const rows: CompareRow[] = [];
  const required = job.requiredSkills ?? [];
  const preferred = job.preferredSkills ?? [];

  for (const skill of required) {
    const inSkills = hasSkill(skill, profile.skills);
    const inProjects = hasSkill(skill, profile.projects.flatMap((p) => p.skills));
    rows.push({
      category: skill,
      candidate: inSkills && inProjects ? "Advanced" : inSkills ? "Listed" : inProjects ? "Project only" : "Not detected",
      requirement: "Required",
      status: inSkills && inProjects ? "Strong" : inSkills ? "Match" : inProjects ? "Partial" : "Missing",
    });
  }
  for (const skill of preferred) {
    const has = hasSkill(skill, pool);
    rows.push({
      category: skill,
      candidate: has ? "Listed" : "Not detected",
      requirement: "Preferred",
      status: has ? "Match" : "Partial",
    });
  }

  const minYears = job.minYears ?? 0;
  rows.push({
    category: "Experience",
    candidate: `${profile.totalYearsExperience} years`,
    requirement: minYears ? `${minYears}+ years` : "Open",
    status: profile.totalYearsExperience >= minYears ? "Match" : profile.totalYearsExperience >= minYears - 1 ? "Partial" : "Missing",
  });
  rows.push({
    category: "Education",
    candidate: `${profile.educationLevel} — ${profile.educationField || "n/a"}`,
    requirement: job.educationRequirement || "Not specified",
    status: job.breakdown.education >= 9 ? "Match" : job.breakdown.education >= 6 ? "Partial" : "Missing",
  });
  const certReq = job.certificationRequirements ?? [];
  rows.push({
    category: "Certifications",
    candidate: profile.certifications.length ? profile.certifications.join(", ") : "Not detected",
    requirement: certReq.length ? certReq.join(", ") : "None specified",
    status: job.breakdown.certifications >= 4 ? "Match" : job.breakdown.certifications >= 2 ? "Partial" : "Missing",
  });
  return rows;
}

/* ---------------- Skill-gap intelligence ---------------- */

export type SkillInsight = {
  skill: string;
  group: "strong" | "matching" | "partial" | "missing";
  importance: number; // 0-100, how often the market asks for it
  coverage: number; // 0-100, how well the resume covers it
  priority: "High" | "Medium" | "Low";
  demand: number; // jobs requiring it
};

export function skillInsights(profile: ResumeProfile, matches: JobMatch[]): SkillInsight[] {
  const demand = new Map<string, number>();
  const requiredCount = new Map<string, number>();
  for (const job of matches) {
    for (const skill of job.requiredSkills ?? []) {
      demand.set(skill, (demand.get(skill) ?? 0) + 1);
      requiredCount.set(skill, (requiredCount.get(skill) ?? 0) + 1);
    }
    for (const skill of job.preferredSkills ?? []) demand.set(skill, (demand.get(skill) ?? 0) + 0.5);
  }
  // Skills the candidate has that nobody asks for still count as strengths.
  for (const skill of profile.skills) if (!demand.has(skill)) demand.set(skill, 0.25);

  const total = matches.length || 1;
  const projectSkills = profile.projects.flatMap((p) => p.skills);

  const list: SkillInsight[] = [...demand.entries()].map(([skill, count]) => {
    const inSkills = hasSkill(skill, profile.skills);
    const inProjects = hasSkill(skill, projectSkills);
    const importance = Math.round(Math.min(100, (count / total) * 100));
    let group: SkillInsight["group"];
    let coverage: number;
    if (inSkills && inProjects) {
      group = "strong";
      coverage = 100;
    } else if (inSkills) {
      group = "matching";
      coverage = 75;
    } else if (inProjects) {
      group = "partial";
      coverage = 45;
    } else {
      group = "missing";
      coverage = 0;
    }
    const priority: SkillInsight["priority"] =
      group === "missing" && importance >= 50 ? "High" : group === "missing" || importance >= 60 ? "Medium" : "Low";
    return { skill, group, importance, coverage, priority, demand: Math.round(count) };
  });

  return list.sort((a, b) => b.importance - a.importance || a.coverage - b.coverage);
}

export function radarData(insights: SkillInsight[]) {
  return insights
    .filter((i) => i.importance > 0)
    .slice(0, 8)
    .map((i) => ({ skill: i.skill.length > 14 ? `${i.skill.slice(0, 13)}…` : i.skill, You: i.coverage, Market: i.importance }));
}

/* ---------------- Career paths ---------------- */

export type CareerPath = {
  role: string;
  match: number;
  openings: number;
  requiredSkills: string[];
  missingSkills: string[];
  prepWeeks: number;
  projects: string[];
};

export function careerPaths(matches: JobMatch[]): CareerPath[] {
  const groups = new Map<string, JobMatch[]>();
  for (const job of matches) {
    const key = job.title.replace(/^(senior|junior|lead|staff|principal)\s+/i, "").trim();
    groups.set(key, [...(groups.get(key) ?? []), job]);
  }
  return [...groups.entries()]
    .map(([role, jobs]) => {
      const match = Math.round(jobs.reduce((a, j) => a + j.score, 0) / jobs.length);
      const missing = [...new Set(jobs.flatMap((j) => j.missingSkills))];
      const required = [...new Set(jobs.flatMap((j) => j.requiredSkills ?? []))];
      return {
        role,
        match,
        openings: jobs.length,
        requiredSkills: required,
        missingSkills: missing,
        prepWeeks: Math.max(2, Math.min(24, missing.length * 2)),
        projects: projectIdeas(missing, role).map((p) => p.title),
      };
    })
    .sort((a, b) => b.match - a.match);
}

/* ---------------- Learning roadmap ---------------- */

export type RoadmapWeek = {
  week: number;
  focus: string;
  importance: "High" | "Medium" | "Low";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  topics: string[];
  practiceProject: string;
  certification: string;
};

const DIFFICULTY: Record<string, RoadmapWeek["difficulty"]> = {
  sql: "Intermediate",
  python: "Intermediate",
  excel: "Beginner",
  git: "Beginner",
  tableau: "Beginner",
  "power bi": "Beginner",
  spark: "Advanced",
  kubernetes: "Advanced",
  kafka: "Advanced",
  terraform: "Advanced",
  statistics: "Advanced",
  "machine learning": "Advanced",
};

function difficultyFor(skill: string): RoadmapWeek["difficulty"] {
  const key = Object.keys(DIFFICULTY).find((k) => norm(skill).includes(norm(k)));
  return key ? DIFFICULTY[key]! : "Intermediate";
}

export function roadmap(insights: SkillInsight[], category: string): RoadmapWeek[] {
  const gaps = insights.filter((i) => i.group === "missing" || i.group === "partial").slice(0, 3);
  const weeks: RoadmapWeek[] = gaps.map((gap, index) => {
    const difficulty = difficultyFor(gap.skill);
    return {
      week: index + 1,
      focus: gap.skill,
      importance: gap.priority,
      difficulty,
      duration: difficulty === "Advanced" ? "10-12 hrs/week" : difficulty === "Intermediate" ? "7-9 hrs/week" : "4-6 hrs/week",
      topics: topicsFor(gap.skill),
      practiceProject: `Ship a small ${gap.skill} exercise and publish the code with a short README.`,
      certification: certificationFor(gap.skill, category),
    };
  });

  weeks.push({
    week: weeks.length + 1,
    focus: "Portfolio project & resume rewrite",
    importance: "High",
    difficulty: "Intermediate",
    duration: "10-12 hrs/week",
    topics: ["End-to-end project", "README & documentation", "Quantified resume bullets", "ATS keyword pass"],
    practiceProject: projectIdeas(gaps.map((g) => g.skill), category)[0]?.title ?? "Capstone portfolio project",
    certification: "Publish on GitHub and link it from your resume header",
  });
  return weeks;
}

function topicsFor(skill: string): string[] {
  const s = norm(skill);
  if (s.includes("sql")) return ["Window functions", "CTEs", "Query tuning & indexes", "Analytical joins"];
  if (s.includes("tableau") || s.includes("powerbi") || s.includes("powerbi")) return ["Data modelling", "Calculated fields", "Dashboard design", "Publishing & sharing"];
  if (s.includes("python")) return ["Pandas transformations", "Testing", "Packaging", "Automation scripts"];
  if (s.includes("statistic")) return ["Distributions", "Hypothesis testing", "Regression", "A/B testing"];
  if (s.includes("spark")) return ["DataFrames API", "Partitioning", "Joins at scale", "Performance tuning"];
  if (s.includes("airflow")) return ["DAG authoring", "Sensors & operators", "Backfills", "Monitoring"];
  if (s.includes("aws") || s.includes("azure") || s.includes("gcp")) return ["Core compute & storage", "IAM", "Managed data services", "Cost basics"];
  if (s.includes("docker") || s.includes("kubernetes")) return ["Images & layers", "Compose", "Deployments", "Observability"];
  return [`${skill} fundamentals`, `${skill} in production workflows`, "Hands-on exercises", "Interview questions"];
}

function certificationFor(skill: string, category: string): string {
  const s = norm(skill);
  if (s.includes("aws")) return "AWS Certified Data Engineer / Solutions Architect Associate";
  if (s.includes("azure")) return "Microsoft Azure Data Fundamentals (DP-900)";
  if (s.includes("gcp")) return "Google Cloud Professional Data Engineer";
  if (s.includes("tableau")) return "Tableau Desktop Specialist";
  if (s.includes("powerbi")) return "Microsoft Power BI Data Analyst (PL-300)";
  if (s.includes("sql") || s.includes("statistic")) return "Vendor-neutral analytics certificate (e.g. Google Data Analytics)";
  if (s.includes("kubernetes")) return "Certified Kubernetes Application Developer";
  return `Any reputable ${category} specialisation covering ${skill}`;
}

/* ---------------- Portfolio project recommender ---------------- */

export type ProjectIdea = { title: string; skills: string[]; why: string; steps: string[] };

const PROJECT_LIBRARY: { match: string[]; idea: Omit<ProjectIdea, "why"> }[] = [
  {
    match: ["sql", "tableau", "powerbi", "excel", "visualization", "dashboard"],
    idea: {
      title: "E-commerce Sales Dashboard",
      skills: ["SQL", "Data cleaning", "Power BI / Tableau", "Data visualization"],
      steps: ["Load a public retail dataset", "Model fact and dimension tables", "Build KPI + cohort views", "Publish with a written insight summary"],
    },
  },
  {
    match: ["python", "pandas", "etl", "airflow", "pipeline", "spark", "kafka"],
    idea: {
      title: "Automated ETL Pipeline with Scheduling",
      skills: ["Python", "SQL", "Airflow", "Data quality tests"],
      steps: ["Ingest a public API on a schedule", "Normalise into a warehouse schema", "Add data-quality assertions", "Document lineage and failures"],
    },
  },
  {
    match: ["statistic", "machinelearning", "ml", "scikit", "model", "forecast"],
    idea: {
      title: "Churn Prediction & Experiment Analysis",
      skills: ["Statistics", "scikit-learn", "Feature engineering", "Model evaluation"],
      steps: ["Frame the business question", "Engineer features and baseline", "Compare models with cross-validation", "Report lift with confidence intervals"],
    },
  },
  {
    match: ["react", "typescript", "frontend", "next", "tailwind", "accessibility"],
    idea: {
      title: "Accessible Analytics Front-End",
      skills: ["React", "TypeScript", "Charting", "Accessibility (WCAG)"],
      steps: ["Design a dashboard spec", "Build reusable chart components", "Audit with Lighthouse and axe", "Document the design system"],
    },
  },
  {
    match: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "cloud"],
    idea: {
      title: "Cloud-Deployed Data Service",
      skills: ["Docker", "Cloud deployment", "Infrastructure as code", "Monitoring"],
      steps: ["Containerise a small API", "Provision infra as code", "Add CI/CD", "Wire up logs, metrics and alerts"],
    },
  },
];

export function projectIdeas(missingSkills: string[], category: string): ProjectIdea[] {
  const ideas: ProjectIdea[] = [];
  for (const entry of PROJECT_LIBRARY) {
    const covered = missingSkills.filter((skill) => entry.match.some((m) => norm(skill).includes(m) || m.includes(norm(skill))));
    if (covered.length)
      ideas.push({
        ...entry.idea,
        why: `Covers ${covered.length} skill${covered.length > 1 ? "s" : ""} missing from your target ${category} roles: ${covered.slice(0, 4).join(", ")}.`,
      });
  }
  if (!ideas.length)
    ideas.push({
      title: `${category} Capstone Project`,
      skills: missingSkills.slice(0, 4).length ? missingSkills.slice(0, 4) : ["End-to-end delivery"],
      why: "A single end-to-end project is the fastest way to evidence the skills recruiters screen for.",
      steps: ["Pick a real dataset or problem", "Ship an end-to-end solution", "Document decisions and trade-offs", "Publish and link it on your resume"],
    });
  return ideas;
}

/* ---------------- Resume tailoring (rule-based templates) ---------------- */

export type Tailoring = {
  keywords: string[];
  highlightSkills: string[];
  experiencePoints: string[];
  projectOrder: string[];
  summary: string;
  missingRequirements: string[];
};

export function tailorResume(profile: ResumeProfile, job: JobMatch): Tailoring {
  const keywords = [...new Set([...(job.requiredSkills ?? []), ...(job.preferredSkills ?? [])])];
  const highlight = job.matchingSkills.slice(0, 8);
  const pool = job.requiredSkills ?? [];
  const orderedProjects = [...profile.projects]
    .map((p) => ({ p, hits: pool.filter((s) => hasSkill(s, p.skills)).length }))
    .sort((a, b) => b.hits - a.hits)
    .map(({ p, hits }) => `${p.name} — evidences ${hits || 0} of ${pool.length} required skills`);

  const summary = [
    `${profile.educationLevel === "none" ? "" : `${profile.educationLevel.charAt(0).toUpperCase()}${profile.educationLevel.slice(1)}-qualified `}${job.title} candidate`,
    `with ${profile.totalYearsExperience} year${profile.totalYearsExperience === 1 ? "" : "s"} of experience across ${highlight.slice(0, 3).join(", ") || profile.skills.slice(0, 3).join(", ")}.`,
    `Delivered ${profile.projects.length || "several"} hands-on projects and targets ${job.title} roles at organisations like ${job.company}.`,
  ].join(" ");

  return {
    keywords,
    highlightSkills: highlight,
    experiencePoints: [
      `Lead each bullet with a verb + metric, e.g. "Reduced ${(job.requiredSkills ?? [])[0] ?? "pipeline"} runtime by 40%".`,
      `Mirror the job's phrasing: ${keywords.slice(0, 5).join(", ")}.`,
      `Place ${job.title}-relevant experience in the top third of page one.`,
      `Cut unrelated duties that don't support ${job.title}.`,
    ],
    projectOrder: orderedProjects.length ? orderedProjects : ["Add at least one project aligned to this role."],
    summary,
    missingRequirements: job.missingSkills,
  };
}

export const statusTone: Record<CompareRow["status"], string> = {
  Strong: "bg-success/10 text-success border-success/20",
  Match: "bg-primary/10 text-primary border-primary/20",
  Partial: "bg-warning/10 text-warning border-warning/20",
  Missing: "bg-destructive/10 text-destructive border-destructive/20",
};
