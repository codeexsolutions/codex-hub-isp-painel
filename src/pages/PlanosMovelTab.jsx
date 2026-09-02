import { useState, useEffect, useCallback } from "react";
import { Smartphone, Pencil, Trash2, Inbox, CheckCircle2, XCircle } from "lucide-react";
import Modal from "../components/Modal";
import { Label, Input, Select } from "../components/Field";
import { PlanosMoveis } from "../services/store";
import { useToast } from "../components/Toast";
import { brl, dataBR } from "../utils/faturamento";

const LABEL_STATUS_SOLICITACAO = { pendente: "Pendente", atendida: "Atendida", cancelada: "Cancelada" };
const COR_STATUS_SOLICITACAO = {
  pendente: "border-warning/30 bg-warning/10 text-warning",
  atendida: "border-success/30 bg-success/10 text-success",
  cancelada: "border-border bg-surface-2 text-text-dim",
};

export default function PlanosMovelTab() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm());

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loadingSolic, setLoadingSolic] = useState(true);
  const [salvandoSolicId, setSalvandoSolicId] = useState(null);

  function initialForm() {
    return { nome: "", gb_plano: "", gb_bonus: "", valor: "", ordem: "", ativo: "true" };
  }

  const load = useCallback(async () => {
    try {
      setLista(await PlanosMoveis.listar());
    } catch (err) {
      toast(err.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSolicitacoes = useCallback(async () => {
    try {
      setSolicitacoes(await PlanosMoveis.listarSolicitacoes());
    } catch (err) {
      toast(err.message || "Erro ao carregar solicitações");
    } finally {
      setLoadingSolic(false);
    }
  }, []);

  useEffect(() => {
    loadSolicitacoes();
    const interval = setInterval(loadSolicitacoes, 30000);
    return () => clearInterval(interval);
  }, [loadSolicitacoes]);

  const atualizarStatusSolicitacao = async (id, status) => {
    setSalvandoSolicId(id);
    try {
      await PlanosMoveis.atualizarStatusSolicitacao(id, status);
      await loadSolicitacoes();
      toast(status === "atendida" ? "Solicitação marcada como atendida" : "Solicitação cancelada");
    } catch (err) {
      toast(err.message || "Erro ao atualizar solicitação");
    } finally {
      setSalvandoSolicId(null);
    }
  };

  useEffect(() => { load(); }, [load]);

  const openModal = (id = null) => {
    setEditId(id);
    if (id) {
      const p = lista.find((x) => x.id === id);
      setForm({
        nome: p?.nome || "",
        gb_plano: p?.gb_plano != null ? String(p.gb_plano) : "",
        gb_bonus: p?.gb_bonus != null ? String(p.gb_bonus) : "",
        valor: p?.valor != null ? String(p.valor) : "",
        ordem: p?.ordem != null ? String(p.ordem) : "",
        ativo: p?.ativo !== undefined ? String(p.ativo) : "true",
      });
    } else {
      setForm(initialForm());
    }
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { toast("Informe o nome do plano (ex.: 20GB)"); return; }
    if (!form.gb_plano || Number(form.gb_plano) <= 0) { toast("Informe a quantidade de GB do plano"); return; }
    if (!form.valor || Number(form.valor) <= 0) { toast("Informe o valor mensal"); return; }
    const dados = {
      nome: form.nome.trim(),
      gb_plano: Number(form.gb_plano),
      gb_bonus: Number(form.gb_bonus) || 0,
      valor: Number(form.valor),
      ordem: Number(form.ordem) || 0,
      ativo: form.ativo === "true",
    };
    try {
      if (editId) await PlanosMoveis.atualizar(editId, dados);
      else await PlanosMoveis.criar(dados);
      setModalOpen(false);
      await load();
      toast("Plano salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar plano");
    }
  };

  const excluir = async (id) => {
    if (!confirm("Excluir este plano?")) return;
    try {
      await PlanosMoveis.remover(id);
      await load();
      toast("Plano excluído");
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <p className="text-xs text-text-dim mb-2 font-medium">Solicitações de clientes</p>
        {loadingSolic ? (
          <div className="text-sm text-text-dim text-center py-8">Carregando…</div>
        ) : !solicitacoes.length ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border">
            <Inbox size={28} className="mx-auto text-text-dim mb-2 opacity-40" />
            <p className="text-sm text-text-dim">Nenhuma solicitação ainda.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                  <th className="px-4 py-3 font-normal">Cliente</th>
                  <th className="px-4 py-3 font-normal">CPF/CNPJ</th>
                  <th className="px-4 py-3 font-normal">Plano</th>
                  <th className="px-4 py-3 font-normal">Valor</th>
                  <th className="px-4 py-3 font-normal">Solicitado em</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((s) => {
                  const salvando = salvandoSolicId === s.id;
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-text">{s.cliente_nome || "-"}</td>
                      <td className="px-4 py-3 text-text-sub">{s.cliente_cpf_cnpj}</td>
                      <td className="px-4 py-3 text-text-sub">{s.plano_nome}</td>
                      <td className="px-4 py-3 text-text-sub">{brl(s.plano_valor)}</td>
                      <td className="px-4 py-3 text-text-sub">{dataBR(s.criado_em)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${COR_STATUS_SOLICITACAO[s.status]}`}>
                          {LABEL_STATUS_SOLICITACAO[s.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.status === "pendente" && (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => atualizarStatusSolicitacao(s.id, "atendida")}
                              disabled={salvando}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Atendida
                            </button>
                            <button
                              onClick={() => atualizarStatusSolicitacao(s.id, "cancelada")}
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

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-dim max-w-md">
          Planos de internet móvel que aparecem pro cliente no app. A solicitação chega pra você
          aqui em cima e no sino de notificações — não existe ativação automática.
        </p>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors duration-200 shrink-0"
        >
          + Novo plano
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((p) => (
            <PlanoCard key={p.id} plano={p} onEdit={() => openModal(p.id)} onDelete={() => excluir(p.id)} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar plano" : "Novo plano"}>
        <div className="space-y-4">
          <div>
            <Label>Nome do plano</Label>
            <Input value={form.nome} onChange={set("nome")} placeholder="ex.: 20GB" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>GB do plano</Label>
              <Input value={form.gb_plano} onChange={set("gb_plano")} inputMode="numeric" placeholder="ex.: 15" />
            </div>
            <div>
              <Label>GB bônus (opcional)</Label>
              <Input value={form.gb_bonus} onChange={set("gb_bonus")} inputMode="numeric" placeholder="ex.: 5" />
            </div>
          </div>
          <div>
            <Label>Valor mensal (R$)</Label>
            <Input value={form.valor} onChange={set("valor")} inputMode="decimal" placeholder="ex.: 64.90" />
          </div>
          <div>
            <Label>Ordem de exibição (opcional)</Label>
            <Input value={form.ordem} onChange={set("ordem")} inputMode="numeric" placeholder="0" />
          </div>
          <div>
            <Label>Ativo</Label>
            <Select value={form.ativo} onChange={set("ativo")}>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button onClick={salvar} className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
              Salvar plano
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PlanoCard({ plano: p, onEdit, onDelete }) {
  const isAtivo = p.ativo === true || p.ativo === "true";
  const totalGb = Number(p.gb_plano) + Number(p.gb_bonus || 0);
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="p-4 space-y-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
          {totalGb}GB total
        </span>
        <p className="text-sm text-text">{p.nome}</p>
        <p className="text-xs text-text-sub">
          {p.gb_plano}GB {Number(p.gb_bonus) > 0 ? `+ ${p.gb_bonus}GB bônus` : ""} · {brl(p.valor)}/mês
        </p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block ${
          isAtivo ? "text-success border-success/30 bg-success/8" : "text-text-dim border-border bg-surface-2"
        }`}>
          {isAtivo ? "Ativo" : "Inativo"}
        </span>
      </div>
      <div className="flex border-t border-border">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-text-sub hover:text-accent hover:bg-accent/5 transition-colors">
          <Pencil size={13} /> Editar
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-text-sub hover:text-danger hover:bg-danger/5 transition-colors border-l border-border">
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-center py-16">
      <Smartphone size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhum plano cadastrado ainda.</p>
      <p className="text-xs text-text-dim mt-1">Clique em "+ Novo plano" para criar o primeiro.</p>
    </div>
  );
}
