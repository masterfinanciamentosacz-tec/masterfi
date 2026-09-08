export type LancamentoTipo = "receita" | "despesa";

export type LancamentoCategoria =
  | "nota_fiscal_emitida"
  | "nota_fiscal_recebida"
  | "valor_a_receber"
  | "valor_a_pagar"
  | "gasto_despesa"
  | "repasse_pf_pj"
  | "outro";

export type LancamentoStatus = "pendente" | "pago" | "recebido" | "vencido" | "cancelado";

export type Entidade = "pf" | "pj";

export type Lancamento = {
  id: string;
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  descricao: string;
  numero_nota: string | null;
  cliente_fornecedor: string | null;
  valor: number;
  data_emissao: string | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: LancamentoStatus;
  observacoes: string | null;
  anexo_url: string | null;
  entidade: Entidade;
  parcela_atual: number | null;
  parcela_total: number | null;
  grupo_parcelamento: string | null;
  transferencia_par_id: string | null;
  created_at: string;
  updated_at: string;
};

export const CATEGORIA_LABEL: Record<LancamentoCategoria, string> = {
  nota_fiscal_emitida: "Nota fiscal emitida",
  nota_fiscal_recebida: "Nota fiscal recebida",
  valor_a_receber: "Valor a receber",
  valor_a_pagar: "Valor a pagar",
  gasto_despesa: "Gasto / despesa",
  repasse_pf_pj: "Repasse PF ↔ PJ",
  outro: "Outro",
};

// Categorias selecionáveis no formulário normal de lançamento (repasse tem fluxo próprio)
export const CATEGORIA_OPTIONS: LancamentoCategoria[] = [
  "nota_fiscal_emitida",
  "nota_fiscal_recebida",
  "valor_a_receber",
  "valor_a_pagar",
  "gasto_despesa",
  "outro",
];

export const STATUS_LABEL: Record<LancamentoStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  recebido: "Recebido",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const ENTIDADE_LABEL: Record<Entidade, string> = {
  pf: "Pessoa Física",
  pj: "Pessoa Jurídica",
};
