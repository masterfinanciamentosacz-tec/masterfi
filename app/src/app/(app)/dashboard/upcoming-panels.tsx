import { formatBRL } from "@/lib/format";
import type { Lancamento } from "@/lib/types";

function diasAte(hoje: string, venc: string) {
  const [y1, m1, d1] = hoje.split("-").map(Number);
  const [y2, m2, d2] = venc.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function quando(dias: number) {
  if (dias < 0) return `venceu há ${-dias} ${-dias === 1 ? "dia" : "dias"}`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `em ${dias} dias`;
}

function Panel({
  title,
  items,
  hoje,
  valueClass,
  barClass,
}: {
  title: string;
  items: Lancamento[];
  hoje: string;
  valueClass: string;
  barClass: string;
}) {
  const total = items.reduce((s, l) => s + l.valor, 0);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className={`text-lg font-semibold ${valueClass}`}>{formatBRL(total)}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted py-4">Nada previsto nesse período.</p>
      ) : (
        <ul className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin pr-1">
          {items.map((l) => {
            const dias = diasAte(hoje, l.data_vencimento);
            const urgencia = dias < 0 ? "text-danger" : dias <= 5 ? "text-brand-yellow" : "text-muted";
            return (
              <li
                key={l.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2/60 transition-colors"
              >
                <span className={`w-1 self-stretch rounded-full ${dias < 0 ? "bg-danger" : barClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{l.descricao}</p>
                  <p className={`text-xs ${urgencia}`}>
                    {l.data_vencimento.slice(8, 10)}/{l.data_vencimento.slice(5, 7)} · {quando(dias)}
                  </p>
                </div>
                <span className="text-sm shrink-0">{formatBRL(l.valor)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function UpcomingPanels({
  items,
  hoje,
  dias,
}: {
  items: Lancamento[];
  hoje: string;
  dias: number;
}) {
  const entrar = items.filter((l) => l.tipo === "receita");
  const sair = items.filter((l) => l.tipo === "despesa");
  const saldo =
    entrar.reduce((s, l) => s + l.valor, 0) - sair.reduce((s, l) => s + l.valor, 0);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <div>
          <h2 className="text-sm font-medium text-muted">Próximos vencimentos</h2>
          <p className="text-xs text-muted">Atrasados e tudo que vence nos próximos {dias} dias</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Saldo previsto (entra − sai)</p>
          <p className={`text-lg font-semibold ${saldo >= 0 ? "text-brand-lime" : "text-danger"}`}>
            {formatBRL(saldo)}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Panel title="Vai entrar" items={entrar} hoje={hoje} valueClass="text-brand-lime" barClass="bg-brand-lime" />
        <div className="hidden md:block w-px bg-border" />
        <Panel title="Vai sair" items={sair} hoje={hoje} valueClass="text-brand-orange" barClass="bg-brand-orange" />
      </div>
    </div>
  );
}
