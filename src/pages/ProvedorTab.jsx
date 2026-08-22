import { useState, useEffect } from "react";
import { Eye, EyeOff, Plus, X } from "lucide-react";
import { Label, Input, Select, FieldRow, Help } from "../components/Field";
import { Provedores, IxcOsConfig, IxcAssuntos, IxcContratoConfig } from "../services/store";
import { useToast } from "../components/Toast";

export default function ProvedorTab({ provedor, onUpdate }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [showSenha, setShowSenha] = useState(false);
  const [showChave, setShowChave] = useState(false);
  const [saving, setSaving] = useState(false);

  const [osConfig, setOsConfig] = useState({ id_filial: "", setor: "", id_evento_mensagem: "" });
  const [savingOs, setSavingOs] = useState(false);

  const [contratoConfig, setContratoConfig] = useState({ resource_imprimir: "" });
  const [savingContratoConfig, setSavingContratoConfig] = useState(false);

  const [assuntos, setAssuntos] = useState([]);
  const [novoAssunto, setNovoAssunto] = useState({ nome: "", id_assunto_ixc: "" });
  const [salvandoAssunto, setSalvandoAssunto] = useState(false);

  const carregarAssuntos = () => {
    IxcAssuntos.listar().then(setAssuntos).catch(() => {});
  };

  useEffect(() => { carregarAssuntos(); }, []);

  const adicionarAssunto = async () => {
    if (!novoAssunto.nome.trim() || !novoAssunto.id_assunto_ixc) {
      toast("Informe o nome e o ID do assunto no IXC");
      return;
    }
    setSalvandoAssunto(true);
    try {
      await IxcAssuntos.criar({ nome: novoAssunto.nome.trim(), id_assunto_ixc: Number(novoAssunto.id_assunto_ixc) });
      setNovoAssunto({ nome: "", id_assunto_ixc: "" });
      carregarAssuntos();
      toast("Assunto adicionado");
    } catch (err) {
      toast(err.message || "Erro ao adicionar assunto");
    } finally {
      setSalvandoAssunto(false);
    }
  };

  const removerAssunto = async (id) => {
    try {
      await IxcAssuntos.excluir(id);
      setAssuntos((lista) => lista.filter((a) => a.id !== id));
    } catch (err) {
      toast(err.message || "Erro ao remover assunto");
    }
  };

  useEffect(() => {
    if (!provedor) return;
    setForm({
      empresa: provedor.empresa || "",
      nome_fantasia: provedor.nome_fantasia || "",
      cnpj: provedor.cnpj || "",
      nome_administrador: provedor.nome_administrador || "",
      status: provedor.status || "ATIVO",
      codigo_provedor: provedor.codigo_provedor ?? "",
      usuario: provedor.usuario ?? "",
      senha: provedor.senha ?? "",
      gerenciador: provedor.gerenciador || "RECEITANET",
      codigo_api_gerenciador: provedor.codigo_api_gerenciador ?? "",
      dominio_ixc: provedor.dominio_ixc || "",
      chave_api_gerenciador: provedor.chave_api_gerenciador || "",
    });
  }, [provedor]);

  useEffect(() => {
    IxcOsConfig.obter()
      .then((c) => setOsConfig({
        id_filial: c?.id_filial ?? "",
        setor: c?.setor ?? "", id_evento_mensagem: c?.id_evento_mensagem ?? "",
      }))
      .catch(() => {});
  }, []);

  const setOs = (k) => (e) => setOsConfig((f) => ({ ...f, [k]: e.target.value }));

  const salvarOsConfig = async () => {
    setSavingOs(true);
    try {
      await IxcOsConfig.salvar(osConfig);
      toast("Configuração de Ordem de Serviço salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSavingOs(false);
    }
  };

  useEffect(() => {
    IxcContratoConfig.obter()
      .then((c) => setContratoConfig({ resource_imprimir: c?.resource_imprimir ?? "" }))
      .catch(() => {});
  }, []);

  const salvarContratoConfig = async () => {
    if (!contratoConfig.resource_imprimir.trim()) {
      toast("Informe o recurso de impressão de contrato");
      return;
    }
    setSavingContratoConfig(true);
    try {
      await IxcContratoConfig.salvar(contratoConfig);
      toast("Configuração de contrato salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSavingContratoConfig(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    setSaving(true);
    try {
      const patch = {
        empresa: form.empresa,
        nome_fantasia: form.nome_fantasia || null,
        cnpj: form.cnpj,
        nome_administrador: form.nome_administrador,
        usuario: form.usuario,
        senha: form.senha,
        status: form.status,
        gerenciador: form.gerenciador,
        codigo_api_gerenciador: form.codigo_api_gerenciador ? Number(form.codigo_api_gerenciador) : null,
        dominio_ixc: form.dominio_ixc || null,
        chave_api_gerenciador: form.chave_api_gerenciador || null,
      };
      const updated = await Provedores.atualizar(provedor.id, patch);
      onUpdate(updated);
      toast("Dados do provedor salvos");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados cadastrais */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm text-text font-display">Dados cadastrais</h3>

          <div>
            <Label>Empresa</Label>
            <Input value={form.empresa || ""} onChange={set("empresa")} />
          </div>

          <div>
            <Label>Nome fantasia</Label>
            <Input value={form.nome_fantasia || ""} onChange={set("nome_fantasia")} placeholder="Como o provedor é conhecido" />
          </div>

          <FieldRow>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj || ""} onChange={set("cnpj")} />
            </div>
            <div>
              <Label>Nome do administrador</Label>
              <Input value={form.nome_administrador || ""} onChange={set("nome_administrador")} />
            </div>
          </FieldRow>

          <FieldRow>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "ATIVO"} disabled>
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
                <option value="SUSPENSO">SUSPENSO</option>
              </Select>
            </div>
            <div>
              <Label>Código do provedor</Label>
              <Input value={form.codigo_provedor || ""} disabled />
            </div>
          </FieldRow>

          <FieldRow>
            <div>
              <Label>Usuário</Label>
              <Input value={form.usuario || ""} onChange={set("usuario")} />
            </div>
            <div>
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  value={form.senha || ""}
                  onChange={set("senha")}
                  type={showSenha ? "text" : "password"}
                  placeholder="Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-sub transition-colors"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </FieldRow>
        </div>

        {/* Integração */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm text-text font-display">Integração com o gerenciador</h3>

          <div>
            <Label>Gerenciador</Label>
            <Select value={form.gerenciador || "RECEITANET"} onChange={set("gerenciador")}>
              <option value="RECEITANET">RECEITANET</option>
              <option value="IXCSOFT">IXCSOFT</option>
            </Select>
          </div>

          <FieldRow>
            <div>
              <Label>Código API gerenciador</Label>
              <Input value={form.codigo_api_gerenciador || ""} onChange={set("codigo_api_gerenciador")} placeholder="ex.: 128" inputMode="numeric" />
            </div>
            <div>
              <Label>Domínio IXC</Label>
              <Input value={form.dominio_ixc || ""} onChange={set("dominio_ixc")} placeholder="ex.: suaempresa.ixcsoft.com.br" />
              <Help>Caso gerenciador seja IXCSOFT</Help>
            </div>
          </FieldRow>

          <div>
            <Label>Chave API gerenciador</Label>
            <div className="relative">
              <Input
                value={form.chave_api_gerenciador || ""}
                onChange={set("chave_api_gerenciador")}
                type={showChave ? "text" : "password"}
                placeholder="Token de integração"
              />
              <button
                type="button"
                onClick={() => setShowChave(!showChave)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-sub transition-colors"
              >
                {showChave ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Help>Usada para o app buscar faturas, consumo e dados cadastrais do cliente.</Help>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>

      {form.gerenciador === "IXCSOFT" && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm text-text font-display">Ordem de Serviço (IXC)</h3>
            <p className="text-xs text-text-dim mt-1">
              IDs cadastrados no seu IXC, usados quando um cliente abre ou responde um chamado pelo app.
              Sem isso preenchido, abrir/responder chamado fica indisponível pros seus clientes.
            </p>
          </div>

          <FieldRow>
            <div>
              <Label>ID da filial</Label>
              <Input value={osConfig.id_filial} onChange={setOs("id_filial")} inputMode="numeric" placeholder="ex.: 1" />
            </div>
            <div>
              <Label>ID do setor</Label>
              <Input value={osConfig.setor} onChange={setOs("setor")} inputMode="numeric" placeholder="ex.: 1" />
            </div>
          </FieldRow>

          <div>
            <Label>ID do evento (mensagem)</Label>
            <Input value={osConfig.id_evento_mensagem} onChange={setOs("id_evento_mensagem")} inputMode="numeric" placeholder="ex.: 8" className="max-w-[140px]" />
            <Help>Usado ao enviar uma resposta/mensagem num chamado já aberto.</Help>
          </div>

          <div className="flex justify-end">
            <button
              onClick={salvarOsConfig}
              disabled={savingOs}
              className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
                hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
            >
              {savingOs ? "Salvando…" : "Salvar configuração de OS"}
            </button>
          </div>
        </div>
      )}

      {form.gerenciador === "IXCSOFT" && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm text-text font-display">Assuntos de chamado (IXC)</h3>
            <p className="text-xs text-text-dim mt-1">
              Seu IXC tem vários assuntos cadastrados — adicione aqui os que o cliente pode escolher
              ao abrir um chamado pelo app, com o ID correspondente lá no IXC.
            </p>
          </div>

          {assuntos.length > 0 && (
            <div className="divide-y divide-border">
              {assuntos.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <span className="text-sm text-text">{a.nome}</span>
                    <span className="text-xs text-text-dim ml-2">ID {a.id_assunto_ixc}</span>
                  </div>
                  <button onClick={() => removerAssunto(a.id)} className="text-text-dim hover:text-danger p-1">
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <FieldRow>
            <div>
              <Label>Nome exibido pro cliente</Label>
              <Input
                value={novoAssunto.nome}
                onChange={(e) => setNovoAssunto((f) => ({ ...f, nome: e.target.value }))}
                placeholder="ex.: Sem conexão"
              />
            </div>
            <div>
              <Label>ID do assunto no IXC</Label>
              <Input
                value={novoAssunto.id_assunto_ixc}
                onChange={(e) => setNovoAssunto((f) => ({ ...f, id_assunto_ixc: e.target.value }))}
                inputMode="numeric"
                placeholder="ex.: 1"
              />
            </div>
          </FieldRow>

          <div className="flex justify-end">
            <button
              onClick={adicionarAssunto}
              disabled={salvandoAssunto}
              className="px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/30 text-sm
                hover:bg-accent/20 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={15} /> Adicionar assunto
            </button>
          </div>
        </div>
      )}

      {form.gerenciador === "IXCSOFT" && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm text-text font-display">Visualização de contrato (IXC)</h3>
            <p className="text-xs text-text-dim mt-1">
              Recurso do endpoint de impressão de contrato do seu IXC (Sistema {'>'} Ferramentas {'>'} API {'>'} Imprimir
              Contrato). O nome muda por instalação, ex.: cliente_contrato_imprimir_contrato_17678. Sem isso
              preenchido, "Meu contrato" fica indisponível pros seus clientes.
            </p>
          </div>

          <div>
            <Label>Recurso de impressão</Label>
            <Input
              value={contratoConfig.resource_imprimir}
              onChange={(e) => setContratoConfig((f) => ({ ...f, resource_imprimir: e.target.value }))}
              placeholder="ex.: cliente_contrato_imprimir_contrato_17678"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={salvarContratoConfig}
              disabled={savingContratoConfig}
              className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
                hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
            >
              {savingContratoConfig ? "Salvando…" : "Salvar configuração de contrato"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
