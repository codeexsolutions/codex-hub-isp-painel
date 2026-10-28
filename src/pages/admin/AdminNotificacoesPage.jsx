import { useState, useEffect, useMemo } from "react";
import { Bell, Send, Users, AlertCircle, CheckCircle2, Search, X, Megaphone } from "lucide-react";
import { Label, Input, Textarea, Select } from "../../components/Field";
import { Admin, AdminNotificacoes } from "../../services/store";
import { useToast } from "../../components/Toast";

// Mesmo canal de push dos assinantes (ver NotificacoesTab.jsx, usado pelo
// provedor) — aqui é o admin Synk quem dispara, escolhendo pra qual provedor
// (ou todos) a notificação vai. Caso de uso principal: avisar manutenção da
// lista de IPTV ou qualquer aviso geral pros clientes finais.
export default function AdminNotificacoesPage() {
  const toast = useToast();
  const [provedores, setProvedores] = useState([]);
  const [loadingProvedores, setLoadingProvedores] = useState(true);

  useEffect(() => {
    Admin.listarProvedores()
      .then((lista) => setProvedores(lista.filter((p) => p.status === "ATIVO")))
      .catch((err) => toast(err.message || "Erro ao carregar provedores"))
      .finally(() => setLoadingProvedores(false));
  }, []);

  if (loadingProvedores) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <p className="text-xs text-text-dim max-w-lg">
        Envie um aviso push para os clientes finais de um provedor (ou de todos) — ex.: lista de
        IPTV em manutenção, instabilidade, ou qualquer comunicado geral.
      </p>
      <EnviarNotificacaoAdmin provedores={provedores} toast={toast} />
    </div>
  );
}

function EnviarNotificacaoAdmin({ provedores, toast }) {
  const [codigoProvedor, setCodigoProvedor] = useState("");
  const [form, setForm] = useState({ titulo: "", mensagem: "", destino: "todos", link: "" });
  const [selecionados, setSelecionados] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const ehTodosProvedores = codigoProvedor === "todos";

  useEffect(() => {
    setSelecionados([]);
    setForm((f) => ({ ...f, destino: "todos" }));
  }, [codigoProvedor]);

  const enviar = async () => {
    if (!codigoProvedor) { toast("Escolha o provedor (ou \"Todos os provedores\")"); return; }
    if (!form.titulo.trim()) { toast("Informe o título da notificação"); return; }
    if (!form.mensagem.trim()) { toast("Informe a mensagem da notificação"); return; }
    if (form.titulo.length > 65) { toast("O título deve ter no máximo 65 caracteres"); return; }
    if (form.mensagem.length > 240) { toast("A mensagem deve ter no máximo 240 caracteres"); return; }
    if (form.destino === "selecionados" && selecionados.length === 0) { toast("Selecione ao menos um cliente"); return; }

    const payload = {
      title: form.titulo.trim(),
      body: form.mensagem.trim(),
      data: form.link.trim() || null,
      ...(form.destino === "selecionados" ? { cpfs: selecionados } : {}),
    };

    setSending(true);
    try {
      if (ehTodosProvedores) {
        for (const p of provedores) {
          await AdminNotificacoes.enviar({ codigoProvedor: p.codigo_provedor, ...payload });
        }
        toast(`Notificação enviada para os clientes de ${provedores.length} provedor${provedores.length !== 1 ? "es" : ""}`);
      } else {
        await AdminNotificacoes.enviar({ codigoProvedor, ...payload });
        toast(
          form.destino === "selecionados"
            ? `Notificação enviada para ${selecionados.length} cliente${selecionados.length > 1 ? "s" : ""}`
            : "Notificação enviada"
        );
      }
      setSent(true);
      setForm({ titulo: "", mensagem: "", destino: "todos", link: "" });
      setSelecionados([]);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      toast(err.message || "Erro ao enviar notificação");
    } finally {
      setSending(false);
    }
  };

  const nomeProvedorSelecionado = provedores.find((p) => p.codigo_provedor === codigoProvedor);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h3 className="text-sm text-text font-display">Nova notificação push</h3>

        <div>
          <Label>Provedor</Label>
          <Select value={codigoProvedor} onChange={(e) => setCodigoProvedor(e.target.value)}>
            <option value="">Selecione…</option>
            <option value="todos">Todos os provedores ({provedores.length})</option>
            {provedores.map((p) => (
              <option key={p.codigo_provedor} value={p.codigo_provedor}>
                {p.nome_fantasia || p.empresa}
              </option>
            ))}
          </Select>
          {ehTodosProvedores && (
            <p className="text-[11px] text-warning mt-1.5 flex items-center gap-1.5">
              <AlertCircle size={12} /> Envia pra todos os clientes de todos os provedores ativos — use com cuidado.
            </p>
          )}
        </div>

        {codigoProvedor && !ehTodosProvedores && (
          <div>
            <Label>Destinatários</Label>
            <Select value={form.destino} onChange={(e) => { set("destino")(e); if (e.target.value !== "selecionados") setSelecionados([]); }}>
              <option value="todos">Todos os assinantes do provedor</option>
              <option value="selecionados">Clientes selecionados</option>
            </Select>
          </div>
        )}

        {codigoProvedor && !ehTodosProvedores && form.destino === "selecionados" && (
          <SeletorClientesAdmin codigoProvedor={codigoProvedor} selecionados={selecionados} onChange={setSelecionados} toast={toast} />
        )}

        <div>
          <Label>Título</Label>
          <Input
            value={form.titulo}
            onChange={set("titulo")}
            placeholder="ex.: Manutenção na lista de IPTV"
            maxLength={65}
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[11px] ${form.titulo.length > 55 ? "text-warning" : "text-text-dim"}`}>
              {form.titulo.length}/65
            </span>
          </div>
        </div>

        <div>
          <Label>Mensagem</Label>
          <Textarea
            value={form.mensagem}
            onChange={set("mensagem")}
            rows={4}
            placeholder="ex.: Estamos em manutenção na lista de IPTV. O serviço deve normalizar em até 2 horas."
            maxLength={240}
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[11px] ${form.mensagem.length > 200 ? "text-warning" : "text-text-dim"}`}>
              {form.mensagem.length}/240
            </span>
          </div>
        </div>

        <div>
          <Label>Link de destino (opcional)</Label>
          <Input value={form.link} onChange={set("link")} placeholder="https://… ou /app/avisos" />
        </div>

        <div className="pt-2">
          {sent ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 size={16} /> Notificação enviada
            </div>
          ) : (
            <button
              onClick={enviar}
              disabled={sending}
              className="w-full py-2.5 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={15} />
              {sending ? "Enviando…" : "Enviar notificação"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h3 className="text-sm text-text font-display">Pré-visualização</h3>
        <div className="bg-canvas rounded-2xl border border-border p-4 max-w-sm mx-auto">
          <div className="bg-surface-2 rounded-xl p-3 space-y-2 border border-border">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-accent/20 flex items-center justify-center">
                {ehTodosProvedores ? <Megaphone size={11} className="text-accent" /> : <Bell size={11} className="text-accent" />}
              </div>
              <span className="text-[10px] text-text-dim">
                {ehTodosProvedores ? "Todos os provedores" : (nomeProvedorSelecionado?.nome_fantasia || nomeProvedorSelecionado?.empresa || "Selecione um provedor")} · agora
              </span>
            </div>
            <div>
              <p className="text-xs text-text">{form.titulo || "Título da notificação"}</p>
              <p className="text-[11px] text-text-sub mt-0.5 leading-relaxed">
                {form.mensagem || "Mensagem da notificação aparecerá aqui…"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-warning/5 border border-warning/15 rounded-xl p-3 flex gap-2.5">
          <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-sub leading-relaxed">
            Só chega pra quem tem o app instalado e notificações ativadas. Limite recomendado: no
            máximo 3 notificações por dia pra não gerar fadiga.
          </p>
        </div>
      </div>
    </div>
  );
}

function SeletorClientesAdmin({ codigoProvedor, selecionados, onChange, toast }) {
  const [assinantes, setAssinantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    setLoading(true);
    AdminNotificacoes.buscarTodosAssinantes(codigoProvedor)
      .then((lista) => {
        const cpfsUnicos = [...new Map(lista.map((a) => [a.cpf, a])).values()];
        setAssinantes(cpfsUnicos);
      })
      .catch((err) => toast(err.message || "Erro ao carregar clientes"))
      .finally(() => setLoading(false));
  }, [codigoProvedor]);

  const filtrados = useMemo(() => {
    if (!busca) return assinantes;
    const termo = busca.replace(/\D/g, "") || busca.toLowerCase();
    return assinantes.filter((a) => (a.cpf || "").replace(/\D/g, "").includes(termo) || (a.cpf || "").toLowerCase().includes(busca.toLowerCase()));
  }, [assinantes, busca]);

  const alternar = (cpf) => {
    onChange(selecionados.includes(cpf) ? selecionados.filter((c) => c !== cpf) : [...selecionados, cpf]);
  };

  return (
    <div>
      <Label>Clientes ({selecionados.length} selecionado{selecionados.length !== 1 ? "s" : ""})</Label>
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-2 border-b border-border bg-surface-2">
          <Search size={13} className="text-text-dim shrink-0" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por CPF/CNPJ…"
            className="flex-1 bg-transparent text-xs text-text placeholder:text-text-dim outline-none"
          />
          {selecionados.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-[10px] text-text-dim shrink-0 hover:underline">
              Limpar
            </button>
          )}
        </div>
        <div className="max-h-56 overflow-y-auto">
          {loading ? (
            <div className="text-xs text-text-dim text-center py-6">Carregando…</div>
          ) : !filtrados.length ? (
            <div className="text-xs text-text-dim text-center py-6">Nenhum cliente com notificação ativa.</div>
          ) : (
            filtrados.map((a) => {
              const marcado = selecionados.includes(a.cpf);
              return (
                <label
                  key={a.cpf}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer border-b border-border/50 last:border-0 ${marcado ? "bg-accent/5" : "hover:bg-surface-2/50"}`}
                >
                  <input type="checkbox" checked={marcado} onChange={() => alternar(a.cpf)} className="accent-[var(--accent)]" />
                  <span className="text-text-sub">{a.nome ? `${a.nome} · ${a.cpf}` : a.cpf}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
