ALTER TABLE public.website_settings
  ADD COLUMN IF NOT EXISTS watermark_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS watermark_position text NOT NULL DEFAULT 'bottom-right',
  ADD COLUMN IF NOT EXISTS watermark_opacity numeric NOT NULL DEFAULT 0.6;

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_read" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "permissions_super_write" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'SUPER_ADMIN')
      OR EXISTS (SELECT 1 FROM public.user_permissions p WHERE p.user_id = _user_id AND p.module = _module);
$$;