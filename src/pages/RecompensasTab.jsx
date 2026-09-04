import { useState, useEffect, useCallback } from "react";
import { Award, Pencil, Trash2, Gift } from "lucide-react";
import Modal from "../components/Modal";
import { Label, Input, Select, Textarea } from "../components/Field";
import { Recompensas } from "../services/store";
import { useToast } from "../components/Toast";

export default function RecompensasTab() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm());
  const [concederOpen, setConcederOpen] = useState(false);
  const [concederForm, setConcederForm] = useState(initialConcederForm());
  const [concedendo, setConcedendo] = useState(false);

  function initialForm() {
    return { titulo: "", descricao: "", pontos_necessarios: "", ativo: "true" };
  }

  function initialConcederForm() {
    return { cliente_cpf_cnpj: "", cliente_nome: "", pontos: "", motivo: "Pagamento em dia", motivo_outro: "" };
  }

  const load = useCallback(async () => {
    try {
      const data = await Recompensas.listar();
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar recompensas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const openModal = (id = null) => {
    setEditId(id);
    if (id) {
      const r = lista.find((x) => x.id === id);
      setForm({
        titulo: r?.titulo || "", descricao: r?.descricao || "",
        pontos_necessarios: r?.pontos_necessarios != null ? String(r.pontos_necessarios) : "",
        ativo: r?.ativo !== undefined ? String(r.ativo) : "true",
      });
    } else {
      setForm(initialForm());
    }
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.titulo.trim()) { toast("Informe o título da recompensa"); return; }
    if (!form.pontos_necessarios || Number(form.pontos_necessarios) <= 0) { toast("Informe a quantidade de pontos necessária"); return; }
    const dados = {
      titulo: form.titulo.trim(), descricao: form.descricao.trim(),
      pontos_necessarios: Number(form.pontos_necessarios), ativo: form.ativo === "true",
    };
    try {
      if (editId) await Recompensas.atualizar(editId, dados);
      else await Recompensas.criar(dados);
      setModalOpen(false);
      await load();
      toast("Recompensa salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar recompensa");
    }
  };

  const excluir = async (id) => {
    if (!confirm("Excluir esta recompensa?")) return;
    try {
      await Recompensas.remover(id);
      await load();
      toast("Recompensa excluída");
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setConceder = (k) => (e) => setConcederForm((f) => ({ ...f, [k]: e.target.value }));

  const concederPontos = async () => {
    if (!concederForm.cliente_cpf_cnpj.trim() || !concederForm.cliente_nome.trim()) {
      toast("Informe o CPF/CNPJ e o nome do cliente"); return;
    }
    if (!concederForm.pontos || Number(concederForm.pontos) <= 0) {
      toast("Informe uma quantidade de pontos válida"); return;
    }
    const motivoFinal = concederForm.motivo === "Outro" ? concederForm.motivo_outro.trim() : concederForm.motivo.trim();
    if (!motivoFinal) { toast("Informe o motivo"); return; }
    setConcedendo(true);
    try {
      await Recompensas.concederPontos({
        cliente_cpf_cnpj: concederForm.cliente_cpf_cnpj.trim(),
        cliente_nome: concederForm.cliente_nome.trim(),
        pontos: Number(concederForm.pontos),
        motivo: motivoFinal,
      });
      toast(`${concederForm.pontos} pontos concedidos a ${concederForm.cliente_nome}`);
      setConcederOpen(false);
      setConcederForm(initialConcederForm());
    } catch (err) {
      toast(err.message || "Erro ao conceder pontos");
    } finally {
      setConcedendo(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-dim max-w-md">
          Recompensas que o cliente troca pelos pontos acumulados em compras de benefícios. Conceda
          pontos manualmente pra clientes que pagam em dia ou tiveram uma indicação efetivada.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setConcederOpen(true)}
            className="px-4 py-2 rounded-xl border border-border text-text-sub text-sm
              hover:border-accent/40 hover:text-accent transition-colors duration-200"
          >
            <Gift size={14} className="inline -mt-0.5 mr-1.5" /> Conceder pontos
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm
              hover:bg-accent-hover transition-colors duration-200"
          >
            + Nova recompensa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((r) => (
            <RecompensaCard key={r.id} recompensa={r} onEdit={() => openModal(r.id)} onDelete={() => excluir(r.id)} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar recompensa" : "Nova recompensa"}>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={form.titulo} onChange={set("titulo")} placeholder="ex.: 10% OFF na próxima compra" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={set("descricao")} rows={3} placeholder="Detalhes da recompensa" />
          </div>
          <div>
            <Label>Pontos necessários</Label>
            <Input value={form.pontos_necessarios} onChange={set("pontos_necessarios")} inputMode="numeric" placeholder="ex.: 100" />
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
              Salvar recompensa
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={concederOpen} onClose={() => setConcederOpen(false)} title="Conceder pontos">
        <div className="space-y-4">
          <p className="text-xs text-text-dim">
            Use pra premiar clientes por fora de uma compra — ex.: pagamento em dia ou indicação
            já efetivada manualmente.
          </p>
          <div>
            <Label>CPF ou CNPJ do cliente</Label>
            <Input value={concederForm.cliente_cpf_cnpj} onChange={setConceder("cliente_cpf_cnpj")} placeholder="000.000.000-00" />
          </div>
          <div>
            <Label>Nome do cliente</Label>
            <Input value={concederForm.cliente_nome} onChange={setConceder("cliente_nome")} placeholder="Nome completo" />
          </div>
          <div>
            <Label>Pontos</Label>
            <Input value={concederForm.pontos} onChange={setConceder("pontos")} inputMode="numeric" placeholder="ex.: 20" />
          </div>
          <div>
            <Label>Motivo</Label>
            <Select value={concederForm.motivo} onChange={setConceder("motivo")}>
              <option value="Pagamento em dia">Pagamento em dia</option>
              <option value="Indicação efetivada">Indicação efetivada</option>
              <option value="Outro">Outro</option>
            </Select>
          </div>

          {concederForm.motivo === "Outro" && (
            <div>
              <Label>Qual o motivo?</Label>
              <Input value={concederForm.motivo_outro} onChange={setConceder("motivo_outro")} placeholder="Descreva o motivo" />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setConcederOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button
              onClick={concederPontos}
              disabled={concedendo}
              className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {concedendo ? "Concedendo…" : "Conceder pontos"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RecompensaCard({ recompensa: r, onEdit, onDelete }) {
  const isAtivo = r.ativo === true || r.ativo === "true";
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="p-4 space-y-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
          {r.pontos_necessarios} pontos
        </span>
        <p className="text-sm text-text">{r.titulo}</p>
        <p className="text-xs text-text-sub line-clamp-2">{r.descricao}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block ${
          isAtivo ? "text-success border-success/30 bg-success/8" : "text-text-dim border-border bg-surface-2"
        }`}>
          {isAtivo ? "Ativa" : "Inativa"}
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
      <Award size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhuma recompensa cadastrada ainda.</p>
      <p className="text-xs text-text-dim mt-1">Clique em "+ Nova recompensa" para criar a primeira.</p>
    </div>
  );
}
