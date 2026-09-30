"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: null });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo height={96} />
        </div>

        <form
          action={formAction}
          className="bg-surface border border-border rounded-xl p-6 shadow-xl shadow-black/20"
        >
          <h1 className="text-lg font-semibold mb-1">Entrar</h1>
          <p className="text-sm text-muted mb-6">Acesse o painel financeiro da Master Financiamentos.</p>

          <label className="block text-sm mb-1.5 text-muted">E-mail</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full mb-4 rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber transition-colors"
            placeholder="voce@empresa.com"
          />

          <label className="block text-sm mb-1.5 text-muted">Senha</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full mb-5 rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-brand-amber transition-colors"
            placeholder="••••••••"
          />

          {state.error && (
            <p className="text-sm text-danger mb-4">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-yellow text-[#1a1200] font-medium py-2.5 text-sm hover:brightness-105 disabled:opacity-60 transition"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
