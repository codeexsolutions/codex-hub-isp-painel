// Helpers compartilhados pela aba de Faturamento (provedor e admin) — status da
// fatura é sempre calculado a partir da data, nunca guardado, pra não dessincronizar.

export const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// evita o problema clássico de "new Date('2026-08-20')" ser interpretado como UTC e
// renderizar um dia a menos em fusos negativos (Brasil) — monta a data só com as
// partes do calendário, sem passar por conversão de fuso.
export function dataBR(isoDate) {
  if (!isoDate) return "-";
  const [ano, mes, dia] = String(isoDate).slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function diasParaVencimento(isoDate) {
  const hoje = new Date();
  const hojeLocal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const [ano, mes, dia] = String(isoDate).slice(0, 10).split("-").map(Number);
  const alvo = new Date(ano, mes - 1, dia);
  return Math.round((alvo - hojeLocal) / 86400000);
}

// status real da fatura: pago/cancelado vêm do banco; "a_vencer"/"atrasado" são
// calculados na hora a partir do vencimento.
export function statusFatura(fatura) {
  if (!fatura) return null;
  if (fatura.status === "pago") return "pago";
  if (fatura.status === "cancelado") return "cancelado";
  return diasParaVencimento(fatura.vencimento) < 0 ? "atrasado" : "a_vencer";
}

export const LABEL_STATUS_FATURA = { pago: "Pago", cancelado: "Cancelado", atrasado: "Atrasado", a_vencer: "A vencer" };

export function corStatusFatura(status) {
  if (status === "pago") return "text-success border-success/30 bg-success/8";
  if (status === "cancelado") return "text-text-dim border-border bg-surface-2";
  if (status === "atrasado") return "text-danger border-danger/30 bg-danger/8";
  return "text-warning border-warning/30 bg-warning/8";
}

// alerta pra banner: 5 dias antes, no dia, ou já atrasada — só faz sentido pra fatura
// ainda pendente (pago/cancelado não alertam nada).
export function alertaFatura(fatura) {
  if (!fatura || fatura.status !== "pendente") return null;
  const dias = diasParaVencimento(fatura.vencimento);
  if (dias < 0) return { tipo: "atrasado", dias: Math.abs(dias) };
  if (dias === 0) return { tipo: "hoje", dias: 0 };
  if (dias <= 5) return { tipo: "proximo", dias };
  return null;
}
