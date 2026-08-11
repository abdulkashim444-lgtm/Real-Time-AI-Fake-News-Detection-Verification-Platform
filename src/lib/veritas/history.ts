import { supabase } from "@/integrations/supabase/client";

export interface AnalysisRow {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  verdict: string;
  confidence: number;
  ml_label: string;
  ml_probability: number;
  evidence_score: number;
  contradiction_score: number;
  source_score: number;
  factcheck_match: boolean;
  processing_time_ms: number;
  ml_latency_ms: number;
  evidence_latency_ms: number;
  model_version: string;
  created_at: string;
}

export async function fetchAnalyses(limit = 200): Promise<AnalysisRow[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id,title,url,domain,verdict,confidence,ml_label,ml_probability,evidence_score,contradiction_score,source_score,factcheck_match,processing_time_ms,ml_latency_ms,evidence_latency_ms,model_version,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AnalysisRow[];
}

export async function deleteAnalysis(id: string) {
  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) throw error;
}

export const VERDICT_ORDER = [
  "VERIFIED",
  "LIKELY_TRUE",
  "MIXED",
  "LIKELY_FALSE",
  "UNVERIFIED",
  "INSUFFICIENT_EVIDENCE",
] as const;

export const VERDICT_COLOR: Record<string, string> = {
  VERIFIED: "var(--verified)",
  LIKELY_TRUE: "var(--likely-true)",
  MIXED: "var(--mixed)",
  LIKELY_FALSE: "var(--likely-false)",
  UNVERIFIED: "var(--unverified)",
  INSUFFICIENT_EVIDENCE: "var(--insufficient)",
};