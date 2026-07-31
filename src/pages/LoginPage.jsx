import { useState } from "react";
import { Label, Input, Select } from "../components/Field";
import { Sessao, Provedores } from "../services/store";
import { maskCnpj } from "../services/format";
import { useToast } from "../components/Toast";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const toast = useToast();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-accent/15 flex items-center justify-center text-accent text-xl">
            ◈
          </div>
          <div>
            <div className="text-xl tracking-tight font-display text-text">
              hub<span className="text-accent">ISP</span>
            </div>
            <div className="text-[10px] text-text-dim tracking-widest uppercase">
              Painel do Provedor
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
          {mode === "login" ? (
            <LoginForm onLogin={onLogin} onGoRegister={() => setMode("register")} />
          ) : (
            <RegisterForm onLogin={onLogin} onGoLogin={() => setMode("login")} toast={toast} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, onGoRegister }) {
  const [codigoProvedor, setCodigoProvedor] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemo = () => {
    setCodigoProvedor("1");
    setUsuario("admin.fortal");
    setSenha("demo123");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!codigoProvedor || !usuario || !senha) {
      setErro("Preencha código do provedor, usuário e senha.");
      return;
    }
    setLoading(true);
    try {
      const p = await Sessao.login(usuario, senha, codigoProvedor);
      onLogin(p);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-base text-text font-display">Acesse sua conta</h1>
        <p className="text-xs text-text-dim mt-1">Entre com o usuário e senha do seu provedor.</p>
      </div>

      <div>
        <Label>Código do provedor</Label>
        <Input value={codigoProvedor} onChange={(e) => setCodigoProvedor(e.target.value)} placeholder="ex.: 1" inputMode="numeric" />
        <p className="text-[11px] text-text-dim mt-1">O código gerado no seu cadastro.</p>
      </div>

      <div>
        <Label>Usuário</Label>
        <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="ex.: admin.suaempresa" autoComplete="username" />
      </div>

      <div>
        <Label>Senha</Label>
        <Input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" />
      </div>

      {erro && (
        <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{erro}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-accent text-white text-sm
          hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>

      <div className="flex flex-col items-center gap-2">
        <button type="button" onClick={onGoRegister} className="text-xs text-accent hover:text-accent-hover transition-colors">
          Ainda não tenho provedor cadastrado
        </button>
        {/* <button type="button" onClick={handleDemo} className="text-[11px] text-text-dim hover:text-text-sub transition-colors">
          Usar acesso de demonstração
        </button> */}
      </div>
    </form>
  );
}

function RegisterForm({ onLogin, onGoLogin, toast }) {
  const [form, setForm] = useState({
    empresa: "", gerenciador: "", cnpj: "", nome_administrador: "", usuario: "", senha: "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === "cnpj") v = maskCnpj(v);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (Object.values(form).some((v) => !v)) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.senha.length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const novo = await Provedores.cadastrar(form);
      toast(`Provedor cadastrado! Código: ${novo.codigo_provedor}`);
      onLogin(novo);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-base text-text font-display">Cadastrar provedor</h1>
        <p className="text-xs text-text-dim mt-1">
          Informe os dados básicos para criar sua conta no HUB ISP.
        </p>
      </div>

      <div>
        <Label required>Empresa</Label>
        <Input value={form.empresa} onChange={set("empresa")} placeholder="Razão social da empresa" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Gerenciador</Label>
          <Select value={form.gerenciador} onChange={set("gerenciador")}>
            <option value="" disabled>Selecione…</option>
            <option value="RECEITANET">RECEITANET</option>
            <option value="IXCSOFT" disabled>IXCSOFT</option>
          </Select>
        </div>
        <div>
          <Label required>CNPJ</Label>
          <Input value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0000-00" inputMode="numeric" />
        </div>
      </div>

      <div>
        <Label required>Nome do administrador</Label>
        <Input value={form.nome_administrador} onChange={set("nome_administrador")} placeholder="Nome completo" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Usuário</Label>
          <Input value={form.usuario} onChange={set("usuario")} placeholder="ex.: admin.suaempresa" autoComplete="username" />
        </div>
        <div>
          <Label required>Senha</Label>
          <Input value={form.senha} onChange={set("senha")} type="password" placeholder="mín. 6 caracteres" autoComplete="new-password" />
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 space-y-2">
        <div className="text-xs text-accent">Próximos passos</div>
        <ul className="text-[11px] text-text-sub space-y-1">
          <li>✔ Personalizar a identidade visual da Central.</li>
          <li>✔ Enviar logo, favicon e ícones do aplicativo (PWA).</li>
          <li>✔ Configurar a integração com o gerenciador.</li>
          <li>✔ Publicar a Central do Assinante.</li>
        </ul>
      </div>

      {erro && (
        <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{erro}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-accent text-white text-sm
          hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? "Criando…" : "Criar cadastro e acessar o painel"}
      </button>

      <div className="flex justify-center">
        <button type="button" onClick={onGoLogin} className="text-xs text-accent hover:text-accent-hover transition-colors">
          Já tenho provedor cadastrado
        </button>
      </div>
    </form>
  );
}
