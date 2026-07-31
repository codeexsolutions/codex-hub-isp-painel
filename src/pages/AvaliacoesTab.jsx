import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { Avaliacoes } from "../services/store";
import { formataData } from "../services/format";
import { useToast } from "../components/Toast";

export default function AvaliacoesTab({ provedor }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await Avaliacoes.listar(provedor.id);
      setLista(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      toast(err.message || "Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  }, [provedor.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return <div className="p-8 text-sm text-text-dim text-center">Carregando…</div>;
  }

  if (!lista.length) {
    return (
      <div className="p-8 text-center py-16">
        <Star size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
        <p className="text-sm text-text-dim">Nenhuma avaliação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-4">
      <p className="text-xs text-text-dim">
        Consulte as avaliações realizadas pelos clientes através do aplicativo.
      </p>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-dim text-xs text-left">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Avaliação</th>
                <th className="px-5 py-3">Mensagem</th>
                <th className="px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((i, idx) => (
                <tr key={i.id || idx} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-5 py-3 text-sm text-text">{i.cliente}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      {renderStars(Number(i.nota) || 0)}
                      <span className="text-xs text-text-dim ml-1">{i.nota}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-xs text-text-sub max-w-xs truncate">
                      {i.mensagem || "Nenhuma mensagem enviada"}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-dim whitespace-nowrap">
                    {formataData(i.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function renderStars(n) {
  const filled = Math.min(Math.max(Math.round(n), 0), 5);
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={14}
      className={i < filled ? "text-warning fill-warning" : "text-text-dim/30"}
      strokeWidth={1.5}
    />
  ));
}
