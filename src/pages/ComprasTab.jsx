import { useState, useEffect, useCallback, useMemo } from "react";
import { Receipt } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Compras } from "../services/store";
import { formataData } from "../services/format";
import { useToast } from "../components/Toast";
import StatusBadge from "../components/StatusBadge";
import { COR_ACCENT, COR_BORDER, COR_TEXT_SUB, CORES_STATUS, vendasPorDia, distribuicaoStatus } from "../utils/relatoriosCharts";

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

  const dadosVendas = useMemo(() => vendasPorDia(lista), [lista]);
  const dadosStatus = useMemo(() => distribuicaoStatus(lista), [lista]);

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

      {lista.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-5 shadow-soft">
            <p className="text-sm text-text font-display mb-4">Vendas validadas (últimos 14 dias)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosVendas} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gVendasProvedor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COR_ACCENT} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={COR_ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_BORDER} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: COR_TEXT_SUB }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: COR_TEXT_SUB }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => brl(v)} />
                  <Tooltip
                    contentStyle={{ background: "#0e1529", border: `1px solid ${COR_BORDER}`, borderRadius: 12, fontSize: 12, color: "#e2e8f0" }}
                    labelStyle={{ color: "#e2e8f0", fontWeight: 700 }}
                    formatter={(v) => [brl(v), "Vendido"]}
                  />
                  <Area type="monotone" dataKey="valor" stroke={COR_ACCENT} strokeWidth={2.5} fill="url(#gVendasProvedor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
            <p className="text-sm text-text font-display mb-4">Compras por status</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosStatus} dataKey="qtd" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {dadosStatus.map((d) => (
                      <Cell key={d.status} fill={CORES_STATUS[d.status]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0e1529", border: `1px solid ${COR_BORDER}`, borderRadius: 12, fontSize: 12, color: "#e2e8f0" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    formatter={(value) => <span style={{ color: COR_TEXT_SUB, fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
