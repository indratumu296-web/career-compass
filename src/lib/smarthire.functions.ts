import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  deviceId: z.string().min(6).max(80),
  fileName: z.string().min(1).max(200),
  mimeType: z.string().max(120).default("text/plain"),
  text: z.string().max(400000).optional(),
  dataBase64: z.string().max(8000000).optional(),
});

const csv = (value: string) =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

const jobSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(120),
  company: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  salary: z.string().min(1).max(60),
  description: z.string().min(20).max(20000),
  requiredSkills: z.string().max(2000),
  preferredSkills: z.string().max(2000).default(""),
  minYears: z.number().min(0).max(50),
  education: z.string().max(200).default(""),
  certifications: z.string().max(2000).default(""),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const {
      sha256,
      extractProfile,
      embed,
      loadJobs,
      cacheJobEmbedding,
      jobText,
      resumeText,
      scoreJob,
      generateInsights,
    } = await import("./smarthire.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = data.text ?? data.dataBase64;
    if (!payload) throw new Error("No resume content was provided.");
    const hash = await sha256(payload);

    const { data: cached } = await supabaseAdmin
      .from("resume_analyses")
      .select("profile,results,created_at")
      .eq("device_id", data.deviceId)
      .eq("resume_hash", hash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return {
        cached: true,
        analyzedAt: cached.created_at as string,
        profile: cached.profile as never,
        matches: cached.results as never,
      };
    }

    const profile = await extractProfile(
      data.text
        ? { kind: "text" as const, text: data.text }
        : { kind: "file" as const, fileName: data.fileName, mimeType: data.mimeType, dataBase64: data.dataBase64! },
    );

    const jobs = await loadJobs();
    if (!jobs.length) throw new Error("No jobs are available in the database.");

    const missing = jobs.filter((job) => !Array.isArray(job.embedding));
    if (missing.length) {
      const vectors = await embed(missing.map(jobText));
      await Promise.all(
        missing.map(async (job, i) => {
          job.embedding = vectors[i]!;
          await cacheJobEmbedding(job.id, vectors[i]!);
        }),
      );
    }

    const [resumeVector] = await embed([resumeText(profile)]);

    const cosine = (a: number[], b: number[]) => {
      let dot = 0;
      let na = 0;
      let nb = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!;
        na += a[i]! * a[i]!;
        nb += b[i]! * b[i]!;
      }
      return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
    };

    const scored = jobs.map((job) => {
      const similarity = cosine(resumeVector!, job.embedding ?? []);
      const result = scoreJob(profile, job, similarity);
      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        description: job.description,
        similarity: Math.round(similarity * 100) / 100,
        ...result,
      };
    });

    const insights = await generateInsights(
      profile,
      scored.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        score: j.score,
        matchingSkills: j.matchingSkills,
        missingSkills: j.missingSkills,
      })),
    );

    const matches = scored
      .map((job) => ({
        ...job,
        strengths: insights.get(job.id)?.strengths ?? [],
        weaknesses: insights.get(job.id)?.weaknesses ?? [],
      }))
      .sort((a, b) => b.score - a.score);

    const analyzedAt = new Date().toISOString();
    await supabaseAdmin.from("resume_analyses").insert({
      device_id: data.deviceId,
      resume_name: data.fileName,
      resume_hash: hash,
      profile: profile as never,
      results: matches as never,
    });

    return { cached: false, analyzedAt, profile, matches };
  });

export const getAnalysisHistory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ deviceId: z.string().min(6).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("resume_analyses")
      .select("id,resume_name,created_at,profile,results")
      .eq("device_id", data.deviceId)
      .order("created_at", { ascending: false })
      .limit(10);

    return (rows ?? []).map((row) => {
      const results = (row.results ?? []) as { score: number; title: string }[];
      const profile = (row.profile ?? {}) as { predictedCategory?: string };
      return {
        id: row.id as string,
        resumeName: row.resume_name as string,
        createdAt: row.created_at as string,
        category: profile.predictedCategory ?? "Unknown",
        topScore: results.length ? results[0]!.score : 0,
        topJob: results.length ? results[0]!.title : "—",
      };
    });
  });
