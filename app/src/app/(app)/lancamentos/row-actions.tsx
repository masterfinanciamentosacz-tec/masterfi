"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marcarComoPago, excluirLancamento } from "./actions";
import { LancamentoForm } from "./lancamento-form";
import type { Lancamento } from "@/lib/types";

export function RowActions({ lancamento }: { lancamento: Lancamento }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const isSettled = lancamento.status === "pago" || lancamento.status === "recebido";

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        {!isSettled && (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await marcarComoPago(lancamento.id);
              setBusy(false);
              router.refresh();
            }}
            className="text-xs px-2 py-1 rounded-md bg-brand-lime/15 text-brand-lime hover:brightness-110"
          >
            {lancamento.tipo === "receita" ? "Marcar recebido" : "Marcar pago"}
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-xs px-2 py-1 rounded-md bg-surface-2 text-muted hover:text-foreground"
        >
          Editar
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            if (!confirm("Excluir este lançamento?")) return;
            setBusy(true);
            await excluirLancamento(lancamento.id);
            setBusy(false);
            router.refresh();
          }}
          className="text-xs px-2 py-1 rounded-md bg-danger/10 text-danger hover:brightness-110"
        >
          Excluir
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Editar lançamento</h2>
              <button onClick={() => setEditing(false)} className="text-muted hover:text-foreground text-xl leading-none">
                ×
              </button>
            </div>
            <LancamentoForm
              existing={lancamento}
              onDone={() => {
                setEditing(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
