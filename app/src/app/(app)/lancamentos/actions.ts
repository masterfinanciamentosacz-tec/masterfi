"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Entidade, LancamentoCategoria, LancamentoTipo } from "@/lib/types";

export type LancamentoFormState = { error: string | null; ok?: boolean };

type LancamentoPayload = {
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  entidade: Entidade;
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
  | { ok: true; payload: LancamentoPayload; parcelas: number };

function addMonths(dateISO: string, months: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

function parsePayload(formData: FormData): ParsedPayload {
  const tipo = String(formData.get("tipo")) as LancamentoTipo;
  const categoria = String(formData.get("categoria")) as LancamentoCategoria;
  const entidade = String(formData.get("entidade") || "pj") as Entidade;
  const descricao = String(formData.get("descricao") || "").trim();
  const valorRaw = String(formData.get("valor") || "0").replace(",", ".");
  const valor = Number(valorRaw);
  const data_vencimento = String(formData.get("data_vencimento") || "");
  const data_emissao = String(formData.get("data_emissao") || "") || null;
  const data_pagamento = String(formData.get("data_pagamento") || "") || null;
  const numero_nota = String(formData.get("numero_nota") || "") || null;
  const cliente_fornecedor = String(formData.get("cliente_fornecedor") || "") || null;
  const observacoes = String(formData.get("observacoes") || "") || null;
  const parcelas = Math.max(1, Number(formData.get("parcelas") || "1") || 1);

  if (!descricao) return { ok: false, error: "Informe uma descrição." };
  if (!Number.isFinite(valor) || valor < 0) return { ok: false, error: "Valor inválido." };
  if (!data_vencimento) return { ok: false, error: "Informe a data de vencimento." };

  return {
    ok: true,
    parcelas,
    payload: {
      tipo,
      categoria,
      entidade,
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

  const { payload, parcelas } = parsed;

  // "Guardar na poupanca": o lancamento vira um deposito ja efetivado naquela caixinha.
  const caixinha_id = String(formData.get("caixinha_id") || "") || null;
  if (caixinha_id) {
    if (payload.tipo !== "despesa") {
      return { error: "Só dá pra guardar na poupança a partir de uma saída." };
    }
    const { error } = await supabase.from("lancamentos").insert({
      ...payload,
      categoria: "poupanca_deposito",
      caixinha_id,
      data_pagamento: payload.data_pagamento ?? payload.data_vencimento,
      created_by: user?.id ?? null,
    });
    if (error) return { error: error.message };

    revalidatePath("/lancamentos");
    revalidatePath("/dashboard");
    revalidatePath("/poupanca");
    return { error: null, ok: true };
  }

  if (parcelas <= 1) {
    const { error } = await supabase.from("lancamentos").insert({
      ...payload,
      created_by: user?.id ?? null,
    });
    if (error) return { error: error.message };
  } else {
    const grupo_parcelamento = crypto.randomUUID();
    const rows = Array.from({ length: parcelas }, (_, i) => ({
      ...payload,
      descricao: `${payload.descricao} (${i + 1}/${parcelas})`,
      data_vencimento: addMonths(payload.data_vencimento, i),
      // apenas a primeira parcela herda a data de pagamento informada, se houver
      data_pagamento: i === 0 ? payload.data_pagamento : null,
      parcela_atual: i + 1,
      parcela_total: parcelas,
      grupo_parcelamento,
      created_by: user?.id ?? null,
    }));
    const { error } = await supabase.from("lancamentos").insert(rows);
    if (error) return { error: error.message };
  }

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

export type RepasseFormState = { error: string | null; ok?: boolean };

export async function createRepasse(
  _prevState: RepasseFormState,
  formData: FormData
): Promise<RepasseFormState> {
  const direcao = String(formData.get("direcao") || "pf_para_pj"); // pf_para_pj | pj_para_pf
  const descricao = String(formData.get("descricao") || "").trim() || "Repasse entre PF e PJ";
  const valorRaw = String(formData.get("valor") || "0").replace(",", ".");
  const valor = Number(valorRaw);
  const data_vencimento = String(formData.get("data_vencimento") || "");
  const data_pagamento = String(formData.get("data_pagamento") || "") || null;
  const observacoes = String(formData.get("observacoes") || "") || null;

  if (!Number.isFinite(valor) || valor <= 0) return { error: "Valor inválido." };
  if (!data_vencimento) return { error: "Informe a data." };

  const origem: Entidade = direcao === "pf_para_pj" ? "pf" : "pj";
  const destino: Entidade = direcao === "pf_para_pj" ? "pj" : "pf";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = {
    categoria: "repasse_pf_pj" as const,
    descricao,
    valor,
    data_vencimento,
    data_emissao: null,
    data_pagamento,
    numero_nota: null,
    cliente_fornecedor: null,
    observacoes,
    created_by: user?.id ?? null,
  };

  const { data: saida, error: errSaida } = await supabase
    .from("lancamentos")
    .insert({ ...base, tipo: "despesa", entidade: origem })
    .select("id")
    .single();

  if (errSaida || !saida) return { error: errSaida?.message ?? "Falha ao criar repasse." };

  const { data: entrada, error: errEntrada } = await supabase
    .from("lancamentos")
    .insert({ ...base, tipo: "receita", entidade: destino, transferencia_par_id: saida.id })
    .select("id")
    .single();

  if (errEntrada || !entrada) {
    await supabase.from("lancamentos").delete().eq("id", saida.id);
    return { error: errEntrada?.message ?? "Falha ao criar repasse." };
  }

  await supabase.from("lancamentos").update({ transferencia_par_id: entrada.id }).eq("id", saida.id);

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}
