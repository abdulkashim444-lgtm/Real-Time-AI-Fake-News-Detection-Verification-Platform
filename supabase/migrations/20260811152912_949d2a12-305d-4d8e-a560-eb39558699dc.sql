DROP POLICY IF EXISTS "Anyone can remove an analysis" ON public.analyses;
DROP POLICY IF EXISTS "Anyone can submit an analysis" ON public.analyses;
DROP POLICY IF EXISTS "Anyone can remove claims" ON public.claims;
DROP POLICY IF EXISTS "Anyone can submit claims" ON public.claims;
DROP POLICY IF EXISTS "Anyone can remove evidence" ON public.evidence;
DROP POLICY IF EXISTS "Anyone can submit evidence" ON public.evidence;
DROP POLICY IF EXISTS "Anyone can remove fact checks" ON public.fact_checks;
DROP POLICY IF EXISTS "Anyone can submit fact checks" ON public.fact_checks;

REVOKE INSERT, UPDATE, DELETE ON public.analyses FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.claims FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.evidence FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.fact_checks FROM anon, authenticated;

GRANT ALL ON public.analyses TO service_role;
GRANT ALL ON public.claims TO service_role;
GRANT ALL ON public.evidence TO service_role;
GRANT ALL ON public.fact_checks TO service_role;