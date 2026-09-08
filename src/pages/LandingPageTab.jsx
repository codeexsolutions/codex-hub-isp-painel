import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Wifi, ExternalLink, Star, Zap, ShieldCheck, Headphones, Clock, Gift, Heart, Plus, X } from "lucide-react";
import Modal from "../components/Modal";
import { Label, Input, Select, Textarea } from "../components/Field";
import { PlanosInternet, LpConfig, LpVantagens, LpApps } from "../services/store";
import { useToast } from "../components/Toast";
import { brl } from "../utils/faturamento";

const LP_BASE_URL = "https://synkisp.com.br/p";

const ICONES_VANTAGEM = {
  zap: { label: "Velocidade", Icon: Zap },
  wifi: { label: "Wi-Fi", Icon: Wifi },
  shield: { label: "Confiança", Icon: ShieldCheck },
  headset: { label: "Suporte", Icon: Headphones },
  clock: { label: "Agilidade", Icon: Clock },
  gift: { label: "Bônus", Icon: Gift },
  star: { label: "Destaque", Icon: Star },
  heart: { label: "Satisfação", Icon: Heart },
};

export default function LandingPageTab() {
  const toast = useToast();

  // Config da LP
  const [config, setConfig] = useState({
    ativa: false, headline: "", subheadline: "", cidade: "", endereco: "",
    notaGoogle: "", qtdAvaliacoesGoogle: "", linkGoogle: "",
  });
  const [codigoProvedor, setCodigoProvedor] = useState(null);
  const [carregandoConfig, setCarregandoConfig] = useState(true);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  // Catálogo de planos de internet
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm());

  // "Por que assinar" (vantagens)
  const [vantagens, setVantagens] = useState([]);
  const [loadingVantagens, setLoadingVantagens] = useState(true);
  const [modalVantagemOpen, setModalVantagemOpen] = useState(false);
  const [editVantagemId, setEditVantagemId] = useState(null);
  const [formVantagem, setFormVantagem] = useState(initialFormVantagem());

  // "Apps inclusos"
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [novoApp, setNovoApp] = useState("");
  const [salvandoApp, setSalvandoApp] = useState(false);

  function initialFormVantagem() {
    return { titulo: "", descricao: "", icone: "zap", ordem: "", ativo: "true" };
  }

  function initialForm() {
    return { nome: "", velocidade_mega: "", valor: "", beneficios: "", destaque: "false", ordem: "", ativo: "true" };
  }

  const carregarConfig = useCallback(async () => {
    try {
      const dados = await LpConfig.obter();
      setConfig({
        ativa: !!dados?.ativa,
        headline: dados?.headline || "",
        subheadline: dados?.subheadline || "",
        cidade: dados?.cidade || "",
        endereco: dados?.endereco || "",
        notaGoogle: dados?.nota_google != null ? String(dados.nota_google) : "",
        qtdAvaliacoesGoogle: dados?.qtd_avaliacoes_google != null ? String(dados.qtd_avaliacoes_google) : "",
        linkGoogle: dados?.link_google || "",
      });
      setCodigoProvedor(dados?.codigo_provedor_fk ?? null);
    } catch (err) {
      toast(err.message || "Erro ao carregar a configuração da Vitrine de Planos");
    } finally {
      setCarregandoConfig(false);
    }
  }, []);

  useEffect(() => { carregarConfig(); }, [carregarConfig]);

  const salvarConfig = async () => {
    setSalvandoConfig(true);
    try {
      const salvo = await LpConfig.definir(config);
      setCodigoProvedor(salvo?.codigo_provedor_fk ?? codigoProvedor);
      toast("Vitrine de Planos atualizada");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSalvandoConfig(false);
    }
  };

  const load = useCallback(async () => {
    try {
      setLista(await PlanosInternet.listar());
    } catch (err) {
      toast(err.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadVantagens = useCallback(async () => {
    try {
      setVantagens(await LpVantagens.listar());
    } catch (err) {
      toast(err.message || "Erro ao carregar vantagens");
    } finally {
      setLoadingVantagens(false);
    }
  }, []);

  useEffect(() => { loadVantagens(); }, [loadVantagens]);

  const loadApps = useCallback(async () => {
    try {
      setApps(await LpApps.listar());
    } catch (err) {
      toast(err.message || "Erro ao carregar apps");
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  const openModalVantagem = (id = null) => {
    setEditVantagemId(id);
    if (id) {
      const v = vantagens.find((x) => x.id === id);
      setFormVantagem({
        titulo: v?.titulo || "",
        descricao: v?.descricao || "",
        icone: v?.icone || "zap",
        ordem: v?.ordem != null ? String(v.ordem) : "",
        ativo: v?.ativo !== undefined ? String(v.ativo) : "true",
      });
    } else {
      setFormVantagem(initialFormVantagem());
    }
    setModalVantagemOpen(true);
  };

  const salvarVantagem = async () => {
    if (!formVantagem.titulo.trim() || !formVantagem.descricao.trim()) {
      toast("Informe o título e a descrição"); return;
    }
    const dados = {
      titulo: formVantagem.titulo.trim(),
      descricao: formVantagem.descricao.trim(),
      icone: formVantagem.icone,
      ordem: Number(formVantagem.ordem) || 0,
      ativo: formVantagem.ativo === "true",
    };
    try {
      if (editVantagemId) await LpVantagens.atualizar(editVantagemId, dados);
      else await LpVantagens.criar(dados);
      setModalVantagemOpen(false);
      await loadVantagens();
      toast("Vantagem salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar vantagem");
    }
  };

  const excluirVantagem = async (id) => {
    if (!confirm("Excluir esta vantagem?")) return;
    try {
      await LpVantagens.remover(id);
      await loadVantagens();
      toast("Vantagem excluída");
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const adicionarApp = async () => {
    if (!novoApp.trim()) return;
    setSalvandoApp(true);
    try {
      await LpApps.criar({ nome: novoApp.trim(), ordem: apps.length, ativo: true });
      setNovoApp("");
      await loadApps();
    } catch (err) {
      toast(err.message || "Erro ao adicionar app");
    } finally {
      setSalvandoApp(false);
    }
  };

  const excluirApp = async (id) => {
    try {
      await LpApps.remover(id);
      await loadApps();
    } catch (err) {
      toast(err.message || "Erro ao remover");
    }
  };

  const openModal = (id = null) => {
    setEditId(id);
    if (id) {
      const p = lista.find((x) => x.id === id);
      setForm({
        nome: p?.nome || "",
        velocidade_mega: p?.velocidade_mega != null ? String(p.velocidade_mega) : "",
        valor: p?.valor != null ? String(p.valor) : "",
        beneficios: p?.beneficios || "",
        destaque: p?.destaque !== undefined ? String(p.destaque) : "false",
        ordem: p?.ordem != null ? String(p.ordem) : "",
        ativo: p?.ativo !== undefined ? String(p.ativo) : "true",
      });
    } else {
      setForm(initialForm());
    }
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { toast("Informe o nome do plano (ex.: 300 MEGA)"); return; }
    if (!form.velocidade_mega || Number(form.velocidade_mega) <= 0) { toast("Informe a velocidade em Mega"); return; }
    if (!form.valor || Number(form.valor) <= 0) { toast("Informe o valor mensal"); return; }
    const dados = {
      nome: form.nome.trim(),
      velocidade_mega: Number(form.velocidade_mega),
      valor: Number(form.valor),
      beneficios: form.beneficios.trim() || null,
      destaque: form.destaque === "true",
      ordem: Number(form.ordem) || 0,
      ativo: form.ativo === "true",
    };
    try {
      if (editId) await PlanosInternet.atualizar(editId, dados);
      else await PlanosInternet.criar(dados);
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
      await PlanosInternet.remover(id);
      await load();
      toast("Plano excluído");
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setConfigCampo = (k) => (e) => setConfig((c) => ({ ...c, [k]: e.target.value }));
  const setVantagemCampo = (k) => (e) => setFormVantagem((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm text-text font-display">Sua Vitrine de Planos</h3>
            <p className="text-xs text-text-dim mt-1 max-w-lg">
              Uma página pública com a sua marca, seus planos de internet e um jeito rápido do cliente
              te chamar. Headline e subtítulo têm um texto padrão pronto — só personalize se quiser.
            </p>
          </div>
          {config.ativa && codigoProvedor && (
            <a
              href={`${LP_BASE_URL}/${codigoProvedor}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors shrink-0"
            >
              Ver minha Vitrine de Planos <ExternalLink size={13} />
            </a>
          )}
        </div>

        {carregandoConfig ? (
          <div className="text-xs text-text-dim py-2">Carregando…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Vitrine de Planos</Label>
              <Select value={String(config.ativa)} onChange={(e) => setConfig((c) => ({ ...c, ativa: e.target.value === "true" }))}>
                <option value="true">Ativa</option>
                <option value="false">Desativada</option>
              </Select>
            </div>
            <div>
              <Label>Título de destaque (opcional)</Label>
              <Input value={config.headline} onChange={setConfigCampo("headline")} placeholder="ex.: A internet mais rápida da cidade" />
            </div>
            <div>
              <Label>Subtítulo (opcional)</Label>
              <Textarea value={config.subheadline} onChange={setConfigCampo("subheadline")} rows={2} placeholder="ex.: Fibra de verdade, sem atraso e sem letra miúda." />
            </div>
            <div>
              <Label>Cidade (opcional)</Label>
              <Input value={config.cidade} onChange={setConfigCampo("cidade")} placeholder="ex.: Fortaleza - CE" />
            </div>
            <div>
              <Label>Endereço (opcional, aparece no rodapé)</Label>
              <Input value={config.endereco} onChange={setConfigCampo("endereco")} placeholder="ex.: Av. Principal, 123 - Centro" />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-text-dim mb-3">
                Prova social (opcional) — se preencher a nota, a Vitrine mostra um selo com sua avaliação do Google.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nota no Google (0 a 5)</Label>
                  <Input value={config.notaGoogle} onChange={setConfigCampo("notaGoogle")} inputMode="decimal" placeholder="ex.: 4.8" />
                </div>
                <div>
                  <Label>Quantidade de avaliações</Label>
                  <Input value={config.qtdAvaliacoesGoogle} onChange={setConfigCampo("qtdAvaliacoesGoogle")} inputMode="numeric" placeholder="ex.: 320" />
                </div>
              </div>
              <div className="mt-4">
                <Label>Link do seu perfil no Google (opcional)</Label>
                <Input value={config.linkGoogle} onChange={setConfigCampo("linkGoogle")} placeholder="https://g.page/..." />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={salvarConfig}
                disabled={salvandoConfig}
                className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {salvandoConfig ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm text-text font-display">Planos de internet (fibra)</h3>
          <p className="text-xs text-text-dim mt-1 max-w-md">
            Esses planos aparecem na sua Vitrine de Planos. Marque um como "Destaque" pra chamar mais atenção.
          </p>
        </div>
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

      <div className="flex items-center justify-between gap-3 flex-wrap pt-4">
        <div>
          <h3 className="text-sm text-text font-display">Por que assinar</h3>
          <p className="text-xs text-text-dim mt-1 max-w-md">
            Cartões de vantagem que aparecem na sua Vitrine de Planos (ex.: "Instalação grátis", "Suporte 24h").
          </p>
        </div>
        <button
          onClick={() => openModalVantagem()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors duration-200 shrink-0"
        >
          + Nova vantagem
        </button>
      </div>

      {loadingVantagens ? (
        <div className="text-sm text-text-dim text-center py-8">Carregando…</div>
      ) : !vantagens.length ? (
        <div className="text-center py-10 bg-surface rounded-2xl border border-border">
          <p className="text-sm text-text-dim">Nenhuma vantagem cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {vantagens.map((v) => (
            <VantagemCard key={v.id} vantagem={v} onEdit={() => openModalVantagem(v.id)} onDelete={() => excluirVantagem(v.id)} />
          ))}
        </div>
      )}

      <div className="pt-4">
        <h3 className="text-sm text-text font-display">Apps inclusos (opcional)</h3>
        <p className="text-xs text-text-dim mt-1 max-w-md">
          Se seus planos já vêm com apps de streaming/música inclusos, liste os nomes aqui — aparecem como
          selo de destaque na Vitrine, sem precisar de logo.
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div className="flex gap-3">
          <Input
            value={novoApp}
            onChange={(e) => setNovoApp(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionarApp(); }}
            placeholder="ex.: HBO Max"
          />
          <button
            onClick={adicionarApp}
            disabled={salvandoApp}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
          >
            <Plus size={15} /> Adicionar
          </button>
        </div>
        {loadingApps ? (
          <div className="text-xs text-text-dim">Carregando…</div>
        ) : apps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {apps.map((a) => (
              <span key={a.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-surface-2 border border-border text-text">
                {a.nome}
                <button onClick={() => excluirApp(a.id)} className="text-text-dim hover:text-danger transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalVantagemOpen} onClose={() => setModalVantagemOpen(false)} title={editVantagemId ? "Editar vantagem" : "Nova vantagem"}>
        <div className="space-y-4">
          <div>
            <Label>Ícone</Label>
            <Select value={formVantagem.icone} onChange={setVantagemCampo("icone")}>
              {Object.entries(ICONES_VANTAGEM).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={formVantagem.titulo} onChange={setVantagemCampo("titulo")} placeholder="ex.: Instalação grátis" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={formVantagem.descricao} onChange={setVantagemCampo("descricao")} rows={2} placeholder="ex.: Técnico vai até sua casa em até 48h, sem custo inicial." />
          </div>
          <div>
            <Label>Ordem de exibição (opcional)</Label>
            <Input value={formVantagem.ordem} onChange={setVantagemCampo("ordem")} inputMode="numeric" placeholder="0" />
          </div>
          <div>
            <Label>Ativo</Label>
            <Select value={formVantagem.ativo} onChange={setVantagemCampo("ativo")}>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalVantagemOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button onClick={salvarVantagem} className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
              Salvar vantagem
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar plano" : "Novo plano"}>
        <div className="space-y-4">
          <div>
            <Label>Nome do plano</Label>
            <Input value={form.nome} onChange={set("nome")} placeholder="ex.: 300 MEGA" />
          </div>
          <div>
            <Label>Velocidade (Mega)</Label>
            <Input value={form.velocidade_mega} onChange={set("velocidade_mega")} inputMode="numeric" placeholder="ex.: 300" />
          </div>
          <div>
            <Label>Valor mensal (R$)</Label>
            <Input value={form.valor} onChange={set("valor")} inputMode="decimal" placeholder="ex.: 99.90" />
          </div>
          <div>
            <Label>Benefícios / tags (opcional, separados por vírgula)</Label>
            <Input value={form.beneficios} onChange={set("beneficios")} placeholder="ex.: Wi-Fi grátis, Instalação grátis" />
          </div>
          <div>
            <Label>Destaque ("mais popular")</Label>
            <Select value={form.destaque} onChange={set("destaque")}>
              <option value="false">Não</option>
              <option value="true">Sim</option>
            </Select>
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
  const isDestaque = p.destaque === true || p.destaque === "true";
  const tags = (p.beneficios || "").split(",").map((t) => t.trim()).filter(Boolean);
  return (
    <div className={`bg-surface rounded-2xl border overflow-hidden ${isDestaque ? "border-accent/50" : "border-border"}`}>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
            {p.velocidade_mega} MEGA
          </span>
          {isDestaque && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-warning flex items-center gap-1">
              <Star size={10} /> Destaque
            </span>
          )}
        </div>
        <p className="text-sm text-text">{p.nome}</p>
        <p className="text-xs text-text-sub">{brl(p.valor)}/mês</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-dim">
                {tag}
              </span>
            ))}
          </div>
        )}
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

function VantagemCard({ vantagem: v, onEdit, onDelete }) {
  const isAtivo = v.ativo === true || v.ativo === "true";
  const { Icon } = ICONES_VANTAGEM[v.icone] || ICONES_VANTAGEM.zap;
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <Icon size={17} />
        </div>
        <p className="text-sm text-text font-medium">{v.titulo}</p>
        <p className="text-xs text-text-sub line-clamp-2">{v.descricao}</p>
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
      <Wifi size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhum plano de internet cadastrado ainda.</p>
      <p className="text-xs text-text-dim mt-1">Clique em "+ Novo plano" para criar o primeiro.</p>
    </div>
  );
}
