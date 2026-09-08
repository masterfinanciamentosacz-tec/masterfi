"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortableHeader({
  field,
  label,
  currentSort,
}: {
  field: string;
  label: string;
  currentSort: string; // ex: "vencimento_desc"
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isActive = currentSort.startsWith(field);
  const isAsc = currentSort === `${field}_asc`;
  const nextDirection = isActive && isAsc ? "desc" : "asc";

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", `${field}_${nextDirection}`);
    router.push(`/lancamentos?${params.toString()}`);
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 font-normal hover:text-foreground transition ${
        isActive ? "text-brand-yellow" : ""
      }`}
      title="Ordenar"
    >
      {label}
      <span className="text-[10px] leading-none">
        {isActive ? (isAsc ? "AZ ▲" : "ZA ▼") : "⇅"}
      </span>
    </button>
  );
}
