import { useState, useEffect, useCallback } from "react";
import { Gift } from "lucide-react";
import { Indicacoes } from "../services/store";
import { formatarTelefone } from "../services/format";
import { useToast } from "../components/Toast";

export default function IndicacoesTab({ provedor }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [efetivandoId, setEfetivandoId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await Indicacoes.listar(provedor.id);
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar indicações");
    } finally {
      setLoading(false);
    }
  }, [provedor.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const efetivar = async (indicacao) => {
    setEfetivandoId(indicacao.id);
    try {
      const resultado = await Indicacoes.efetivar(indicacao.id);
      setLista((atual) => atual.map((i) => (i.id === indicacao.id ? { ...i, status: "efetivada" } : i)));
      toast(`Indicação efetivada — ${resultado?.extrato?.pontos ?? ""} pontos creditados a ${indicacao.nome_cliente}`);
    } catch (err) {
      toast(err.message || "Erro ao efetivar indicação");
    } finally {
      setEfetivandoId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-text-dim text-center">Carregando…</div>;
  }

  if (!lista.length) {
    return (
      <div className="p-8 text-center py-16">
        <Gift size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
        <p className="text-sm text-text-dim">Nenhuma indicação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-4">
      <p className="text-xs text-text-dim">
        Consulte as indicações realizadas pelos clientes através do aplicativo. Marque como
        efetivada quando o amigo indicado virar cliente de fato — os pontos são creditados
        automaticamente pra quem indicou.
      </p>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-dim text-xs text-left">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Indicado</th>
                <th className="px-5 py-3">Contato</th>
                <th className="px-5 py-3">Mensagem</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((i, idx) => {
                const efetivada = i.status === "efetivada";
                const semCpf = !i.cliente_cpf_cnpj;
                return (
                <tr key={i.id || idx} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar letter={(i.nome_cliente || "?")[0]} />
                      <div>
                        <div className="text-sm text-text">{i.nome_cliente}</div>
                        <div className="text-[11px] text-text-dim">Cliente</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar letter={(i.indicado || "?")[0]} variant="accent" />
                      <div>
                        <div className="text-sm text-text">{i.indicado}</div>
                        <div className="text-[11px] text-text-dim">Indicado</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-text-sub bg-surface-2 px-2.5 py-1 rounded-lg">
                      📞 {formatarTelefone(i.contato)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-xs text-text-sub max-w-xs truncate">
                      {i.mensagem || "Nenhuma mensagem enviada"}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      efetivada ? "text-success border-success/30 bg-success/8" : "text-text-dim border-border bg-surface-2"
                    }`}>
                      {efetivada ? "Efetivada" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {!efetivada && (
                      <button
                        onClick={() => efetivar(i)}
                        disabled={efetivandoId === i.id || semCpf}
                        title={semCpf ? "Indicação antiga sem CPF/CNPJ — conceda os pontos manualmente na aba Recompensas" : undefined}
                        className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30
                          hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {efetivandoId === i.id ? "Efetivando…" : "Marcar como efetivada"}
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Avatar({ letter, variant }) {
  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs uppercase
      ${variant === "accent"
        ? "bg-accent/15 text-accent"
        : "bg-surface-3 text-text-sub"}`}
    >
      {letter}
    </div>
  );
}
