import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import type { Entidade, Lancamento } from "@/lib/types";
import { KpiCard } from "./kpi-card";
import { MonthlyChart } from "./monthly-chart";
import { DashboardFilters } from "./filters";
import { EntidadeTabs } from "./entidade-tabs";

type SearchParams = { [key: string]: string | string[] | undefined };

function buildLancamentosHref(
  extra: Record<string, string>,
  vista: "todos" | Entidade,
  de: string,
  ate: string
) {
  const params = new URLSearchParams(extra);
  if (vista !== "todos") params.set("entidade", vista);
  if (de) params.set("de", de);
  if (ate) params.set("ate", ate);
  return `/lancamentos?${params.toString()}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const de = typeof sp.de === "string" ? sp.de : "";
  const ate = typeof sp.ate === "string" ? sp.ate : "";
  const vistaRaw = typeof sp.vista === "string" ? sp.vista : "todos";
  const vista = (["pf", "pj"].includes(vistaRaw) ? vistaRaw : "todos") as "todos" | Entidade;

  const supabase = await createClient();

  let query = supabase.from("lancamentos").select("*").order("data_vencimento", { ascending: true });
  if (de) query = query.gte("data_vencimento", de);
  if (ate) query = query.lte("data_vencimento", ate);
  if (vista !== "todos") query = query.eq("entidade", vista);

  const { data, error } = await query;
  const todos = (data ?? []) as Lancamento[];

  // No consolidado ("todos"), repasses entre PF e PJ sao movimentacao interna e nao
  // devem inflar os totais de recebido/pago (eles se anulam). Na visao PF ou PJ isolada,
  // o repasse e dinheiro real entrando ou saindo daquele "bolso", entao conta normalmente.
  // Depositos/resgates de poupanca nunca contam como receita/despesa real (em nenhuma
  // visao) - e so dinheiro do proprio dono mudando de lugar (caixa -> reserva).
  const semPoupanca = todos.filter(
    (l) => l.categoria !== "poupanca_deposito" && l.categoria !== "poupanca_resgate"
  );
  const lancamentos = vista === "todos" ? semPoupanca.filter((l) => l.categoria !== "repasse_pf_pj") : semPoupanca;

  const totalRecebido = lancamentos
    .filter((l) => l.tipo === "receita" && l.status === "recebido")
    .reduce((s, l) => s + l.valor, 0);
  const totalPago = lancamentos
    .filter((l) => l.tipo === "despesa" && l.status === "pago")
    .reduce((s, l) => s + l.valor, 0);
  const aReceber = lancamentos
    .filter((l) => l.tipo === "receita" && !["recebido", "cancelado"].includes(l.status))
    .reduce((s, l) => s + l.valor, 0);
  const aPagar = lancamentos
    .filter((l) => l.tipo === "despesa" && !["pago", "cancelado"].includes(l.status))
    .reduce((s, l) => s + l.valor, 0);
  const vencidos = lancamentos.filter((l) => l.status === "vencido");
  const resultado = totalRecebido - totalPago;

  // saldo liquido de repasses PF -> PJ (sempre calculado sobre a base toda, sem filtro de vista)
  const { data: repasses } = await supabase
    .from("lancamentos")
    .select("entidade,tipo,status,valor")
    .eq("categoria", "repasse_pf_pj");
  const saldoPfParaPj = (repasses ?? []).reduce((s, r) => {
    if (r.entidade === "pf" && r.tipo === "despesa" && r.status === "pago") return s + r.valor;
    if (r.entidade === "pf" && r.tipo === "receita" && r.status === "recebido") return s - r.valor;
    return s;
  }, 0);

  // Ultimos 6 meses de calendario, terminando no filtro "ate" (ou hoje, se nao houver filtro).
  // Usamos uma janela fixa de calendario (em vez de "ultimos 6 meses com dados") porque
  // parcelamentos futuros ainda pendentes criavam meses "fantasma" la na frente e empurravam
  // o mes atual pra fora do grafico.
  const anchor = ate ? new Date(ate + "T00:00:00") : new Date();
  const monthsWindow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const byMonth = new Map(monthsWindow.map((mes) => [mes, { receita: 0, despesa: 0 }]));
  for (const l of lancamentos) {
    if (!l.data_pagamento) continue;
    const key = l.data_pagamento.slice(0, 7);
    const entry = byMonth.get(key);
    if (!entry) continue;
    if (l.tipo === "receita" && l.status === "recebido") entry.receita += l.valor;
    if (l.tipo === "despesa" && l.status === "pago") entry.despesa += l.valor;
  }
  const chartData = monthsWindow.map((mes) => ({ mes, ...byMonth.get(mes)! }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard financeiro</h1>
          <p className="text-sm text-muted">Visão geral de entradas, saídas e resultado.</p>
        </div>
        <DashboardFilters de={de} ate={ate} />
      </div>

      <EntidadeTabs vista={vista} />

      {error && (
        <p className="text-sm text-danger mb-4">
          Erro ao carregar dados: {error.message}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Recebido"
          value={formatBRL(totalRecebido)}
          tone="lime"
          href={buildLancamentosHref({ status: "recebido" }, vista, de, ate)}
        />
        <KpiCard
          label="Pago"
          value={formatBRL(totalPago)}
          tone="orange"
          href={buildLancamentosHref({ status: "pago" }, vista, de, ate)}
        />
        <KpiCard
          label="A receber"
          value={formatBRL(aReceber)}
          tone="yellow"
          href={buildLancamentosHref({ tipo: "receita", status_in: "pendente,vencido" }, vista, de, ate)}
        />
        <KpiCard
          label="A pagar"
          value={formatBRL(aPagar)}
          tone="amber"
          href={buildLancamentosHref({ tipo: "despesa", status_in: "pendente,vencido" }, vista, de, ate)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4 text-muted">Resultado mensal (recebido x pago)</h2>
          <MonthlyChart data={chartData} />
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col">
          <h2 className="text-sm font-medium mb-2 text-muted">Resultado do período</h2>
          <p className={`text-3xl font-semibold ${resultado >= 0 ? "text-brand-lime" : "text-danger"}`}>
            {formatBRL(resultado)}
          </p>
          <p className="text-xs text-muted mt-1 mb-4">Recebido − Pago</p>
          <div className="mt-auto pt-4 border-t border-border space-y-3">
            <div>
              <p className="text-sm text-muted mb-1">Vencimentos em atraso</p>
              <p className="text-2xl font-semibold text-danger">{vencidos.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">
                {saldoPfParaPj >= 0 ? "PF já injetou na PJ (líquido)" : "PJ já devolveu à PF (líquido)"}
              </p>
              <p className="text-lg font-semibold text-brand-amber">{formatBRL(Math.abs(saldoPfParaPj))}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-4 text-muted">Próximos vencimentos</h2>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="pb-2 font-normal">Descrição</th>
                <th className="pb-2 font-normal">Tipo</th>
                <th className="pb-2 font-normal">Vencimento</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos
                .filter((l) => !["pago", "recebido", "cancelado"].includes(l.status))
                .slice(0, 8)
                .map((l) => (
                  <tr key={l.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5">{l.descricao}</td>
                    <td className="py-2.5 capitalize">{l.tipo}</td>
                    <td className="py-2.5">{new Date(l.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          l.status === "vencido"
                            ? "bg-danger/15 text-danger"
                            : "bg-brand-yellow/15 text-brand-yellow"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{formatBRL(l.valor)}</td>
                  </tr>
                ))}
              {lancamentos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
