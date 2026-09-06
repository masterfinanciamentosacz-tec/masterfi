"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardFilters({ de, ate }: { de: string; ate: string }) {
  const router = useRouter();
  const [deVal, setDeVal] = useState(de);
  const [ateVal, setAteVal] = useState(ate);

  function apply() {
    const params = new URLSearchParams();
    if (deVal) params.set("de", deVal);
    if (ateVal) params.set("ate", ateVal);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={deVal}
        onChange={(e) => setDeVal(e.target.value)}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      />
      <span className="text-muted text-sm">até</span>
      <input
        type="date"
        value={ateVal}
        onChange={(e) => setAteVal(e.target.value)}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      />
      <button
        onClick={apply}
        className="rounded-lg bg-brand-yellow text-[#1a1200] text-sm font-medium px-4 py-1.5 hover:brightness-105 transition"
      >
        Filtrar
      </button>
    </div>
  );
}
