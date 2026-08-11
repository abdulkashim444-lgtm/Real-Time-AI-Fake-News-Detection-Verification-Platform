/**
 * Deterministic text-processing layer.
 * Every function here is pure so that training-time and inference-time
 * feature extraction are guaranteed identical.
 */

const STOP_WORDS = new Set(
  ("a an and are as at be by for from has have he her his in is it its of on or that the to was were will with this these those they their you your we our i not but had who what when where which while after before over under more most been also said says say according report reported".split(
    " ",
  )),
);

const SENSATIONAL_WORDS = [
  "shocking","unbelievable","miracle","exposed","secret","conspiracy","hoax","bombshell","destroyed","slams",
  "you won't believe","breaking","urgent","banned","censored","cover-up","coverup","wake up","sheeple","truth they",
  "doctors hate","cure","instantly","100%","guaranteed","scandal","outrageous","insane","terrifying",
];

const HEDGE_WORDS = ["allegedly","reportedly","claims","claimed","suggests","may","might","could","appears","unconfirmed"];

const ATTRIBUTION_WORDS = ["according to","said in a statement","told reuters","spokesperson","researchers","study published"];

export interface LinguisticFeatures {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  uppercaseRatio: number;
  exclamationRatio: number;
  questionRatio: number;
  urlCount: number;
  digitRatio: number;
  quoteCount: number;
  sensationalHits: number;
  hedgeHits: number;
  attributionHits: number;
  lexicalDiversity: number;
}

export function cleanText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Very small heuristic language check — we only claim Latin-script/English support. */
export function detectLanguage(text: string): { code: string; confident: boolean } {
  const latin = (text.match(/[a-zA-Z]/g) ?? []).length;
  const total = (text.match(/\S/g) ?? []).length || 1;
  if (latin / total < 0.4) return { code: "unknown", confident: false };
  const words = tokenize(text);
  const englishHits = words.filter((w) => STOP_WORDS.has(w)).length;
  return { code: "en", confident: englishHits / Math.max(words.length, 1) > 0.05 };
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter((t) => t.length > 1);
}

export function contentTokens(text: string): string[] {
  return tokenize(text).filter((t) => !STOP_WORDS.has(t));
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'\d])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function extractLinguisticFeatures(title: string, body: string): LinguisticFeatures {
  const text = `${title}\n${body}`.trim();
  const words = tokenize(text);
  const sentences = splitSentences(body || title);
  const letters = text.replace(/[^A-Za-z]/g, "");
  const uppercase = text.replace(/[^A-Z]/g, "");
  const lower = text.toLowerCase();
  return {
    charCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length ? words.length / sentences.length : words.length,
    uppercaseRatio: letters.length ? uppercase.length / letters.length : 0,
    exclamationRatio: text.length ? (text.match(/!/g) ?? []).length / (text.length / 100) : 0,
    questionRatio: text.length ? (text.match(/\?/g) ?? []).length / (text.length / 100) : 0,
    urlCount: (text.match(/https?:\/\//g) ?? []).length,
    digitRatio: text.length ? (text.match(/\d/g) ?? []).length / text.length : 0,
    quoteCount: (text.match(/["“”]/g) ?? []).length / 2,
    sensationalHits: SENSATIONAL_WORDS.filter((w) => lower.includes(w)).length,
    hedgeHits: HEDGE_WORDS.filter((w) => lower.includes(w)).length,
    attributionHits: ATTRIBUTION_WORDS.filter((w) => lower.includes(w)).length,
    lexicalDiversity: words.length ? new Set(words).size / words.length : 0,
  };
}

/** Sparse TF vector (L2 normalised) over content unigrams + bigrams. */
export function vectorize(text: string): Map<string, number> {
  const tokens = contentTokens(text);
  const counts = new Map<string, number>();
  const bump = (k: string, w: number) => counts.set(k, (counts.get(k) ?? 0) + w);
  tokens.forEach((t, i) => {
    bump(t, 1);
    if (i + 1 < tokens.length) bump(`${t}_${tokens[i + 1]}`, 0.6);
  });
  let norm = 0;
  counts.forEach((v) => (norm += v * v));
  norm = Math.sqrt(norm) || 1;
  const out = new Map<string, number>();
  counts.forEach((v, k) => out.set(k, v / norm));
  return out;
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  small.forEach((v, k) => {
    const other = large.get(k);
    if (other) dot += v * other;
  });
  return Math.max(0, Math.min(1, dot));
}

/** Capitalised multi-word spans — a cheap stand-in for named entities. */
export function extractEntities(text: string): string[] {
  const matches = text.match(/\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,}){0,3})\b/g) ?? [];
  const seen = new Map<string, number>();
  for (const m of matches) {
    if (STOP_WORDS.has(m.toLowerCase())) continue;
    seen.set(m, (seen.get(m) ?? 0) + 1);
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => k);
}

export function extractKeywords(text: string, limit = 10): string[] {
  const counts = new Map<string, number>();
  for (const t of contentTokens(text)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([t]) => t.length > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}

export interface ExtractedClaim {
  text: string;
  type: "statistical" | "attributed" | "event" | "statement";
  importance: number;
}

/**
 * Claim extraction: score each sentence on checkability signals
 * (numbers, named entities, attribution verbs, position in article).
 */
export function extractClaims(title: string, body: string, limit = 5): ExtractedClaim[] {
  const sentences = [title, ...splitSentences(body)].filter((s) => s.split(/\s+/).length >= 5);
  const scored = sentences.map((sentence, index) => {
    const hasNumber = /\d/.test(sentence);
    const entities = extractEntities(sentence).length;
    const attributed = /(said|says|according to|announced|confirmed|reported|told)/i.test(sentence);
    const eventVerb = /(will|has|have|killed|won|lost|banned|approved|launched|died|arrested|signed)/i.test(sentence);
    let importance =
      (hasNumber ? 0.3 : 0) +
      Math.min(entities, 3) * 0.15 +
      (attributed ? 0.2 : 0) +
      (eventVerb ? 0.15 : 0) +
      Math.max(0, 0.2 - index * 0.02);
    importance = Math.min(1, Number(importance.toFixed(3)));
    const type: ExtractedClaim["type"] = hasNumber
      ? "statistical"
      : attributed
        ? "attributed"
        : eventVerb
          ? "event"
          : "statement";
    return { text: sentence.trim().slice(0, 400), type, importance };
  });
  return scored
    .filter((c) => c.importance > 0.15)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limit);
}

export function domainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}