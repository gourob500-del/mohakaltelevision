CREATE TABLE public.epaper_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.epaper_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  automation_enabled boolean NOT NULL DEFAULT true,
  logo_url text,
  page_categories jsonb NOT NULL DEFAULT '{"2":["national","international","politics"],"3":["district","local","education","cat-pszmg"],"4":["sports","entertainment","religion","economy","technology","others"]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.epaper_settings (id) VALUES (1);
CREATE TABLE public.epaper_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_date date NOT NULL UNIQUE,
  source_date date NOT NULL,
  status text NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT','PUBLISHED')),
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  template jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_count integer NOT NULL DEFAULT 0 CHECK (page_count BETWEEN 0 AND 4),
  news_count integer NOT NULL DEFAULT 0,
  overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.epaper_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organization text,
  image_url text NOT NULL,
  link_url text,
  starts_on date,
  ends_on date,
  pages integer[] NOT NULL DEFAULT '{4}',
  position text NOT NULL DEFAULT 'bottom' CHECK (position IN ('top','bottom','left','right','middle','full')),
  size text NOT NULL DEFAULT 'medium' CHECK (size IN ('small','medium','large')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.epaper_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_date date NOT NULL,
  trigger text NOT NULL,
  status text NOT NULL,
  message text,
  news_count integer,
  page_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.epaper_templates, public.epaper_settings, public.epaper_issues, public.epaper_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epaper_templates, public.epaper_settings, public.epaper_issues, public.epaper_ads, public.epaper_runs TO authenticated;
GRANT ALL ON public.epaper_templates, public.epaper_settings, public.epaper_issues, public.epaper_ads, public.epaper_runs TO service_role;
ALTER TABLE public.epaper_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epaper_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epaper_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epaper_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epaper_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read templates" ON public.epaper_templates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read epaper settings" ON public.epaper_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read published issues" ON public.epaper_issues FOR SELECT TO anon, authenticated USING (status = 'PUBLISHED' OR (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper')));
CREATE POLICY "read active ads" ON public.epaper_ads FOR SELECT TO anon, authenticated USING (is_active OR (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper')));
CREATE POLICY "admin templates" ON public.epaper_templates FOR ALL TO authenticated USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper')) WITH CHECK (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper'));
CREATE POLICY "admin settings" ON public.epaper_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper')) WITH CHECK (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper'));
CREATE POLICY "admin issues" ON public.epaper_issues FOR ALL TO authenticated USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper')) WITH CHECK (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper'));
CREATE POLICY "admin ads" ON public.epaper_ads FOR ALL TO authenticated USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper')) WITH CHECK (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper'));
CREATE POLICY "admin runs" ON public.epaper_runs FOR ALL TO authenticated USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper')) WITH CHECK (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(),'epaper'));
CREATE TRIGGER epaper_ads_updated BEFORE UPDATE ON public.epaper_ads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER epaper_templates_updated BEFORE UPDATE ON public.epaper_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.epaper_templates (name, config, is_active) VALUES ('ক্লাসিক দৈনিক', '{"columns":{"1":4,"2":3,"3":3,"4":3},"headlineSize":40,"bodySize":14,"accent":"#d71920","ink":"#111111","paper":"#ffffff","margin":14,"capacity":{"1":7,"2":9,"3":9,"4":9}}'::jsonb, true);