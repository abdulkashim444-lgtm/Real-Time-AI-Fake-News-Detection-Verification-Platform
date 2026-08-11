import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteAnalysis, fetchAnalyses, VERDICT_ORDER } from "@/lib/veritas/history";
import { VerdictChip } from "@/components/veritas/verdict";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis history — VeritasAI" },
      { name: "description", content: "Search, filter and manage every article VeritasAI has verified." },
      { property: "og:title", content: "Analysis history — VeritasAI" },
      { property: "og:description", content: "A searchable log of verdicts, confidence and processing time." },
    ],
  }),
  component: HistoryPage,
});

const PAGE_SIZE = 12;

function HistoryPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["analyses"], queryFn: () => fetchAnalyses() });
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState<string>("ALL");
  const [sort, setSort] = useState<"newest" | "confidence" | "latency">("newest");
  const [page, setPage] = useState(0);

  const remove = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      toast.success("Analysis deleted.");
      void queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: () => toast.error("Could not delete this analysis."),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.filter(
      (r) =>
        (verdict === "ALL" || r.verdict === verdict) &&
        (!q || r.title.toLowerCase().includes(q) || (r.domain ?? "").toLowerCase().includes(q)),
    );
    return [...rows].sort((a, b) => {
      if (sort === "confidence") return Number(b.confidence) - Number(a.confidence);
      if (sort === "latency") return b.processing_time_ms - a.processing_time_ms;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data, query, verdict, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">History</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every stored verification, with the verdict, confidence and measured processing time.
        </p>
      </header>

      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search title or domain"
            className="pl-9"
          />
        </div>
        <select
          value={verdict}
          onChange={(e) => { setVerdict(e.target.value); setPage(0); }}
          className="h-9 rounded-md border border-input bg-secondary px-3 text-sm"
        >
          <option value="ALL">All verdicts</option>
          {VERDICT_ORDER.map((v) => (
            <option key={v} value={v}>{v.replace(/_/g, " ").toLowerCase()}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-9 rounded-md border border-input bg-secondary px-3 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="confidence">Highest confidence</option>
          <option value="latency">Slowest first</option>
        </select>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-3xl text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Date", "Article", "Verdict", "Confidence", "Time", "Model", ""].map((h) => (
                <th key={h} className="stat-label px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No analyses match these filters.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="max-w-md px-4 py-3">
                  <span className="line-clamp-2">{r.title}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">
                      {r.domain} <ExternalLink className="size-3" />
                    </a>
                  )}
                </td>
                <td className="px-4 py-3"><VerdictChip verdict={r.verdict} /></td>
                <td className="px-4 py-3 font-mono text-xs">{Math.round(Number(r.confidence) * 100)}%</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.processing_time_ms}ms</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.model_version}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)} aria-label="Delete analysis">
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {current + 1} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}