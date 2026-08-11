import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Info,
  MinusCircle,
  ShieldQuestion,
  Timer,
  XCircle,
} from "lucide-react";
import type { VerificationResult } from "@/lib/analyze.functions";
import { ScoreBar, VERDICT_META } from "./verdict";
import { cn } from "@/lib/utils";

const EVIDENCE_STYLES = {
  supporting: { chip: "border-verified/40 bg-verified/10 text-verified", label: "Supporting" },
  contradicting: { chip: "border-likely-false/40 bg-likely-false/10 text-likely-false", label: "Contradicting" },
  neutral: { chip: "border-border bg-secondary text-muted-foreground", label: "Neutral" },
} as const;

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === "supports") return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verified" />;
  if (direction === "contradicts") return <XCircle className="mt-0.5 size-4 shrink-0 text-likely-false" />;
  return <MinusCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
}

export function AnalysisResult({ result }: { result: VerificationResult }) {
  const meta = VERDICT_META[result.verdict] ?? VERDICT_META["UNVERIFIED"]!;
  const supporting = result.evidence.filter((e) => e.evidenceType === "supporting");
  const contradicting = result.evidence.filter((e) => e.evidenceType === "contradicting");

  return (
    <div className="space-y-6">
      {result.serviceMessages.length > 0 && (
        <div className="panel flex gap-3 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-mixed" />
          <div className="space-y-1">
            <p className="font-medium">Some evidence sources were unavailable</p>
            {result.serviceMessages.map((m) => (
              <p key={m} className="text-muted-foreground">{m}</p>
            ))}
            <p className="text-muted-foreground">
              The verdict below was produced without those sources and is therefore lower-confidence.
            </p>
          </div>
        </div>
      )}

      <section className="panel p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <p className="stat-label">Verdict</p>
            <h2 className={cn("mt-2 text-4xl font-semibold", meta.className)}>{meta.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{meta.blurb}</p>
            <p className="mt-4 line-clamp-2 text-sm text-foreground/80">{result.title}</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <ScoreBar label="Overall confidence" value={result.confidence} caption="How much independent evidence backed this verdict" />
            <ScoreBar label="Evidence support" value={result.evidenceScore} tone="good" />
            <ScoreBar label="Contradicting evidence" value={result.contradictionScore} tone="danger" />
            <ScoreBar label="Source credibility" value={result.source.score / 100} tone="primary" />
            <ScoreBar
              label="Stylometric risk (weak signal)"
              value={result.ml.probability}
              tone="warn"
              caption={`Model ${result.modelVersion}`}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Timer className="size-3.5" />ML inference: {result.timings.mlMs}ms</span>
          <span>Extraction: {result.timings.extractionMs}ms</span>
          <span>Evidence retrieval: {result.timings.evidenceMs}ms</span>
          <span>Fact-check lookup: {result.timings.factCheckMs}ms</span>
          <span className="text-foreground">Total: {result.timings.totalMs}ms</span>
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Info className="size-4 text-primary" />Why this result?</h3>
        <ul className="mt-4 space-y-3">
          {result.explanations.map((e, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <DirectionIcon direction={e.direction} />
              <span className="text-foreground/85">{e.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-border pt-4">
          <p className="stat-label">Model feature contributions</p>
          <div className="mt-3 space-y-2">
            {result.ml.contributions.slice(0, 5).map((c) => (
              <div key={c.feature} className="flex items-center gap-3 text-sm">
                <span className="w-56 shrink-0 truncate text-muted-foreground">{c.label}</span>
                <div className="relative h-2 flex-1 rounded-full bg-secondary">
                  <div
                    className={cn(
                      "absolute top-0 h-full rounded-full",
                      c.contribution >= 0 ? "left-1/2 bg-likely-false" : "right-1/2 bg-verified",
                    )}
                    style={{ width: `${Math.min(50, Math.abs(c.contribution) * 40)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {c.contribution >= 0 ? "+" : ""}{c.contribution.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Exact contributions of an interpretable linear model. Positive values push towards "questionable
            writing style"; style is never treated as proof of falsity.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Existing fact checks</h3>
            <span className="font-mono text-xs text-muted-foreground">{result.factChecks.length} matched</span>
          </div>
          {result.factChecks.length === 0 ? (
            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldQuestion className="mt-0.5 size-4 shrink-0" />
              {result.serviceStatus.factCheck === "ok"
                ? "No matching fact-check found. This does not mean the claim is true."
                : "Fact-check service unavailable — this evidence source is missing from the verdict."}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {result.factChecks.map((f, i) => (
                <li key={i} className="rounded-lg border border-border bg-secondary/40 p-4">
                  <p className="text-sm text-foreground/90">{f.matchedClaim ?? f.claimText}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded border border-mixed/40 bg-mixed/10 px-2 py-0.5 font-mono uppercase text-mixed">
                      {f.rating ?? "unrated"}
                    </span>
                    <span className="text-muted-foreground">Reviewed by {f.publisher ?? "unknown reviewer"}</span>
                    <span className="font-mono text-muted-foreground">match {Math.round(f.matchScore * 100)}%</span>
                    {f.reviewUrl && (
                      <a href={f.reviewUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">
                        View review <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Evidence</h3>
              <span className="font-mono text-xs text-muted-foreground">
                {supporting.length} supporting · {contradicting.length} contradicting
              </span>
            </div>
            {result.evidence.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {result.serviceStatus.newsSearch === "ok"
                  ? "No related coverage was retrieved for the extracted claims."
                  : "News retrieval was unavailable, so no external corroboration could be gathered."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {result.evidence.map((e, i) => {
                  const style = EVIDENCE_STYLES[e.evidenceType];
                  return (
                    <li key={i} className="rounded-lg border border-border bg-secondary/30 p-4">
                      <span className={cn("inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide", style.chip)}>
                        {style.label}
                      </span>
                      <p className="mt-2 font-medium">{e.title}</p>
                      {e.snippet && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.snippet}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                        <span>{e.publisher ?? "unknown publisher"}</span>
                        {e.publishedAt && <span>{new Date(e.publishedAt).toLocaleDateString()}</span>}
                        <span>match {Math.round(e.similarityScore * 100)}%</span>
                        <span>credibility {e.credibilityScore}%</span>
                        {e.url && (
                          <a href={e.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">
                            Open source <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Why relevant: {e.rationale}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Gauge className="size-4 text-primary" />Source analysis</h3>
            <p className="mt-3 font-mono text-sm text-muted-foreground">{result.source.domain ?? "no source URL"}</p>
            <p className="mt-2 text-3xl font-semibold">{result.source.score}<span className="text-base text-muted-foreground"> / 100</span></p>
            <ul className="mt-4 space-y-2 text-sm">
              {result.source.signals.map((s, i) => (
                <li key={i} className="flex gap-2">
                  {s.status === "positive" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verified" />
                  ) : s.status === "warning" ? (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-mixed" />
                  ) : (
                    <MinusCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-foreground/85">{s.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              A low score means credibility could not be established — it is not a claim that the outlet is fake.
            </p>
          </section>

          <section className="panel p-6">
            <h3 className="text-lg font-semibold">Extracted claims</h3>
            <ul className="mt-4 space-y-3">
              {result.claims.map((c, i) => (
                <li key={i} className="text-sm">
                  <p className="text-foreground/85">{c.text}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {c.type} · checkability {Math.round(c.importance * 100)}%
                  </p>
                </li>
              ))}
              {result.claims.length === 0 && (
                <li className="text-sm text-muted-foreground">No individually checkable claims were detected.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}