/**
 * Verification orchestrator — the full pipeline in one place.
 * Extract -> clean -> claims -> ML -> evidence retrieval -> fact checks ->
 * source credibility -> fusion -> persistence.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { predict, MODEL_VERSION, type MlPrediction } from "./classifier";
import { assessSource, type SourceAssessment } from "./credibility";
import { buildEvidence, scoreFactCheckMatch } from "./evidence";
import { fuse, type Explanation, type Verdict } from "./fusion";
import {
  extractArticleFromUrl,
  searchFactChecks,
  searchNews,
} from "./services.server";
import {
  cleanText,
  detectLanguage,
  domainFromUrl,
  extractClaims,
  extractEntities,
  extractKeywords,
  type ExtractedClaim,
} from "./text";
import type { EvidenceItem, FactCheckItem, ServiceStatus } from "./types";

export interface VerificationResult {
  analysisId: string | null;
  requestId: string;
  title: string;
  url: string | null;
  domain: string | null;
  language: string;
  verdict: Verdict;
  confidence: number;
  ml: MlPrediction;
  claims: ExtractedClaim[];
  evidence: EvidenceItem[];
  factChecks: FactCheckItem[];
  source: SourceAssessment;
  explanations: Explanation[];
  evidenceScore: number;
  contradictionScore: number;
  serviceStatus: ServiceStatus;
  serviceMessages: string[];
  timings: {
    extractionMs: number;
    mlMs: number;
    evidenceMs: number;
    factCheckMs: number;
    totalMs: number;
  };
  persisted: boolean;
  modelVersion: string;
}

export class PipelineError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function serverSupabase(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

export async function runVerification(input: {
  title?: string | undefined;
  content?: string | undefined;
  url?: string | undefined;
}): Promise<VerificationResult> {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const serviceMessages: string[] = [];
  const serviceStatus: ServiceStatus = { newsSearch: "unconfigured", factCheck: "unconfigured", urlFetch: "skipped" };

  let title = cleanText(input.title ?? "");
  let content = cleanText(input.content ?? "");
  let author: string | null = null;
  let publishedAt: string | null = null;
  const url = input.url?.trim() ? input.url.trim() : null;
  let domain = domainFromUrl(url);

  const extractionStart = performance.now();
  if (url && content.split(/\s+/).filter(Boolean).length < 40) {
    const extracted = await extractArticleFromUrl(url);
    if (extracted.status === "failed") {
      serviceStatus.urlFetch = "failed";
      throw new PipelineError(
        "ARTICLE_EXTRACTION_FAILED",
        extracted.message ?? "Unable to extract readable article content.",
      );
    }
    serviceStatus.urlFetch = "ok";
    title = title || extracted.title;
    content = extracted.content;
    author = extracted.author;
    publishedAt = extracted.publishedAt;
    domain = extracted.domain ?? domain;
  }
  const extractionMs = Math.round(performance.now() - extractionStart);

  if (!content || content.split(/\s+/).filter(Boolean).length < 8) {
    if (title) content = title;
    else throw new PipelineError("EMPTY_ARTICLE", "The submitted article contained no analysable text.");
  }
  if (!title) title = content.slice(0, 120);

  const language = detectLanguage(`${title} ${content}`);

  // --- Local model inference ---
  const ml = predict(title, content);

  // --- Claim extraction & query construction ---
  const claims = extractClaims(title, content, 4);
  const entities = extractEntities(`${title}. ${content.slice(0, 2000)}`);
  const keywords = extractKeywords(`${title} ${content.slice(0, 2000)}`, 8);
  const primaryQuery = [...entities.slice(0, 3), ...keywords.slice(0, 5)].join(" ") || title;

  // --- External evidence, fetched in parallel ---
  const evidenceStart = performance.now();
  const factCheckStart = performance.now();
  const factCheckQueries = (claims.length ? claims.slice(0, 2).map((c) => c.text) : [title]).map((t) =>
    t.split(/\s+/).slice(0, 25).join(" "),
  );

  const [newsResult, ...factCheckResults] = await Promise.all([
    searchNews(primaryQuery, 12),
    ...factCheckQueries.map((q) => searchFactChecks(q)),
  ]);
  const evidenceMs = Math.round(performance.now() - evidenceStart);
  const factCheckMs = Math.round(performance.now() - factCheckStart);

  serviceStatus.newsSearch = newsResult.status;
  if (newsResult.message) serviceMessages.push(newsResult.message);
  serviceStatus.factCheck = factCheckResults[0]?.status ?? "unconfigured";
  for (const r of factCheckResults) if (r.message && !serviceMessages.includes(r.message)) serviceMessages.push(r.message);

  const evidence: EvidenceItem[] = [];
  const evidenceSeen = new Set<string>();
  const claimTexts = claims.length ? claims.map((c) => c.text) : [title];
  for (const claimText of claimTexts) {
    for (const item of buildEvidence(claimText, newsResult.articles, domain)) {
      const key = item.url ?? item.title;
      if (evidenceSeen.has(key)) continue;
      evidenceSeen.add(key);
      evidence.push(item);
    }
  }
  evidence.sort((a, b) => b.similarityScore - a.similarityScore);

  const factChecks: FactCheckItem[] = [];
  factCheckResults.forEach((result, index) => {
    const claimText = factCheckQueries[index] ?? title;
    for (const raw of result.results) {
      const matchScore = scoreFactCheckMatch(claimText, raw.matchedClaim);
      if (matchScore < 0.12) continue;
      factChecks.push({
        claimText,
        publisher: raw.publisher,
        rating: raw.rating,
        reviewUrl: raw.reviewUrl,
        matchedClaim: raw.matchedClaim,
        matchScore,
        claimDate: raw.claimDate,
      });
    }
  });
  factChecks.sort((a, b) => b.matchScore - a.matchScore);

  const corroboratingPublishers = new Set(
    evidence.filter((e) => e.evidenceType === "supporting").map((e) => e.publisher),
  ).size;

  const source = assessSource({
    domain,
    hasAuthor: Boolean(author),
    corroboratingPublishers,
    hasHttps: url ? url.startsWith("https://") : true,
    hasPublishDate: Boolean(publishedAt),
    evidenceRetrieved: serviceStatus.newsSearch === "ok",
  });

  const fusion = fuse({
    ml,
    evidence: evidence.slice(0, 12),
    factChecks: factChecks.slice(0, 6),
    source,
    newsAvailable: serviceStatus.newsSearch === "ok",
    factCheckAvailable: serviceStatus.factCheck === "ok",
  });

  const totalMs = Math.round(performance.now() - startedAt);

  // --- Persistence (never fails the analysis) ---
  let analysisId: string | null = null;
  let persisted = false;
  try {
    const supabase = await serverSupabase();
    const { data: inserted, error } = await supabase
      .from("analyses")
      .insert({
        title: title.slice(0, 500),
        content: content.slice(0, 20000),
        url,
        domain,
        language: language.code,
        verdict: fusion.verdict,
        confidence: fusion.confidence,
        ml_label: ml.label,
        ml_probability: ml.probability,
        evidence_score: fusion.evidenceScore,
        contradiction_score: fusion.contradictionScore,
        source_score: source.score,
        factcheck_match: factChecks.length > 0,
        explanations: fusion.explanations,
        linguistic_features: ml.features,
        service_status: serviceStatus,
        ml_latency_ms: ml.latencyMs,
        evidence_latency_ms: evidenceMs,
        factcheck_latency_ms: factCheckMs,
        processing_time_ms: totalMs,
        model_version: MODEL_VERSION,
      })
      .select("id")
      .single();
    if (error) throw error;
    analysisId = inserted.id as string;
    persisted = true;

    const { data: claimRows } = await supabase
      .from("claims")
      .insert(
        claims.map((c) => ({
          analysis_id: analysisId,
          claim_text: c.text,
          claim_type: c.type,
          importance: c.importance,
        })),
      )
      .select("id, claim_text");

    const claimIdByText = new Map<string, string>();
    for (const row of claimRows ?? []) claimIdByText.set(row.claim_text as string, row.id as string);

    if (evidence.length) {
      await supabase.from("evidence").insert(
        evidence.slice(0, 12).map((e) => ({
          analysis_id: analysisId,
          claim_id: claimIdByText.get(e.claimText) ?? null,
          title: e.title,
          url: e.url,
          publisher: e.publisher,
          snippet: e.snippet,
          evidence_type: e.evidenceType,
          similarity_score: e.similarityScore,
          credibility_score: e.credibilityScore,
          rationale: e.rationale,
          published_at: e.publishedAt,
        })),
      );
    }
    if (factChecks.length) {
      await supabase.from("fact_checks").insert(
        factChecks.slice(0, 6).map((f) => ({
          analysis_id: analysisId,
          claim_id: claimIdByText.get(f.claimText) ?? null,
          publisher: f.publisher,
          rating: f.rating,
          review_url: f.reviewUrl,
          matched_claim: f.matchedClaim,
          match_score: f.matchScore,
          claim_date: f.claimDate,
        })),
      );
    }
  } catch (error) {
    console.error(`[${requestId}] persistence_failed`, error);
    serviceMessages.push("This analysis could not be saved to history.");
  }

  console.log(
    JSON.stringify({
      request_id: requestId,
      endpoint: "analyze",
      verdict: fusion.verdict,
      model_version: MODEL_VERSION,
      ml_ms: ml.latencyMs,
      evidence_ms: evidenceMs,
      total_ms: totalMs,
      services: serviceStatus,
      persisted,
    }),
  );

  return {
    analysisId,
    requestId,
    title,
    url,
    domain,
    language: language.code,
    verdict: fusion.verdict,
    confidence: fusion.confidence,
    ml,
    claims,
    evidence: evidence.slice(0, 12),
    factChecks: factChecks.slice(0, 6),
    source,
    explanations: fusion.explanations,
    evidenceScore: fusion.evidenceScore,
    contradictionScore: fusion.contradictionScore,
    serviceStatus,
    serviceMessages,
    timings: { extractionMs, mlMs: ml.latencyMs, evidenceMs, factCheckMs, totalMs },
    persisted,
    modelVersion: MODEL_VERSION,
  };
}