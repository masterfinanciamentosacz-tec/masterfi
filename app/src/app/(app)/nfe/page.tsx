import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import type { Nfe, NfeAno } from "@/lib/types";
import { AnoTabs, EditarTetoButton, NfeRowActions, NovaNfeButton } from "./nfe-client";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

export default async function NfePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: anosData, error: anosError } = await supabase.from("nfe_anos").select("*").order("ano");
  const anos = ((anosData ?? []) as NfeAno[]).map((a) => ({ ano: a.ano, teto: Number(a.teto) }));

  const hoje = todayISO();
  const anoAtual = Number(hoje.slice(0, 4));
  const anoParam = typeof sp.ano === "string" ? Number(sp.ano) : NaN;
  const anoSel =
    anos.find((a) => a.ano === anoParam) ?? anos.find((a) => a.ano === anoAtual) ?? anos[anos.length - 1] ?? null;

  let nfes: Nfe[] = [];
  let nfesError: string | null = null;
  if (anoSel) {
    const { data, error } = await supabase
      .from("nfes")
      .select("*")
      .gte("data_emissao", `${anoSel.ano}-01-01`)
      .lte("data_emissao", `${anoSel.ano}-12-31`)
      .order("data_emissao", { ascending: false })
      .order("created_at", { ascending: false });
    nfes = ((data ?? []) as Nfe[]).map((n) => ({ ...n, valor: Number(n.valor) }));
    nfesError = error?.message ?? null;
  }

  // Links temporarios (1 hora) para abrir os PDFs guardados
  const pdfUrls = new Map<string, string>();
  const caminhos = nfes.map((n) => n.arquivo_path).filter((p): p is string => !!p);
  if (caminhos.length > 0) {
    const { data: assinadas } = await supabase.storage.from("notas-fiscais").createSignedUrls(caminhos, 3600);
    for (const a of assinadas ?? []) if (a.path && a.signedUrl) pdfUrls.set(a.path, a.signedUrl);
  }

  const emitido = nfes.reduce((s, n) => s + n.valor, 0);
  const teto = anoSel?.teto ?? 0;
  const restante = Math.max(teto - emitido, 0);
  const excedido = Math.max(emitido - teto, 0);
  const usado = teto > 0 ? (emitido / teto) * 100 : 0;
  const barra = usado > 100 ? "bg-danger" : usado >= 80 ? "bg-brand-amber" : "bg-brand-lime";

  const porMes = MESES.map((_, i) => {
    const doMes = nfes.filter((n) => Number(n.data_emissao.slice(5, 7)) === i + 1);
    return { total: doMes.reduce((s, n) => s + n.valor, 0), qtd: doMes.length };
  });

  const mesAtual = Number(hoje.slice(5, 7));
  const mesesRestantes = anoSel && anoSel.ano === anoAtual ? 12 - mesAtual + 1 : 0;

  const defaultDate = anoSel && anoSel.ano !== anoAtual ? `${anoSel.ano}-01-01` : hoje;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold">NFE emitidas</h1>
          <p className="text-sm text-muted">Controle das notas emitidas por ano, em relação ao teto anual do MEI.</p>
        </div>
        {anoSel && <NovaNfeButton defaultDate={defaultDate} />}
      </div>

      {(anosError || nfesError) && (
        <p className="text-sm text-danger mb-4">Erro ao carregar dados: {anosError?.message ?? nfesError}</p>
      )}

      <div className="mb-6">
        <AnoTabs anos={anos} selecionado={anoSel?.ano ?? null} />
      </div>

      {!anoSel ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center text-sm text-muted">
          Nenhum ano cadastrado ainda. Use o botão "+ Ano" para definir o teto anual.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted">Teto anual {anoSel.ano}</p>
                <EditarTetoButton ano={anoSel} />
              </div>
              <p className="text-xl font-semibold text-brand-yellow">{formatBRL(teto)}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-muted mb-1.5">Emitido em {anoSel.ano}</p>
              <p className="text-xl font-semibold text-brand-lime">{formatBRL(emitido)}</p>
              <p className="text-xs text-muted mt-1">{pct(usado)} do teto</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-muted mb-1.5">{excedido > 0 ? "Acima do teto" : "Ainda pode emitir"}</p>
              <p className={`text-xl font-semibold ${excedido > 0 ? "text-danger" : "text-brand-amber"}`}>
                {formatBRL(excedido > 0 ? excedido : restante)}
              </p>
              {excedido === 0 && mesesRestantes > 0 && restante > 0 && (
                <p className="text-xs text-muted mt-1">
                  ≈ {formatBRL(restante / mesesRestantes)} por mês até dezembro
                </p>
              )}
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-muted mb-1.5">Média por mês (÷ 12)</p>
              <p className="text-xl font-semibold">{formatBRL(emitido / 12)}</p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 mb-6">
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className={`h-full ${barra}`} style={{ width: `${Math.min(usado, 100)}%` }} />
            </div>
            {excedido > 0 && (
              <p className="text-xs text-danger mt-2">
                O teto de {anoSel.ano} foi ultrapassado em {formatBRL(excedido)}.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {MESES.map((nome, i) => (
              <div key={nome} className="bg-surface border border-border rounded-xl p-3">
                <p className="text-xs text-muted mb-1">{nome}</p>
                {porMes[i].qtd === 0 ? (
                  <p className="text-xs text-muted">Sem emissão</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-brand-lime">{formatBRL(porMes[i].total)}</p>
                    <p className="text-[11px] text-muted">
                      {porMes[i].qtd} {porMes[i].qtd === 1 ? "nota" : "notas"}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted bg-surface-2/50 border-b border-border">
                    <th className="px-4 py-3 font-normal">Nº NFE</th>
                    <th className="px-4 py-3 font-normal">Tomador</th>
                    <th className="px-4 py-3 font-normal">Data de emissão</th>
                    <th className="px-4 py-3 font-normal text-right">Valor</th>
                    <th className="px-4 py-3 font-normal">Nota</th>
                    <th className="px-4 py-3 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {nfes.map((n) => (
                    <tr key={n.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                      <td className="px-4 py-3 text-muted">{n.numero ?? "—"}</td>
                      <td className="px-4 py-3">
                        {n.tomador}
                        {n.descricao && <p className="text-xs text-muted mt-0.5">{n.descricao}</p>}
                      </td>
                      <td className="px-4 py-3">{formatDate(n.data_emissao)}</td>
                      <td className="px-4 py-3 text-right font-medium text-brand-lime">{formatBRL(n.valor)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {n.arquivo_path && pdfUrls.get(n.arquivo_path) ? (
                          <a
                            href={pdfUrls.get(n.arquivo_path)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-yellow hover:underline"
                          >
                            Ver PDF
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                        {n.lancamento_id && <p className="text-brand-lime mt-0.5">Em contas a receber</p>}
                      </td>
                      <td className="px-4 py-3">
                        <NfeRowActions nfe={n} />
                      </td>
                    </tr>
                  ))}
                  {nfes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        Nenhuma NFE emitida em {anoSel.ano}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
