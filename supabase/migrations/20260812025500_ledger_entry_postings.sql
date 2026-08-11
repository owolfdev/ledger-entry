create table if not exists public.ledger_entry_postings (
  id uuid primary key default gen_random_uuid(),
  ledger_entry_id uuid not null references public.ledger_entries (id) on delete cascade,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  account_name text not null,
  amount numeric not null,
  currency text not null,
  posting_index integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (ledger_entry_id, posting_index)
);

create index if not exists ledger_entry_postings_ledger_id_idx
  on public.ledger_entry_postings (ledger_id);

create index if not exists ledger_entry_postings_account_name_idx
  on public.ledger_entry_postings (ledger_id, account_name);

alter table public.ledger_entry_postings enable row level security;

drop policy if exists "Users manage postings for own ledgers" on public.ledger_entry_postings;
create policy "Users manage postings for own ledgers"
  on public.ledger_entry_postings
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.ledgers
      where ledgers.id = ledger_entry_postings.ledger_id
        and ledgers.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.ledgers
      where ledgers.id = ledger_entry_postings.ledger_id
        and ledgers.owner_user_id = auth.uid()
    )
  );

insert into public.ledger_entry_postings (
  ledger_entry_id,
  ledger_id,
  account_name,
  amount,
  currency,
  posting_index,
  created_at
)
select
  ledger_entries.id,
  ledger_entries.ledger_id,
  posting.value ->> 'account',
  (posting.value ->> 'amount')::numeric,
  ledger_entries.currency,
  posting.ordinality::integer,
  ledger_entries.created_at
from public.ledger_entries
cross join lateral jsonb_array_elements(ledger_entries.postings) with ordinality as posting(value, ordinality)
on conflict (ledger_entry_id, posting_index) do nothing;
