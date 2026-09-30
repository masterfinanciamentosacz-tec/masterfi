export type LancamentoTipo = "receita" | "despesa";

export type LancamentoCategoria =
  | "nota_fiscal_emitida"
  | "nota_fiscal_recebida"
  | "valor_a_receber"
  | "valor_a_pagar"
  | "gasto_despesa"
  | "repasse_pf_pj"
  | "poupanca_deposito"
  | "poupanca_resgate"
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
  caixinha_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Caixinha = {
  id: string;
  nome: string;
  entidade: Entidade;
  meta_valor: number | null;
  created_at: string;
};

// Categorias que representam movimentacao interna (nao contam como receita/despesa real)
export const CATEGORIAS_INTERNAS: LancamentoCategoria[] = [
  "repasse_pf_pj",
  "poupanca_deposito",
  "poupanca_resgate",
];

export const CATEGORIA_LABEL: Record<LancamentoCategoria, string> = {
  nota_fiscal_emitida: "Nota fiscal emitida",
  nota_fiscal_recebida: "Nota fiscal recebida",
  valor_a_receber: "Valor a receber",
  valor_a_pagar: "Valor a pagar",
  gasto_despesa: "Gasto / despesa",
  repasse_pf_pj: "Repasse PF ↔ PJ",
  poupanca_deposito: "Depósito em poupança",
  poupanca_resgate: "Resgate de poupança",
  outro: "Outro",
};

// Categorias selecionáveis no formulário normal de lançamento
// (repasse e poupança têm fluxo próprio nas suas respectivas telas)
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
