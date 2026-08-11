create extension if not exists pgcrypto;

create table if not exists public.ledgers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  book_type text not null check (book_type in ('business', 'personal')),
  default_currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, slug)
);

create index if not exists ledgers_owner_user_id_idx
  on public.ledgers (owner_user_id);

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null,
  category text not null check (category in ('asset', 'liability', 'equity', 'income', 'expense')),
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (ledger_id, name)
);

create index if not exists ledger_accounts_ledger_id_idx
  on public.ledger_accounts (ledger_id);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  created_by_user_id uuid not null references auth.users (id) on delete cascade,
  source_prompt text not null,
  entry_date date not null,
  description text not null,
  currency text not null,
  postings jsonb not null,
  beancount_text text not null,
  model_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ledger_entries_ledger_id_idx
  on public.ledger_entries (ledger_id);

create index if not exists ledger_entries_created_by_user_id_idx
  on public.ledger_entries (created_by_user_id);

alter table public.ledgers enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_entries enable row level security;

drop policy if exists "Users manage own ledgers" on public.ledgers;
create policy "Users manage own ledgers"
  on public.ledgers
  for all
  to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "Users manage accounts for own ledgers" on public.ledger_accounts;
create policy "Users manage accounts for own ledgers"
  on public.ledger_accounts
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.ledgers
      where ledgers.id = ledger_accounts.ledger_id
        and ledgers.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.ledgers
      where ledgers.id = ledger_accounts.ledger_id
        and ledgers.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Users manage entries for own ledgers" on public.ledger_entries;
create policy "Users manage entries for own ledgers"
  on public.ledger_entries
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.ledgers
      where ledgers.id = ledger_entries.ledger_id
        and ledgers.owner_user_id = auth.uid()
    )
  )
  with check (
    created_by_user_id = auth.uid()
    and exists (
      select 1
      from public.ledgers
      where ledgers.id = ledger_entries.ledger_id
        and ledgers.owner_user_id = auth.uid()
    )
  );
