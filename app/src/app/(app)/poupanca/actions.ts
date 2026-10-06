"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Entidade } from "@/lib/types";

export type ActionState = { error: string | null; ok?: boolean };

export async function createCaixinha(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nome = String(formData.get("nome") || "").trim();
  const entidade = String(formData.get("entidade") || "pj") as Entidade;
  const metaRaw = String(formData.get("meta_valor") || "").replace(",", ".");
  const meta_valor = metaRaw ? Number(metaRaw) : null;

  if (!nome) return { error: "Dê um nome para a caixinha." };
  if (meta_valor !== null && (!Number.isFinite(meta_valor) || meta_valor <= 0)) {
    return { error: "Meta inválida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("caixinhas").insert({
    nome,
    entidade,
    meta_valor,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/poupanca");
  return { error: null, ok: true };
}

export async function excluirCaixinha(id: string) {
  const supabase = await createClient();
  await supabase.from("caixinhas").delete().eq("id", id);
  revalidatePath("/poupanca");
  revalidatePath("/lancamentos");
}

async function movimentarCaixinha(
  formData: FormData,
  tipo: "despesa" | "receita",
  categoria: "poupanca_deposito" | "poupanca_resgate"
): Promise<ActionState> {
  const caixinha_id = String(formData.get("caixinha_id") || "");
  const entidade = String(formData.get("entidade") || "pj") as Entidade;
  const valorRaw = String(formData.get("valor") || "0").replace(",", ".");
  const valor = Number(valorRaw);
  const data = String(formData.get("data") || "");
  const observacoes = String(formData.get("observacoes") || "") || null;

  if (!caixinha_id) return { error: "Caixinha inválida." };
  if (!Number.isFinite(valor) || valor <= 0) return { error: "Valor inválido." };
  if (!data) return { error: "Informe a data." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const descricaoBase = categoria === "poupanca_deposito" ? "Depósito em poupança" : "Resgate de poupança";

  const { error } = await supabase.from("lancamentos").insert({
    tipo,
    categoria,
    entidade,
    descricao: descricaoBase,
    valor,
    data_vencimento: data,
    data_pagamento: data,
    caixinha_id,
    observacoes,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/poupanca");
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function registrarRendimento(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const caixinha_id = String(formData.get("caixinha_id") || "");
  const valorRaw = String(formData.get("valor") || "0").replace(",", ".");
  const valor = Number(valorRaw);
  const data = String(formData.get("data") || "");
  const observacoes = String(formData.get("observacoes") || "") || null;

  if (!caixinha_id) return { error: "Caixinha inválida." };
  if (!Number.isFinite(valor) || valor <= 0) return { error: "Valor inválido." };
  if (!data) return { error: "Informe a data." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("caixinha_rendimentos").insert({
    caixinha_id,
    valor,
    data,
    observacoes,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/poupanca");
  return { error: null, ok: true };
}

export async function depositar(_prevState: ActionState, formData: FormData) {
  return movimentarCaixinha(formData, "despesa", "poupanca_deposito");
}

export async function resgatar(_prevState: ActionState, formData: FormData) {
  return movimentarCaixinha(formData, "receita", "poupanca_resgate");
}
