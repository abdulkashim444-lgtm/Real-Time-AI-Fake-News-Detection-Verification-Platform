import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Database, ScanSearch, ShieldAlert } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { fetchAnalyses, VERDICT_COLOR, VERDICT_ORDER } from "@/lib/veritas/history";
import { VerdictChip } from "@/components/veritas/verdict";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VeritasAI — Real-Time News Verification Dashboard" },
      {
        name: "description",
        content:
          "Analyst dashboard for evidence-weighted news verification: verdict distribution, confidence, latency and recent analyses.",
      },
      { property: "og:title", content: "VeritasAI — Real-Time News Verification Dashboard" },
      {
        property: "og:description",
        content: "Track verdicts, confidence and evidence coverage across every article you verify.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data = [], isLoading } = useQuery({ queryKey: ["analyses"], queryFn: () => fetchAnalyses() });

  const total = data.length;
  const avg = (pick: (r: (typeof data)[number]) => number) =>
    total ? data.reduce((s, r) => s + Number(pick(r)), 0) / total : 0;
  const counts = VERDICT_ORDER.map((v) => ({
    name: v,
    value: data.filter((r) => r.verdict === v).length,
  }));

  const stats = [
    { label: "Total analyses", value: total },
    { label: "Likely false", value: data.filter((r) => r.verdict === "LIKELY_FALSE").length },
    { label: "Likely true", value: data.filter((r) => r.verdict === "LIKELY_TRUE" || r.verdict === "VERIFIED").length },
    { label: "Unresolved", value: data.filter((r) => r.verdict === "UNVERIFIED" || r.verdict === "INSUFFICIENT_EVIDENCE").length },
    { label: "Avg confidence", value: `${Math.round(avg((r) => Number(r.confidence)) * 100)}%` },
    { label: "Avg total latency", value: `${Math.round(avg((r) => r.processing_time_ms))}ms` },
  ];

  return (
    <div className="space-y-8">
      <section className="panel flex flex-wrap items-center justify-between gap-6 p-8">
        <div className="max-w-2xl">
          <p className="stat-label">Verification console</p>
          <h1 className="mt-3 text-4xl font-semibold">
            Evidence-weighted verification, not a truth oracle
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            VeritasAI fuses an interpretable stylometric model with live news retrieval, published fact
            checks and source-credibility signals — and tells you exactly which of those were available.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/analyze">
                <ScanSearch className="size-4" /> Analyze an article
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/analytics">
                View analytics <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="h-52 w-full max-w-xs">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={counts.filter((c) => c.value > 0)} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} stroke="none">
                  {counts.filter((c) => c.value > 0).map((c) => (
                    <Cell key={c.name} fill={VERDICT_COLOR[c.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              <Database className="size-5" />
              No analyses yet
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5">
            <p className="stat-label">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{isLoading ? "—" : s.value}</p>
          </div>
        ))}
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent analyses</h2>
          <Link to="/history" className="text-sm text-primary hover:underline">
            Full history
          </Link>
        </div>
        {total === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="size-4" /> Nothing analysed yet — start with the Analyze page.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {data.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <VerdictChip verdict={r.verdict} />
                <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {Math.round(Number(r.confidence) * 100)}% · {r.processing_time_ms}ms ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
