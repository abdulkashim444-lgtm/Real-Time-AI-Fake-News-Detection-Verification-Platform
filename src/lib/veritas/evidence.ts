import { cosine, vectorize } from "./text";
import { evidenceCredibility } from "./credibility";
import type { NewsArticle } from "./services.server";
import type { EvidenceItem } from "./types";
import { domainFromUrl } from "./text";

const NEGATION = /(false|debunk|myth|hoax|no evidence|denies|denied|refutes|refuted|misleading|fact.?check|not true|baseless|unfounded|rumou?r|misinformation|disput)/i;

/**
 * Rank retrieved news articles against a claim and label their stance.
 * Similarity is TF-based cosine over unigrams+bigrams; stance uses negation
 * cues. This is a retrieval signal, never a truth decision on its own.
 */
export function buildEvidence(
  claimText: string,
  articles: NewsArticle[],
  sourceDomain: string | null,
): EvidenceItem[] {
  const claimVec = vectorize(claimText);
  const seen = new Set<string>();
  const items: EvidenceItem[] = [];

  for (const article of articles) {
    const domain = domainFromUrl(article.url);
    const dedupeKey = `${domain}|${article.title.toLowerCase().slice(0, 60)}`;
    if (seen.has(dedupeKey)) continue;
    if (domain && sourceDomain && domain === sourceDomain) continue; // not independent
    seen.add(dedupeKey);

    const text = `${article.title}. ${article.description ?? ""}`;
    const similarity = cosine(claimVec, vectorize(text));
    if (similarity < 0.06) continue;

    const negates = NEGATION.test(text);
    const evidenceType: EvidenceItem["evidenceType"] =
      negates && similarity >= 0.12
        ? "contradicting"
        : similarity >= 0.22
          ? "supporting"
          : "neutral";

    items.push({
      claimText,
      title: article.title,
      url: article.url,
      publisher: article.publisher,
      snippet: article.description,
      evidenceType,
      similarityScore: Number(similarity.toFixed(3)),
      credibilityScore: evidenceCredibility(domain, Boolean(article.publishedAt)),
      rationale:
        evidenceType === "contradicting"
          ? "Covers the same claim while using disputing or debunking language."
          : evidenceType === "supporting"
            ? "Independently reports the same entities and facts as the claim."
            : "Topically related but does not directly address the specific claim.",
      publishedAt: article.publishedAt,
    });
  }

  return items
    .sort((a, b) => b.similarityScore * b.credibilityScore - a.similarityScore * a.credibilityScore)
    .slice(0, 12);
}

export function scoreFactCheckMatch(claimText: string, matchedClaim: string | null): number {
  if (!matchedClaim) return 0;
  return Number(cosine(vectorize(claimText), vectorize(matchedClaim)).toFixed(3));
}