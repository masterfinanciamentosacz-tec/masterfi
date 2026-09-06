"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LancamentoCategoria, LancamentoTipo } from "@/lib/types";

export type LancamentoFormState = { error: string | null; ok?: boolean };

type LancamentoPayload = {
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_emissao: string | null;
  data_pagamento: string | null;
  numero_nota: string | null;
  cliente_fornecedor: string | null;
  observacoes: string | null;
};

type ParsedPayload =
  | { ok: false; error: string }
  | { ok: true; payload: LancamentoPayload };

function parsePayload(formData: FormData): ParsedPayload {
  const tipo = String(formData.get("tipo")) as LancamentoTipo;
  const categoria = String(formData.get("categoria")) as LancamentoCategoria;
  const descricao = String(formData.get("descricao") || "").trim();
  const valorRaw = String(formData.get("valor") || "0").replace(",", ".");
  const valor = Number(valorRaw);
  const data_vencimento = String(formData.get("data_vencimento") || "");
  const data_emissao = String(formData.get("data_emissao") || "") || null;
  const data_pagamento = String(formData.get("data_pagamento") || "") || null;
  const numero_nota = String(formData.get("numero_nota") || "") || null;
  const cliente_fornecedor = String(formData.get("cliente_fornecedor") || "") || null;
  const observacoes = String(formData.get("observacoes") || "") || null;

  if (!descricao) return { ok: false, error: "Informe uma descrição." };
  if (!Number.isFinite(valor) || valor < 0) return { ok: false, error: "Valor inválido." };
  if (!data_vencimento) return { ok: false, error: "Informe a data de vencimento." };

  return {
    ok: true,
    payload: {
      tipo,
      categoria,
      descricao,
      valor,
      data_vencimento,
      data_emissao,
      data_pagamento,
      numero_nota,
      cliente_fornecedor,
      observacoes,
    },
  };
}

export async function createLancamento(
  _prevState: LancamentoFormState,
  formData: FormData
): Promise<LancamentoFormState> {
  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("lancamentos").insert({
    ...parsed.payload,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function updateLancamento(
  id: string,
  _prevState: LancamentoFormState,
  formData: FormData
): Promise<LancamentoFormState> {
  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };
  const payload = parsed.payload;

  const supabase = await createClient();
  const { error } = await supabase.from("lancamentos").update(payload).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function marcarComoPago(id: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("lancamentos").update({ data_pagamento: today }).eq("id", id);
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
}

export async function excluirLancamento(id: string) {
  const supabase = await createClient();
  await supabase.from("lancamentos").delete().eq("id", id);
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
}
