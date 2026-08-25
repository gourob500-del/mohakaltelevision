ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS reporter_designation text,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS news_slug_key ON public.news (slug);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_publish boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.can_publish(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.can_publish AND p.status = 'ACTIVE');
$$;

-- news policies: allow direct publishing when permitted
DROP POLICY IF EXISTS news_author_insert ON public.news;
CREATE POLICY news_author_insert ON public.news
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      is_admin(auth.uid())
      OR (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'ACTIVE')
        AND (
          status = ANY (ARRAY['DRAFT'::news_status, 'PENDING'::news_status])
          OR (status = 'PUBLISHED'::news_status AND public.can_publish(auth.uid()))
        )
      )
    )
  );

DROP POLICY IF EXISTS news_author_update ON public.news;
CREATE POLICY news_author_update ON public.news
  FOR UPDATE TO authenticated
  USING (
    is_admin(auth.uid())
    OR (author_id = auth.uid() AND (
      status = ANY (ARRAY['DRAFT'::news_status, 'PENDING'::news_status, 'CORRECTION_REQUIRED'::news_status])
      OR (status = 'PUBLISHED'::news_status AND public.can_publish(auth.uid()))
    ))
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (author_id = auth.uid() AND (
      status = ANY (ARRAY['DRAFT'::news_status, 'PENDING'::news_status])
      OR (status = 'PUBLISHED'::news_status AND public.can_publish(auth.uid()))
    ))
  );

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  for_admins boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_read ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (for_admins AND is_admin(auth.uid())));

CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR (for_admins AND user_id IS NULL));

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (for_admins AND is_admin(auth.uid())))
  WITH CHECK (user_id = auth.uid() OR (for_admins AND is_admin(auth.uid())));

CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);