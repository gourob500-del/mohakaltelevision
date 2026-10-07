CREATE TABLE public.photo_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  width int NOT NULL DEFAULT 1200,
  height int NOT NULL DEFAULT 1200,
  background_color text NOT NULL DEFAULT '#ffffff',
  background_url text,
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ad_image_url text,
  ad_text text,
  is_active boolean NOT NULL DEFAULT false,
  is_builtin boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX photo_card_templates_one_active ON public.photo_card_templates (is_active) WHERE is_active;
GRANT SELECT ON public.photo_card_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photo_card_templates TO authenticated;
GRANT ALL ON public.photo_card_templates TO service_role;
ALTER TABLE public.photo_card_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active template" ON public.photo_card_templates FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Admins read templates" ON public.photo_card_templates FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(), 'settings'));
CREATE POLICY "Admins manage templates" ON public.photo_card_templates FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(), 'settings'))
  WITH CHECK (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(), 'settings'));
CREATE OR REPLACE FUNCTION public.photo_card_templates_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER photo_card_templates_updated BEFORE UPDATE ON public.photo_card_templates
  FOR EACH ROW EXECUTE FUNCTION public.photo_card_templates_touch();

CREATE OR REPLACE FUNCTION public.activate_photo_card_template(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin(auth.uid()) AND public.has_permission(auth.uid(), 'settings')) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE public.photo_card_templates SET is_active = false WHERE is_active AND id <> _id;
  UPDATE public.photo_card_templates SET is_active = true WHERE id = _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.activate_photo_card_template(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.activate_photo_card_template(uuid) TO authenticated;

INSERT INTO public.photo_card_templates (name, is_active, is_builtin, background_color, elements) VALUES
('ক্লাসিক লাল-কালো (মূল ডিজাইন)', true, true, '#ffffff', '[
 {"type":"rect","x":0,"y":0,"w":1200,"h":8,"color":"#d71920"},
 {"type":"field","field":"logo","x":36,"y":22,"w":100,"h":100,"fit":"contain"},
 {"type":"text","text":"মহাকাল টেলিভিশন","x":154,"y":24,"w":790,"h":68,"size":58,"bold":true,"color":"#101010"},
 {"type":"text","text":"MOHAKAL TELEVISION","x":156,"y":88,"w":590,"h":32,"size":24,"bold":true,"color":"#d71920"},
 {"type":"field","field":"date","x":790,"y":92,"w":374,"h":34,"size":26,"color":"#101010"},
 {"type":"rect","x":0,"y":140,"w":1200,"h":530,"color":"#101010"},
 {"type":"field","field":"news_image","x":0,"y":140,"w":1200,"h":530,"fit":"contain"},
 {"type":"rect","x":752,"y":620,"w":448,"h":50,"color":"#101010","opacity":0.82},
 {"type":"text","text":"MOHAKAL TELEVISION","x":774,"y":633,"w":400,"h":32,"size":26,"bold":true,"color":"#ffffff"},
 {"type":"rect","x":0,"y":670,"w":1200,"h":8,"color":"#d71920"},
 {"type":"rect","x":0,"y":678,"w":1200,"h":270,"color":"#101010"},
 {"type":"field","field":"headline","x":40,"y":708,"w":1120,"h":215,"size":62,"bold":true,"color":"#ffffff"},
 {"type":"field","field":"reporter_line","x":40,"y":966,"w":1120,"h":62,"size":34,"color":"#101010"},
 {"type":"rect","x":0,"y":1044,"w":1200,"h":4,"color":"#d71920"},
 {"type":"text","text":"বিজ্ঞাপন","x":40,"y":1065,"w":150,"h":36,"size":26,"color":"#101010"},
 {"type":"field","field":"advertisement","x":210,"y":1065,"w":950,"h":68,"size":26,"color":"#101010","border":"#d8d8d8"},
 {"type":"field","field":"website","x":40,"y":1150,"w":1120,"h":34,"size":25,"color":"#101010"}
]'::jsonb);