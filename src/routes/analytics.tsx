import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchAnalyses, VERDICT_COLOR, VERDICT_ORDER } from "@/lib/veritas/history";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Model analytics — VeritasAI" },
      {
        name: "description",
        content: "Verdict distribution, confidence trends, latency breakdown and evidence coverage for VeritasAI.",
      },
      { property: "og:title", content: "Model analytics — VeritasAI" },
      { property: "og:description", content: "Operational metrics for the verification pipeline." },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

function AnalyticsPage() {
  const { data = [] } = useQuery({ queryKey: ["analyses"], queryFn: () => fetchAnalyses() });

  const verdicts = VERDICT_ORDER.map((v) => ({
    verdict: v.replace(/_/g, " ").toLowerCase(),
    key: v,
    count: data.filter((r) => r.verdict === v).length,
  }));

  const byDay = Object.entries(
    data.reduce<Record<string, { n: number; conf: number }>>((acc, r) => {
      const day = new Date(r.created_at).toISOString().slice(0, 10);
      const entry = acc[day] ?? { n: 0, conf: 0 };
      entry.n += 1;
      entry.conf += Number(r.confidence);
      acc[day] = entry;
      return acc;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day: day.slice(5), analyses: v.n, confidence: Math.round((v.conf / v.n) * 100) }));

  const n = data.length || 1;
  const latency = [
    { stage: "Model", ms: Math.round(data.reduce((s, r) => s + r.ml_latency_ms, 0) / n) },
    { stage: "Evidence", ms: Math.round(data.reduce((s, r) => s + r.evidence_latency_ms, 0) / n) },
    { stage: "Total", ms: Math.round(data.reduce((s, r) => s + r.processing_time_ms, 0) / n) },
  ];

  const coverage = [
    { label: "Fact-check matched", value: data.filter((r) => r.factcheck_match).length },
    { label: "Evidence found", value: data.filter((r) => Number(r.evidence_score) > 0).length },
    { label: "Contradiction flagged", value: data.filter((r) => Number(r.contradiction_score) > 0.2).length },
    { label: "Low-credibility source", value: data.filter((r) => Number(r.source_score) < 0.45).length },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Operational metrics across {data.length} stored analyses. These describe the pipeline's behaviour, not
          ground-truth accuracy — that requires a labelled evaluation set.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {coverage.map((c) => (
          <div key={c.label} className="panel p-5">
            <p className="stat-label">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{c.value}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {data.length ? Math.round((c.value / data.length) * 100) : 0}% of analyses
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-lg font-semibold">Verdict distribution</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verdicts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="verdict" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} angle={-20} height={50} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {verdicts.map((v) => (
                    <Cell key={v.key} fill={VERDICT_COLOR[v.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-lg font-semibold">Volume and average confidence</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="analyses" stroke="var(--primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="confidence" stroke="var(--likely-true)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-lg font-semibold">Average latency by stage</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latency} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={70} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="ms" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel space-y-3 p-6 text-sm text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">How the score is built</h2>
          <p>
            The final credibility score is a weighted fusion: published fact checks 45%, retrieved evidence
            agreement 40%, source credibility 10%, and stylometric model output 5%.
          </p>
          <p>
            The stylometric model is an interpretable linear classifier over sensationalism, hedging,
            attribution, punctuation and capitalisation features. Each factor's contribution is reported per
            analysis, so no verdict is a black box.
          </p>
          <p>
            When no independent coverage and no fact check are available, the pipeline returns
            <span className="font-mono"> insufficient evidence</span> instead of guessing from writing style
            alone.
          </p>
        </section>
      </div>
    </div>
  );
}