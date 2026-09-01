import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume, getAnalysisHistory } from "@/lib/smarthire.functions";
import type { AnalysisResult } from "@/lib/career-intel";

const STORAGE_KEY = "smarthire-last-analysis";

type Store = {
  deviceId: string;
  result: AnalysisResult | null;
  fileName: string;
  loading: boolean;
  error: string;
  analyze: (file: File) => void;
  reanalyze: () => void;
  clear: () => void;
  history: { id: string; resumeName: string; createdAt: string; category: string; topScore: number; topJob: string }[];
};

const AnalysisContext = createContext<Store | null>(null);

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

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const analyzeFn = useServerFn(analyzeResume);
  const historyFn = useServerFn(getAnalysisHistory);

  useEffect(() => {
    let existing = localStorage.getItem("smarthire-device-id");
    if (!existing) {
      existing = crypto.randomUUID();
      localStorage.setItem("smarthire-device-id", existing);
    }
    setDeviceId(existing);
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { result: AnalysisResult; fileName: string };
        setResult(parsed.result);
        setFileName(parsed.fileName);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const historyQuery = useQuery({
    queryKey: ["analysis-history", deviceId],
    queryFn: () => historyFn({ data: { deviceId } }),
    enabled: Boolean(deviceId),
  });

  const mutation = useMutation({
    mutationFn: async (target: File) => {
      const content = await readFile(target);
      return analyzeFn({
        data: {
          deviceId,
          fileName: target.name,
          mimeType: target.type || "application/octet-stream",
          ...content,
        },
      });
    },
    onSuccess: (data, target) => {
      setResult(data);
      setFileName(target.name);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ result: data, fileName: target.name }));
      } catch {
        /* payload too large for storage — keep it in memory only */
      }
      queryClient.invalidateQueries({ queryKey: ["analysis-history", deviceId] });
    },
    onError: (err: Error) => setError(err.message || "Analysis failed. Please try again."),
  });

  const analyze = useCallback(
    (target: File) => {
      setError("");
      setResult(null);
      setFile(target);
      setFileName(target.name);
      mutation.mutate(target);
    },
    [mutation],
  );

  const reanalyze = useCallback(() => {
    if (file) mutation.mutate(file);
  }, [file, mutation]);

  const clear = useCallback(() => {
    setResult(null);
    setFile(null);
    setFileName("");
    setError("");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<Store>(
    () => ({
      deviceId,
      result,
      fileName,
      loading: mutation.isPending,
      error,
      analyze,
      reanalyze,
      clear,
      history: historyQuery.data ?? [],
    }),
    [deviceId, result, fileName, mutation.isPending, error, analyze, reanalyze, clear, historyQuery.data],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return ctx;
}
