CREATE TABLE public.facebook_settings (
  id integer PRIMARY KEY DEFAULT 1,
  page_id text NOT NULL DEFAULT '',
  access_token text NOT NULL DEFAULT '',
  auto_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.facebook_settings TO authenticated;
GRANT ALL ON public.facebook_settings TO service_role;
ALTER TABLE public.facebook_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY fb_settings_admin_read ON public.facebook_settings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY fb_settings_admin_update ON public.facebook_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.facebook_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  fb_post_id text,
  fb_comment_id text,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.facebook_posts TO authenticated;
GRANT ALL ON public.facebook_posts TO service_role;
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY fb_posts_admin_read ON public.facebook_posts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

INSERT INTO public.facebook_settings (id) VALUES (1) ON CONFLICT DO NOTHING;