"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LancamentoForm } from "./lancamento-form";
import { RepasseForm } from "./repasse-form";
import type { Caixinha } from "@/lib/types";

export function NewLancamentoButton({ caixinhas = [] }: { caixinhas?: Caixinha[] }) {
  const [open, setOpen] = useState(false);
  const [aba, setAba] = useState<"lancamento" | "repasse">("lancamento");
  const router = useRouter();

  function close() {
    setOpen(false);
    setAba("lancamento");
  }

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
              <button onClick={close} className="text-muted hover:text-foreground text-xl leading-none">
                ×
              </button>
            </div>

            <div className="flex gap-1 mb-5 bg-surface-2 rounded-lg p-1">
              <button
                onClick={() => setAba("lancamento")}
                className={`flex-1 rounded-md py-1.5 text-sm transition ${
                  aba === "lancamento" ? "bg-brand-yellow text-[#1a1200] font-medium" : "text-muted"
                }`}
              >
                Lançamento
              </button>
              <button
                onClick={() => setAba("repasse")}
                className={`flex-1 rounded-md py-1.5 text-sm transition ${
                  aba === "repasse" ? "bg-brand-yellow text-[#1a1200] font-medium" : "text-muted"
                }`}
              >
                Repasse PF ↔ PJ
              </button>
            </div>

            {aba === "lancamento" ? (
              <LancamentoForm
                caixinhas={caixinhas}
                onDone={() => {
                  close();
                  router.refresh();
                }}
              />
            ) : (
              <RepasseForm
                onDone={() => {
                  close();
                  router.refresh();
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
