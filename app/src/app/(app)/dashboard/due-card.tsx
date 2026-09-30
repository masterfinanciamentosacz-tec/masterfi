import Link from "next/link";
import { formatBRL } from "@/lib/format";
import type { Lancamento } from "@/lib/types";

const TONE_MAP = {
  danger: "text-danger",
  yellow: "text-brand-yellow",
  amber: "text-brand-amber",
} as const;

export function DueCard({
  label,
  items,
  tone,
  href,
}: {
  label: string;
  items: Lancamento[];
  tone: keyof typeof TONE_MAP;
  href: string;
}) {
  const total = items.reduce((s, l) => s + l.valor, 0);

  return (
    <Link
      href={href}
      className="block bg-surface border border-border rounded-xl p-4 hover:border-brand-amber transition-colors"
    >
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className={`text-xl font-semibold mb-3 ${TONE_MAP[tone]}`}>{formatBRL(total)}</p>

      {items.length === 0 ? (
        <p className="text-xs text-muted">Nada por aqui.</p>
      ) : (
        <ul className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin pr-1">
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
