"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCaixinha, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

export function NewCaixinhaButton({ variant = "default" }: { variant?: "default" | "empty" }) {
  const [open, setOpen] = useState(false);
  const [entidade, setEntidade] = useState<"pf" | "pj">("pj");
  const [state, formAction, pending] = useActionState(createCaixinha, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <>
      {variant === "empty" ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full min-h-[170px] rounded-xl border border-dashed border-border text-muted text-sm hover:text-foreground hover:border-brand-amber transition-colors"
        >
          + Nova caixinha
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-brand-yellow text-[#1a1200] text-sm font-medium px-4 py-2 hover:brightness-105 transition"
        >
          + Nova caixinha
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Nova caixinha</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground text-xl leading-none">
                ×
              </button>
            </div>

            <form action={formAction} className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Nome *</label>
                <input
                  name="nome"
                  required
                  placeholder="Ex.: Reserva de emergência"
                  className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
                />
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">De qual "bolso" é essa reserva? *</label>
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

              <div>
                <label className="block text-xs text-muted mb-1">Meta (R$) — opcional</label>
                <input
                  name="meta_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Deixe em branco se não tiver meta"
                  className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber"
                />
              </div>

              {state.error && <p className="text-sm text-danger">{state.error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-brand-yellow text-[#1a1200] font-medium py-2.5 text-sm hover:brightness-105 disabled:opacity-60 transition"
              >
                {pending ? "Criando..." : "Criar caixinha"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
