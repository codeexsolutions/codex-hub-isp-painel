import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { Admin } from "../../services/store";
import { formataData } from "../../services/format";
import { useToast } from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminRelatoriosPage() {
  const toast = useToast();
  const [resumo, setResumo] = useState(null);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validandoId, setValidandoId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { resumo, compras } = await Admin.obterRelatorioCompras();
      setResumo(resumo);
      setCompras(compras);
    } catch (err) {
      toast(err.message || "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validar = async (compra) => {
    setValidandoId(compra.id);
    try {
      await Admin.validarCompra(compra.id);
      await load();
      toast("Compra validada — pontos creditados ao cliente");
    } catch (err) {
      toast(err.message || "Erro ao validar compra");
    } finally {
      setValidandoId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-dim max-w-lg">
        Visão consolidada de todas as compras de benefícios, em todos os provedores. Só compras com status
        "Validado" contam nos totais abaixo — cupons pendentes só existem quando o cliente ainda não usou o
        benefício com o parceiro.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card label="Compras validadas" value={resumo.compras} />
        <Card label="GMV (total vendido)" value={brl(resumo.totalVendas)} />
        <Card label="Parceiros" value={brl(resumo.totalParceiro)} />
        <Card label="Synk" value={brl(resumo.totalSynk)} />
        <Card label="Provedores" value={brl(resumo.totalProvedor)} />
      </div>

      {!compras.length ? (
        <div className="text-center py-16">
          <Receipt size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-sm text-text-dim">Nenhuma compra registrada ainda.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Provedor</th>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Benefício</th>
                <th className="px-4 py-3 font-normal">Cupom</th>
                <th className="px-4 py-3 font-normal">Valor</th>
                <th className="px-4 py-3 font-normal">Synk</th>
                <th className="px-4 py-3 font-normal">Provedor</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Data</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3 text-text">{c.provedor_nome || c.provedor_empresa}</td>
                  <td className="px-4 py-3 text-text-sub">{c.cliente_nome}</td>
                  <td className="px-4 py-3 text-text-sub">{c.beneficio_titulo}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text">
                      {c.cupom_codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-sub">{brl(c.valor)}</td>
                  <td className="px-4 py-3 text-accent">{brl(c.valor_synk)}</td>
                  <td className="px-4 py-3 text-success">{brl(c.valor_provedor)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-text-dim">{formataData(c.criado_em)}</td>
                  <td className="px-4 py-3">
                    {c.status === "pendente" && (
                      <button
                        onClick={() => validar(c)}
                        disabled={validandoId === c.id}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors disabled:opacity-50"
                        title="Confirmar uso manualmente (parceiro sem portal vinculado)"
                      >
                        {validandoId === c.id ? "…" : "Validar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 shadow-soft">
      <p className="text-[11px] text-text-dim">{label}</p>
      <p className="text-lg font-display text-text mt-1">{value}</p>
    </div>
  );
}
