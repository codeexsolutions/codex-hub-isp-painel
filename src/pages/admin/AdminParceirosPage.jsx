import { useState, useEffect, useCallback } from "react";
import { Handshake, MapPin } from "lucide-react";
import Modal from "../../components/Modal";
import { Label, Input, Select, Textarea } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";

export default function AdminParceirosPage() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [provedores, setProvedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ nome: "", usuario: "", senha: "", codigo_provedor_fk: "", cidade: "", uf: "", endereco: "", contato: "" });
  const [contatoModalId, setContatoModalId] = useState(null);
  const [contatoForm, setContatoForm] = useState({ endereco: "", contato: "" });
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [aprovarModal, setAprovarModal] = useState(null);
  const [aprovarForm, setAprovarForm] = useState({ usuario: "", senha: "" });
  const [aprovando, setAprovando] = useState(false);
  const [rejeitandoId, setRejeitandoId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [data, provs] = await Promise.all([Admin.listarParceiros(), Admin.listarProvedores()]);
      setLista(data);
      setProvedores(provs);
    } catch (err) {
      toast(err.message || "Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const criar = async () => {
    if (!form.nome.trim() || !form.usuario.trim() || !form.senha.trim()) {
      toast("Preencha nome, usuário e senha"); return;
    }
    setCriando(true);
    try {
      await Admin.criarParceiro({
        nome: form.nome.trim(),
        usuario: form.usuario.trim(),
        senha: form.senha.trim(),
        ativo: true,
        codigo_provedor_fk: form.codigo_provedor_fk ? Number.parseInt(form.codigo_provedor_fk) : null,
        cidade: form.cidade.trim() || null,
        uf: form.uf.trim().toUpperCase() || null,
        endereco: form.endereco.trim() || null,
        contato: form.contato.trim() || null,
      });
      setForm({ nome: "", usuario: "", senha: "", codigo_provedor_fk: "", cidade: "", uf: "", endereco: "", contato: "" });
      await load();
      toast("Parceiro cadastrado");
    } catch (err) {
      toast(err.message || "Erro ao cadastrar parceiro");
    } finally {
      setCriando(false);
    }
  };

  const toggle = async (parceiro) => {
    setSalvandoId(parceiro.id);
    try {
      await Admin.definirStatusParceiro(parceiro.id, !parceiro.ativo);
      setLista((atual) => atual.map((p) => (p.id === parceiro.id ? { ...p, ativo: !p.ativo } : p)));
    } catch (err) {
      toast(err.message || "Erro ao atualizar parceiro");
    } finally {
      setSalvandoId(null);
    }
  };

  const mudarProvedor = async (parceiro, valor) => {
    const codigoProvedorFk = valor ? Number.parseInt(valor) : null;
    setSalvandoId(parceiro.id);
    try {
      await Admin.definirProvedorParceiro(parceiro.id, codigoProvedorFk);
      const prov = provedores.find((p) => p.codigo_provedor === codigoProvedorFk);
      setLista((atual) => atual.map((p) => (p.id === parceiro.id
        ? { ...p, codigo_provedor_fk: codigoProvedorFk, provedor_nome: prov ? (prov.nome_fantasia || prov.empresa) : null }
        : p)));
      toast("Vínculo de provedor atualizado");
    } catch (err) {
      toast(err.message || "Erro ao atualizar provedor do parceiro");
    } finally {
      setSalvandoId(null);
    }
  };

  const mudarLocalizacao = async (parceiro, cidade, uf) => {
    setSalvandoId(parceiro.id);
    try {
      await Admin.definirLocalizacaoParceiro(parceiro.id, cidade || null, uf || null);
      setLista((atual) => atual.map((p) => (p.id === parceiro.id ? { ...p, cidade, uf } : p)));
    } catch (err) {
      toast(err.message || "Erro ao atualizar localização do parceiro");
    } finally {
      setSalvandoId(null);
    }
  };

  const abrirAprovarModal = (parceiro) => {
    setAprovarForm({ usuario: "", senha: "" });
    setAprovarModal(parceiro);
  };

  const aprovar = async () => {
    if (!aprovarForm.usuario.trim() || !aprovarForm.senha.trim()) {
      toast("Defina usuário e senha de acesso"); return;
    }
    setAprovando(true);
    try {
      await Admin.aprovarParceiro(aprovarModal.id, aprovarForm.usuario.trim(), aprovarForm.senha.trim());
      setAprovarModal(null);
      await load();
      toast("Parceiro aprovado — credenciais liberadas");
    } catch (err) {
      toast(err.message || "Erro ao aprovar parceiro");
    } finally {
      setAprovando(false);
    }
  };

  const rejeitar = async (parceiro) => {
    setRejeitandoId(parceiro.id);
    try {
      await Admin.rejeitarParceiro(parceiro.id);
      await load();
      toast("Pré-cadastro rejeitado");
    } catch (err) {
      toast(err.message || "Erro ao rejeitar parceiro");
    } finally {
      setRejeitandoId(null);
    }
  };

  const abrirContatoModal = (parceiro) => {
    setContatoForm({ endereco: parceiro.endereco || "", contato: parceiro.contato || "" });
    setContatoModalId(parceiro.id);
  };

  const salvarContato = async () => {
    setSalvandoContato(true);
    try {
      await Admin.definirContatoParceiro(contatoModalId, contatoForm.endereco.trim() || null, contatoForm.contato.trim() || null);
      setLista((atual) => atual.map((p) => (p.id === contatoModalId
        ? { ...p, endereco: contatoForm.endereco.trim() || null, contato: contatoForm.contato.trim() || null }
        : p)));
      setContatoModalId(null);
      toast("Endereço e contato atualizados");
    } catch (err) {
      toast(err.message || "Erro ao atualizar endereço/contato");
    } finally {
      setSalvandoContato(false);
    }
  };

  const pendentes = lista.filter((p) => p.status === "pendente");
  const demais = lista.filter((p) => p.status !== "pendente");

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-dim max-w-lg">
        Contas de acesso ao painel do parceiro (<code className="text-text-sub">/parceiro</code>) — financeiro e validação de cupom.
        O provedor vincula um benefício a um parceiro cadastrado aqui na aba Benefícios.
      </p>

      {pendentes.length > 0 && (
        <div className="bg-surface rounded-2xl border border-accent/30 p-5 space-y-4">
          <div>
            <h3 className="text-sm text-text font-display">Pré-cadastros pendentes</h3>
            <p className="text-xs text-text-dim mt-1">Vieram do formulário de Parcerias do site — revise e aprove ou rejeite.</p>
          </div>
          <div className="divide-y divide-border">
            {pendentes.map((p) => (
              <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-text">{p.nome}</div>
                  <div className="text-[11px] text-text-dim mt-0.5">
                    {[p.cidade, p.uf].filter(Boolean).join("/") || "Sem localização"}
                    {p.contato && ` · ${p.contato}`}
                  </div>
                  {p.observacoes && (
                    <div className="text-[11px] text-text-dim mt-1 max-w-md italic">"{p.observacoes}"</div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => rejeitar(p)}
                    disabled={rejeitandoId === p.id}
                    className="px-3 py-1.5 rounded-lg text-xs border border-border text-text-sub hover:text-danger hover:border-danger/30 transition-colors disabled:opacity-50"
                  >
                    {rejeitandoId === p.id ? "Rejeitando…" : "Rejeitar"}
                  </button>
                  <button
                    onClick={() => abrirAprovarModal(p)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-accent text-white hover:bg-accent-hover transition-colors"
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-xl">
        <h3 className="text-sm text-text font-display">Novo parceiro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={form.nome} onChange={set("nome")} placeholder="ex.: Cinema X" />
          </div>
          <div>
            <Label>Usuário</Label>
            <Input value={form.usuario} onChange={set("usuario")} placeholder="ex.: cinemax" />
          </div>
          <div>
            <Label>Senha</Label>
            <Input value={form.senha} onChange={set("senha")} type="text" placeholder="senha de acesso" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={set("cidade")} placeholder="ex.: Fortaleza" />
          </div>
          <div>
            <Label>UF</Label>
            <Input value={form.uf} onChange={set("uf")} maxLength={2} placeholder="ex.: CE" />
          </div>
        </div>
        <div>
          <Label>Endereço completo</Label>
          <Textarea value={form.endereco} onChange={set("endereco")} rows={2} placeholder="Rua, número, bairro — onde o cliente vai usar o cupom" />
        </div>
        <div>
          <Label>Contato (telefone/WhatsApp)</Label>
          <Input value={form.contato} onChange={set("contato")} placeholder="ex.: (85) 99999-9999" />
        </div>
        <div>
          <Label>Provedor</Label>
          <Select value={form.codigo_provedor_fk} onChange={set("codigo_provedor_fk")}>
            <option value="">Nacional (todos os provedores)</option>
            {provedores.map((p) => (
              <option key={p.codigo_provedor} value={p.codigo_provedor}>
                {p.nome_fantasia || p.empresa}
              </option>
            ))}
          </Select>
        </div>
        <button
          onClick={criar}
          disabled={criando}
          className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {criando ? "Cadastrando…" : "Cadastrar parceiro"}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !demais.length ? (
        <div className="text-center py-16">
          <Handshake size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-sm text-text-dim">Nenhum parceiro cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">Usuário</th>
                <th className="px-4 py-3 font-normal">Localização</th>
                <th className="px-4 py-3 font-normal">Endereço/contato</th>
                <th className="px-4 py-3 font-normal">Provedor</th>
                <th className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {demais.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text">{p.nome}</td>
                  <td className="px-4 py-3 text-text-sub">{p.usuario}</td>
                  <td className="px-4 py-3 text-text-sub">
                    <div className="flex gap-1.5">
                      <input
                        defaultValue={p.cidade || ""}
                        placeholder="Cidade"
                        disabled={salvandoId === p.id}
                        onBlur={(e) => {
                          if (e.target.value !== (p.cidade || "")) mudarLocalizacao(p, e.target.value.trim(), p.uf || "");
                        }}
                        className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text disabled:opacity-50"
                      />
                      <input
                        defaultValue={p.uf || ""}
                        placeholder="UF"
                        maxLength={2}
                        disabled={salvandoId === p.id}
                        onBlur={(e) => {
                          const uf = e.target.value.trim().toUpperCase();
                          if (uf !== (p.uf || "")) mudarLocalizacao(p, p.cidade || "", uf);
                        }}
                        className="w-12 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text uppercase disabled:opacity-50"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-sub">
                    <button
                      onClick={() => abrirContatoModal(p)}
                      className="flex items-center gap-1.5 text-xs hover:text-accent transition-colors max-w-[180px] text-left"
                      title="Editar endereço e contato"
                    >
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {p.endereco || p.contato ? (p.endereco || p.contato) : "Não informado"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-sub">
                    <select
                      value={p.codigo_provedor_fk ?? ""}
                      onChange={(e) => mudarProvedor(p, e.target.value)}
                      disabled={salvandoId === p.id}
                      className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text disabled:opacity-50"
                    >
                      <option value="">Nacional (todos)</option>
                      {provedores.map((prov) => (
                        <option key={prov.codigo_provedor} value={prov.codigo_provedor}>
                          {prov.nome_fantasia || prov.empresa}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "rejeitado" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border text-text-dim border-border bg-surface-2">
                        Rejeitado
                      </span>
                    ) : (
                      <button
                        onClick={() => toggle(p)}
                        disabled={salvandoId === p.id}
                        className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors disabled:opacity-50 ${
                          p.ativo
                            ? "text-success border-success/30 bg-success/8 hover:bg-success/15"
                            : "text-danger border-danger/30 bg-danger/8 hover:bg-danger/15"
                        }`}
                      >
                        {p.ativo ? "Ativo" : "Inativo"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={contatoModalId != null} onClose={() => setContatoModalId(null)} title="Endereço e contato">
        <div className="space-y-4">
          <p className="text-xs text-text-dim">
            Mostrado pro cliente no app junto da oferta, pra ele já saber onde e como usar o cupom.
          </p>
          <div>
            <Label>Endereço completo</Label>
            <Textarea
              value={contatoForm.endereco}
              onChange={(e) => setContatoForm((f) => ({ ...f, endereco: e.target.value }))}
              rows={3}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>
          <div>
            <Label>Contato (telefone/WhatsApp)</Label>
            <Input
              value={contatoForm.contato}
              onChange={(e) => setContatoForm((f) => ({ ...f, contato: e.target.value }))}
              placeholder="ex.: (85) 99999-9999"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setContatoModalId(null)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button
              onClick={salvarContato}
              disabled={salvandoContato}
              className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {salvandoContato ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={aprovarModal != null} onClose={() => setAprovarModal(null)} title="Aprovar parceiro">
        <div className="space-y-4">
          <p className="text-xs text-text-dim">
            Defina o usuário e a senha de acesso ao portal do parceiro (<code className="text-text-sub">/parceiro</code>) pra <strong className="text-text-sub">{aprovarModal?.nome}</strong>.
            Envie essas credenciais pra ele por WhatsApp/e-mail depois de aprovar.
          </p>
          <div>
            <Label>Usuário</Label>
            <Input value={aprovarForm.usuario} onChange={(e) => setAprovarForm((f) => ({ ...f, usuario: e.target.value }))} placeholder="ex.: cinemax" />
          </div>
          <div>
            <Label>Senha</Label>
            <Input value={aprovarForm.senha} onChange={(e) => setAprovarForm((f) => ({ ...f, senha: e.target.value }))} type="text" placeholder="senha de acesso" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setAprovarModal(null)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button
              onClick={aprovar}
              disabled={aprovando}
              className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {aprovando ? "Aprovando…" : "Aprovar parceiro"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
