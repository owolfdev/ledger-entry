alter table public.ledger_entries
add column if not exists status text not null default 'confirmed'
  check (status in ('confirmed', 'reversed'));

alter table public.ledger_entries
add column if not exists reversal_of_entry_id uuid references public.ledger_entries (id) on delete set null;

alter table public.ledger_entries
add column if not exists reversed_by_entry_id uuid references public.ledger_entries (id) on delete set null;
