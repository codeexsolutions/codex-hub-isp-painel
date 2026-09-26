import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label, Input, Help } from "../../components/Field";
import { Parceiro } from "../../services/store";
import { useToast } from "../../components/Toast";

export default function ParceiroPerfilPage() {
  const toast = useToast();
  const [form, setForm] = useState({ nome: "", cidade: "", uf: "", endereco: "", contato: "" });
  const [usuario, setUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  const carregar = async () => {
    try {
      const p = await Parceiro.obterPerfil();
      setForm({
        nome: p?.nome || "",
        cidade: p?.cidade || "",
        uf: p?.uf || "",
        endereco: p?.endereco || "",
        contato: p?.contato || "",
      });
      setUsuario(p?.usuario || "");
    } catch (err) {
      toast(err.message || "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    if (!form.nome.trim()) { toast("Informe o nome do seu negócio"); return; }
    setSaving(true);
    try {
      await Parceiro.atualizarPerfil({
        nome: form.nome.trim(),
        cidade: form.cidade.trim() || null,
        uf: form.uf.trim().toUpperCase() || null,
        endereco: form.endereco.trim() || null,
        contato: form.contato.trim() || null,
      });
      toast("Perfil atualizado");
    } catch (err) {
      toast(err.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const trocarSenha = async () => {
    if (!senhaAtual.trim() || !senhaNova.trim()) { toast("Preencha a senha atual e a nova senha"); return; }
    if (senhaNova.trim() !== confirmarSenha.trim()) { toast("A confirmação não bate com a nova senha"); return; }
    setTrocandoSenha(true);
    try {
      await Parceiro.alterarSenha(senhaAtual.trim(), senhaNova.trim());
      setSenhaAtual(""); setSenhaNova(""); setConfirmarSenha("");
      toast("Senha alterada");
    } catch (err) {
      toast(err.message || "Erro ao trocar senha");
    } finally {
      setTrocandoSenha(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h3 className="text-sm text-text font-display">Meu perfil</h3>

        <div>
          <Label>Usuário</Label>
          <Input value={usuario} disabled />
          <Help>O usuário de acesso não pode ser alterado aqui — fale com a Synk se precisar mudar.</Help>
        </div>

        <div>
          <Label>Nome do seu negócio</Label>
          <Input value={form.nome} onChange={set("nome")} placeholder="ex.: Cinema X" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={set("cidade")} placeholder="ex.: Fortaleza" />
          </div>
          <div>
            <Label>UF</Label>
            <Input value={form.uf} onChange={set("uf")} placeholder="ex.: CE" maxLength={2} />
          </div>
        </div>

        <div>
          <Label>Endereço</Label>
          <Input value={form.endereco} onChange={set("endereco")} placeholder="Rua, número, bairro" />
          <Help>Mostrado pro cliente no app, junto da oferta, pra ele saber onde usar o cupom.</Help>
        </div>

        <div>
          <Label>Contato</Label>
          <Input value={form.contato} onChange={set("contato")} placeholder="Telefone/WhatsApp" />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={salvar}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-accent-gradient text-white text-sm
              hover:brightness-110 transition-all duration-200 shadow-glow disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar perfil"}
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h3 className="text-sm text-text font-display">Alterar senha</h3>

        <div>
          <Label>Senha atual</Label>
          <div className="relative">
            <Input
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              type={showSenha ? "text" : "password"}
              placeholder="Sua senha atual"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Nova senha</Label>
            <Input value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} type={showSenha ? "text" : "password"} placeholder="Mínimo 4 caracteres" />
          </div>
          <div>
            <Label>Confirmar nova senha</Label>
            <Input value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} type={showSenha ? "text" : "password"} placeholder="Repita a nova senha" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={trocarSenha}
            disabled={trocandoSenha}
            className="px-6 py-2.5 rounded-xl border border-border text-sm text-text-sub
              hover:text-text hover:border-border-2 transition-colors disabled:opacity-50"
          >
            {trocandoSenha ? "Alterando…" : "Alterar senha"}
          </button>
        </div>
      </div>
    </div>
  );
}
