GRANT INSERT, UPDATE, DELETE ON public.jobs TO anon, authenticated;

CREATE POLICY "Anyone can add jobs" ON public.jobs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can edit jobs" ON public.jobs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete jobs" ON public.jobs FOR DELETE TO anon, authenticated USING (true);