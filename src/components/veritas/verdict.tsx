import { cn } from "@/lib/utils";

export const VERDICT_META: Record<
  string,
  { label: string; blurb: string; className: string; chip: string }
> = {
  VERIFIED: {
    label: "Verified",
    blurb: "Independent reporting and a published review both align with this story.",
    className: "text-verified",
    chip: "border-verified/40 bg-verified/10 text-verified",
  },
  LIKELY_TRUE: {
    label: "Likely true",
    blurb: "Evidence leans towards accurate, but this is not a proof of truth.",
    className: "text-likely-true",
    chip: "border-likely-true/40 bg-likely-true/10 text-likely-true",
  },
  MIXED: {
    label: "Mixed evidence",
    blurb: "Retrieved sources both support and dispute parts of this story.",
    className: "text-mixed",
    chip: "border-mixed/40 bg-mixed/10 text-mixed",
  },
  LIKELY_FALSE: {
    label: "Likely false",
    blurb: "Fact-checks or independent reporting contradict the main claims.",
    className: "text-likely-false",
    chip: "border-likely-false/40 bg-likely-false/10 text-likely-false",
  },
  UNVERIFIED: {
    label: "Unverified",
    blurb: "Some coverage was found, but not enough to reach a conclusion.",
    className: "text-unverified",
    chip: "border-unverified/40 bg-unverified/10 text-unverified",
  },
  INSUFFICIENT_EVIDENCE: {
    label: "Insufficient evidence",
    blurb: "No usable external evidence was retrieved. This is not a verdict of falsity.",
    className: "text-insufficient",
    chip: "border-insufficient/40 bg-insufficient/10 text-insufficient",
  },
};

export function VerdictChip({ verdict, className }: { verdict: string; className?: string }) {
  const meta = VERDICT_META[verdict] ?? VERDICT_META["UNVERIFIED"]!;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-wide uppercase",
        meta.chip,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function ScoreBar({
  label,
  value,
  tone = "primary",
  caption,
}: {
  label: string;
  value: number;
  tone?: "primary" | "warn" | "danger" | "good";
  caption?: string;
}) {
  const toneClass = {
    primary: "bg-primary",
    warn: "bg-mixed",
    danger: "bg-likely-false",
    good: "bg-verified",
  }[tone];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="stat-label">{label}</span>
        <span className="font-mono text-sm text-foreground">{Math.round(value * 100)}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-all", toneClass)} style={{ width: `${Math.min(100, Math.max(2, value * 100))}%` }} />
      </div>
      {caption ? <p className="mt-1.5 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}