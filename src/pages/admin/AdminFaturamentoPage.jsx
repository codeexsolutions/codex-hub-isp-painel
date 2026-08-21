import { useState, useEffect, useCallback } from "react";
import { CreditCard, CheckCircle2, XCircle, Printer, Settings } from "lucide-react";
import Modal from "../../components/Modal";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";
import { brl, dataBR, statusFatura, LABEL_STATUS_FATURA, corStatusFatura } from "../../utils/faturamento";

export default function AdminFaturamentoPage() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  const [pix, setPix] = useState({ chave_pix: "", nome_recebedor: "", cidade: "" });
  const [salvandoPix, setSalvandoPix] = useState(false);

  const [assinaturaModal, setAssinaturaModal] = useState(null); // { codigoProvedor, nome }
  const [assinaturaForm, setAssinaturaForm] = useState({ valor_mensalidade: "", data_adesao: "" });
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);

  const [recibo, setRecibo] = useState(null);

  const load = useCallback(async () => {
    try {
      const [dados, config] = await Promise.all([Admin.listarFaturamento(), Admin.obterConfigPix()]);
      setLista(dados);
      setPix(config);
    } catch (err) {
      toast(err.message || "Erro ao carregar faturamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const salvarPix = async () => {
    if (!pix.chave_pix.trim()) { toast("Informe a chave PIX"); return; }
    setSalvandoPix(true);
    try {
      await Admin.definirConfigPix(pix);
      toast("Configuração PIX salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar PIX");
    } finally {
      setSalvandoPix(false);
    }
  };

  const abrirAssinaturaModal = (item) => {
    setAssinaturaForm({
      valor_mensalidade: item.valor_mensalidade != null ? String(item.valor_mensalidade) : "",
      data_adesao: item.data_adesao ? String(item.data_adesao).slice(0, 10) : "",
    });
    setAssinaturaModal({ codigoProvedor: item.codigo_provedor, nome: item.provedor_nome });
  };

  const salvarAssinatura = async () => {
    if (!(Number(assinaturaForm.valor_mensalidade) > 0)) { toast("Informe um valor válido"); return; }
    if (!assinaturaForm.data_adesao) { toast("Informe a data de adesão"); return; }
    setSalvandoAssinatura(true);
    try {
      await Admin.configurarAssinatura(assinaturaModal.codigoProvedor, {
        valor_mensalidade: Number(assinaturaForm.valor_mensalidade),
        data_adesao: assinaturaForm.data_adesao,
      });
      setAssinaturaModal(null);
      await load();
      toast("Assinatura configurada");
    } catch (err) {
      toast(err.message || "Erro ao configurar assinatura");
    } finally {
      setSalvandoAssinatura(false);
    }
  };

  const marcarPago = async (item) => {
    setSalvandoId(item.fatura_id);
    try {
      await Admin.marcarFaturaPaga(item.fatura_id);
      await load();
      toast("Fatura marcada como paga");
    } catch (err) {
      toast(err.message || "Erro ao marcar como paga");
    } finally {
      setSalvandoId(null);
    }
  };

  const cancelarFatura = async (item) => {
    if (!confirm("Cancelar esta fatura?")) return;
    setSalvandoId(item.fatura_id);
    try {
      await Admin.marcarFaturaCancelada(item.fatura_id);
      await load();
      toast("Fatura cancelada");
    } catch (err) {
      toast(err.message || "Erro ao cancelar");
    } finally {
      setSalvandoId(null);
    }
  };

  const toggleProvedor = async (item) => {
    const novoStatus = item.provedor_status === "ATIVO" ? "INATIVO" : "ATIVO";
    setSalvandoId(`status-${item.codigo_provedor}`);
    try {
      await Admin.definirStatus(item.codigo_provedor, novoStatus);
      setLista((atual) => atual.map((p) => (p.codigo_provedor === item.codigo_provedor ? { ...p, provedor_status: novoStatus } : p)));
      toast(`${item.provedor_nome} ${novoStatus === "ATIVO" ? "ativado" : "desativado"}`);
    } catch (err) {
      toast(err.message || "Erro ao atualizar status");
    } finally {
      setSalvandoId(null);
    }
  };

  const gerarRecibo = async (item) => {
    try {
      const dados = await Admin.obterRecibo(item.fatura_id);
      setRecibo(dados);
    } catch (err) {
      toast(err.message || "Só é possível gerar recibo de faturas pagas");
    }
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-dim max-w-lg">
        Acompanhe a mensalidade que cada provedor paga pra Synk, marque pagamentos e gerencie o status de acesso.
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-xl">
        <h3 className="text-sm text-text font-display flex items-center gap-2"><Settings size={15} /> PIX de recebimento (Synk)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Chave PIX</Label>
            <Input value={pix.chave_pix} onChange={(e) => setPix((p) => ({ ...p, chave_pix: e.target.value }))} placeholder="CNPJ, e-mail, telefone ou chave aleatória" />
          </div>
          <div>
            <Label>Nome do recebedor</Label>
            <Input value={pix.nome_recebedor} onChange={(e) => setPix((p) => ({ ...p, nome_recebedor: e.target.value }))} maxLength={25} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={pix.cidade} onChange={(e) => setPix((p) => ({ ...p, cidade: e.target.value }))} maxLength={15} />
          </div>
        </div>
        <button
          onClick={salvarPix}
          disabled={salvandoPix}
          className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {salvandoPix ? "Salvando…" : "Salvar PIX"}
        </button>
      </div>

      {!lista.length ? (
        <div className="text-center py-16">
          <CreditCard size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-sm text-text-dim">Nenhum provedor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Provedor</th>
                <th className="px-4 py-3 font-normal">Mensalidade</th>
                <th className="px-4 py-3 font-normal">Vencimento</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Acesso</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((item) => {
                const semAssinatura = !item.assinatura_id;
                const status = semAssinatura ? null : statusFatura({ status: item.fatura_status, vencimento: item.vencimento });
                const salvandoFatura = salvandoId === item.fatura_id;
                const salvandoStatus = salvandoId === `status-${item.codigo_provedor}`;
                return (
                  <tr key={item.codigo_provedor} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 text-text">{item.provedor_nome}</td>
                    <td className="px-4 py-3 text-text-sub">{semAssinatura ? "-" : brl(item.valor_mensalidade)}</td>
                    <td className="px-4 py-3 text-text-sub">{semAssinatura || !item.vencimento ? "-" : dataBR(item.vencimento)}</td>
                    <td className="px-4 py-3">
                      {status ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${corStatusFatura(status)}`}>
                          {LABEL_STATUS_FATURA[status]}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface-2 text-text-dim">
                          Sem assinatura
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleProvedor(item)}
                        disabled={salvandoStatus}
                        className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors disabled:opacity-50 ${
                          item.provedor_status === "ATIVO"
                            ? "text-success border-success/30 bg-success/8 hover:bg-success/15"
                            : "text-danger border-danger/30 bg-danger/8 hover:bg-danger/15"
                        }`}
                      >
                        {item.provedor_status === "ATIVO" ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {semAssinatura ? (
                          <button
                            onClick={() => abrirAssinaturaModal(item)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors"
                          >
                            Configurar assinatura
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => abrirAssinaturaModal(item)}
                              className="text-[11px] px-2 py-1 rounded-lg text-text-sub hover:text-accent transition-colors"
                              title="Editar assinatura"
                            >
                              Editar
                            </button>
                            {status === "pago" ? (
                              <button
                                onClick={() => gerarRecibo(item)}
                                className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-2 text-text-sub border border-border hover:text-accent hover:border-accent/30 transition-colors flex items-center gap-1"
                              >
                                <Printer size={12} /> Recibo
                              </button>
                            ) : status === "cancelado" ? null : (
                              <>
                                <button
                                  onClick={() => marcarPago(item)}
                                  disabled={salvandoFatura}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <CheckCircle2 size={12} /> Pago
                                </button>
                                <button
                                  onClick={() => cancelarFatura(item)}
                                  disabled={salvandoFatura}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <XCircle size={12} /> Cancelar
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!assinaturaModal} onClose={() => setAssinaturaModal(null)} title={`Assinatura — ${assinaturaModal?.nome || ""}`}>
        <div className="space-y-4">
          <div>
            <Label>Valor da mensalidade (R$)</Label>
            <Input
              value={assinaturaForm.valor_mensalidade}
              onChange={(e) => setAssinaturaForm((f) => ({ ...f, valor_mensalidade: e.target.value }))}
              inputMode="decimal"
              placeholder="ex.: 199.90"
            />
          </div>
          <div>
            <Label>Data de adesão</Label>
            <Input
              type="date"
              value={assinaturaForm.data_adesao}
              onChange={(e) => setAssinaturaForm((f) => ({ ...f, data_adesao: e.target.value }))}
            />
            <p className="text-[11px] text-text-dim mt-1.5">O vencimento mensal é sempre o mesmo dia do mês dessa data.</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setAssinaturaModal(null)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button
              onClick={salvarAssinatura}
              disabled={salvandoAssinatura}
              className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {salvandoAssinatura ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </Modal>

      {recibo && <ReciboView recibo={recibo} onClose={() => setRecibo(null)} />}
    </div>
  );
}

function ReciboView({ recibo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="bg-white text-black rounded-2xl max-w-md w-full p-8 print:rounded-none print:shadow-none">
        <div className="text-center mb-6">
          <p className="text-lg font-bold">Recibo de Pagamento</p>
          <p className="text-xs text-gray-500">Nº {recibo.numero}</p>
        </div>
        <div className="space-y-3 text-sm">
          <Linha label="Provedor" valor={recibo.provedorNome} />
          {recibo.provedorCnpj && <Linha label="CNPJ" valor={recibo.provedorCnpj} />}
          <Linha label="Competência" valor={dataBR(recibo.competencia)} />
          <Linha label="Valor" valor={brl(recibo.valor)} />
          <Linha label="Pago em" valor={recibo.pagoEm ? dataBR(recibo.pagoEm) : "-"} />
        </div>
        <p className="text-[11px] text-gray-500 mt-6 text-center">
          Referente à mensalidade de uso da plataforma Synk.
        </p>
        <div className="flex gap-3 justify-center mt-6 print:hidden">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
            Fechar
          </button>
          <button onClick={() => window.print()} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

function Linha({ label, valor }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{valor}</span>
    </div>
  );
}
