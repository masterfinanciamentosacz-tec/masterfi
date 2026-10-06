import type { LancamentoStatus } from "./types";

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

// Data de hoje no fuso de Brasilia (o servidor da Vercel roda em UTC, o que
// "viraria o dia" as 21h no Brasil).
export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function addDaysISO(dateISO: string, days: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

// O status "vencido" gravado no banco so e atualizado quando a linha e salva. Para
// itens ainda em aberto, o status real depende da data de vencimento vs. hoje.
export function effectiveStatus(
  status: LancamentoStatus,
  dataVencimento: string,
  hoje: string = todayISO()
): LancamentoStatus {
  if (status === "pendente" || status === "vencido") {
    return dataVencimento < hoje ? "vencido" : "pendente";
  }
  return status;
}
