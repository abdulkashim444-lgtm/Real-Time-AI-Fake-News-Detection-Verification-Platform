/**
 * Source credibility engine.
 *
 * Explicitly NOT a blacklist. A score is assembled from observable signals
 * (transparency, corroboration, publishing footprint) and every signal is
 * returned so the UI can justify the number. A low score means "we could not
 * establish credibility", never "this outlet is fake".
 */

export interface CredibilitySignal {
  label: string;
  status: "positive" | "warning" | "neutral";
  weight: number;
}

export interface SourceAssessment {
  domain: string | null;
  publisher: string | null;
  score: number;
  signals: CredibilitySignal[];
}

/** Domains with widely documented editorial standards, used only as a mild prior. */
const ESTABLISHED = new Set([
  "reuters.com","apnews.com","bbc.co.uk","bbc.com","npr.org","nytimes.com","washingtonpost.com",
  "theguardian.com","ft.com","wsj.com","bloomberg.com","aljazeera.com","economist.com","cnn.com",
  "nature.com","science.org","thehindu.com","indianexpress.com","timesofindia.indiatimes.com",
]);

export interface CredibilityInput {
  domain: string | null;
  publisher?: string | null;
  hasAuthor: boolean;
  corroboratingPublishers: number;
  hasHttps: boolean;
  hasPublishDate: boolean;
  evidenceRetrieved: boolean;
}

export function assessSource(input: CredibilityInput): SourceAssessment {
  const signals: CredibilitySignal[] = [];
  let score = 50;
  const add = (label: string, status: CredibilitySignal["status"], weight: number) => {
    signals.push({ label, status, weight });
    score += weight;
  };

  if (!input.domain) {
    add("No source URL supplied — publisher could not be identified", "warning", -8);
  } else if (ESTABLISHED.has(input.domain)) {
    add("Publisher with documented editorial standards", "positive", 20);
  } else {
    add("Publisher has no established verification record in this system", "neutral", 0);
  }

  if (input.hasAuthor) add("Author identified", "positive", 6);
  else add("No author attribution found", "warning", -6);

  if (input.hasPublishDate) add("Publication date available", "positive", 4);
  else add("No publication date found", "warning", -4);

  if (input.domain && !input.hasHttps) add("Source served without HTTPS", "warning", -5);

  if (input.corroboratingPublishers >= 3)
    add(`Reported independently by ${input.corroboratingPublishers} other publishers`, "positive", 16);
  else if (input.corroboratingPublishers > 0)
    add(`Limited corroboration (${input.corroboratingPublishers} other publisher(s))`, "neutral", 6);
  else if (input.evidenceRetrieved) add("No independent reports found for this story", "warning", -8);
  else add("Corroboration could not be checked — news retrieval unavailable", "neutral", 0);

  return {
    domain: input.domain,
    publisher: input.publisher ?? input.domain ?? null,
    score: Math.max(0, Math.min(100, Math.round(score))),
    signals,
  };
}

/** Per-evidence-item credibility, reused for evidence cards. */
export function evidenceCredibility(domain: string | null, hasDate: boolean): number {
  let score = 50;
  if (domain && ESTABLISHED.has(domain)) score += 25;
  if (hasDate) score += 8;
  if (domain && domain.split(".").length > 3) score -= 5;
  return Math.max(0, Math.min(100, score));
}