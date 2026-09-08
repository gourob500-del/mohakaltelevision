
CREATE TABLE public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  body text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.news_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_comments TO authenticated;
GRANT ALL ON public.news_comments TO service_role;

ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved comments" ON public.news_comments
  FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "Admins can read all comments" ON public.news_comments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Anyone can submit a comment" ON public.news_comments
  FOR INSERT TO anon, authenticated WITH CHECK (is_approved = false);
CREATE POLICY "Admins can update comments" ON public.news_comments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can delete comments" ON public.news_comments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE INDEX news_comments_news_id_idx ON public.news_comments (news_id, created_at DESC);

CREATE TRIGGER update_news_comments_updated_at BEFORE UPDATE ON public.news_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.news_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  contact text,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.news_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_reports TO authenticated;
GRANT ALL ON public.news_reports TO service_role;

ALTER TABLE public.news_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a report" ON public.news_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read reports" ON public.news_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can update reports" ON public.news_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can delete reports" ON public.news_reports
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE INDEX news_reports_news_id_idx ON public.news_reports (news_id, created_at DESC);

CREATE TRIGGER update_news_reports_updated_at BEFORE UPDATE ON public.news_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
