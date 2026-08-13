DROP POLICY IF EXISTS "Claims can be added" ON public.claims;
DROP POLICY IF EXISTS "Claims can be removed" ON public.claims;
DROP POLICY IF EXISTS "Evidence can be added" ON public.evidence;
DROP POLICY IF EXISTS "Evidence can be removed" ON public.evidence;
DROP POLICY IF EXISTS "Fact checks can be added" ON public.fact_checks;
DROP POLICY IF EXISTS "Fact checks can be removed" ON public.fact_checks;

REVOKE INSERT, UPDATE, DELETE ON public.analyses FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.claims FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.evidence FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.fact_checks FROM anon, authenticated;

GRANT SELECT ON public.analyses TO anon, authenticated;
GRANT SELECT ON public.claims TO anon, authenticated;
GRANT SELECT ON public.evidence TO anon, authenticated;
GRANT SELECT ON public.fact_checks TO anon, authenticated;

GRANT ALL ON public.analyses TO service_role;
GRANT ALL ON public.claims TO service_role;
GRANT ALL ON public.evidence TO service_role;
GRANT ALL ON public.fact_checks TO service_role;