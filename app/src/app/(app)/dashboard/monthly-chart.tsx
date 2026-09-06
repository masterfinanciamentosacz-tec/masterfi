import { formatBRL } from "@/lib/format";

type Point = { mes: string; receita: number; despesa: number };

export function MonthlyChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted py-10 text-center">Sem dados para o período.</p>;
  }

  const max = Math.max(1, ...data.flatMap((d) => [d.receita, d.despesa]));

  return (
    <div className="flex items-end gap-4 h-56">
      {data.map((d) => {
        const [year, month] = d.mes.split("-");
        const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("pt-BR", {
          month: "short",
        });
        return (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-2 h-full">
            <div className="flex-1 flex items-end gap-1 w-full justify-center">
              <div
                title={`Recebido: ${formatBRL(d.receita)}`}
                className="w-3.5 rounded-t bg-brand-lime"
                style={{ height: `${(d.receita / max) * 100}%` }}
              />
              <div
                title={`Pago: ${formatBRL(d.despesa)}`}
                className="w-3.5 rounded-t bg-brand-orange"
                style={{ height: `${(d.despesa / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted capitalize">{label}</span>
          </div>
        );
      })}
      <div className="flex flex-col gap-2 text-xs text-muted self-start ml-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-lime inline-block" /> Recebido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-orange inline-block" /> Pago
        </span>
      </div>
    </div>
  );
}
