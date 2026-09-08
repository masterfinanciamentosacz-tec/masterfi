-- Master Financiamentos ERP - migration 002
-- Adiciona: separacao Pessoa Fisica (PF) / Pessoa Juridica (PJ), parcelamento
-- e repasses entre PF e PJ (transferencias internas que aparecem nos dois saldos).
--
-- Rode este script inteiro de uma vez no SQL Editor do Supabase (depois do schema.sql original).

-- 1) Nova categoria para repasses entre PF e PJ
alter type lancamento_categoria add value if not exists 'repasse_pf_pj';

-- 2) Novas colunas em lancamentos
alter table public.lancamentos
  add column if not exists entidade text not null default 'pj' check (entidade in ('pf', 'pj')),
  add column if not exists parcela_atual int,
  add column if not exists parcela_total int,
  add column if not exists grupo_parcelamento uuid,
  add column if not exists transferencia_par_id uuid references public.lancamentos(id) on delete cascade;

create index if not exists idx_lancamentos_entidade on public.lancamentos(entidade);
create index if not exists idx_lancamentos_grupo_parcelamento on public.lancamentos(grupo_parcelamento);

-- 3) View de resultado mensal por entidade (PF x PJ)
create or replace view public.resultado_mensal_entidade as
select
  date_trunc('month', coalesce(data_pagamento, data_vencimento))::date as mes,
  entidade,
  sum(case when tipo = 'receita' and status = 'recebido' then valor else 0 end) as total_recebido,
  sum(case when tipo = 'despesa' and status = 'pago' then valor else 0 end) as total_pago,
  sum(case when tipo = 'receita' and status = 'recebido' then valor else 0 end)
    - sum(case when tipo = 'despesa' and status = 'pago' then valor else 0 end) as resultado,
  sum(case when tipo = 'receita' and status not in ('recebido','cancelado') then valor else 0 end) as a_receber,
  sum(case when tipo = 'despesa' and status not in ('pago','cancelado') then valor else 0 end) as a_pagar
from public.lancamentos
group by 1, 2
order by 1 desc, 2;

-- 4) Saldo acumulado de repasses entre PF e PJ (quanto a PF ja "emprestou" liquido para a PJ)
create or replace view public.saldo_repasses_pf_pj as
select
  coalesce(sum(case when entidade = 'pf' and tipo = 'despesa' and status = 'pago' then valor else 0 end), 0)
    - coalesce(sum(case when entidade = 'pf' and tipo = 'receita' and status = 'recebido' then valor else 0 end), 0)
    as saldo_pf_para_pj
from public.lancamentos
where categoria = 'repasse_pf_pj';
