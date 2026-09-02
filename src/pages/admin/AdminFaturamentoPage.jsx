import { Fragment, useState, useEffect, useCallback } from "react";
import { CreditCard, CheckCircle2, XCircle, Printer, Settings, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import Modal from "../../components/Modal";
import { Label, Input, Select } from "../../components/Field";
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
  const [assinaturaForm, setAssinaturaForm] = useState({ valor_mensalidade: "", data_adesao: "", plano_id: "" });
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);
  const [planos, setPlanos] = useState([]);

  const [recibo, setRecibo] = useState(null);

  // Linha expandida — mostra TODAS as faturas do provedor, não só a mais
  // relevante que aparece na listagem geral (evita marcar como paga a
  // fatura errada quando existe mais de uma em aberto).
  const [expandido, setExpandido] = useState(null); // codigoProvedor
  const [faturasExpandido, setFaturasExpandido] = useState([]);
  const [carregandoExpandido, setCarregandoExpandido] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dados, config, listaPlanos] = await Promise.all([Admin.listarFaturamento(), Admin.obterConfigPix(), Admin.listarPlanos()]);
      setLista(dados);
      setPix(config);
      setPlanos(listaPlanos.filter((p) => p.ativo));
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
      plano_id: item.plano_id != null ? String(item.plano_id) : "",
    });
    setAssinaturaModal({ codigoProvedor: item.codigo_provedor, nome: item.provedor_nome });
  };

  const selecionarPlano = (planoId) => {
    const plano = planos.find((p) => String(p.id) === planoId);
    setAssinaturaForm((f) => ({
      ...f,
      plano_id: planoId,
      valor_mensalidade: plano ? String(plano.valor_mensalidade) : f.valor_mensalidade,
    }));
  };

  const salvarAssinatura = async () => {
    if (!(Number(assinaturaForm.valor_mensalidade) > 0)) { toast("Informe um valor válido"); return; }
    if (!assinaturaForm.data_adesao) { toast("Informe a data de adesão"); return; }
    setSalvandoAssinatura(true);
    try {
      await Admin.configurarAssinatura(assinaturaModal.codigoProvedor, {
        valor_mensalidade: Number(assinaturaForm.valor_mensalidade),
        data_adesao: assinaturaForm.data_adesao,
        plano_id: assinaturaForm.plano_id || null,
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

  const recarregarExpandido = async (codigoProvedor) => {
    if (expandido !== codigoProvedor) return;
    try {
      setFaturasExpandido(await Admin.listarFaturasProvedor(codigoProvedor));
    } catch {
      // silencioso — a lista principal já foi recarregada
    }
  };

  const alternarExpandido = async (codigoProvedor) => {
    if (expandido === codigoProvedor) {
      setExpandido(null);
      return;
    }
    setExpandido(codigoProvedor);
    setCarregandoExpandido(true);
    try {
      setFaturasExpandido(await Admin.listarFaturasProvedor(codigoProvedor));
    } catch (err) {
      toast(err.message || "Erro ao carregar faturas");
      setFaturasExpandido([]);
    } finally {
      setCarregandoExpandido(false);
    }
  };

  const marcarPago = async (idFatura, codigoProvedor) => {
    setSalvandoId(idFatura);
    try {
      await Admin.marcarFaturaPaga(idFatura);
      await Promise.all([load(), recarregarExpandido(codigoProvedor)]);
      toast("Fatura marcada como paga");
    } catch (err) {
      toast(err.message || "Erro ao marcar como paga");
    } finally {
      setSalvandoId(null);
    }
  };

  const cancelarFatura = async (idFatura, codigoProvedor) => {
    if (!confirm("Cancelar esta fatura?")) return;
    setSalvandoId(idFatura);
    try {
      await Admin.marcarFaturaCancelada(idFatura);
      await Promise.all([load(), recarregarExpandido(codigoProvedor)]);
      toast("Fatura cancelada");
    } catch (err) {
      toast(err.message || "Erro ao cancelar");
    } finally {
      setSalvandoId(null);
    }
  };

  // Desfaz um "marcar como pago" (ou "cancelar") feito por engano — volta a
  // fatura pra pendente.
  const desfazerFatura = async (idFatura, codigoProvedor) => {
    if (!confirm("Desfazer esta baixa e voltar a fatura para pendente?")) return;
    setSalvandoId(idFatura);
    try {
      await Admin.reabrirFatura(idFatura);
      await Promise.all([load(), recarregarExpandido(codigoProvedor)]);
      toast("Fatura reaberta como pendente");
    } catch (err) {
      toast(err.message || "Erro ao desfazer");
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
                <th className="px-4 py-3 font-normal w-8"></th>
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
                const aberto = expandido === item.codigo_provedor;
                const temMaisDeUmaPendente = Number(item.faturas_pendentes) > 1;
                return (
                  <Fragment key={item.codigo_provedor}>
                    <tr className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3">
                        {!semAssinatura && (
                          <button
                            onClick={() => alternarExpandido(item.codigo_provedor)}
                            className="text-text-dim hover:text-text transition-colors"
                            title="Ver todas as faturas"
                          >
                            {aberto ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text">
                        {item.provedor_nome}
                        {temMaisDeUmaPendente && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border border-warning/30 bg-warning/8 text-warning">
                            {item.faturas_pendentes} em aberto
                          </span>
                        )}
                      </td>
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
                                <>
                                  <button
                                    onClick={() => gerarRecibo(item)}
                                    className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-2 text-text-sub border border-border hover:text-accent hover:border-accent/30 transition-colors flex items-center gap-1"
                                  >
                                    <Printer size={12} /> Recibo
                                  </button>
                                  <button
                                    onClick={() => desfazerFatura(item.fatura_id, item.codigo_provedor)}
                                    disabled={salvandoFatura}
                                    className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-2 text-text-sub border border-border hover:text-warning hover:border-warning/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                    title="Desfazer — marcou como pago por engano"
                                  >
                                    <RotateCcw size={12} /> Desfazer
                                  </button>
                                </>
                              ) : status === "cancelado" ? (
                                <button
                                  onClick={() => desfazerFatura(item.fatura_id, item.codigo_provedor)}
                                  disabled={salvandoFatura}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-2 text-text-sub border border-border hover:text-warning hover:border-warning/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <RotateCcw size={12} /> Reabrir
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => marcarPago(item.fatura_id, item.codigo_provedor)}
                                    disabled={salvandoFatura}
                                    className="text-[11px] px-2.5 py-1 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <CheckCircle2 size={12} /> Pago
                                  </button>
                                  <button
                                    onClick={() => cancelarFatura(item.fatura_id, item.codigo_provedor)}
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

                    {aberto && (
                      <tr className="border-b border-border last:border-0 bg-surface-2/30">
                        <td colSpan={7} className="px-4 py-3">
                          {carregandoExpandido ? (
                            <div className="text-xs text-text-dim py-3 text-center">Carregando…</div>
                          ) : !faturasExpandido.length ? (
                            <div className="text-xs text-text-dim py-3 text-center">Nenhuma fatura gerada ainda.</div>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-text-dim uppercase tracking-wide">
                                  <th className="px-3 py-2 font-normal">Competência</th>
                                  <th className="px-3 py-2 font-normal">Vencimento</th>
                                  <th className="px-3 py-2 font-normal">Valor</th>
                                  <th className="px-3 py-2 font-normal">Status</th>
                                  <th className="px-3 py-2 font-normal">Pago em</th>
                                  <th className="px-3 py-2 font-normal"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {faturasExpandido.map((f) => {
                                  const statusF = statusFatura(f);
                                  const salvandoEssa = salvandoId === f.id;
                                  return (
                                    <tr key={f.id} className="border-t border-border/60">
                                      <td className="px-3 py-2 text-text">{dataBR(f.competencia)}</td>
                                      <td className="px-3 py-2 text-text-sub">{dataBR(f.vencimento)}</td>
                                      <td className="px-3 py-2 text-text-sub">{brl(f.valor)}</td>
                                      <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded-full border ${corStatusFatura(statusF)}`}>
                                          {LABEL_STATUS_FATURA[statusF]}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-text-dim">{f.pago_em ? dataBR(f.pago_em) : "-"}</td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-2 justify-end">
                                          {statusF === "pago" ? (
                                            <button
                                              onClick={() => desfazerFatura(f.id, item.codigo_provedor)}
                                              disabled={salvandoEssa}
                                              className="px-2 py-1 rounded-lg bg-surface text-text-sub border border-border hover:text-warning hover:border-warning/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                              <RotateCcw size={11} /> Desfazer
                                            </button>
                                          ) : statusF === "cancelado" ? (
                                            <button
                                              onClick={() => desfazerFatura(f.id, item.codigo_provedor)}
                                              disabled={salvandoEssa}
                                              className="px-2 py-1 rounded-lg bg-surface text-text-sub border border-border hover:text-warning hover:border-warning/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                              <RotateCcw size={11} /> Reabrir
                                            </button>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => marcarPago(f.id, item.codigo_provedor)}
                                                disabled={salvandoEssa}
                                                className="px-2 py-1 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                              >
                                                <CheckCircle2 size={11} /> Pago
                                              </button>
                                              <button
                                                onClick={() => cancelarFatura(f.id, item.codigo_provedor)}
                                                disabled={salvandoEssa}
                                                className="px-2 py-1 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                              >
                                                <XCircle size={11} /> Cancelar
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!assinaturaModal} onClose={() => setAssinaturaModal(null)} title={`Assinatura — ${assinaturaModal?.nome || ""}`}>
        <div className="space-y-4">
          <div>
            <Label>Plano</Label>
            <Select value={assinaturaForm.plano_id} onChange={(e) => selecionarPlano(e.target.value)}>
              <option value="">Personalizado (sem plano)</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {brl(p.valor_mensalidade)}</option>
              ))}
            </Select>
            {assinaturaForm.plano_id && (
              <p className="text-[11px] text-text-dim mt-1.5">
                Ao salvar, os módulos do provedor são ajustados pra bater com o plano.
              </p>
            )}
          </div>
          <div>
            <Label>Valor da mensalidade (R$)</Label>
            <Input
              value={assinaturaForm.valor_mensalidade}
              onChange={(e) => setAssinaturaForm((f) => ({ ...f, valor_mensalidade: e.target.value }))}
              inputMode="decimal"
              placeholder="ex.: 199.90"
              disabled={!!assinaturaForm.plano_id}
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
