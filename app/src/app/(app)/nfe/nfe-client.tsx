"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createNfe, updateNfe, excluirNfe, salvarAno, type NfeState } from "./actions";
import type { Nfe, NfeAno } from "@/lib/types";

const initial: NfeState = { error: null };
const inputCls =
  "w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber";
const submitCls =
  "w-full rounded-lg bg-brand-yellow text-[#1a1200] font-medium py-2.5 text-sm hover:brightness-105 disabled:opacity-60 transition";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NfeForm({
  existing,
  defaultDate,
  onDone,
}: {
  existing?: Nfe;
  defaultDate: string;
  onDone: () => void;
}) {
  const action = existing ? updateNfe.bind(null, existing.id) : createNfe;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs text-muted mb-1">Número da NFE</label>
        <input name="numero" defaultValue={existing?.numero ?? ""} autoFocus className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Tomador *</label>
        <input
          name="tomador"
          required
          placeholder="CNPJ/CPF - Nome"
          defaultValue={existing?.tomador ?? ""}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Data de emissão *</label>
          <input
            name="data_emissao"
            type="date"
            required
            defaultValue={existing?.data_emissao ?? defaultDate}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Valor da NFE (R$) *</label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={existing?.valor}
            className={inputCls}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className={submitCls}>
        {pending ? "Salvando..." : existing ? "Salvar alterações" : "Adicionar NFE"}
      </button>
    </form>
  );
}

function AnoForm({ existing, onDone }: { existing?: NfeAno; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(salvarAno, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs text-muted mb-1">Ano *</label>
        {existing ? (
          <>
            <input type="hidden" name="ano" value={existing.ano} />
            <p className="text-sm py-2">{existing.ano}</p>
          </>
        ) : (
          <input
            name="ano"
            type="number"
            min="2000"
            max="2100"
            required
            defaultValue={new Date().getFullYear() + 1}
            className={inputCls}
          />
        )}
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Teto anual (R$) *</label>
        <input
          name="teto"
          type="number"
          step="0.01"
          min="0.01"
          required
          autoFocus
          defaultValue={existing?.teto}
          className={inputCls}
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className={submitCls}>
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

export function AnoTabs({ anos, selecionado }: { anos: NfeAno[]; selecionado: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {anos.map((a) => (
            <button
              key={a.ano}
              onClick={() => router.push(`/nfe?ano=${a.ano}`)}
              className={`px-4 py-1.5 rounded-md text-sm transition ${
                a.ano === selecionado ? "bg-brand-yellow text-[#1a1200] font-medium" : "text-muted hover:text-foreground"
              }`}
            >
              {a.ano}
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(true)} className="text-sm text-muted hover:text-foreground px-2 py-1.5">
          + Ano
        </button>
      </div>

      {open && (
        <Modal title="Novo ano" onClose={() => setOpen(false)}>
          <AnoForm
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </Modal>
      )}
    </>
  );
}

export function EditarTetoButton({ ano }: { ano: NfeAno }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-muted hover:text-foreground">
        Editar teto
      </button>
      {open && (
        <Modal title={`Teto de ${ano.ano}`} onClose={() => setOpen(false)}>
          <AnoForm
            existing={ano}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </Modal>
      )}
    </>
  );
}

export function NovaNfeButton({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-yellow text-[#1a1200] text-sm font-medium px-4 py-2 hover:brightness-105 transition"
      >
        + Nova NFE
      </button>
      {open && (
        <Modal title="Nova NFE" onClose={() => setOpen(false)}>
          <NfeForm
            defaultDate={defaultDate}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </Modal>
      )}
    </>
  );
}

export function NfeRowActions({ nfe }: { nfe: Nfe }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => setEditing(true)}
          className="text-xs px-2 py-1 rounded-md bg-surface-2 text-muted hover:text-foreground"
        >
          Editar
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            if (!confirm("Excluir esta NFE?")) return;
            setBusy(true);
            await excluirNfe(nfe.id);
            setBusy(false);
            router.refresh();
          }}
          className="text-xs px-2 py-1 rounded-md bg-danger/10 text-danger hover:brightness-110"
        >
          Excluir
        </button>
      </div>

      {editing && (
        <Modal title="Editar NFE" onClose={() => setEditing(false)}>
          <NfeForm
            existing={nfe}
            defaultDate={nfe.data_emissao}
            onDone={() => {
              setEditing(false);
              router.refresh();
            }}
          />
        </Modal>
      )}
    </>
  );
}
