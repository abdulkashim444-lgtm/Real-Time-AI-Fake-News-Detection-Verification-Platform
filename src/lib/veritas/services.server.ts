/**
 * External evidence providers. Server-only.
 * Every provider degrades gracefully: a missing key or a failing upstream
 * returns a status instead of throwing, so the analysis always completes.
 */
import { cleanText, domainFromUrl } from "./text";
import type { ServiceStatus } from "./types";

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  publisher: string | null;
  publishedAt: string | null;
  author: string | null;
}

export interface NewsSearchResult {
  articles: NewsArticle[];
  status: ServiceStatus["newsSearch"];
  message?: string;
}

export async function searchNews(query: string, pageSize = 10): Promise<NewsSearchResult> {
  const key = process.env["NEWS_API_KEY"];
  if (!key) return { articles: [], status: "unconfigured", message: "NEWS_API_KEY is not configured." };
  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query.slice(0, 480));
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("sortBy", "relevancy");
    url.searchParams.set("language", "en");
    const res = await fetchWithTimeout(url.toString(), { headers: { "X-Api-Key": key } });
    if (res.status === 429) return { articles: [], status: "rate_limited", message: "News provider rate limit reached." };
    if (!res.ok) return { articles: [], status: "error", message: `News provider responded ${res.status}.` };
    const json = (await res.json()) as {
      articles?: Array<{
        title?: string;
        description?: string;
        url?: string;
        publishedAt?: string;
        author?: string;
        source?: { name?: string };
      }>;
    };
    const articles = (json.articles ?? [])
      .filter((a) => a.title && a.url && a.title !== "[Removed]")
      .map((a) => ({
        title: cleanText(a.title!),
        description: a.description ? cleanText(a.description) : null,
        url: a.url!,
        publisher: a.source?.name ?? domainFromUrl(a.url) ?? null,
        publishedAt: a.publishedAt ?? null,
        author: a.author ?? null,
      }));
    return { articles, status: "ok" };
  } catch {
    return { articles: [], status: "error", message: "News provider request failed or timed out." };
  }
}

export interface RawFactCheck {
  claimText: string;
  matchedClaim: string | null;
  publisher: string | null;
  rating: string | null;
  reviewUrl: string | null;
  claimDate: string | null;
}

export interface FactCheckSearchResult {
  results: RawFactCheck[];
  status: ServiceStatus["factCheck"];
  message?: string;
}

export async function searchFactChecks(query: string): Promise<FactCheckSearchResult> {
  const key = process.env["GOOGLE_FACTCHECK_API_KEY"];
  if (!key)
    return { results: [], status: "unconfigured", message: "GOOGLE_FACTCHECK_API_KEY is not configured." };
  try {
    const url = new URL("https://factchecktools.googleapis.com/v1alpha1/claims:search");
    url.searchParams.set("query", query.slice(0, 300));
    url.searchParams.set("languageCode", "en");
    url.searchParams.set("pageSize", "8");
    url.searchParams.set("key", key);
    const res = await fetchWithTimeout(url.toString());
    if (res.status === 429) return { results: [], status: "rate_limited", message: "Fact-check API rate limit reached." };
    if (!res.ok) return { results: [], status: "error", message: `Fact-check API responded ${res.status}.` };
    const json = (await res.json()) as {
      claims?: Array<{
        text?: string;
        claimDate?: string;
        claimReview?: Array<{ publisher?: { name?: string }; textualRating?: string; url?: string }>;
      }>;
    };
    const results: RawFactCheck[] = [];
    for (const claim of json.claims ?? []) {
      const review = claim.claimReview?.[0];
      if (!review) continue;
      results.push({
        claimText: query,
        matchedClaim: claim.text ? cleanText(claim.text) : null,
        publisher: review.publisher?.name ?? null,
        rating: review.textualRating ?? null,
        reviewUrl: review.url ?? null,
        claimDate: claim.claimDate ?? null,
      });
    }
    return { results, status: "ok" };
  } catch {
    return { results: [], status: "error", message: "Fact-check request failed or timed out." };
  }
}

export interface ExtractedArticle {
  title: string;
  content: string;
  author: string | null;
  publishedAt: string | null;
  domain: string | null;
  status: "ok" | "failed";
  message?: string;
}

const BLOCKED_HOST = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|.*\.internal|.*\.local)$/i;

/** SSRF-hardened article fetch + extraction. */
export async function extractArticleFromUrl(rawUrl: string): Promise<ExtractedArticle> {
  const fail = (message: string): ExtractedArticle => ({
    title: "",
    content: "",
    author: null,
    publishedAt: null,
    domain: null,
    status: "failed",
    message,
  });

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return fail("The URL could not be parsed.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
    return fail("Only http and https URLs are supported.");
  const host = parsed.hostname;
  if (BLOCKED_HOST.test(host) || host.startsWith("[") || /^\d+\.\d+\.\d+\.\d+$/.test(host))
    return fail("Requests to private, local, or raw-IP addresses are blocked.");

  try {
    const res = await fetchWithTimeout(
      parsed.toString(),
      {
        redirect: "follow",
        headers: { "user-agent": "VeritasAI-Verifier/1.0 (+article extraction)", accept: "text/html" },
      },
      10000,
    );
    if (!res.ok) return fail(`The publisher responded ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html") && !type.includes("text")) return fail("The URL did not return an HTML document.");
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 3_000_000) return fail("The document exceeded the 3 MB size limit.");
    const html = new TextDecoder().decode(buffer);

    const meta = (name: string) => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
        "i",
      );
      const alt = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
        "i",
      );
      return html.match(re)?.[1] ?? html.match(alt)?.[1] ?? null;
    };

    const title =
      meta("og:title") ?? cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ?? "";
    const bodyMatch = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<body[\s\S]*?<\/body>/i)?.[0] ?? html;
    const paragraphs = [...bodyMatch.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => cleanText(m[1] ?? ""))
      .filter((p) => p.split(/\s+/).length > 6);
    const content = paragraphs.join("\n\n");
    if (content.split(/\s+/).length < 40)
      return fail("Readable article content could not be extracted from this page.");

    return {
      title: cleanText(title) || "Untitled article",
      content,
      author: meta("author") ?? meta("article:author"),
      publishedAt: meta("article:published_time") ?? meta("og:published_time"),
      domain: domainFromUrl(parsed.toString()),
      status: "ok",
    };
  } catch {
    return fail("The article could not be fetched (network error or timeout).");
  }
}