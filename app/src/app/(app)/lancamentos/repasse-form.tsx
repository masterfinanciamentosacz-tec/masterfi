"use client";

import { useActionState, useEffect, useState } from "react";
import { createRepasse, type RepasseFormState } from "./actions";
import { todayISO } from "@/lib/format";

const initialState: RepasseFormState = { error: null };

export function RepasseForm({ onDone }: { onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(createRepasse, initialState);
  const [direcao, setDirecao] = useState<"pf_para_pj" | "pj_para_pf">("pf_para_pj");

  useEffect(() => {
    if (state.ok && onDone) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <p className="col-span-2 text-xs text-muted -mt-1">
        Use quando dinheiro pessoal cobre a empresa (ou vice-versa). O sistema lança automaticamente a saída
        de um lado e a entrada do outro, e mantém os dois saldos corretos.
      </p>

      <div className="col-span-2 flex gap-2">
        <button
          type="button"
          onClick={() => setDirecao("pf_para_pj")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium border transition ${
            direcao === "pf_para_pj"
              ? "bg-brand-yellow/15 border-brand-yellow text-brand-yellow"
              : "border-border text-muted"
          }`}
        >
          PF → PJ (sócio ajudou a empresa)
        </button>
        <button
          type="button"
          onClick={() => setDirecao("pj_para_pf")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium border transition ${
            direcao === "pj_para_pf"
              ? "bg-brand-yellow/15 border-brand-yellow text-brand-yellow"
              : "border-border text-muted"
          }`}
        >
          PJ → PF (empresa devolveu / distribuiu)
        </button>
      </div>
      <input type="hidden" name="direcao" value={direcao} />

      <div className="col-span-2">
        <label className="block text-xs text-muted mb-1">Descrição</label>
        <input
          name="descricao"
          placeholder="Ex.: Sócio cobriu fatura do cartão da empresa"
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Valor (R$) *</label>
        <input
          name="valor"
          required
          type="number"
          step="0.01"
          min="0.01"
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Data *</label>
        <input
          name="data_vencimento"
          type="date"
          required
          defaultValue={todayISO()}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs text-muted mb-1">Já foi efetivado? (data de pagamento)</label>
        <input
          name="data_pagamento"
          type="date"
          defaultValue={todayISO()}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs text-muted mb-1">Observações</label>
        <textarea
          name="observacoes"
          rows={2}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber resize-none"
        />
      </div>

      {state.error && <p className="col-span-2 text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded-lg bg-brand-yellow text-[#1a1200] font-medium py-2.5 text-sm hover:brightness-105 disabled:opacity-60 transition"
      >
        {pending ? "Salvando..." : "Registrar repasse"}
      </button>
    </form>
  );
}
