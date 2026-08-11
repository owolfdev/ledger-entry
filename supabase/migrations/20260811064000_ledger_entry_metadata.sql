alter table public.ledger_entries
add column if not exists metadata jsonb not null default '{}'::jsonb;
