import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { Compras } from "../services/store";
import { formataData } from "../services/format";
import { useToast } from "../components/Toast";
import StatusBadge from "../components/StatusBadge";

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ComprasTab() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await Compras.listar();
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar compras");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const validadas = lista.filter((c) => c.status === "utilizado");
  const pendentes = lista.filter((c) => c.status === "pendente");
  const totalVendas = validadas.reduce((s, c) => s + Number(c.valor || 0), 0);
  const totalComissao = validadas.reduce((s, c) => s + Number(c.valor_provedor || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-xs text-text-dim">Compras validadas</p>
          <p className="text-2xl font-display text-text mt-1">{validadas.length}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-xs text-text-dim">Aguardando uso</p>
          <p className="text-2xl font-display text-text mt-1">{pendentes.length}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-xs text-text-dim">Total vendido</p>
          <p className="text-2xl font-display text-text mt-1">{brl(totalVendas)}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-xs text-text-dim">Minha comissão</p>
          <p className="text-2xl font-display text-text mt-1">{brl(totalComissao)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Benefício</th>
                <th className="px-4 py-3 font-normal">Cupom</th>
                <th className="px-4 py-3 font-normal">Valor</th>
                <th className="px-4 py-3 font-normal">Minha comissão</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Data</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3 text-text">{c.cliente_nome}</td>
                  <td className="px-4 py-3 text-text-sub">{c.beneficio_titulo}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text">
                      {c.cupom_codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-sub">{brl(c.valor)}</td>
                  <td className="px-4 py-3 text-success">{brl(c.valor_provedor)}</td>
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

function Empty() {
  return (
    <div className="text-center py-16">
      <Receipt size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhuma compra registrada ainda.</p>
      <p className="text-xs text-text-dim mt-1">Aparecem aqui assim que um cliente comprar um benefício no app.</p>
    </div>
  );
}
