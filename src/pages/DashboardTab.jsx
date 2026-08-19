import { useState, useEffect } from "react";
import { Users, UserCheck, ShoppingBag, TrendingUp, Wallet, Gift } from "lucide-react";
import { Metricas } from "../services/store";

const CARDS = [
  { key: "clientesConectados", label: "Clientes conectados", icon: Users, formato: "numero" },
  { key: "usuariosAtivos", label: "Usuários ativos", icon: UserCheck, formato: "numero" },
  { key: "compras", label: "Compras", icon: ShoppingBag, formato: "numero" },
  { key: "vendasGeradas", label: "Vendas geradas", icon: TrendingUp, formato: "moeda" },
  { key: "comissao", label: "Minha comissão", icon: Wallet, formato: "moeda" },
  { key: "beneficiosUtilizados", label: "Benefícios utilizados", icon: Gift, formato: "numero" },
];

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (v) => Number(v || 0).toLocaleString("pt-BR");

export default function DashboardTab({ provedor }) {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Metricas.obter(provedor.id)
      .then(setMetricas)
      .finally(() => setLoading(false));
  }, [provedor.id]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <p className="text-xs text-text-dim max-w-lg">
        Visão geral do impacto comercial do Synk na sua base de clientes.
      </p>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {CARDS.map(({ key, label, icon: Icon, formato }) => (
            <div key={key} className="bg-surface rounded-2xl border border-border p-5 space-y-3 shadow-soft hover:border-border-2 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-accent-gradient flex items-center justify-center text-white">
                <Icon size={17} strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-xs text-text-dim">{label}</p>
                <p className="text-2xl font-display text-text mt-1">
                  {formato === "moeda" ? brl(metricas?.[key]) : numero(metricas?.[key])}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
