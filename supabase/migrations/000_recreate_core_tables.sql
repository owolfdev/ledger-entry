CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_github_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_pat TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_github_tokens_user_id_unique
  ON public.user_github_tokens(user_id);

CREATE TABLE IF NOT EXISTS public.user_ledger_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_ledger_repos_user_id
  ON public.user_ledger_repos(user_id);

CREATE INDEX IF NOT EXISTS idx_user_ledger_repos_user_id_created_at
  ON public.user_ledger_repos(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_ledger_repos_one_active_per_user
  ON public.user_ledger_repos(user_id)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_user_ledger_repos_updated_at'
  ) THEN
    CREATE TRIGGER update_user_ledger_repos_updated_at
      BEFORE UPDATE ON public.user_ledger_repos
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

ALTER TABLE public.user_ledger_repos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_ledger_repos'
      AND policyname = 'Users can view own ledger repos'
  ) THEN
    CREATE POLICY "Users can view own ledger repos" ON public.user_ledger_repos
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_ledger_repos'
      AND policyname = 'Users can insert own ledger repos'
  ) THEN
    CREATE POLICY "Users can insert own ledger repos" ON public.user_ledger_repos
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_ledger_repos'
      AND policyname = 'Users can update own ledger repos'
  ) THEN
    CREATE POLICY "Users can update own ledger repos" ON public.user_ledger_repos
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_ledger_repos'
      AND policyname = 'Users can delete own ledger repos'
  ) THEN
    CREATE POLICY "Users can delete own ledger repos" ON public.user_ledger_repos
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
