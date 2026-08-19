import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { Parceiro } from "../../services/store";
import { formataData } from "../../services/format";
import { useToast } from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ParceiroFinanceiroPage() {
  const toast = useToast();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const financeiro = await Parceiro.financeiro();
      setDados(financeiro);
    } catch (err) {
      toast(err.message || "Erro ao carregar financeiro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  const { resumo, compras } = dados;

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-dim max-w-lg">
        "Pendente" já foi vendido no app, aguardando você confirmar o uso na aba "Validar cupom".
        Só cupons "Validado" contam como devido pra Synk/provedor.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Pendentes" value={resumo.pendente.qtd} sub={brl(resumo.pendente.total)} tone="warning" />
        <Card label="Validados" value={resumo.utilizado.qtd} sub={brl(resumo.utilizado.total)} tone="success" />
        <Card label="Devido (Synk + provedor)" value={brl(resumo.utilizado.synk + resumo.utilizado.provedor)} tone="accent" />
      </div>

      {!compras.length ? (
        <div className="text-center py-16">
          <Receipt size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-sm text-text-dim">Nenhuma venda registrada ainda.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Provedor</th>
                <th className="px-4 py-3 font-normal">Cupom</th>
                <th className="px-4 py-3 font-normal">Valor</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Data</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3 text-text">{c.cliente_nome}</td>
                  <td className="px-4 py-3 text-text-sub">{c.provedor_nome || c.provedor_empresa}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text">
                      {c.cupom_codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-sub">{brl(c.valor)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-text-dim">{formataData(c.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TONES = {
  warning: "text-warning",
  success: "text-success",
  accent: "text-accent",
};

function Card({ label, value, sub, tone }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
      <p className="text-xs text-text-dim">{label}</p>
      <p className={`text-2xl font-display mt-1 ${TONES[tone] || "text-text"}`}>{value}</p>
      {sub && <p className="text-xs text-text-dim mt-0.5">{sub}</p>}
    </div>
  );
}
