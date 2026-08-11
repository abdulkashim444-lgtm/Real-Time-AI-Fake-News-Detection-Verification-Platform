export interface EvidenceItem {
  claimText: string;
  title: string;
  url: string | null;
  publisher: string | null;
  snippet: string | null;
  evidenceType: "supporting" | "contradicting" | "neutral";
  similarityScore: number;
  credibilityScore: number;
  rationale: string;
  publishedAt: string | null;
}

export interface FactCheckItem {
  claimText: string;
  publisher: string | null;
  rating: string | null;
  reviewUrl: string | null;
  matchedClaim: string | null;
  matchScore: number;
  claimDate: string | null;
}

export interface ServiceStatus {
  newsSearch: "ok" | "unconfigured" | "error" | "rate_limited";
  factCheck: "ok" | "unconfigured" | "error" | "rate_limited";
  urlFetch: "ok" | "failed" | "skipped";
}