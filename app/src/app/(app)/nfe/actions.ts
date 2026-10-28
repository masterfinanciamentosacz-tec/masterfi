"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseNfsePdf, type NfseDados } from "@/lib/nfse-parser";

export type NfeState = { error: string | null; ok?: boolean };

export type LeituraNfe =
  | { erro: string }
  | {
      numero: string;
      tomador: string;
      dataEmissao: string;
      valor: number;
      descricao: string | null;
    };

const BUCKET = "notas-fiscais";
const MAX_PDF_BYTES = 4 * 1024 * 1024;

function nomeDoTomador(tomador: string) {
  const i = tomador.indexOf(" - ");
  return i >= 0 ? tomador.slice(i + 3).trim() : tomador;
}

function revalidarTudo() {
  revalidatePath("/nfe");
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
}

type ArquivoLido = { bytes: Uint8Array; dados: NfseDados } | { erro: string };

async function lerArquivo(arquivo: FormDataEntryValue | null): Promise<ArquivoLido> {
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Selecione o PDF da nota fiscal." };
  if (arquivo.size > MAX_PDF_BYTES) return { erro: "O PDF é grande demais (máximo de 4 MB)." };

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const cabecalho = new TextDecoder().decode(bytes.slice(0, 5));
  if (cabecalho !== "%PDF-") return { erro: "Esse arquivo não é um PDF." };

  try {
    return { bytes, dados: await parseNfsePdf(bytes.slice()) };
  } catch {
    return { erro: "Não consegui abrir esse PDF." };
  }
}

// Le o PDF e devolve os campos para preencher o formulario (nada e gravado aqui).
export async function lerNotaFiscal(formData: FormData): Promise<LeituraNfe> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." };

  const lido = await lerArquivo(formData.get("arquivo"));
  if ("erro" in lido) return { erro: lido.erro };

  const d = lido.dados;
  if (!d.numero || !d.dataEmissao || d.valor === null) {
    return {
      erro: "Não consegui ler os dados dessa nota. Confira se é o PDF da NFS-e (e não uma foto ou digitalização) ou preencha manualmente.",
    };
  }

  if (d.chaveAcesso) {
    const { data: existente } = await supabase
      .from("nfes")
      .select("numero")
      .eq("chave_acesso", d.chaveAcesso)
      .maybeSingle();
    if (existente) return { erro: `Essa nota (nº ${existente.numero ?? d.numero}) já está cadastrada.` };
  }

  const tomador =
    d.tomadorDocumento && d.tomadorNome
      ? `${d.tomadorDocumento} - ${d.tomadorNome}`
      : (d.tomadorNome ?? d.tomadorDocumento ?? "");

  return { numero: d.numero, tomador, dataEmissao: d.dataEmissao, valor: d.valor, descricao: d.descricao };
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

const ERRO_ANO = (ano: number) =>
  `O ano ${ano} ainda não está cadastrado. Use o botão "+ Ano" para definir o teto dele.`;

export async function createNfe(_prev: NfeState, formData: FormData): Promise<NfeState> {
  const parsed = parseNfe(formData);
  if (!parsed.ok) return { error: parsed.error };

  const ano = Number(parsed.data_emissao.slice(0, 4));
  if (!(await anoCadastrado(ano))) return { error: ERRO_ANO(ano) };

  const lancar = formData.get("lancar_receber") === "on";
  const vencimento = String(formData.get("data_vencimento") || "");
  if (lancar && !vencimento) return { error: "Informe o vencimento da conta a receber." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // PDF (opcional): relê no servidor para pegar a chave de acesso e a descrição do serviço
  let chave: string | null = null;
  let descricao: string | null = null;
  let arquivoPath: string | null = null;
  const arquivo = formData.get("arquivo");

  if (arquivo instanceof File && arquivo.size > 0) {
    const lido = await lerArquivo(arquivo);
    if ("erro" in lido) return { error: lido.erro };

    chave = lido.dados.chaveAcesso;
    descricao = lido.dados.descricao;

    if (chave) {
      const { data: existente } = await supabase.from("nfes").select("numero").eq("chave_acesso", chave).maybeSingle();
      if (existente) return { error: `Essa nota (nº ${existente.numero ?? parsed.numero ?? "?"}) já está cadastrada.` };
    }

    arquivoPath = `${ano}/${chave ?? crypto.randomUUID()}.pdf`;
    const { error: upErro } = await supabase.storage
      .from(BUCKET)
      .upload(arquivoPath, lido.bytes, { contentType: "application/pdf", upsert: false });
    if (upErro) return { error: `Não consegui guardar o PDF: ${upErro.message}` };
  }

  const desfazerArquivo = async () => {
    if (arquivoPath) await supabase.storage.from(BUCKET).remove([arquivoPath]);
  };

  const { data: nfe, error } = await supabase
    .from("nfes")
    .insert({
      numero: parsed.numero,
      tomador: parsed.tomador,
      data_emissao: parsed.data_emissao,
      valor: parsed.valor,
      chave_acesso: chave,
      descricao,
      arquivo_path: arquivoPath,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !nfe) {
    await desfazerArquivo();
    return { error: error?.message ?? "Não consegui salvar a NFE." };
  }

  if (lancar) {
    const { data: lanc, error: lancErro } = await supabase
      .from("lancamentos")
      .insert({
        tipo: "receita",
        categoria: "nota_fiscal_emitida",
        entidade: "pj",
        descricao: descricao ?? `NFE ${parsed.numero ?? ""}`.trim(),
        numero_nota: parsed.numero,
        cliente_fornecedor: nomeDoTomador(parsed.tomador),
        valor: parsed.valor,
        data_emissao: parsed.data_emissao,
        data_vencimento: vencimento,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (lancErro || !lanc) {
      await supabase.from("nfes").delete().eq("id", nfe.id);
      await desfazerArquivo();
      return { error: `Não consegui criar a conta a receber: ${lancErro?.message ?? "erro desconhecido"}` };
    }

    await supabase.from("nfes").update({ lancamento_id: lanc.id }).eq("id", nfe.id);
  }

  revalidarTudo();
  return { error: null, ok: true };
}

export async function updateNfe(id: string, _prev: NfeState, formData: FormData): Promise<NfeState> {
  const parsed = parseNfe(formData);
  if (!parsed.ok) return { error: parsed.error };

  const ano = Number(parsed.data_emissao.slice(0, 4));
  if (!(await anoCadastrado(ano))) return { error: ERRO_ANO(ano) };

  const supabase = await createClient();
  const { data: atual } = await supabase.from("nfes").select("lancamento_id").eq("id", id).maybeSingle();

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

  // Mantém a conta a receber vinculada em dia (se ainda não foi recebida)
  if (atual?.lancamento_id) {
    await supabase
      .from("lancamentos")
      .update({
        numero_nota: parsed.numero,
        cliente_fornecedor: nomeDoTomador(parsed.tomador),
        valor: parsed.valor,
        data_emissao: parsed.data_emissao,
      })
      .eq("id", atual.lancamento_id)
      .neq("status", "recebido");
  }

  revalidarTudo();
  return { error: null, ok: true };
}

export async function excluirNfe(id: string) {
  const supabase = await createClient();
  const { data: nfe } = await supabase.from("nfes").select("lancamento_id,arquivo_path").eq("id", id).maybeSingle();

  // A conta a receber só é removida se ainda não foi recebida
  if (nfe?.lancamento_id) {
    await supabase.from("lancamentos").delete().eq("id", nfe.lancamento_id).neq("status", "recebido");
  }
  if (nfe?.arquivo_path) {
    await supabase.storage.from(BUCKET).remove([nfe.arquivo_path]);
  }
  await supabase.from("nfes").delete().eq("id", id);

  revalidarTudo();
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
