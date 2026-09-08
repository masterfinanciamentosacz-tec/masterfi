"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORIA_LABEL, ENTIDADE_LABEL, STATUS_LABEL } from "@/lib/types";

export function FiltersBar({
  initial,
}: {
  initial: { tipo: string; categoria: string; status: string; entidade: string; de: string; ate: string; q: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [f, setF] = useState(initial);

  function apply() {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/lancamentos?${params.toString()}`);
  }

  function clear() {
    setF({ tipo: "", categoria: "", status: "", entidade: "", de: "", ate: "", q: "" });
    router.push("/lancamentos");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-surface border border-border rounded-xl p-3 mb-4">
      <input
        placeholder="Buscar descrição, cliente..."
        value={f.q}
        onChange={(e) => setF({ ...f, q: e.target.value })}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber min-w-[200px] flex-1"
      />
      <select
        value={f.entidade}
        onChange={(e) => setF({ ...f, entidade: e.target.value })}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      >
        <option value="">PF e PJ</option>
        {Object.entries(ENTIDADE_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select
        value={f.tipo}
        onChange={(e) => setF({ ...f, tipo: e.target.value })}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      >
        <option value="">Todos os tipos</option>
        <option value="receita">Receita</option>
        <option value="despesa">Despesa</option>
      </select>
      <select
        value={f.categoria}
        onChange={(e) => setF({ ...f, categoria: e.target.value })}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      >
        <option value="">Todas categorias</option>
        {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select
        value={f.status}
        onChange={(e) => setF({ ...f, status: e.target.value })}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      >
        <option value="">Todos status</option>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={f.de}
        onChange={(e) => setF({ ...f, de: e.target.value })}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      />
      <input
        type="date"
        value={f.ate}
        onChange={(e) => setF({ ...f, ate: e.target.value })}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-amber"
      />
      <button
        onClick={apply}
        className="rounded-lg bg-brand-yellow text-[#1a1200] text-sm font-medium px-4 py-1.5 hover:brightness-105 transition"
      >
        Filtrar
      </button>
      <button onClick={clear} className="text-sm text-muted hover:text-foreground px-2">
        Limpar
      </button>
    </div>
  );
}
