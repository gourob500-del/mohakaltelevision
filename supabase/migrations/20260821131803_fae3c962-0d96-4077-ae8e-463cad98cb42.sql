
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN','ADMIN','REPRESENTATIVE','VISITOR');
CREATE TYPE public.news_status AS ENUM ('DRAFT','PENDING','CORRECTION_REQUIRED','APPROVED','PUBLISHED','REJECTED');
CREATE TYPE public.account_status AS ENUM ('PENDING','ACTIVE','SUSPENDED');

-- UPDATED AT
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- LOCATIONS
CREATE TABLE public.divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  code text NOT NULL DEFAULT 'GEN',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.upazilas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (district_id, slug)
);

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  mobile text,
  photo_url text,
  designation text,
  district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  upazila_id uuid REFERENCES public.upazilas(id) ON DELETE SET NULL,
  representative_id text UNIQUE,
  joining_date date NOT NULL DEFAULT current_date,
  status public.account_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('ADMIN','SUPER_ADMIN'));
$$;

-- NEWS
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  content text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  division_id uuid REFERENCES public.divisions(id) ON DELETE SET NULL,
  district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  upazila_id uuid REFERENCES public.upazilas(id) ON DELETE SET NULL,
  location text,
  featured_image text,
  caption text,
  video_url text,
  source text,
  reporter_name text,
  author_id uuid NOT NULL,
  status public.news_status NOT NULL DEFAULT 'DRAFT',
  is_top boolean NOT NULL DEFAULT false,
  is_breaking boolean NOT NULL DEFAULT false,
  views int NOT NULL DEFAULT 0,
  review_note text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER news_updated BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX news_status_pub_idx ON public.news (status, published_at DESC);
CREATE INDEX news_category_idx ON public.news (category_id);
CREATE INDEX news_district_idx ON public.news (district_id);

-- MEDIA
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes int,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SETTINGS
CREATE TABLE public.website_settings (
  id int PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT 'MOHAKAL TELEVISION',
  tagline text NOT NULL DEFAULT 'আপনার আয়োজন, আমাদের সংবাদ',
  logo_url text,
  favicon_url text,
  contact_number text NOT NULL DEFAULT '01966658179',
  contact_email text,
  about_text text NOT NULL DEFAULT '',
  facebook_url text,
  youtube_url text,
  twitter_url text,
  instagram_url text,
  website_url text NOT NULL DEFAULT 'https://mohakaltelevision.lovable.app',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.website_settings (id, about_text, contact_email) VALUES (1, 'MOHAKAL TELEVISION একটি বাংলাদেশি অনলাইন সংবাদ মাধ্যম।', 'info@mohakaltelevision.com');

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_created_idx ON public.activity_logs (created_at DESC);

-- GRANTS
GRANT SELECT ON public.divisions TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.divisions TO authenticated; GRANT ALL ON public.divisions TO service_role;
GRANT SELECT ON public.districts TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.districts TO authenticated; GRANT ALL ON public.districts TO service_role;
GRANT SELECT ON public.upazilas TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.upazilas TO authenticated; GRANT ALL ON public.upazilas TO service_role;
GRANT SELECT ON public.categories TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated; GRANT ALL ON public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.news TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated; GRANT ALL ON public.news TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated; GRANT ALL ON public.media TO service_role;
GRANT SELECT ON public.website_settings TO anon; GRANT SELECT, UPDATE ON public.website_settings TO authenticated; GRANT ALL ON public.website_settings TO service_role;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated; GRANT ALL ON public.activity_logs TO service_role;

-- RLS
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upazilas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "divisions_public_read" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "divisions_admin_write" ON public.divisions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "districts_public_read" ON public.districts FOR SELECT USING (true);
CREATE POLICY "districts_admin_write" ON public.districts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "upazilas_public_read" ON public.upazilas FOR SELECT USING (true);
CREATE POLICY "upazilas_admin_write" ON public.upazilas FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "profiles_own_read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_admin_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE POLICY "user_roles_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_super_write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'SUPER_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE POLICY "news_public_read" ON public.news FOR SELECT USING (status = 'PUBLISHED');
CREATE POLICY "news_author_read" ON public.news FOR SELECT TO authenticated USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "news_author_insert" ON public.news FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (
    public.is_admin(auth.uid())
    OR (status IN ('DRAFT','PENDING') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'ACTIVE'))
  )
);
CREATE POLICY "news_author_update" ON public.news FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR (author_id = auth.uid() AND status IN ('DRAFT','PENDING','CORRECTION_REQUIRED')))
  WITH CHECK (public.is_admin(auth.uid()) OR (author_id = auth.uid() AND status IN ('DRAFT','PENDING')));
CREATE POLICY "news_delete" ON public.news FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR (author_id = auth.uid() AND status IN ('DRAFT','REJECTED')));

CREATE POLICY "media_read" ON public.media FOR SELECT TO authenticated USING (uploaded_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "media_insert" ON public.media FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "media_delete" ON public.media FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "settings_public_read" ON public.website_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_update" ON public.website_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "logs_admin_read" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "logs_insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- VIEW COUNTER
CREATE OR REPLACE FUNCTION public.increment_news_views(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.news SET views = views + 1 WHERE slug = _slug AND status = 'PUBLISHED';
$$;
GRANT EXECUTE ON FUNCTION public.increment_news_views(text) TO anon, authenticated;

-- NEW USER PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, mobile)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email, NEW.raw_user_meta_data->>'mobile')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'VISITOR') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- REPRESENTATIVE ID GENERATOR
CREATE OR REPLACE FUNCTION public.next_representative_id(_district_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text; n int;
BEGIN
  SELECT COALESCE(code,'GEN') INTO c FROM public.districts WHERE id = _district_id;
  IF c IS NULL THEN c := 'GEN'; END IF;
  SELECT COUNT(*) + 1 INTO n FROM public.profiles WHERE representative_id LIKE 'MTV-' || c || '-%';
  RETURN 'MTV-' || c || '-' || lpad(n::text, 4, '0');
END; $$;
GRANT EXECUTE ON FUNCTION public.next_representative_id(uuid) TO authenticated;

-- SEED CATEGORIES
INSERT INTO public.categories (name, slug, sort_order) VALUES
 ('জাতীয়','national',1),('আন্তর্জাতিক','international',2),('রাজনীতি','politics',3),
 ('শিক্ষা','education',4),('ধর্ম','religion',5),('জেলা','district',6),
 ('স্থানীয়','local',7),('বিনোদন','entertainment',8),('খেলাধুলা','sports',9),
 ('অর্থনীতি','economy',10),('প্রযুক্তি','technology',11),('অন্যান্য','others',12);

-- SEED DIVISIONS
INSERT INTO public.divisions (name, slug) VALUES
 ('ঢাকা','dhaka'),('চট্টগ্রাম','chattogram'),('রাজশাহী','rajshahi'),('খুলনা','khulna'),
 ('বরিশাল','barishal'),('সিলেট','sylhet'),('রংপুর','rangpur'),('ময়মনসিংহ','mymensingh');

-- SEED DISTRICTS (subset, admin can add more)
INSERT INTO public.districts (division_id, name, slug, code)
SELECT d.id, x.name, x.slug, x.code FROM public.divisions d
JOIN (VALUES
 ('dhaka','ঢাকা','dhaka-district','DHA'),
 ('dhaka','নারায়ণগঞ্জ','narayanganj','NAR'),
 ('dhaka','গাজীপুর','gazipur','GAZ'),
 ('dhaka','টাঙ্গাইল','tangail','TAN'),
 ('chattogram','চট্টগ্রাম','chattogram-district','CTG'),
 ('chattogram','কুমিল্লা','cumilla','CUM'),
 ('chattogram','নোয়াখালী','noakhali','NOA'),
 ('rajshahi','রাজশাহী','rajshahi-district','RAJ'),
 ('rajshahi','বগুড়া','bogura','BOG'),
 ('khulna','খুলনা','khulna-district','KHU'),
 ('khulna','যশোর','jashore','JAS'),
 ('barishal','বরিশাল','barishal-district','BAR'),
 ('sylhet','সিলেট','sylhet-district','SYL'),
 ('rangpur','রংপুর','rangpur-district','RAN'),
 ('mymensingh','ময়মনসিংহ','mymensingh-district','MYM')
) AS x(div, name, slug, code) ON x.div = d.slug;

-- SEED UPAZILAS for a few districts
INSERT INTO public.upazilas (district_id, name, slug)
SELECT dt.id, x.name, x.slug FROM public.districts dt
JOIN (VALUES
 ('narayanganj','সদর','sadar'),
 ('narayanganj','সোনারগাঁও','sonargaon'),
 ('narayanganj','আড়াইহাজার','araihazar'),
 ('narayanganj','রূপগঞ্জ','rupganj'),
 ('narayanganj','বন্দর','bandar'),
 ('gazipur','সদর','sadar'),
 ('gazipur','কালীগঞ্জ','kaliganj'),
 ('cumilla','সদর','sadar'),
 ('cumilla','দাউদকান্দি','daudkandi'),
 ('bogura','সদর','sadar'),
 ('sylhet-district','সদর','sadar'),
 ('mymensingh-district','সদর','sadar')
) AS x(dslug, name, slug) ON x.dslug = dt.slug;
