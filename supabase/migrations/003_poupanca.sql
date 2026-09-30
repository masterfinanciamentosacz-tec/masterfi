-- Master Financiamentos ERP - migration 003
-- Poupanca: caixinhas de reserva (PF ou PJ), alimentadas por depositos/resgates
-- lancados no fluxo de caixa normal.
--
-- IMPORTANTE: rode em DUAS etapas separadas (Postgres nao deixa usar um valor de
-- enum novo na mesma transacao em que ele foi criado).

-- ===== ETAPA 1 (rode sozinha, clique em Run, espere terminar) =====
alter type lancamento_categoria add value if not exists 'poupanca_deposito';
alter type lancamento_categoria add value if not exists 'poupanca_resgate';

-- ===== ETAPA 2 (depois que a etapa 1 rodar com sucesso, rode o resto) =====

create table if not exists public.caixinhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  entidade text not null check (entidade in ('pf', 'pj')),
  meta_valor numeric(14,2),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.lancamentos
  add column if not exists caixinha_id uuid references public.caixinhas(id) on delete set null;

create index if not exists idx_lancamentos_caixinha on public.lancamentos(caixinha_id);

alter table public.caixinhas enable row level security;

create policy "caixinhas_select_all" on public.caixinhas
  for select using (auth.role() = 'authenticated');
create policy "caixinhas_insert_all" on public.caixinhas
  for insert with check (auth.role() = 'authenticated');
create policy "caixinhas_update_all" on public.caixinhas
  for update using (auth.role() = 'authenticated');
create policy "caixinhas_delete_all" on public.caixinhas
  for delete using (auth.role() = 'authenticated');

-- Saldo de cada caixinha: depositos pagos - resgates recebidos
create or replace view public.saldo_caixinhas as
select
  c.id as caixinha_id,
  c.nome,
  c.entidade,
  c.meta_valor,
  coalesce(sum(case when l.categoria = 'poupanca_deposito' and l.status = 'pago' then l.valor else 0 end), 0)
    - coalesce(sum(case when l.categoria = 'poupanca_resgate' and l.status = 'recebido' then l.valor else 0 end), 0)
    as saldo
from public.caixinhas c
left join public.lancamentos l on l.caixinha_id = c.id
group by c.id, c.nome, c.entidade, c.meta_valor;
