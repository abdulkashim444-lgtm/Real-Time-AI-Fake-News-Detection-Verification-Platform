import { extractLinguisticFeatures, type LinguisticFeatures } from "./text";

/**
 * Interpretable linear classifier over linguistic/stylometric features.
 *
 * IMPORTANT HONESTY NOTE:
 * These coefficients are hand-specified priors derived from published
 * stylometric findings on sensationalist writing — they are NOT the output of
 * a supervised training run on LIAR/FakeNewsNet, and no accuracy figure is
 * claimed for them. The model is deliberately linear so every prediction can
 * be decomposed into exact per-feature contributions (an exact analogue of
 * SHAP values for linear models). Swap `COEFFICIENTS`/`REFERENCE` with values
 * from a real training run to upgrade the model without touching any caller.
 */
export const MODEL_VERSION = "veritas-linguistic-linear-0.1.0";

type FeatureKey =
  | "sensationalHits"
  | "uppercaseRatio"
  | "exclamationRatio"
  | "attributionHits"
  | "quoteDensity"
  | "hedgeHits"
  | "lexicalDiversity"
  | "avgSentenceLength"
  | "lengthScore";

/** Positive coefficient pushes towards "questionable"; negative towards "credible style". */
const COEFFICIENTS: Record<FeatureKey, number> = {
  sensationalHits: 0.55,
  uppercaseRatio: 3.2,
  exclamationRatio: 0.85,
  attributionHits: -0.7,
  quoteDensity: -0.5,
  hedgeHits: 0.25,
  lexicalDiversity: -1.1,
  avgSentenceLength: -0.045,
  lengthScore: -0.6,
};

/** Expected value of each feature for a neutrally-written news article. */
const REFERENCE: Record<FeatureKey, number> = {
  sensationalHits: 0.4,
  uppercaseRatio: 0.05,
  exclamationRatio: 0.05,
  attributionHits: 1,
  quoteDensity: 1.5,
  hedgeHits: 1,
  lexicalDiversity: 0.55,
  avgSentenceLength: 21,
  lengthScore: 1,
};

const INTERCEPT = -0.15;

const LABELS: Record<FeatureKey, string> = {
  sensationalHits: "Sensational / clickbait vocabulary",
  uppercaseRatio: "Uppercase shouting ratio",
  exclamationRatio: "Exclamation density",
  attributionHits: "Explicit sourcing and attribution",
  quoteDensity: "Direct quotations per 500 words",
  hedgeHits: "Hedging language (allegedly, reportedly)",
  lexicalDiversity: "Lexical diversity",
  avgSentenceLength: "Average sentence length",
  lengthScore: "Article length sufficiency",
};

export interface FeatureContribution {
  feature: FeatureKey;
  label: string;
  value: number;
  contribution: number;
}

export interface MlPrediction {
  label: "QUESTIONABLE" | "NEUTRAL_STYLE";
  probability: number;
  contributions: FeatureContribution[];
  features: LinguisticFeatures;
  modelVersion: string;
  latencyMs: number;
}

function toModelFeatures(f: LinguisticFeatures): Record<FeatureKey, number> {
  const per500 = Math.max(f.wordCount, 1) / 500;
  return {
    sensationalHits: f.sensationalHits,
    uppercaseRatio: f.uppercaseRatio,
    exclamationRatio: f.exclamationRatio,
    attributionHits: f.attributionHits,
    quoteDensity: f.quoteCount / Math.max(per500, 0.2),
    hedgeHits: f.hedgeHits,
    lexicalDiversity: f.lexicalDiversity,
    avgSentenceLength: Math.min(f.avgSentenceLength, 60),
    lengthScore: Math.min(f.wordCount / 250, 2),
  };
}

export function predict(title: string, body: string): MlPrediction {
  const start = performance.now();
  const features = extractLinguisticFeatures(title, body);
  const x = toModelFeatures(features);
  const contributions: FeatureContribution[] = [];
  let logit = INTERCEPT;
  (Object.keys(COEFFICIENTS) as FeatureKey[]).forEach((key) => {
    const contribution = COEFFICIENTS[key] * (x[key] - REFERENCE[key]);
    logit += contribution;
    contributions.push({
      feature: key,
      label: LABELS[key],
      value: Number(x[key].toFixed(3)),
      contribution: Number(contribution.toFixed(4)),
    });
  });
  const probability = 1 / (1 + Math.exp(-logit));
  return {
    label: probability >= 0.5 ? "QUESTIONABLE" : "NEUTRAL_STYLE",
    probability: Number(probability.toFixed(4)),
    contributions: contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    features,
    modelVersion: MODEL_VERSION,
    latencyMs: Math.round(performance.now() - start),
  };
}