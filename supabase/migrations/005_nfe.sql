-- Master Financiamentos ERP - migration 005
-- Controle de NFE emitidas, separado por ano, com teto anual (MEI) por ano.
-- Pode rodar o script inteiro de uma vez no SQL Editor (nao mexe em enums) e
-- tambem e seguro rodar mais de uma vez.

create table if not exists public.nfe_anos (
  ano int primary key,
  teto numeric(14,2) not null check (teto >= 0)
);

create table if not exists public.nfes (
  id uuid primary key default gen_random_uuid(),
  numero text,
  tomador text not null,
  data_emissao date not null,
  valor numeric(14,2) not null check (valor >= 0),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_nfes_data_emissao on public.nfes(data_emissao);

alter table public.nfe_anos enable row level security;
alter table public.nfes enable row level security;

drop policy if exists "nfe_anos_select_all" on public.nfe_anos;
drop policy if exists "nfe_anos_insert_all" on public.nfe_anos;
drop policy if exists "nfe_anos_update_all" on public.nfe_anos;
drop policy if exists "nfe_anos_delete_all" on public.nfe_anos;
create policy "nfe_anos_select_all" on public.nfe_anos for select using (auth.role() = 'authenticated');
create policy "nfe_anos_insert_all" on public.nfe_anos for insert with check (auth.role() = 'authenticated');
create policy "nfe_anos_update_all" on public.nfe_anos for update using (auth.role() = 'authenticated');
create policy "nfe_anos_delete_all" on public.nfe_anos for delete using (auth.role() = 'authenticated');

drop policy if exists "nfes_select_all" on public.nfes;
drop policy if exists "nfes_insert_all" on public.nfes;
drop policy if exists "nfes_update_all" on public.nfes;
drop policy if exists "nfes_delete_all" on public.nfes;
create policy "nfes_select_all" on public.nfes for select using (auth.role() = 'authenticated');
create policy "nfes_insert_all" on public.nfes for insert with check (auth.role() = 'authenticated');
create policy "nfes_update_all" on public.nfes for update using (auth.role() = 'authenticated');
create policy "nfes_delete_all" on public.nfes for delete using (auth.role() = 'authenticated');

-- Tetos anuais combinados com o cliente
insert into public.nfe_anos (ano, teto) values (2026, 81000), (2027, 110000)
on conflict (ano) do nothing;

-- Importa as NFE de 2026 da planilha "Emissao de NFE 2026.xlsx".
-- So roda se a tabela ainda estiver vazia (nao duplica se rodar de novo).
-- A planilha tem apenas mes/ano; por isso a data de emissao fica no dia 1 do mes
-- e o numero da NFE fica em branco (pode ser preenchido depois, em Editar).
insert into public.nfes (tomador, data_emissao, valor)
select v.tomador, v.data_emissao::date, v.valor
from (values
  ('41.941.887/0001-08 - VALVASSORI SERVICOS INDUSTRIAIS LTDA', '2026-01-01', 3500.00),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-01-01', 3200.00),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-03-01', 900.00),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-04-01', 900.00),
  ('00.360.305/1112-83 - CAIXA ECONOMICA FEDERAL',               '2026-06-01', 7.45),
  ('00.360.305/1112-83 - CAIXA ECONOMICA FEDERAL',               '2026-06-01', 345.00),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-06-01', 1800.00),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-07-01', 3600.00),
  ('00.360.305/1112-83 - CAIXA ECONOMICA FEDERAL',               '2026-07-01', 3362.08),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-08-01', 11700.00),
  ('00.360.305/1112-83 - CAIXA ECONOMICA FEDERAL',               '2026-08-01', 607.50),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-09-01', 900.00),
  ('00.360.305/1112-83 - CAIXA ECONOMICA FEDERAL',               '2026-09-01', 933.76),
  ('295.235.498-71 - MILSON FERNANDES PAULIN',                   '2026-10-01', 4603.84)
) as v(tomador, data_emissao, valor)
where not exists (select 1 from public.nfes);
