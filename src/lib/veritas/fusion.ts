import type { MlPrediction } from "./classifier";
import type { EvidenceItem, FactCheckItem } from "./types";
import type { SourceAssessment } from "./credibility";

export type Verdict =
  | "VERIFIED"
  | "LIKELY_TRUE"
  | "MIXED"
  | "LIKELY_FALSE"
  | "UNVERIFIED"
  | "INSUFFICIENT_EVIDENCE";

/**
 * Documented fusion weights.
 * Published fact-check reviews dominate because they are human adjudications.
 * The stylometric model is deliberately the weakest signal: writing style is
 * not evidence of factual falsity.
 */
export const FUSION_WEIGHTS = {
  factCheck: 0.45,
  contradictingEvidence: 0.2,
  supportingEvidence: 0.2,
  sourceCredibility: 0.1,
  mlStyle: 0.05,
} as const;

export interface Explanation {
  text: string;
  signal: "fact_check" | "evidence" | "source" | "model" | "coverage";
  direction: "supports" | "contradicts" | "neutral";
}

const FALSE_RATINGS = /(false|pants on fire|fake|incorrect|debunk|misleading|no evidence|altered|hoax|scam)/i;
const TRUE_RATINGS = /(true|correct|accurate|verified)/i;

export interface FusionInput {
  ml: MlPrediction;
  evidence: EvidenceItem[];
  factChecks: FactCheckItem[];
  source: SourceAssessment;
  newsAvailable: boolean;
  factCheckAvailable: boolean;
}

export interface FusionResult {
  verdict: Verdict;
  confidence: number;
  evidenceScore: number;
  contradictionScore: number;
  explanations: Explanation[];
}

export function fuse(input: FusionInput): FusionResult {
  const { ml, evidence, factChecks, source } = input;
  const explanations: Explanation[] = [];

  const supporting = evidence.filter((e) => e.evidenceType === "supporting");
  const contradicting = evidence.filter((e) => e.evidenceType === "contradicting");

  const weightOf = (items: EvidenceItem[]) =>
    items.reduce((sum, e) => sum + e.similarityScore * (e.credibilityScore / 100), 0);

  const evidenceScore = Math.min(1, weightOf(supporting) / 2);
  const contradictionScore = Math.min(1, weightOf(contradicting) / 1.5);

  const falseChecks = factChecks.filter((f) => FALSE_RATINGS.test(f.rating ?? ""));
  const trueChecks = factChecks.filter(
    (f) => !FALSE_RATINGS.test(f.rating ?? "") && TRUE_RATINGS.test(f.rating ?? ""),
  );

  // Truthfulness score in [-1, 1]: positive means evidence leans true.
  let score = 0;
  let evidenceMass = 0;

  if (falseChecks.length) {
    const top = falseChecks[0]!;
    score -= FUSION_WEIGHTS.factCheck * Math.min(1, top.matchScore + 0.2);
    evidenceMass += FUSION_WEIGHTS.factCheck;
    explanations.push({
      text: `A published fact-check by ${top.publisher ?? "a reviewer"} rates a matching claim as "${top.rating}".`,
      signal: "fact_check",
      direction: "contradicts",
    });
  } else if (trueChecks.length) {
    const top = trueChecks[0]!;
    score += FUSION_WEIGHTS.factCheck * Math.min(1, top.matchScore + 0.2);
    evidenceMass += FUSION_WEIGHTS.factCheck;
    explanations.push({
      text: `A published fact-check by ${top.publisher ?? "a reviewer"} rates a matching claim as "${top.rating}".`,
      signal: "fact_check",
      direction: "supports",
    });
  } else if (input.factCheckAvailable) {
    explanations.push({
      text: "No matching published fact-check was found. Absence of a fact-check is not evidence that the claim is true or false.",
      signal: "fact_check",
      direction: "neutral",
    });
  } else {
    explanations.push({
      text: "The fact-check database was unavailable for this run, so that evidence source is missing from the verdict.",
      signal: "fact_check",
      direction: "neutral",
    });
  }

  if (supporting.length) {
    score += FUSION_WEIGHTS.supportingEvidence * evidenceScore;
    evidenceMass += FUSION_WEIGHTS.supportingEvidence * evidenceScore;
    const publishers = new Set(supporting.map((e) => e.publisher).filter(Boolean));
    explanations.push({
      text: `${supporting.length} corroborating report(s) from ${publishers.size} publisher(s) closely match the article's main claims.`,
      signal: "evidence",
      direction: "supports",
    });
  }

  if (contradicting.length) {
    score -= FUSION_WEIGHTS.contradictingEvidence * contradictionScore;
    evidenceMass += FUSION_WEIGHTS.contradictingEvidence * contradictionScore;
    explanations.push({
      text: `${contradicting.length} related report(s) use disputing or negating language about the same claims.`,
      signal: "evidence",
      direction: "contradicts",
    });
  }

  if (!evidence.length) {
    explanations.push({
      text: input.newsAvailable
        ? "No related news coverage was retrieved for the extracted claims."
        : "News retrieval was unavailable, so external corroboration could not be checked.",
      signal: "coverage",
      direction: "neutral",
    });
  }

  const sourceDelta = ((source.score - 50) / 50) * FUSION_WEIGHTS.sourceCredibility;
  score += sourceDelta;
  evidenceMass += Math.abs(sourceDelta);
  explanations.push({
    text: `Source credibility assessed at ${source.score}/100 from ${source.signals.length} observable signals.`,
    signal: "source",
    direction: source.score >= 60 ? "supports" : source.score <= 40 ? "contradicts" : "neutral",
  });

  score += (0.5 - ml.probability) * 2 * FUSION_WEIGHTS.mlStyle;
  const topFeature = ml.contributions[0];
  explanations.push({
    text:
      ml.label === "QUESTIONABLE"
        ? `Stylometric model flags writing patterns associated with unreliable reporting (strongest factor: ${topFeature?.label ?? "n/a"}). Style is a weak signal and cannot establish falsity.`
        : `Stylometric model finds writing patterns typical of conventional reporting (strongest factor: ${topFeature?.label ?? "n/a"}). Style alone cannot establish truth.`,
    signal: "model",
    direction: ml.label === "QUESTIONABLE" ? "contradicts" : "supports",
  });

  // Evidence sufficiency gates which verdict vocabulary is even allowed.
  const hasHardEvidence = factChecks.length > 0 || evidence.length >= 3;
  let verdict: Verdict;
  if (!hasHardEvidence) {
    verdict = evidence.length === 0 ? "INSUFFICIENT_EVIDENCE" : "UNVERIFIED";
  } else if (score <= -0.25) verdict = "LIKELY_FALSE";
  else if (score < -0.08) verdict = "MIXED";
  else if (score < 0.15) verdict = supporting.length && contradicting.length ? "MIXED" : "UNVERIFIED";
  else if (score < 0.32) verdict = "LIKELY_TRUE";
  else if (falseChecks.length) verdict = "MIXED";
  else verdict = trueChecks.length && supporting.length >= 2 ? "VERIFIED" : "LIKELY_TRUE";

  // Confidence reflects how much independent evidence was actually available.
  const confidence = Math.max(
    0.15,
    Math.min(0.95, evidenceMass + Math.min(Math.abs(score) * 1.2, 0.35)),
  );

  return {
    verdict,
    confidence: Number(confidence.toFixed(3)),
    evidenceScore: Number(evidenceScore.toFixed(3)),
    contradictionScore: Number(contradictionScore.toFixed(3)),
    explanations,
  };
}