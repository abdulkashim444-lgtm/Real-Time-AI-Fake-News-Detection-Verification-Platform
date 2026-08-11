import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FileUp, Link2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { analyzeArticle, type VerificationResult } from "@/lib/analyze.functions";
import { AnalysisResult } from "@/components/veritas/AnalysisResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze an article — VeritasAI" },
      {
        name: "description",
        content:
          "Submit a URL, headline, article text or a .txt file and get an evidence-weighted credibility assessment.",
      },
      { property: "og:title", content: "Analyze an article — VeritasAI" },
      {
        property: "og:description",
        content: "Evidence retrieval, fact-check matching, source credibility and explainable scoring.",
      },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = useServerFn(analyzeArticle);
  const mutation = useMutation({
    mutationFn: () => analyze({ data: { url: url.trim(), title: title.trim(), content: content.trim() } }),
    onSuccess: (data) => {
      setResult(data);
      if (!data.persisted) toast.warning("Analysis completed but could not be saved to history.");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Analysis failed.";
      toast.error(message.replace(/^\[.*?\]\s*/, "").slice(0, 220));
    },
  });

  async function onFile(file: File) {
    if (file.size > 500_000) {
      toast.error("File is larger than 500 KB.");
      return;
    }
    const text = await file.text();
    setContent(text.slice(0, 60_000));
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    toast.success("File loaded into the article field.");
  }

  const disabled = mutation.isPending || (!url.trim() && content.trim().length < 40);

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold">Analyze news</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste a URL, a headline, or the full article. VeritasAI extracts checkable claims, retrieves
          independent coverage and published fact checks, scores the source, and explains every signal it used.
        </p>
      </header>

      <section className="panel space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="url" className="stat-label">Article URL</Label>
          <div className="relative">
            <Link2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://publisher.com/news/story"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The article is fetched server-side with private-network and size protections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="stat-label">or paste the text</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="stat-label">Headline or claim</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline or single claim to verify" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="stat-label">Article content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Paste the article body here…"
            className="font-sans"
          />
          <p className="text-xs text-muted-foreground">{content.trim().split(/\s+/).filter(Boolean).length} words</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => mutation.mutate()} disabled={disabled} size="lg">
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {mutation.isPending ? "Verifying…" : "Analyze article"}
          </Button>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            <FileUp className="size-4" /> Upload .txt
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = "";
            }}
          />
          {mutation.isPending && (
            <span className="font-mono text-xs text-muted-foreground">
              extracting claims · retrieving evidence · matching fact checks
            </span>
          )}
        </div>
      </section>

      {result && <AnalysisResult result={result} />}
    </div>
  );
}