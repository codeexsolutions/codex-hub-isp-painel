import { useState } from "react";
import { Handshake } from "lucide-react";
import { Label, Input } from "../../components/Field";
import { Parceiro } from "../../services/store";

export default function ParceiroLoginPage({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!usuario || !senha) {
      setErro("Preencha usuário e senha.");
      return;
    }
    setLoading(true);
    try {
      await Parceiro.login(usuario, senha);
      onLogin();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-accent-gradient shadow-glow flex items-center justify-center text-white">
            <Handshake size={20} strokeWidth={2} />
          </div>
          <div>
            <div className="text-xl tracking-tight font-display text-text">
              Synk<span className="text-accent">ISP</span>
            </div>
            <div className="text-[10px] text-text-dim tracking-widest uppercase">
              Portal do parceiro
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-3xl border border-border p-6 space-y-4 shadow-soft">
          <div>
            <h1 className="text-base text-text font-display">Acesso do parceiro</h1>
            <p className="text-xs text-text-dim mt-1">Financeiro e validação de cupom.</p>
          </div>

          <div>
            <Label>Usuário</Label>
            <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" />
          </div>

          <div>
            <Label>Senha</Label>
            <Input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" autoComplete="current-password" />
          </div>

          {erro && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{erro}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-accent-gradient text-white text-sm font-medium
              hover:brightness-110 transition-all duration-200 disabled:opacity-50 shadow-glow"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
