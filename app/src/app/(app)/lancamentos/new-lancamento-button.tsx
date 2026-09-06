"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LancamentoForm } from "./lancamento-form";

export function NewLancamentoButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-yellow text-[#1a1200] text-sm font-medium px-4 py-2 hover:brightness-105 transition"
      >
        + Novo lançamento
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Novo lançamento</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground text-xl leading-none">
                ×
              </button>
            </div>
            <LancamentoForm
              onDone={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
