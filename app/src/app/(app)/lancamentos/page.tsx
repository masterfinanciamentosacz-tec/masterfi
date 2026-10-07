import { createClient } from "@/lib/supabase/server";
import { effectiveStatus, formatBRL, formatDate, todayISO } from "@/lib/format";
import { CATEGORIA_LABEL, ENTIDADE_LABEL, STATUS_LABEL, type Caixinha, type Lancamento } from "@/lib/types";
import { FiltersBar } from "./filters-bar";
import { NewLancamentoButton } from "./new-lancamento-button";
import { RowActions } from "./row-actions";
import { SortableHeader } from "./sortable-header";

type SearchParams = { [key: string]: string | string[] | undefined };

const STATUS_STYLE: Record<string, string> = {
  pendente: "bg-brand-yellow/15 text-brand-yellow",
  pago: "bg-brand-lime/15 text-brand-lime",
  recebido: "bg-brand-lime/15 text-brand-lime",
  vencido: "bg-danger/15 text-danger",
  cancelado: "bg-surface-2 text-muted",
};

const ENTIDADE_STYLE: Record<string, string> = {
  pf: "bg-brand-amber/15 text-brand-amber",
  pj: "bg-brand-lime/15 text-brand-lime",
};

const SORT_COLUMN: Record<string, string> = {
  vencimento: "data_vencimento",
  lancamento: "created_at",
};

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const filters = {
    tipo: str("tipo"),
    categoria: str("categoria"),
    status: str("status"),
    entidade: str("entidade"),
    de: str("de"),
    ate: str("ate"),
    q: str("q"),
  };

  const sort = str("sort") || "vencimento_desc";
  const [sortField, sortDirection] = sort.split("_") as [string, "asc" | "desc"];
  const sortColumn = SORT_COLUMN[sortField] ?? "data_vencimento";

  const hoje = todayISO();
  const supabase = await createClient();
  let query = supabase
    .from("lancamentos")
    .select("*")
    .order(sortColumn, { ascending: sortDirection === "asc" });

  const statusIn = str("status_in");

  if (filters.tipo) query = query.eq("tipo", filters.tipo);
  if (filters.categoria) query = query.eq("categoria", filters.categoria);
  // "Vencido" e "Pendente" dependem da data de vencimento vs. hoje (o status gravado
  // no banco so e atualizado quando a linha e salva).
  if (statusIn) query = query.in("status", statusIn.split(","));
  else if (filters.status === "vencido") query = query.in("status", ["pendente", "vencido"]).lt("data_vencimento", hoje);
  else if (filters.status === "pendente") query = query.in("status", ["pendente", "vencido"]).gte("data_vencimento", hoje);
  else if (filters.status) query = query.eq("status", filters.status);
  if (filters.entidade) query = query.eq("entidade", filters.entidade);
  if (filters.de) query = query.gte("data_vencimento", filters.de);
  if (filters.ate) query = query.lte("data_vencimento", filters.ate);
  if (filters.q) query = query.or(`descricao.ilike.%${filters.q}%,cliente_fornecedor.ilike.%${filters.q}%`);

  const { data: caixinhasData } = await supabase
    .from("caixinhas")
    .select("*")
    .order("created_at", { ascending: true });
  const caixinhas = (caixinhasData ?? []) as Caixinha[];

  const { data, error } = await query;
  const lancamentos = ((data ?? []) as Lancamento[]).map((l) => ({
    ...l,
    status: effectiveStatus(l.status, l.data_vencimento, hoje),
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Lançamentos</h1>
          <p className="text-sm text-muted">Todo dinheiro que entra ou sai deve ser registrado aqui.</p>
        </div>
        <NewLancamentoButton caixinhas={caixinhas} />
      </div>

      <FiltersBar initial={filters} />

      {error && <p className="text-sm text-danger mb-4">Erro ao carregar dados: {error.message}</p>}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted bg-surface-2/50 border-b border-border">
                <th className="px-4 py-3 font-normal">Descrição</th>
                <th className="px-4 py-3 font-normal">Origem</th>
                <th className="px-4 py-3 font-normal">Categoria</th>
                <th className="px-4 py-3 font-normal">Cliente/Fornecedor</th>
                <th className="px-4 py-3 font-normal">
                  <SortableHeader field="lancamento" label="Lançado em" currentSort={sort} />
                </th>
                <th className="px-4 py-3 font-normal">
                  <SortableHeader field="vencimento" label="Vencimento" currentSort={sort} />
                </th>
                <th className="px-4 py-3 font-normal">Pagamento</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right">Valor</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                        l.tipo === "receita" ? "bg-brand-lime" : "bg-brand-orange"
                      }`}
                    />
                    {l.descricao}
                    {l.numero_nota && <span className="text-muted"> · NF {l.numero_nota}</span>}
                    {l.parcela_total && l.parcela_total > 1 && (
                      <span className="text-muted"> · {l.parcela_atual}/{l.parcela_total}</span>
                    )}
                    {l.transferencia_par_id && <span className="text-muted"> · repasse</span>}
                    {l.caixinha_id && <span className="text-muted"> · poupança</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${ENTIDADE_STYLE[l.entidade]}`}>
                      {ENTIDADE_LABEL[l.entidade]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{CATEGORIA_LABEL[l.categoria]}</td>
                  <td className="px-4 py-3 text-muted">{l.cliente_fornecedor ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(l.created_at.slice(0, 10))}</td>
                  <td className="px-4 py-3">{formatDate(l.data_vencimento)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(l.data_pagamento)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLE[l.status]}`}>
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${l.tipo === "receita" ? "text-brand-lime" : "text-brand-orange"}`}>
                    {l.tipo === "receita" ? "+" : "-"}
                    {formatBRL(l.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <RowActions lancamento={l} />
                  </td>
                </tr>
              ))}
              {lancamentos.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted">
                    Nenhum lançamento encontrado com esses filtros.
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
