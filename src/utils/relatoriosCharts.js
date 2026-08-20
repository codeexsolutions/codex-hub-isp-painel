// Cores e agregações compartilhadas pelos gráficos de vendas de benefícios
// (admin e provedor usam a mesma lógica, só com listas de compras diferentes).

export const COR_ACCENT = "#3b82f6";
export const COR_BORDER = "#1e2d4a";
export const COR_TEXT_SUB = "#8899b4";
export const CORES_STATUS = { pendente: "#f59e0b", utilizado: "#22c55e", cancelado: "#ef4444" };
export const LABEL_STATUS = { pendente: "Pendente", utilizado: "Validado", cancelado: "Cancelado" };

// Agrupa as compras validadas por dia (últimos 14 dias) — pra ver a tendência de vendas.
export function vendasPorDia(compras, campoValor = "valor") {
  const hoje = new Date();
  const dias = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    dias.push({ chave: d.toISOString().slice(0, 10), label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), valor: 0 });
  }
  const porDia = Object.fromEntries(dias.map((d) => [d.chave, d]));
  for (const c of compras) {
    if (c.status !== "utilizado" || !c.criado_em) continue;
    const chave = String(c.criado_em).slice(0, 10);
    if (porDia[chave]) porDia[chave].valor += Number(c[campoValor] || 0);
  }
  return dias;
}

// Contagem por status — mostra quanto ainda está pendente de confirmação do parceiro.
export function distribuicaoStatus(compras) {
  const contagem = { pendente: 0, utilizado: 0, cancelado: 0 };
  for (const c of compras) {
    if (contagem[c.status] !== undefined) contagem[c.status] += 1;
  }
  return Object.entries(contagem)
    .filter(([, qtd]) => qtd > 0)
    .map(([status, qtd]) => ({ status, qtd, label: LABEL_STATUS[status] }));
}
