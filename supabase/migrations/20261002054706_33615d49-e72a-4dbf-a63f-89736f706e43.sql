DROP POLICY IF EXISTS "settings_public_read" ON public.website_settings;
CREATE POLICY "settings_admin_read"
ON public.website_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_public_website_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'site_name', site_name,
    'tagline', tagline,
    'logo_url', logo_url,
    'favicon_url', favicon_url,
    'contact_number', contact_number,
    'contact_email', contact_email,
    'about_text', about_text,
    'facebook_url', facebook_url,
    'youtube_url', youtube_url,
    'twitter_url', twitter_url,
    'instagram_url', instagram_url,
    'website_url', website_url,
    'editor_name', editor_name,
    'news_editor_name', news_editor_name,
    'executive_editor_name', executive_editor_name,
    'publisher_name', publisher_name,
    'office_address', office_address
  )
  FROM public.website_settings
  WHERE id = 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_website_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_website_settings() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can submit a comment" ON public.news_comments;
CREATE POLICY "Guests can submit ownerless comments"
ON public.news_comments
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND is_approved = false);
CREATE POLICY "Users can submit own comments"
ON public.news_comments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND is_approved = false);

DROP POLICY IF EXISTS "Anyone can submit a report" ON public.news_reports;
CREATE POLICY "Guests can submit ownerless reports"
ON public.news_reports
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND is_resolved = false);
CREATE POLICY "Users can submit own reports"
ON public.news_reports
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND is_resolved = false);

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'SUPER_ADMIN')
      OR (
        public.has_role(_user_id, 'ADMIN')
        AND NOT EXISTS (
          SELECT 1 FROM public.user_permissions p0 WHERE p0.user_id = _user_id
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.user_permissions p
        WHERE p.user_id = _user_id AND p.module = _module
      );
$$;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;