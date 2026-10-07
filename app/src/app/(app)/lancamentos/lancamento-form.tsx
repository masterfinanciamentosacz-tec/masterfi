"use client";

import { useActionState, useEffect, useState } from "react";
import { createLancamento, updateLancamento, type LancamentoFormState } from "./actions";
import { CATEGORIA_LABEL, CATEGORIA_OPTIONS } from "@/lib/types";
import type { Caixinha, Entidade, Lancamento } from "@/lib/types";
import { ENTIDADE_LABEL } from "@/lib/types";
import { todayISO } from "@/lib/format";

const initialState: LancamentoFormState = { error: null };

export function LancamentoForm({
  existing,
  onDone,
  caixinhas = [],
}: {
  existing?: Lancamento;
  onDone?: () => void;
  caixinhas?: Caixinha[];
}) {
  const action = existing ? updateLancamento.bind(null, existing.id) : createLancamento;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tipo, setTipo] = useState<"receita" | "despesa">(existing?.tipo ?? "receita");
  const [entidade, setEntidade] = useState<Entidade>(existing?.entidade ?? "pj");
  const [poupar, setPoupar] = useState(false);
  const [caixinhaId, setCaixinhaId] = useState("");

  // Guardar na poupanca so existe ao criar uma saida (despesa)
  const podePoupar = !existing && tipo === "despesa";
  const guardando = podePoupar && poupar && caixinhas.length > 0;

  function escolherCaixinha(id: string) {
    setCaixinhaId(id);
    const c = caixinhas.find((x) => x.id === id);
    if (c) setEntidade(c.entidade);
  }

  useEffect(() => {
    if (state.ok && onDone) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <div className="col-span-2 flex gap-2">
        <button
          type="button"
          onClick={() => setTipo("receita")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium border transition ${
            tipo === "receita"
              ? "bg-brand-lime/15 border-brand-lime text-brand-lime"
              : "border-border text-muted"
          }`}
        >
          Entrada (receita)
        </button>
        <button
          type="button"
          onClick={() => setTipo("despesa")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium border transition ${
            tipo === "despesa"
              ? "bg-brand-orange/15 border-brand-orange text-brand-orange"
              : "border-border text-muted"
          }`}
        >
          Saída (despesa)
        </button>
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      <div className="col-span-2">
        <label className="block text-xs text-muted mb-1">Este lançamento é de qual "bolso"? *</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEntidade("pf")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium border transition ${
              entidade === "pf" ? "bg-brand-yellow/15 border-brand-yellow text-brand-yellow" : "border-border text-muted"
            }`}
          >
            Pessoa Física
          </button>
          <button
            type="button"
            onClick={() => setEntidade("pj")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium border transition ${
              entidade === "pj" ? "bg-brand-yellow/15 border-brand-yellow text-brand-yellow" : "border-border text-muted"
            }`}
          >
            Pessoa Jurídica
          </button>
        </div>
        <input type="hidden" name="entidade" value={entidade} />
      </div>

      {podePoupar && (
        <div className="col-span-2 rounded-lg border border-border bg-surface-2/40 p-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={poupar}
              onChange={(e) => setPoupar(e.target.checked)}
              className="accent-[#f2cb05]"
            />
            Guardar esse valor na poupança
          </label>

          {poupar && caixinhas.length === 0 && (
            <p className="text-xs text-muted mt-2">
              Você ainda não tem nenhuma caixinha. Crie uma na aba Poupança e volte aqui.
            </p>
          )}

          {poupar && caixinhas.length > 0 && (
            <div className="mt-3">
              <label className="block text-xs text-muted mb-1">Em qual caixinha? *</label>
              <select
                name="caixinha_id"
                required
                value={caixinhaId}
                onChange={(e) => escolherCaixinha(e.target.value)}
                className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
              >
                <option value="">Selecione...</option>
                {caixinhas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {ENTIDADE_LABEL[c.entidade]}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted mt-1">
                O valor sai do bolso escolhido acima e soma direto no saldo da caixinha.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="col-span-2">
        <label className="block text-xs text-muted mb-1">Descrição *</label>
        <input
          name="descricao"
          required
          defaultValue={existing?.descricao}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      {!guardando && (
        <div>
          <label className="block text-xs text-muted mb-1">Categoria *</label>
          <select
            name="categoria"
            required
            defaultValue={existing?.categoria ?? "gasto_despesa"}
            className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
          >
            {(existing && !CATEGORIA_OPTIONS.includes(existing.categoria)
              ? [existing.categoria, ...CATEGORIA_OPTIONS]
              : CATEGORIA_OPTIONS
            ).map((k) => (
              <option key={k} value={k}>
                {CATEGORIA_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-muted mb-1">
          {guardando ? "Valor (R$) *" : "Valor por parcela (R$) *"}
        </label>
        <input
          name="valor"
          required
          type="number"
          step="0.01"
          min="0"
          defaultValue={existing?.valor}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Cliente / Fornecedor</label>
        <input
          name="cliente_fornecedor"
          defaultValue={existing?.cliente_fornecedor ?? ""}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Nº da nota fiscal</label>
        <input
          name="numero_nota"
          defaultValue={existing?.numero_nota ?? ""}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      {!existing && !guardando && (
        <div>
          <label className="block text-xs text-muted mb-1">Número de parcelas</label>
          <input
            name="parcelas"
            type="number"
            min="1"
            max="360"
            defaultValue={1}
            className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
          />
          <p className="text-[11px] text-muted mt-1">
            Se maior que 1, gera as parcelas seguintes automaticamente (mensal), a partir do vencimento abaixo.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs text-muted mb-1">Data de emissão</label>
        <input
          name="data_emissao"
          type="date"
          defaultValue={existing?.data_emissao ?? ""}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">
          {existing?.parcela_total ? `Vencimento (parcela ${existing.parcela_atual}/${existing.parcela_total})` : "Data de vencimento *"}
        </label>
        <input
          name="data_vencimento"
          type="date"
          required
          defaultValue={existing?.data_vencimento ?? todayISO()}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Data de pagamento{!existing && !guardando ? " (1ª parcela)" : ""}</label>
        <input
          name="data_pagamento"
          type="date"
          defaultValue={existing?.data_pagamento ?? ""}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs text-muted mb-1">Observações</label>
        <textarea
          name="observacoes"
          defaultValue={existing?.observacoes ?? ""}
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
        {pending ? "Salvando..." : existing ? "Salvar alterações" : "Adicionar lançamento"}
      </button>
    </form>
  );
}
