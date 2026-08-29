import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Copy, CreditCard, CheckCircle2 } from "lucide-react";
import { Faturamento } from "../services/store";
import { useToast } from "../components/Toast";
import { brl, dataBR, statusFatura, LABEL_STATUS_FATURA, corStatusFatura, alertaFatura } from "../utils/faturamento";

const LABEL_MODULO = {
  beneficios: "Benefícios",
  recompensas: "Recompensas",
  desbloqueio_confianca: "Desbloqueio de confiança",
};

export default function FaturamentoTab() {
  const toast = useToast();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await Faturamento.obter();
      setDados(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar faturamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(dados.pixCopiaCola);
      toast("Código PIX copiado");
    } catch {
      toast("Não foi possível copiar", "alert");
    }
  };

  if (loading) {
    return <div className="p-6 lg:p-8 text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  if (!dados?.assinatura) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-16 bg-surface rounded-2xl border border-border">
          <CreditCard size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-sm text-text-dim">Sua assinatura ainda não foi configurada.</p>
          <p className="text-xs text-text-dim mt-1">Fale com o time Synk pra ativar a cobrança da mensalidade.</p>
        </div>
      </div>
    );
  }

  const { assinatura, faturas, modulosAtivos, pixCopiaCola, pixQrCode } = dados;
  const faturaAberta = faturas.find((f) => f.status === "pendente");
  const alerta = alertaFatura(faturaAberta);
  const diaVencimento = dataBR(assinatura.data_adesao).split("/")[0];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {alerta && (
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
          alerta.tipo === "atrasado" ? "border-danger/30 bg-danger/8" : "border-warning/30 bg-warning/8"
        }`}>
          <AlertTriangle size={18} className={alerta.tipo === "atrasado" ? "text-danger" : "text-warning"} />
          <p className={`text-sm ${alerta.tipo === "atrasado" ? "text-danger" : "text-warning"}`}>
            {alerta.tipo === "atrasado" && `Sua mensalidade está atrasada há ${alerta.dias} dia${alerta.dias > 1 ? "s" : ""}. Após 7 dias de atraso, o acesso é suspenso automaticamente.`}
            {alerta.tipo === "hoje" && "Sua mensalidade vence hoje."}
            {alerta.tipo === "proximo" && `Sua mensalidade vence em ${alerta.dias} dia${alerta.dias > 1 ? "s" : ""}.`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-xs text-text-dim">Mensalidade</p>
          <p className="text-2xl font-display text-text mt-1">{brl(assinatura.valor_mensalidade)}</p>
          <p className="text-xs text-text-dim mt-2">Vence todo dia {diaVencimento}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-xs text-text-dim">Adesão</p>
          <p className="text-lg font-display text-text mt-1">{dataBR(assinatura.data_adesao)}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-xs text-text-dim mb-2">Módulos ativos</p>
          {modulosAtivos.length ? (
            <div className="flex flex-wrap gap-1.5">
              {modulosAtivos.map((m) => (
                <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                  {LABEL_MODULO[m] || m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-dim">Nenhum módulo ativo</p>
          )}
        </div>
      </div>

      {pixCopiaCola && (
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-soft">
          <p className="text-sm text-text font-display mb-1">Pagar com PIX</p>
          <p className="text-xs text-text-dim mb-3">Escaneie o QR code ou copie o código abaixo no app do seu banco (Pix Copia e Cola).</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {pixQrCode && (
              <div className="shrink-0 self-center sm:self-start bg-white p-3 rounded-xl border border-border">
                <img src={pixQrCode} alt="QR code PIX" width={220} height={220} className="w-56 h-56" />
              </div>
            )}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs text-text-sub font-mono break-all">
                {pixCopiaCola}
              </div>
              <button
                onClick={copiarPix}
                className="px-4 py-2.5 rounded-xl bg-accent-gradient text-white text-sm font-medium hover:brightness-110 transition-all shadow-glow flex items-center justify-center gap-2 shrink-0"
              >
                <Copy size={15} /> Copiar código
              </button>
            </div>
          </div>
          <p className="text-[11px] text-text-dim mt-3">
            O pagamento é confirmado manualmente pela Synk após a compensação — pode levar algumas horas.
          </p>
        </div>
      )}

      <div>
        <p className="text-xs text-text-dim mb-2 font-medium">Histórico de faturas</p>
        <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Competência</th>
                <th className="px-4 py-3 font-normal">Vencimento</th>
                <th className="px-4 py-3 font-normal">Valor</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Pago em</th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((f) => {
                const status = statusFatura(f);
                return (
                  <tr key={f.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text">{dataBR(f.competencia)}</td>
                    <td className="px-4 py-3 text-text-sub">{dataBR(f.vencimento)}</td>
                    <td className="px-4 py-3 text-text-sub">{brl(f.valor)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${corStatusFatura(status)}`}>
                        {status === "pago" && <CheckCircle2 size={10} className="inline -mt-0.5 mr-1" />}
                        {LABEL_STATUS_FATURA[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-dim">{f.pago_em ? dataBR(f.pago_em) : "-"}</td>
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
