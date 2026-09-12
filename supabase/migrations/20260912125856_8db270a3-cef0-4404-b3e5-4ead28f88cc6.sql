DROP POLICY IF EXISTS "Anyone can add jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can edit jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can delete jobs" ON public.jobs;

REVOKE INSERT, UPDATE, DELETE ON public.jobs FROM anon, authenticated;
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT ALL ON public.jobs TO service_role;

REVOKE ALL ON public.resume_analyses FROM anon, authenticated;
GRANT ALL ON public.resume_analyses TO service_role;