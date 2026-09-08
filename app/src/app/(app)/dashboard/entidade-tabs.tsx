"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Entidade } from "@/lib/types";

const OPTIONS: { value: "todos" | Entidade; label: string }[] = [
  { value: "todos", label: "Consolidado" },
  { value: "pj", label: "Pessoa Jurídica" },
  { value: "pf", label: "Pessoa Física" },
];

export function EntidadeTabs({ vista }: { vista: "todos" | Entidade }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function go(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todos") params.delete("vista");
    else params.set("vista", value);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 mb-6 bg-surface border border-border rounded-lg p-1 w-fit">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => go(opt.value)}
          className={`px-4 py-1.5 rounded-md text-sm transition ${
            vista === opt.value ? "bg-brand-yellow text-[#1a1200] font-medium" : "text-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
