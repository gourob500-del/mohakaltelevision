CREATE TABLE public.epaper_cron_key (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), token text NOT NULL DEFAULT encode(gen_random_bytes(24),'hex'));
GRANT ALL ON public.epaper_cron_key TO service_role;
ALTER TABLE public.epaper_cron_key ENABLE ROW LEVEL SECURITY;
INSERT INTO public.epaper_cron_key (id) VALUES (1);
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;