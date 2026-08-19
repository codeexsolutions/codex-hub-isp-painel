import { useState, useEffect, useCallback } from "react";
import { Handshake } from "lucide-react";
import { Label, Input, Select } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";

export default function AdminParceirosPage() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [provedores, setProvedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ nome: "", usuario: "", senha: "", codigo_provedor_fk: "" });

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
      });
      setForm({ nome: "", usuario: "", senha: "", codigo_provedor_fk: "" });
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

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-dim max-w-lg">
        Contas de acesso ao painel do parceiro (<code className="text-text-sub">/parceiro</code>) — financeiro e validação de cupom.
        O provedor vincula um benefício a um parceiro cadastrado aqui na aba Benefícios.
      </p>

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
      ) : !lista.length ? (
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
                <th className="px-4 py-3 font-normal">Provedor</th>
                <th className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text">{p.nome}</td>
                  <td className="px-4 py-3 text-text-sub">{p.usuario}</td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
