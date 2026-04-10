CREATE TABLE IF NOT EXISTS public."update" (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public."update" (id, updated_at)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;
