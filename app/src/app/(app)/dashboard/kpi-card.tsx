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
}: {
  label: string;
  value: string;
  tone: keyof typeof TONE_MAP;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className={`text-xl font-semibold ${TONE_MAP[tone]}`}>{value}</p>
    </div>
  );
}
