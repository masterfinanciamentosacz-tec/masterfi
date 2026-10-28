import { extractText, getDocumentProxy } from "unpdf";

export type NfseDados = {
  chaveAcesso: string | null;
  numero: string | null;
  dataEmissao: string | null; // YYYY-MM-DD
  valor: number | null;
  tomadorDocumento: string | null;
  tomadorNome: string | null;
  prestadorDocumento: string | null;
  prestadorNome: string | null;
  descricao: string | null;
};

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function valorOuNulo(s: string | undefined | null) {
  const v = (s ?? "").trim();
  return v === "" || v === "-" ? null : v;
}

function parseBRL(s: string | null) {
  if (!s) return null;
  const limpo = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

// Le o texto de uma NFS-e (DANFSe do Portal Nacional, usada pelo MEI). Cada campo vem
// em uma linha, logo abaixo do rotulo dele.
export function parseNfseText(text: string): NfseDados {
  const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const norm = linhas.map(normalizar);

  const achar = (rotulo: string, aPartir = 0) => {
    const alvo = normalizar(rotulo);
    for (let i = aPartir; i < norm.length; i++) if (norm[i].startsWith(alvo)) return i;
    return -1;
  };
  const valorApos = (rotulo: string, aPartir = 0) => {
    const i = achar(rotulo, aPartir);
    return i >= 0 ? valorOuNulo(linhas[i + 1]) : null;
  };

  const chaveAcesso = text.match(/\b\d{50}\b/)?.[0] ?? null;

  // Numero: campo proprio; se faltar, vem dentro da chave de acesso (13 digitos, apos 22).
  let numero = valorApos("NUMERO DA NFS-E");
  if (!numero || !/^\d+$/.test(numero)) {
    numero = chaveAcesso ? String(Number(chaveAcesso.slice(22, 35))) : null;
  }

  // Data de emissao: "26/10/2026 08:36:27" (ou, na falta, a competencia)
  const dataBruta = valorApos("DATA E HORA DA EMISSAO DA NFS-E") ?? valorApos("COMPETENCIA DA NFS-E");
  const m = dataBruta?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const dataEmissao = m ? `${m[3]}-${m[2]}-${m[1]}` : null;

  const iPrestador = achar("PRESTADOR / FORNECEDOR");
  const iTomador = achar("TOMADOR / ADQUIRENTE");
  const nomeApos = (i: number) => {
    const j = i >= 0 ? achar("NOME / NOME EMPRESARIAL", i) : -1;
    return j >= 0 ? valorOuNulo(linhas[j + 1]) : null;
  };

  const prestadorDocumento = iPrestador >= 0 ? valorOuNulo(linhas[iPrestador + 1]) : null;
  const tomadorDocumento = iTomador >= 0 ? valorOuNulo(linhas[iTomador + 1]) : null;

  const valor =
    parseBRL(valorApos("VALOR TOTAL DA NFS-E")) ??
    parseBRL(valorApos("VALOR LIQUIDO DA NFS-E"));

  return {
    chaveAcesso,
    numero,
    dataEmissao,
    valor,
    tomadorDocumento,
    tomadorNome: nomeApos(iTomador),
    prestadorDocumento,
    prestadorNome: nomeApos(iPrestador),
    descricao: valorApos("DESCRICAO DO SERVICO"),
  };
}

export async function parseNfsePdf(arquivo: Uint8Array): Promise<NfseDados> {
  const pdf = await getDocumentProxy(arquivo);
  const { text } = await extractText(pdf, { mergePages: true });
  return parseNfseText(text);
}
