import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Receipt } from "lucide-react";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";
import { brl, dataBR, statusFatura, LABEL_STATUS_FATURA, corStatusFatura } from "../../utils/faturamento";

export default function AdminComissaoPage() {
  const toast = useToast();
  const [form, setForm] = useState({ percentual_parceiro: "", percentual_synk: "", percentual_provedor: "", dia_pagamento: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [faturas, setFaturas] = useState([]);
  const [loadingFaturas, setLoadingFaturas] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  const load = useCallback(async () => {
    try {
      const config = await Admin.obterConfigComissao();
      setForm({
        percentual_parceiro: String(config.percentual_parceiro),
        percentual_synk: String(config.percentual_synk),
        percentual_provedor: String(config.percentual_provedor),
        dia_pagamento: String(config.dia_pagamento ?? 5),
      });
    } catch (err) {
      toast(err.message || "Erro ao carregar configuração de comissão");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFaturas = useCallback(async () => {
    try {
      setFaturas(await Admin.listarFaturasComissao());
    } catch (err) {
      toast(err.message || "Erro ao carregar faturas de comissão");
    } finally {
      setLoadingFaturas(false);
    }
  }, []);

  useEffect(() => { load(); loadFaturas(); }, [load, loadFaturas]);

  const marcarPago = async (item) => {
    setSalvandoId(item.fatura_id);
    try {
      await Admin.marcarFaturaComissaoPaga(item.fatura_id);
      await loadFaturas();
      toast("Comissão marcada como paga");
    } catch (err) {
      toast(err.message || "Erro ao marcar como pago");
    } finally {
      setSalvandoId(null);
    }
  };

  const marcarCancelado = async (item) => {
    if (!confirm("Cancelar esta fatura de comissão?")) return;
    setSalvandoId(item.fatura_id);
    try {
      await Admin.marcarFaturaComissaoCancelada(item.fatura_id);
      await loadFaturas();
      toast("Fatura cancelada");
    } catch (err) {
      toast(err.message || "Erro ao cancelar");
    } finally {
      setSalvandoId(null);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const soma =
    (Number(form.percentual_parceiro) || 0) +
    (Number(form.percentual_synk) || 0) +
    (Number(form.percentual_provedor) || 0);

  const somaValida = Math.round(soma * 100) / 100 === 100;

  const salvar = async () => {
    if (!somaValida) { toast("Os 3 percentuais precisam somar 100%"); return; }
    setSaving(true);
    try {
      await Admin.definirConfigComissao({
        percentual_parceiro: Number(form.percentual_parceiro),
        percentual_synk: Number(form.percentual_synk),
        percentual_provedor: Number(form.percentual_provedor),
        dia_pagamento: Number(form.dia_pagamento) || 5,
      });
      toast("Configuração de comissão salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-xs text-text-dim">
        Percentual fixo aplicado a toda nova compra de benefício (o split é gravado na hora da compra —
        alterar aqui não muda compras já feitas). Precisa somar 100%.
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Parceiro (%)</Label>
            <Input value={form.percentual_parceiro} onChange={set("percentual_parceiro")} inputMode="decimal" />
          </div>
          <div>
            <Label>Synk (%)</Label>
            <Input value={form.percentual_synk} onChange={set("percentual_synk")} inputMode="decimal" />
          </div>
          <div>
            <Label>Provedor (%)</Label>
            <Input value={form.percentual_provedor} onChange={set("percentual_provedor")} inputMode="decimal" />
          </div>
        </div>

        <div className={`text-xs ${somaValida ? "text-success" : "text-danger"}`}>
          Soma atual: {soma}% {somaValida ? "✓" : "— precisa ser 100%"}
        </div>

        <div className="border-t border-border pt-4">
          <Label>Dia do pagamento da comissão</Label>
          <Input value={form.dia_pagamento} onChange={set("dia_pagamento")} inputMode="numeric" className="max-w-[100px]" />
          <p className="text-[11px] text-text-dim mt-1.5">
            Todo dia X, o parceiro vê a cobrança do que ficou devido (Synk + provedor) no mês fechado anterior.
          </p>
        </div>

        <button
          onClick={salvar}
          disabled={saving || !somaValida}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>

      <div>
        <p className="text-xs text-text-dim mb-2 font-medium">Comissão devida por parceiro (mês fechado)</p>
        {loadingFaturas ? (
          <div className="text-sm text-text-dim text-center py-8">Carregando…</div>
        ) : !faturas.length ? (
          <div className="text-center py-12">
            <Receipt size={32} className="mx-auto text-text-dim mb-3 opacity-40" />
            <p className="text-sm text-text-dim">Nenhuma comissão gerada ainda.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                  <th className="px-4 py-3 font-normal">Parceiro</th>
                  <th className="px-4 py-3 font-normal">Competência</th>
                  <th className="px-4 py-3 font-normal">Vencimento</th>
                  <th className="px-4 py-3 font-normal">Valor</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {faturas.map((item) => {
                  const semFatura = !item.fatura_id;
                  const status = semFatura ? null : statusFatura({ status: item.status, vencimento: item.vencimento });
                  const salvando = salvandoId === item.fatura_id;
                  return (
                    <tr key={item.parceiro_id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-text">{item.parceiro_nome}</td>
                      <td className="px-4 py-3 text-text-sub">{semFatura ? "-" : dataBR(item.competencia)}</td>
                      <td className="px-4 py-3 text-text-sub">{semFatura ? "-" : dataBR(item.vencimento)}</td>
                      <td className="px-4 py-3 text-text-sub">{semFatura ? "-" : brl(item.valor)}</td>
                      <td className="px-4 py-3">
                        {status ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${corStatusFatura(status)}`}>
                            {LABEL_STATUS_FATURA[status]}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface-2 text-text-dim">
                            Nada devido ainda
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!semFatura && (status === "a_vencer" || status === "atrasado") && (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => marcarPago(item)}
                              disabled={salvando}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Pago
                            </button>
                            <button
                              onClick={() => marcarCancelado(item)}
                              disabled={salvando}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <XCircle size={12} /> Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
