export type LancamentoTipo = "receita" | "despesa";

export type LancamentoCategoria =
  | "nota_fiscal_emitida"
  | "nota_fiscal_recebida"
  | "valor_a_receber"
  | "valor_a_pagar"
  | "gasto_despesa"
  | "outro";

export type LancamentoStatus = "pendente" | "pago" | "recebido" | "vencido" | "cancelado";

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
  created_at: string;
  updated_at: string;
};

export const CATEGORIA_LABEL: Record<LancamentoCategoria, string> = {
  nota_fiscal_emitida: "Nota fiscal emitida",
  nota_fiscal_recebida: "Nota fiscal recebida",
  valor_a_receber: "Valor a receber",
  valor_a_pagar: "Valor a pagar",
  gasto_despesa: "Gasto / despesa",
  outro: "Outro",
};

export const STATUS_LABEL: Record<LancamentoStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  recebido: "Recebido",
  vencido: "Vencido",
  cancelado: "Cancelado",
};
