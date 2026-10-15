import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Tv } from "lucide-react";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";
import { brl, dataBR } from "../../utils/faturamento";

const LABEL_STATUS = {
  pendente: "Aguardando pagamento",
  teste: "Em teste (7 dias)",
  ativa: "Ativa",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

const COR_STATUS = {
  pendente: "border-warning/30 bg-warning/10 text-warning",
  teste: "border-accent/30 bg-accent/10 text-accent",
  ativa: "border-success/30 bg-success/10 text-success",
  vencida: "border-danger/30 bg-danger/10 text-danger",
  cancelada: "border-border bg-surface-2 text-text-dim",
};

const CONFIG_VAZIA = { valor_anual: "", chave_pix: "", nome_recebedor: "", cidade: "" };

export default function AdminLicencasTvPage() {
  const toast = useToast();
  const [config, setConfig] = useState(CONFIG_VAZIA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [licencas, setLicencas] = useState([]);
  const [loadingLicencas, setLoadingLicencas] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [linkEditando, setLinkEditando] = useState({});
  const [salvandoLinkId, setSalvandoLinkId] = useState(null);

  const [criarNome, setCriarNome] = useState("");
  const [criarTelefone, setCriarTelefone] = useState("");
  const [criando, setCriando] = useState(false);

  const [revendedores, setRevendedores] = useState([]);
  const [loadingRevendedores, setLoadingRevendedores] = useState(true);
  const [novoRevendedor, setNovoRevendedor] = useState({ nome: "", usuario: "", senha: "" });
  const [criandoRevendedor, setCriandoRevendedor] = useState(false);
  const [salvandoRevendedorId, setSalvandoRevendedorId] = useState(null);

  const load = useCallback(async () => {
    try {
      const dados = await Admin.obterConfigLicencaTv();
      setConfig({
        valor_anual: String(dados?.valor_anual ?? ""),
        chave_pix: dados?.chave_pix ?? "",
        nome_recebedor: dados?.nome_recebedor ?? "",
        cidade: dados?.cidade ?? "",
      });
    } catch (err) {
      toast(err.message || "Erro ao carregar configuração de licença");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLicencas = useCallback(async () => {
    try {
      setLicencas(await Admin.listarLicencasTv());
    } catch (err) {
      toast(err.message || "Erro ao carregar licenças");
    } finally {
      setLoadingLicencas(false);
    }
  }, []);

  const loadRevendedores = useCallback(async () => {
    try {
      setRevendedores(await Admin.listarRevendedores());
    } catch (err) {
      toast(err.message || "Erro ao carregar revendedores");
    } finally {
      setLoadingRevendedores(false);
    }
  }, []);

  useEffect(() => { load(); loadLicencas(); loadRevendedores(); }, [load, loadLicencas, loadRevendedores]);

  const criarRevendedor = async () => {
    if (!novoRevendedor.nome.trim() || !novoRevendedor.usuario.trim() || !novoRevendedor.senha.trim()) {
      toast("Informe nome, usuário e senha");
      return;
    }
    setCriandoRevendedor(true);
    try {
      await Admin.criarRevendedor(novoRevendedor.nome.trim(), novoRevendedor.usuario.trim(), novoRevendedor.senha.trim());
      setNovoRevendedor({ nome: "", usuario: "", senha: "" });
      await loadRevendedores();
      toast("Revendedor criado — acesso em /revendedor");
    } catch (err) {
      toast(err.message || "Erro ao criar revendedor");
    } finally {
      setCriandoRevendedor(false);
    }
  };

  const alternarStatusRevendedor = async (revendedor) => {
    setSalvandoRevendedorId(revendedor.id);
    try {
      await Admin.definirStatusRevendedor(revendedor.id, revendedor.status !== "ATIVO");
      await loadRevendedores();
    } catch (err) {
      toast(err.message || "Erro ao atualizar status");
    } finally {
      setSalvandoRevendedorId(null);
    }
  };

  const setCampo = (campo) => (e) => setConfig((c) => ({ ...c, [campo]: e.target.value }));

  const salvar = async () => {
    setSaving(true);
    try {
      await Admin.definirConfigLicencaTv({
        valor_anual: Number(config.valor_anual),
        chave_pix: config.chave_pix.trim(),
        nome_recebedor: config.nome_recebedor.trim(),
        cidade: config.cidade.trim(),
      });
      toast("Configuração da licença salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const aprovar = async (item) => {
    setSalvandoId(item.id);
    try {
      await Admin.aprovarLicencaTv(item.id);
      await loadLicencas();
      toast("Licença aprovada — válida por 1 ano");
    } catch (err) {
      toast(err.message || "Erro ao aprovar");
    } finally {
      setSalvandoId(null);
    }
  };

  // Criação manual — usada quando o cliente pede a ativação por fora do app
  // (WhatsApp etc., já que o app não gera mais o pedido/PIX sozinho). Reaproveita
  // a mesma lógica do fluxo público antigo, só que o admin preenche os dados.
  const criarLicenca = async () => {
    if (!criarNome.trim() || !criarTelefone.trim()) {
      toast("Informe nome e telefone");
      return;
    }
    setCriando(true);
    try {
      const resultado = await Admin.criarLicencaTv(criarNome.trim(), criarTelefone.trim());
      setCriarNome("");
      setCriarTelefone("");
      await loadLicencas();
      toast(`Licença criada: ${resultado.chave} — envie essa chave pro cliente`);
    } catch (err) {
      toast(err.message || "Erro ao criar licença");
    } finally {
      setCriando(false);
    }
  };

  const salvarLinkLista = async (item) => {
    const link = (linkEditando[item.id] ?? item.link_pagamento_lista ?? "").trim();
    setSalvandoLinkId(item.id);
    try {
      await Admin.definirLinkPagamentoListaLicencaTv(item.id, link);
      await loadLicencas();
      toast("Link de renovação da lista salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar link");
    } finally {
      setSalvandoLinkId(null);
    }
  };

  const cancelar = async (item) => {
    if (!confirm(`Cancelar a licença de ${item.nome}?`)) return;
    setSalvandoId(item.id);
    try {
      await Admin.cancelarLicencaTv(item.id);
      await loadLicencas();
      toast("Licença cancelada");
    } catch (err) {
      toast(err.message || "Erro ao cancelar");
    } finally {
      setSalvandoId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-xs text-text-dim">
        Licença anual do app Synk TV pra quem usa sem código de provedor (venda avulsa).
        Provedor com código não precisa disso — ele já paga o Synk mensal pelo faturamento normal.
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-sm">
        <div>
          <Label>Valor da licença anual (R$)</Label>
          <Input value={config.valor_anual} onChange={setCampo("valor_anual")} inputMode="decimal" />
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-[11px] text-text-dim mb-3">
            Chave PIX própria da licença — separada da chave usada em Faturamento/Comissão.
          </p>
          <Label>Chave PIX</Label>
          <Input value={config.chave_pix} onChange={setCampo("chave_pix")} placeholder="e-mail, telefone, CPF/CNPJ ou aleatória" />
        </div>

        <div>
          <Label>Nome do recebedor</Label>
          <Input value={config.nome_recebedor} onChange={setCampo("nome_recebedor")} placeholder="ex.: SYNK SOLUCOES" />
        </div>

        <div>
          <Label>Cidade</Label>
          <Input value={config.cidade} onChange={setCampo("cidade")} placeholder="ex.: FORTALEZA" />
        </div>

        <button
          onClick={salvar}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-sm">
        <div>
          <h3 className="text-sm text-text font-display">Criar licença manualmente</h3>
          <p className="text-xs text-text-dim mt-1">
            Pra cliente que pediu ativação por fora do app (WhatsApp, etc.). Gera a chave já —
            copie e envie pra ele digitar no app.
          </p>
        </div>

        <div>
          <Label>Nome do cliente</Label>
          <Input value={criarNome} onChange={(e) => setCriarNome(e.target.value)} placeholder="Nome" />
        </div>

        <div>
          <Label>Telefone</Label>
          <Input value={criarTelefone} onChange={(e) => setCriarTelefone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>

        <button
          onClick={criarLicenca}
          disabled={criando}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {criando ? "Criando…" : "Criar licença"}
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-sm">
        <div>
          <h3 className="text-sm text-text font-display">Revendedores de IPTV</h3>
          <p className="text-xs text-text-dim mt-1">
            Painel básico (em /revendedor) pra cada revendedor cadastrar e gerenciar as licenças
            dos próprios clientes, sem precisar do seu acesso de admin.
          </p>
        </div>

        <div>
          <Label>Nome</Label>
          <Input value={novoRevendedor.nome} onChange={(e) => setNovoRevendedor((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome do revendedor" />
        </div>

        <div>
          <Label>Usuário</Label>
          <Input value={novoRevendedor.usuario} onChange={(e) => setNovoRevendedor((f) => ({ ...f, usuario: e.target.value }))} placeholder="usuário de acesso" />
        </div>

        <div>
          <Label>Senha</Label>
          <Input value={novoRevendedor.senha} onChange={(e) => setNovoRevendedor((f) => ({ ...f, senha: e.target.value }))} type="text" placeholder="senha de acesso" />
        </div>

        <button
          onClick={criarRevendedor}
          disabled={criandoRevendedor}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {criandoRevendedor ? "Criando…" : "Criar revendedor"}
        </button>

        {!loadingRevendedores && revendedores.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            {revendedores.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-text">{r.nome}</span>
                  <span className="text-text-dim ml-2">({r.usuario})</span>
                </div>
                <button
                  onClick={() => alternarStatusRevendedor(r)}
                  disabled={salvandoRevendedorId === r.id}
                  className={`px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wide transition-colors disabled:opacity-50 ${
                    r.status === "ATIVO"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-surface-2 text-text-dim"
                  }`}
                >
                  {r.status}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-text-dim mb-2 font-medium">Licenças solicitadas</p>
        {loadingLicencas ? (
          <div className="text-sm text-text-dim text-center py-8">Carregando…</div>
        ) : !licencas.length ? (
          <div className="text-center py-12">
            <Tv size={32} className="mx-auto text-text-dim mb-3 opacity-40" />
            <p className="text-sm text-text-dim">Nenhuma licença solicitada ainda.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                  <th className="px-4 py-3 font-normal">Nome</th>
                  <th className="px-4 py-3 font-normal">Telefone</th>
                  <th className="px-4 py-3 font-normal">Chave</th>
                  <th className="px-4 py-3 font-normal">Valor</th>
                  <th className="px-4 py-3 font-normal">Vencimento</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Link renovação da lista (Mercado Pago)</th>
                  <th className="px-4 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {licencas.map((item) => {
                  const salvando = salvandoId === item.id;
                  const salvandoLink = salvandoLinkId === item.id;
                  const linkAtual = linkEditando[item.id] ?? item.link_pagamento_lista ?? "";
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-text">{item.nome}</td>
                      <td className="px-4 py-3 text-text-sub">{item.telefone}</td>
                      <td className="px-4 py-3 text-text-sub font-mono text-xs">{item.chave}</td>
                      <td className="px-4 py-3 text-text-sub">{brl(item.valor)}</td>
                      <td className="px-4 py-3 text-text-sub">{item.vencimento ? dataBR(item.vencimento) : "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${COR_STATUS[item.status]}`}>
                          {LABEL_STATUS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[220px]">
                          <Input
                            value={linkAtual}
                            onChange={(e) => setLinkEditando((m) => ({ ...m, [item.id]: e.target.value }))}
                            placeholder="https://mpago.la/..."
                            className="text-xs"
                          />
                          <button
                            onClick={() => salvarLinkLista(item)}
                            disabled={salvandoLink}
                            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {salvandoLink ? "..." : "Salvar"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(item.status === "pendente" || item.status === "teste") && (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => aprovar(item)}
                              disabled={salvando}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Aprovar
                            </button>
                            <button
                              onClick={() => cancelar(item)}
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
