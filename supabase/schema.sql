-- Master Financiamentos ERP - Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)

create extension if not exists "pgcrypto";

-- ========== Enums ==========
create type lancamento_tipo as enum ('receita', 'despesa');
create type lancamento_categoria as enum (
  'nota_fiscal_emitida',
  'nota_fiscal_recebida',
  'valor_a_receber',
  'valor_a_pagar',
  'gasto_despesa',
  'outro'
);
create type lancamento_status as enum ('pendente', 'pago', 'recebido', 'vencido', 'cancelado');

-- ========== Tables ==========

-- Profiles (1:1 with auth.users) - allows role-based access later
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  created_at timestamptz not null default now()
);

-- Main ledger table: every entry that generates cash in/out
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo lancamento_tipo not null,                 -- receita | despesa
  categoria lancamento_categoria not null,
  descricao text not null,
  numero_nota text,                               -- optional NF number
  cliente_fornecedor text,                        -- client or supplier name
  valor numeric(14,2) not null check (valor >= 0),
  data_emissao date,                              -- issue date (for NFs)
  data_vencimento date not null,                  -- due date
  data_pagamento date,                            -- actual payment/receipt date
  status lancamento_status not null default 'pendente',
  observacoes text,
  anexo_url text,                                 -- optional file (NF PDF, receipt, etc.)
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lancamentos_tipo on public.lancamentos(tipo);
create index idx_lancamentos_categoria on public.lancamentos(categoria);
create index idx_lancamentos_status on public.lancamentos(status);
create index idx_lancamentos_vencimento on public.lancamentos(data_vencimento);
create index idx_lancamentos_pagamento on public.lancamentos(data_pagamento);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_lancamentos_updated_at
before update on public.lancamentos
for each row execute function public.set_updated_at();

-- Auto status: mark vencido when past due and not yet paid/recebido
create or replace function public.compute_status()
returns trigger as $$
begin
  if new.data_pagamento is not null then
    new.status := case when new.tipo = 'receita' then 'recebido' else 'pago' end;
  elsif new.status not in ('cancelado') and new.data_vencimento < current_date then
    new.status := 'vencido';
  elsif new.status not in ('cancelado', 'vencido') then
    new.status := 'pendente';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_lancamentos_status
before insert or update on public.lancamentos
for each row execute function public.compute_status();

-- ========== Row Level Security ==========
alter table public.profiles enable row level security;
alter table public.lancamentos enable row level security;

-- Any authenticated user of this ERP (single company/tenant) can read/write.
-- Since this is a single-client internal system, all logged-in users share data.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "lancamentos_select_all" on public.lancamentos
  for select using (auth.role() = 'authenticated');

create policy "lancamentos_insert_all" on public.lancamentos
  for insert with check (auth.role() = 'authenticated');

create policy "lancamentos_update_all" on public.lancamentos
  for update using (auth.role() = 'authenticated');

create policy "lancamentos_delete_all" on public.lancamentos
  for delete using (auth.role() = 'authenticated');

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ========== Monthly result view (Resultado financeiro mensal) ==========
create or replace view public.resultado_mensal as
select
  date_trunc('month', coalesce(data_pagamento, data_vencimento))::date as mes,
  sum(case when tipo = 'receita' and status = 'recebido' then valor else 0 end) as total_recebido,
  sum(case when tipo = 'despesa' and status = 'pago' then valor else 0 end) as total_pago,
  sum(case when tipo = 'receita' and status = 'recebido' then valor else 0 end)
    - sum(case when tipo = 'despesa' and status = 'pago' then valor else 0 end) as resultado,
  sum(case when tipo = 'receita' and status not in ('recebido','cancelado') then valor else 0 end) as a_receber,
  sum(case when tipo = 'despesa' and status not in ('pago','cancelado') then valor else 0 end) as a_pagar
from public.lancamentos
group by 1
order by 1 desc;
