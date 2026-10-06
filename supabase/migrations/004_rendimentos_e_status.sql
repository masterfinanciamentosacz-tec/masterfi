-- Master Financiamentos ERP - migration 004
-- 1) Rendimentos da poupanca: somam so no saldo da caixinha (nao mexem no caixa de PF/PJ).
-- 2) Corrige a trigger de status: recalcula pendente/vencido a cada gravacao.
--
-- Pode rodar o script inteiro de uma vez no SQL Editor (nao mexe em enums).

create table if not exists public.caixinha_rendimentos (
  id uuid primary key default gen_random_uuid(),
  caixinha_id uuid not null references public.caixinhas(id) on delete cascade,
  valor numeric(14,2) not null check (valor > 0),
  data date not null,
  observacoes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_rendimentos_caixinha on public.caixinha_rendimentos(caixinha_id);

alter table public.caixinha_rendimentos enable row level security;

create policy "rendimentos_select_all" on public.caixinha_rendimentos
  for select using (auth.role() = 'authenticated');
create policy "rendimentos_insert_all" on public.caixinha_rendimentos
  for insert with check (auth.role() = 'authenticated');
create policy "rendimentos_update_all" on public.caixinha_rendimentos
  for update using (auth.role() = 'authenticated');
create policy "rendimentos_delete_all" on public.caixinha_rendimentos
  for delete using (auth.role() = 'authenticated');

-- Saldo da caixinha = depositos pagos - resgates recebidos + rendimentos
create or replace view public.saldo_caixinhas as
select
  c.id as caixinha_id,
  c.nome,
  c.entidade,
  c.meta_valor,
  coalesce((select sum(l.valor) from public.lancamentos l
            where l.caixinha_id = c.id and l.categoria = 'poupanca_deposito' and l.status = 'pago'), 0)
  - coalesce((select sum(l.valor) from public.lancamentos l
              where l.caixinha_id = c.id and l.categoria = 'poupanca_resgate' and l.status = 'recebido'), 0)
  + coalesce((select sum(r.valor) from public.caixinha_rendimentos r
              where r.caixinha_id = c.id), 0)
  as saldo
from public.caixinhas c;

-- Trigger de status: recalcula sempre (antes um "vencido" ficava travado mesmo
-- se a data de vencimento fosse alterada para o futuro).
create or replace function public.compute_status()
returns trigger as $$
begin
  if new.status = 'cancelado' then
    return new;
  end if;

  if new.data_pagamento is not null then
    new.status := case when new.tipo = 'receita' then 'recebido' else 'pago' end;
  elsif new.data_vencimento < current_date then
    new.status := 'vencido';
  else
    new.status := 'pendente';
  end if;
  return new;
end;
$$ language plpgsql;
