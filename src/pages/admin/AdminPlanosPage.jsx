import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Package } from "lucide-react";
import Modal from "../../components/Modal";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";
import { brl } from "../../utils/faturamento";

const MODULOS = [
  { key: "beneficios", label: "Benefícios" },
  { key: "recompensas", label: "Recompensas" },
  { key: "desbloqueio_confianca", label: "Desbloqueio de confiança" },
  { key: "app_tv", label: "App Synk TV" },
  { key: "iptv", label: "IPTV Ao Vivo (app do assinante)" },
  { key: "planos_moveis", label: "Internet Móvel (planos de dados)" },
];

const FORM_VAZIO = { nome: "", valor_mensalidade: "", modulos: [], ordem: "" };

export default function AdminPlanosPage() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  const [modal, setModal] = useState(null); // { id?: number }
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const load = useCallback(async () => {
    try {
      setLista(await Admin.listarPlanos());
    } catch (err) {
      toast(err.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const abrirNovo = () => {
    setForm({ ...FORM_VAZIO, ordem: String(lista.length + 1) });
    setModal({});
  };

  const abrirEditar = (plano) => {
    setForm({
      nome: plano.nome,
      valor_mensalidade: String(plano.valor_mensalidade),
      modulos: plano.modulos || [],
      ordem: String(plano.ordem ?? 0),
    });
    setModal({ id: plano.id });
  };

  const alternarModulo = (chave) => {
    setForm((f) => ({
      ...f,
      modulos: f.modulos.includes(chave) ? f.modulos.filter((m) => m !== chave) : [...f.modulos, chave],
    }));
  };

  const salvar = async () => {
    if (!form.nome.trim()) { toast("Informe o nome do plano"); return; }
    if (!(Number(form.valor_mensalidade) > 0)) { toast("Informe um valor válido"); return; }

    const dados = {
      nome: form.nome.trim(),
      valor_mensalidade: Number(form.valor_mensalidade),
      modulos: form.modulos,
      ordem: Number(form.ordem) || 0,
    };

    setSalvando(true);
    try {
      if (modal.id) await Admin.editarPlano(modal.id, dados);
      else await Admin.criarPlano(dados);
      setModal(null);
      await load();
      toast("Plano salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar plano");
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (plano) => {
    setSalvandoId(plano.id);
    try {
      await Admin.definirStatusPlano(plano.id, !plano.ativo);
      setLista((atual) => atual.map((p) => (p.id === plano.id ? { ...p, ativo: !p.ativo } : p)));
    } catch (err) {
      toast(err.message || "Erro ao atualizar plano");
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim max-w-md">
          Planos de venda do Synk — pacotes de módulos + valor, usados ao configurar a assinatura de um provedor.
        </p>
        <button
          onClick={abrirNovo}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors
            flex items-center gap-2 shrink-0"
        >
          <Plus size={15} /> Novo plano
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-sm text-text-dim">Nenhum plano cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lista.map((plano) => (
            <div key={plano.id} className={`bg-surface rounded-2xl border p-5 space-y-3 ${plano.ativo ? "border-border" : "border-border opacity-50"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-text font-display">{plano.nome}</div>
                  <div className="text-xl text-text font-display mt-1">{brl(plano.valor_mensalidade)}<span className="text-xs text-text-dim">/mês</span></div>
                </div>
                <button onClick={() => abrirEditar(plano)} className="text-text-dim hover:text-accent p-1">
                  <Pencil size={15} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(plano.modulos || []).length ? (
                  plano.modulos.map((m) => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                      {MODULOS.find((x) => x.key === m)?.label || m}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-text-dim">Nenhum módulo incluído</span>
                )}
              </div>

              <button
                onClick={() => alternarStatus(plano)}
                disabled={salvandoId === plano.id}
                className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors disabled:opacity-50 ${
                  plano.ativo
                    ? "text-success border-success/30 bg-success/8 hover:bg-success/15"
                    : "text-danger border-danger/30 bg-danger/8 hover:bg-danger/15"
                }`}
              >
                {plano.ativo ? "Ativo" : "Inativo"}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Editar plano" : "Novo plano"}>
        <div className="space-y-4">
          <div>
            <Label>Nome do plano</Label>
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="ex.: Profissional" />
          </div>

          <div>
            <Label>Valor da mensalidade (R$)</Label>
            <Input
              value={form.valor_mensalidade}
              onChange={(e) => setForm((f) => ({ ...f, valor_mensalidade: e.target.value }))}
              inputMode="decimal"
              placeholder="ex.: 99.90"
            />
          </div>

          <div>
            <Label>Ordem de exibição</Label>
            <Input value={form.ordem} onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))} inputMode="numeric" className="max-w-[100px]" />
          </div>

          <div>
            <Label>Módulos incluídos</Label>
            <div className="space-y-2">
              {MODULOS.map((m) => (
                <label key={m.key} className="flex items-center gap-2.5 text-sm text-text-sub cursor-pointer">
                  <input type="checkbox" checked={form.modulos.includes(m.key)} onChange={() => alternarModulo(m.key)} className="accent-[var(--accent)]" />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
