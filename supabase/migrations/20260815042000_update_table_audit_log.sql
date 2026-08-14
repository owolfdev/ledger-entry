CREATE TABLE IF NOT EXISTS public."update" (
  id INTEGER PRIMARY KEY DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public."update" DROP CONSTRAINT IF EXISTS update_id_check;

CREATE SEQUENCE IF NOT EXISTS public.update_id_seq;

SELECT setval(
  'public.update_id_seq',
  GREATEST(COALESCE((SELECT MAX(id) FROM public."update"), 0), 1),
  true
);

ALTER SEQUENCE public.update_id_seq OWNED BY public."update".id;

ALTER TABLE public."update"
  ALTER COLUMN id SET DEFAULT nextval('public.update_id_seq');
