ALTER TABLE public.news ADD COLUMN IF NOT EXISTS epaper_exclude boolean NOT NULL DEFAULT false;

CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  placement text NOT NULL DEFAULT 'sidebar',
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY ads_public_read ON public.ads FOR SELECT TO anon, authenticated
  USING (is_active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY ads_admin_read ON public.ads FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(), 'ads'));
CREATE POLICY ads_admin_write ON public.ads FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(), 'ads'))
  WITH CHECK (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(), 'ads'));
CREATE TRIGGER ads_updated BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();