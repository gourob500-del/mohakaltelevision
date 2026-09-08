ALTER TABLE public.website_settings
  ADD COLUMN IF NOT EXISTS editor_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS news_editor_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS executive_editor_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS publisher_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS office_address text NOT NULL DEFAULT '';