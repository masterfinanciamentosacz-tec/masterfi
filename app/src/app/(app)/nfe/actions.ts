"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NfeState = { error: string | null; ok?: boolean; values?: Record<string, string> };

// Devolve o que o usuario digitou, para o formulario nao ficar em branco depois de um erro.
function echo(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of ["numero", "tomador", "data_emissao", "valor"]) out[k] = String(formData.get(k) || "");
  return out;
}

type Parsed =
  | { ok: false; error: string }
  | { ok: true; numero: string | null; tomador: string; data_emissao: string; valor: number };

function parseNfe(formData: FormData): Parsed {
  const numero = String(formData.get("numero") || "").trim() || null;
  const tomador = String(formData.get("tomador") || "").trim();
  const data_emissao = String(formData.get("data_emissao") || "");
  const valor = Number(String(formData.get("valor") || "").replace(",", "."));

  if (!tomador) return { ok: false, error: "Informe o tomador." };
  if (!data_emissao) return { ok: false, error: "Informe a data de emissão." };
  if (!Number.isFinite(valor) || valor < 0) return { ok: false, error: "Valor inválido." };

  return { ok: true, numero, tomador, data_emissao, valor };
}

async function anoCadastrado(ano: number) {
  const supabase = await createClient();
  const { data } = await supabase.from("nfe_anos").select("ano").eq("ano", ano).maybeSingle();
  return !!data;
}

export async function createNfe(_prev: NfeState, formData: FormData): Promise<NfeState> {
  const parsed = parseNfe(formData);
  if (!parsed.ok) return { error: parsed.error, values: echo(formData) };

  const ano = Number(parsed.data_emissao.slice(0, 4));
  if (!(await anoCadastrado(ano))) {
    return {
      error: `O ano ${ano} ainda não está cadastrado. Use o botão "+ Ano" para definir o teto dele.`,
      values: echo(formData),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("nfes").insert({
    numero: parsed.numero,
    tomador: parsed.tomador,
    data_emissao: parsed.data_emissao,
    valor: parsed.valor,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message, values: echo(formData) };

  revalidatePath("/nfe");
  return { error: null, ok: true };
}

export async function updateNfe(id: string, _prev: NfeState, formData: FormData): Promise<NfeState> {
  const parsed = parseNfe(formData);
  if (!parsed.ok) return { error: parsed.error, values: echo(formData) };

  const ano = Number(parsed.data_emissao.slice(0, 4));
  if (!(await anoCadastrado(ano))) {
    return {
      error: `O ano ${ano} ainda não está cadastrado. Use o botão "+ Ano" para definir o teto dele.`,
      values: echo(formData),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nfes")
    .update({
      numero: parsed.numero,
      tomador: parsed.tomador,
      data_emissao: parsed.data_emissao,
      valor: parsed.valor,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/nfe");
  return { error: null, ok: true };
}

export async function excluirNfe(id: string) {
  const supabase = await createClient();
  await supabase.from("nfes").delete().eq("id", id);
  revalidatePath("/nfe");
}

export async function salvarAno(_prev: NfeState, formData: FormData): Promise<NfeState> {
  const ano = Number(formData.get("ano"));
  const teto = Number(String(formData.get("teto") || "").replace(",", "."));

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) return { error: "Ano inválido." };
  if (!Number.isFinite(teto) || teto <= 0) return { error: "Informe o teto anual." };

  const supabase = await createClient();
  const { error } = await supabase.from("nfe_anos").upsert({ ano, teto });
  if (error) return { error: error.message };

  revalidatePath("/nfe");
  return { error: null, ok: true };
}
