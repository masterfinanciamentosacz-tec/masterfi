import { createClient } from "@/lib/supabase/server";
import { formatBRL, todayISO } from "@/lib/format";
import type { Caixinha, Lancamento } from "@/lib/types";
import { CaixinhaCard } from "./caixinha-card";
import { NewCaixinhaButton } from "./new-caixinha-button";

export default async function PoupancaPage() {
  const supabase = await createClient();

  const { data: caixinhasData, error } = await supabase
    .from("caixinhas")
    .select("*")
    .order("created_at", { ascending: true });
  const caixinhas = (caixinhasData ?? []) as Caixinha[];

  const { data: movsData } = await supabase
    .from("lancamentos")
    .select("*")
    .in("categoria", ["poupanca_deposito", "poupanca_resgate"]);
  const movimentos = (movsData ?? []) as Lancamento[];

  const saldoPorCaixinha = new Map<string, number>();
  for (const c of caixinhas) saldoPorCaixinha.set(c.id, 0);
  let totalGuardado = 0;
  let depositadoMes = 0;
  let resgatadoMes = 0;
  const mesAtual = todayISO().slice(0, 7);

  for (const m of movimentos) {
    if (!m.caixinha_id) continue;
    const atual = saldoPorCaixinha.get(m.caixinha_id) ?? 0;
    if (m.categoria === "poupanca_deposito" && m.status === "pago") {
      saldoPorCaixinha.set(m.caixinha_id, atual + m.valor);
      totalGuardado += m.valor;
      if (m.data_pagamento?.slice(0, 7) === mesAtual) depositadoMes += m.valor;
    }
    if (m.categoria === "poupanca_resgate" && m.status === "recebido") {
      saldoPorCaixinha.set(m.caixinha_id, atual - m.valor);
      totalGuardado -= m.valor;
      if (m.data_pagamento?.slice(0, 7) === mesAtual) resgatadoMes += m.valor;
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Poupança</h1>
          <p className="text-sm text-muted">Reservas separadas do caixa do dia a dia, alimentadas pelos seus lançamentos.</p>
        </div>
        {caixinhas.length > 0 && <NewCaixinhaButton />}
      </div>

      {error && <p className="text-sm text-danger mb-4">Erro ao carregar dados: {error.message}</p>}

      {caixinhas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1.5">Total guardado</p>
            <p className="text-xl font-semibold text-brand-lime">{formatBRL(totalGuardado)}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1.5">Depositado no mês</p>
            <p className="text-xl font-semibold text-brand-yellow">{formatBRL(depositadoMes)}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1.5">Resgatado no mês</p>
            <p className="text-xl font-semibold text-brand-orange">{formatBRL(resgatadoMes)}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1.5">Caixinhas ativas</p>
            <p className="text-xl font-semibold text-brand-amber">{caixinhas.length}</p>
          </div>
        </div>
      )}

      {caixinhas.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted mb-4">
            Nenhuma caixinha criada ainda. Crie a primeira pra começar a separar uma reserva do seu caixa.
          </p>
          <div className="max-w-xs mx-auto">
            <NewCaixinhaButton variant="empty" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {caixinhas.map((c) => (
            <CaixinhaCard key={c.id} caixinha={c} saldo={saldoPorCaixinha.get(c.id) ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
