CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  domain TEXT,
  language TEXT,
  verdict TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  ml_label TEXT NOT NULL,
  ml_probability NUMERIC NOT NULL,
  evidence_score NUMERIC NOT NULL DEFAULT 0,
  contradiction_score NUMERIC NOT NULL DEFAULT 0,
  source_score NUMERIC NOT NULL DEFAULT 0,
  factcheck_match BOOLEAN NOT NULL DEFAULT false,
  explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
  linguistic_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  service_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  ml_latency_ms INTEGER NOT NULL DEFAULT 0,
  evidence_latency_ms INTEGER NOT NULL DEFAULT 0,
  factcheck_latency_ms INTEGER NOT NULL DEFAULT 0,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'statement',
  importance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT,
  publisher TEXT,
  snippet TEXT,
  evidence_type TEXT NOT NULL DEFAULT 'neutral',
  similarity_score NUMERIC NOT NULL DEFAULT 0,
  credibility_score NUMERIC NOT NULL DEFAULT 0,
  rationale TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fact_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  publisher TEXT,
  rating TEXT,
  review_url TEXT,
  matched_claim TEXT,
  match_score NUMERIC NOT NULL DEFAULT 0,
  claim_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  publisher TEXT,
  country TEXT,
  category TEXT,
  credibility_score NUMERIC NOT NULL DEFAULT 50,
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  article_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.model_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_version TEXT NOT NULL,
  accuracy NUMERIC,
  precision_score NUMERIC,
  recall NUMERIC,
  f1 NUMERIC,
  roc_auc NUMERIC,
  confusion_matrix JSONB,
  dataset TEXT,
  sample_size INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_evidence_analysis ON public.evidence(analysis_id);
CREATE INDEX idx_claims_analysis ON public.claims(analysis_id);
CREATE INDEX idx_factchecks_analysis ON public.fact_checks(analysis_id);

GRANT SELECT, INSERT, DELETE ON public.analyses TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.claims TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.evidence TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.fact_checks TO anon, authenticated;
GRANT SELECT ON public.sources TO anon, authenticated;
GRANT SELECT ON public.model_metrics TO anon, authenticated;
GRANT ALL ON public.analyses, public.claims, public.evidence, public.fact_checks, public.sources, public.model_metrics TO service_role;

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public verification log is readable" ON public.analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can submit an analysis" ON public.analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove an analysis" ON public.analyses FOR DELETE USING (true);

CREATE POLICY "Claims are readable" ON public.claims FOR SELECT USING (true);
CREATE POLICY "Claims can be added" ON public.claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Claims can be removed" ON public.claims FOR DELETE USING (true);

CREATE POLICY "Evidence is readable" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Evidence can be added" ON public.evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Evidence can be removed" ON public.evidence FOR DELETE USING (true);

CREATE POLICY "Fact checks are readable" ON public.fact_checks FOR SELECT USING (true);
CREATE POLICY "Fact checks can be added" ON public.fact_checks FOR INSERT WITH CHECK (true);
CREATE POLICY "Fact checks can be removed" ON public.fact_checks FOR DELETE USING (true);

CREATE POLICY "Sources are readable" ON public.sources FOR SELECT USING (true);
CREATE POLICY "Model metrics are readable" ON public.model_metrics FOR SELECT USING (true);