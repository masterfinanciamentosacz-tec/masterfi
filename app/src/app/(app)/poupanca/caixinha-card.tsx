"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { depositar, resgatar, registrarRendimento, excluirCaixinha, type ActionState } from "./actions";
import { ENTIDADE_LABEL, type Caixinha, type Entidade } from "@/lib/types";
import { formatBRL, todayISO } from "@/lib/format";

const initialState: ActionState = { error: null };

function MovimentoForm({
  caixinha,
  tipo,
  onDone,
}: {
  caixinha: Caixinha;
  tipo: "deposito" | "resgate";
  onDone: () => void;
}) {
  const action = tipo === "deposito" ? depositar : resgatar;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [entidade, setEntidade] = useState<Entidade>(caixinha.entidade);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="caixinha_id" value={caixinha.id} />
      <input type="hidden" name="entidade" value={entidade} />

      <div>
        <label className="block text-xs text-muted mb-1">
          {tipo === "deposito" ? "De onde sai o dinheiro?" : "Para onde vai o dinheiro?"} *
        </label>
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
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Valor (R$) *</label>
        <input
          name="valor"
          required
          type="number"
          step="0.01"
          min="0.01"
          autoFocus
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Data *</label>
        <input
          name="data"
          type="date"
          required
          defaultValue={todayISO()}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Observações</label>
        <textarea
          name="observacoes"
          rows={2}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber resize-none"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-yellow text-[#1a1200] font-medium py-2.5 text-sm hover:brightness-105 disabled:opacity-60 transition"
      >
        {pending ? "Salvando..." : tipo === "deposito" ? "Confirmar depósito" : "Confirmar resgate"}
      </button>
    </form>
  );
}

function RendimentoForm({ caixinha, onDone }: { caixinha: Caixinha; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(registrarRendimento, initialState);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="caixinha_id" value={caixinha.id} />

      <p className="text-xs text-muted">
        O rendimento soma só no saldo da caixinha. Não sai nem entra no caixa da Pessoa Física ou da Pessoa Jurídica.
      </p>

      <div>
        <label className="block text-xs text-muted mb-1">Valor do rendimento (R$) *</label>
        <input
          name="valor"
          required
          type="number"
          step="0.01"
          min="0.01"
          autoFocus
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Data *</label>
        <input
          name="data"
          type="date"
          required
          defaultValue={todayISO()}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Observações</label>
        <textarea
          name="observacoes"
          rows={2}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber resize-none"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-yellow text-[#1a1200] font-medium py-2.5 text-sm hover:brightness-105 disabled:opacity-60 transition"
      >
        {pending ? "Salvando..." : "Confirmar rendimento"}
      </button>
    </form>
  );
}

export function CaixinhaCard({
  caixinha,
  saldo,
  rendimentos,
}: {
  caixinha: Caixinha;
  saldo: number;
  rendimentos: number;
}) {
  const [modal, setModal] = useState<"deposito" | "resgate" | "rendimento" | null>(null);
  const router = useRouter();

  const progresso = caixinha.meta_valor ? Math.min(100, Math.round((saldo / caixinha.meta_valor) * 100)) : null;

  function close() {
    setModal(null);
    router.refresh();
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">{caixinha.nome}</p>
            <p className="text-xs text-muted">{ENTIDADE_LABEL[caixinha.entidade]}</p>
          </div>
          <button
            onClick={async () => {
              if (!confirm(`Excluir a caixinha "${caixinha.nome}"? O histórico de lançamentos permanece.`)) return;
              await excluirCaixinha(caixinha.id);
              router.refresh();
            }}
            className="text-xs text-muted hover:text-danger"
          >
            Excluir
          </button>
        </div>

        <p className="text-2xl font-bold text-brand-lime mb-1">{formatBRL(saldo)}</p>
        {rendimentos > 0 && (
          <p className="text-xs text-muted mb-3">Inclui {formatBRL(rendimentos)} de rendimentos</p>
        )}
        {rendimentos <= 0 && <div className="mb-2" />}

        {caixinha.meta_valor ? (
          <>
            <p className="text-xs text-muted mb-2">
              Meta: {formatBRL(caixinha.meta_valor)} · {progresso}%
            </p>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-4">
              <div className="h-full bg-brand-yellow" style={{ width: `${progresso}%` }} />
            </div>
          </>
        ) : (
          <p className="text-xs text-muted mb-4">Sem meta definida</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setModal("deposito")}
            className="flex-1 text-xs font-medium py-2 rounded-lg bg-brand-lime/15 text-brand-lime hover:brightness-110"
          >
            + Depositar
          </button>
          <button
            onClick={() => setModal("rendimento")}
            className="flex-1 text-xs font-medium py-2 rounded-lg bg-brand-yellow/15 text-brand-yellow hover:brightness-110"
          >
            + Rendimento
          </button>
          <button
            onClick={() => setModal("resgate")}
            disabled={saldo <= 0}
            className="flex-1 text-xs font-medium py-2 rounded-lg bg-surface-2 text-muted hover:text-foreground disabled:opacity-40"
          >
            Resgatar
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">
                {modal === "deposito"
                  ? `Depositar em "${caixinha.nome}"`
                  : modal === "resgate"
                    ? `Resgatar de "${caixinha.nome}"`
                    : `Rendimento em "${caixinha.nome}"`}
              </h2>
              <button onClick={() => setModal(null)} className="text-muted hover:text-foreground text-xl leading-none">
                ×
              </button>
            </div>
            {modal === "rendimento" ? (
              <RendimentoForm caixinha={caixinha} onDone={close} />
            ) : (
              <MovimentoForm caixinha={caixinha} tipo={modal} onDone={close} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
