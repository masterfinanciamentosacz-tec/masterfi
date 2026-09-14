import Link from "next/link";

const TONE_MAP = {
  lime: "text-brand-lime",
  yellow: "text-brand-yellow",
  amber: "text-brand-amber",
  orange: "text-brand-orange",
} as const;

export function KpiCard({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string;
  tone: keyof typeof TONE_MAP;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className={`text-xl font-semibold ${TONE_MAP[tone]}`}>{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block bg-surface border border-border rounded-xl p-4 hover:border-brand-amber transition-colors"
      >
        {content}
      </Link>
    );
  }

  return <div className="bg-surface border border-border rounded-xl p-4">{content}</div>;
}
