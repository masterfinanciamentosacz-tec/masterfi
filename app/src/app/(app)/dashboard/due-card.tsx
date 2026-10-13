import Link from "next/link";
import { formatBRL } from "@/lib/format";
import type { Lancamento } from "@/lib/types";

const LABEL_TONE = {
  danger: "text-danger",
  yellow: "text-brand-yellow",
  amber: "text-brand-amber",
} as const;

function Section({
  title,
  items,
  valueClass,
  href,
}: {
  title: string;
  items: Lancamento[];
  valueClass: string;
  href: string;
}) {
  const total = items.reduce((s, l) => s + l.valor, 0);

  return (
    <Link href={href} className="block rounded-lg p-2 -mx-2 hover:bg-surface-2/60 transition-colors">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted">{title}</span>
        <span className={`text-lg font-semibold ${valueClass}`}>{formatBRL(total)}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted mt-1">Nada por aqui.</p>
      ) : (
        <ul className="mt-1.5 space-y-1 max-h-24 overflow-y-auto scrollbar-thin pr-1">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted truncate">{l.descricao}</span>
              <span className="shrink-0">{formatBRL(l.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export function DueCard({
  label,
  items,
  tone,
  hrefReceber,
  hrefPagar,
}: {
  label: string;
  items: Lancamento[];
  tone: keyof typeof LABEL_TONE;
  hrefReceber: string;
  hrefPagar: string;
}) {
  const receber = items.filter((l) => l.tipo === "receita");
  const pagar = items.filter((l) => l.tipo === "despesa");

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className={`text-sm font-medium mb-3 ${LABEL_TONE[tone]}`}>{label}</p>
      <div className="space-y-2">
        <Section title="A receber" items={receber} valueClass="text-brand-lime" href={hrefReceber} />
        <div className="border-t border-border" />
        <Section title="A pagar" items={pagar} valueClass="text-brand-orange" href={hrefPagar} />
      </div>
    </div>
  );
}
