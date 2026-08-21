import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, Send, Clock, Users, AlertCircle, CheckCircle2, Search, UserCheck, BellOff, X } from "lucide-react";
import { Label, Input, Textarea, Select } from "../components/Field";
import { Notificacoes } from "../services/store";
import { formataData, formatarTelefone } from "../services/format";
import { useToast } from "../components/Toast";

export default function NotificacoesTab({ provedor }) {
  const toast = useToast();
  const [view, setView] = useState("enviar");
  const [historico, setHistorico] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const loadHistorico = useCallback(async () => {
    setLoadingHist(true);
    try {
      const data = await Notificacoes.listar();
      setHistorico(data);
    } catch (err) {
      // silently fail
    } finally {
      setLoadingHist(false);
    }
  }, []);

  useEffect(() => {
    if (view === "historico") loadHistorico();
  }, [view, loadHistorico]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface rounded-xl border border-border p-1 w-fit">
        <TabBtn active={view === "enviar"} onClick={() => setView("enviar")} icon={Send} label="Enviar" />
        <TabBtn active={view === "assinantes"} onClick={() => setView("assinantes")} icon={Users} label="Assinantes" />
        {/* <TabBtn active={view === "historico"} onClick={() => setView("historico")} icon={Clock} label="Histórico" /> */}
      </div>

      {view === "enviar" && (
        <EnviarNotificacao provedor={provedor} toast={toast} onSent={loadHistorico} />
      )}
      {view === "assinantes" && (
        <AssinantesNotificacao toast={toast} />
      )}
      {view === "historico" && (
        <HistoricoNotificacoes lista={historico} loading={loadingHist} />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-200
        ${active ? "bg-accent/10 text-accent" : "text-text-sub hover:text-text"}`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

/* ============================================================
 *  ASSINANTES COM NOTIFICAÇÃO ATIVA
 * ============================================================*/
function AssinantesNotificacao({ toast }) {
  const [assinantes, setAssinantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaCpf, setBuscaCpf] = useState("");
  const [resultadoCpf, setResultadoCpf] = useState(null);
  const [buscandoCpf, setBuscandoCpf] = useState(false);

  const loadAssinantes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Notificacoes.buscarTodosAssinantes();
      setAssinantes(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar assinantes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAssinantes(); }, [loadAssinantes]);

  const buscarPorCpf = async () => {
    const cpf = buscaCpf.replace(/\D/g, "");
    if (!cpf) { toast("Informe o CPF para buscar"); return; }
    setBuscandoCpf(true);
    setResultadoCpf(null);
    try {
      const data = await Notificacoes.buscarPorCpf(cpf);
      setResultadoCpf(data);
      if (!data) toast("Nenhum assinante encontrado com esse CPF");
    } catch (err) {
      toast(err.message || "Erro ao buscar");
      setResultadoCpf(null);
    } finally {
      setBuscandoCpf(false);
    }
  };

  const filtrados = busca
    ? assinantes.filter((a) => {
        const termo = busca.toLowerCase();
        return (
          (a.nome || a.Nome || "").toLowerCase().includes(termo) ||
          (a.cpf || a.Cpf || a.CpfCnpj || "").includes(termo) ||
          (a.email || a.Email || "").toLowerCase().includes(termo)
        );
      })
    : assinantes;

  return (
    <div className="space-y-6">
      {/* Busca por CPF */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h3 className="text-sm text-text font-display">Buscar assinante por CPF</h3>
        <div className="flex gap-3">
          <Input
            value={buscaCpf}
            onChange={(e) => setBuscaCpf(e.target.value)}
            placeholder="000.000.000-00"
            className="max-w-xs"
            onKeyDown={(e) => { if (e.key === "Enter") buscarPorCpf(); }}
          />
          <button
            onClick={buscarPorCpf}
            disabled={buscandoCpf}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm
              hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50
              flex items-center gap-2 shrink-0"
          >
            <Search size={15} />
            {buscandoCpf ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {resultadoCpf && (
          <div className="bg-surface-2 rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent text-sm">
              {(resultadoCpf.nome || resultadoCpf.Nome || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text">{resultadoCpf.nome || resultadoCpf.Nome}</p>
              <p className="text-xs text-text-dim">
                {resultadoCpf.cpf || resultadoCpf.Cpf || resultadoCpf.CpfCnpj}
                {(resultadoCpf.email || resultadoCpf.Email) && (
                  <span className="ml-2">{resultadoCpf.email || resultadoCpf.Email}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {resultadoCpf.notificacao_ativa || resultadoCpf.NotificacaoAtiva ? (
                <>
                  <Bell size={14} className="text-success" />
                  <span className="text-[10px] text-success">Ativa</span>
                </>
              ) : (
                <>
                  <BellOff size={14} className="text-text-dim" />
                  <span className="text-[10px] text-text-dim">Inativa</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lista de todos */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <h3 className="text-sm text-text font-display">Assinantes com notificação</h3>
            {!loading && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {assinantes.length} registros
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar por nome, CPF ou email…"
              className="bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-text
                placeholder:text-text-dim outline-none focus:border-accent/50 w-64
                transition-colors duration-200"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
        ) : !filtrados.length ? (
          <div className="text-center py-12">
            <UserCheck size={32} className="mx-auto text-text-dim mb-3 opacity-40" />
            <p className="text-sm text-text-dim">
              {busca ? "Nenhum assinante encontrado para essa busca." : "Nenhum assinante com notificação ativa."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-dim text-xs text-left">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">CPF/CNPJ</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Notificação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a, idx) => {
                  const nome = a.nome || a.Nome || "-";
                  const cpf = a.cpf || a.Cpf || a.CpfCnpj || "-";
                  const email = a.email || a.Email || "-";
                  const contato = a.contato || a.Contato || a.telefone || a.Telefone || "";
                  const ativa = a.notificacao_ativa ?? a.NotificacaoAtiva ?? a.push_ativo ?? true;

                  return (
                    <tr key={a.id || a.Id || idx} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-surface-3 flex items-center justify-center text-xs text-text-sub uppercase">
                            {nome[0]}
                          </div>
                          <span className="text-sm text-text">{nome}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-text-sub">{cpf}</td>
                      <td className="px-5 py-3 text-xs text-text-sub">{email}</td>
                      <td className="px-5 py-3 text-xs text-text-sub">
                        {contato ? formatarTelefone(contato) : "-"}
                      </td>
                      <td className="px-5 py-3">
                        {ativa ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-success">
                            <Bell size={12} /> Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-text-dim">
                            <BellOff size={12} /> Inativa
                          </span>
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

/* ============================================================
 *  ENVIAR NOTIFICAÇÃO
 * ============================================================*/
function EnviarNotificacao({ provedor, toast, onSent }) {
  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    destino: "todos",
    link: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selecionados, setSelecionados] = useState([]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const enviar = async () => {
    if (!form.titulo.trim()) { toast("Informe o título da notificação"); return; }
    if (!form.mensagem.trim()) { toast("Informe a mensagem da notificação"); return; }
    if (form.titulo.length > 65) { toast("O título deve ter no máximo 65 caracteres"); return; }
    if (form.mensagem.length > 240) { toast("A mensagem deve ter no máximo 240 caracteres"); return; }
    if (form.destino === "selecionados" && selecionados.length === 0) { toast("Selecione ao menos um cliente"); return; }

    setSending(true);
    try {
      await Notificacoes.enviar({
        title: form.titulo.trim(),
        body: form.mensagem.trim(),
        destino: form.destino,
        data: form.link.trim() || null,
        ...(form.destino === "selecionados" ? { cpfs: selecionados } : {}),
      });
      toast(
        form.destino === "selecionados"
          ? `Notificação enviada para ${selecionados.length} cliente${selecionados.length > 1 ? "s" : ""}`
          : "Notificação enviada"
      );
      setSent(true);
      setForm({ titulo: "", mensagem: "", destino: "todos", link: "" });
      setSelecionados([]);
      onSent();
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      toast(err.message || "Erro ao enviar notificação");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h3 className="text-sm text-text font-display">Nova notificação push</h3>

        <div>
          <Label>Destinatários</Label>
          <Select value={form.destino} onChange={(e) => { set("destino")(e); if (e.target.value !== "selecionados") setSelecionados([]); }}>
            <option value="todos">Todos os assinantes</option>
            <option value="selecionados">Clientes selecionados</option>
          </Select>
        </div>

        {form.destino === "selecionados" && (
          <SeletorClientes selecionados={selecionados} onChange={setSelecionados} toast={toast} />
        )}

        <div>
          <Label>Título</Label>
          <Input
            value={form.titulo}
            onChange={set("titulo")}
            placeholder="ex.: Nova fatura disponível"
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
            placeholder="ex.: Sua fatura de julho já está disponível no app. Acesse para visualizar."
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
          <Input
            value={form.link}
            onChange={set("link")}
            placeholder="https://… ou /app/faturas"
          />
          <p className="text-[11px] text-text-dim mt-1">
            Ao clicar na notificação, o assinante será redirecionado para este link.
          </p>
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
              className="w-full py-2.5 rounded-xl bg-accent text-white text-sm
                hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50
                flex items-center justify-center gap-2"
            >
              <Send size={15} />
              {sending ? "Enviando…" : "Enviar notificação"}
            </button>
          )}
        </div>

        <div className="bg-warning/5 border border-warning/15 rounded-xl p-3 flex gap-2.5">
          <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-sub leading-relaxed">
            {form.destino === "todos"
              ? "A notificação será enviada para todos os dispositivos com o app instalado e notificações ativadas."
              : "A notificação será enviada apenas para os clientes selecionados abaixo."}
            {" "}Limite recomendado: no máximo 3 notificações por dia.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm text-text font-display">Pré-visualização</h3>

          <div className="bg-canvas rounded-2xl border border-border p-4 max-w-sm mx-auto">
            <div className="bg-surface-2 rounded-xl p-3 space-y-2 border border-border">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-accent/20 flex items-center justify-center">
                  <Bell size={11} className="text-accent" />
                </div>
                <span className="text-[10px] text-text-dim">
                  {provedor?.nome_fantasia || provedor?.empresa || "Seu Provedor"} · agora
                </span>
              </div>
              <div>
                <p className="text-xs text-text">
                  {form.titulo || "Título da notificação"}
                </p>
                <p className="text-[11px] text-text-sub mt-0.5 leading-relaxed">
                  {form.mensagem || "Mensagem da notificação aparecerá aqui…"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-accent" />
              <span className="text-[11px] text-text-dim">Destinatários</span>
            </div>
            <p className="text-lg text-text font-display">
              {form.destino === "todos" ? "Todos" : `${selecionados.length} selecionado${selecionados.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={15} className="text-accent" />
              <span className="text-[11px] text-text-dim">Caracteres</span>
            </div>
            <p className="text-lg text-text font-display">
              {form.titulo.length + form.mensagem.length}
              <span className="text-xs text-text-dim"> / 305</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  SELETOR DE CLIENTES (envio para selecionados)
 * ============================================================*/
function SeletorClientes({ selecionados, onChange, toast }) {
  const [assinantes, setAssinantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    Notificacoes.buscarTodosAssinantes()
      .then((lista) => {
        const cpfsUnicos = [...new Map(lista.map((a) => [a.cpf, a])).values()];
        setAssinantes(cpfsUnicos);
      })
      .catch((err) => toast(err.message || "Erro ao carregar clientes"))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    if (!busca) return assinantes;
    const termo = busca.replace(/\D/g, "") || busca.toLowerCase();
    return assinantes.filter((a) => (a.cpf || "").replace(/\D/g, "").includes(termo) || (a.cpf || "").toLowerCase().includes(busca.toLowerCase()));
  }, [assinantes, busca]);

  const alternar = (cpf) => {
    onChange(selecionados.includes(cpf) ? selecionados.filter((c) => c !== cpf) : [...selecionados, cpf]);
  };

  const selecionarTodosFiltrados = () => {
    const cpfsFiltrados = filtrados.map((a) => a.cpf);
    onChange([...new Set([...selecionados, ...cpfsFiltrados])]);
  };

  const limpar = () => onChange([]);

  return (
    <div>
      <Label>Clientes ({selecionados.length} selecionado{selecionados.length !== 1 ? "s" : ""})</Label>

      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selecionados.slice(0, 8).map((cpf) => (
            <span key={cpf} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent">
              {cpf}
              <button type="button" onClick={() => alternar(cpf)} className="hover:text-danger">
                <X size={11} />
              </button>
            </span>
          ))}
          {selecionados.length > 8 && (
            <span className="text-[10px] px-2 py-1 text-text-dim">+{selecionados.length - 8}</span>
          )}
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-2 border-b border-border bg-surface-2">
          <Search size={13} className="text-text-dim shrink-0" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por CPF/CNPJ…"
            className="flex-1 bg-transparent text-xs text-text placeholder:text-text-dim outline-none"
          />
          {filtrados.length > 0 && (
            <button type="button" onClick={selecionarTodosFiltrados} className="text-[10px] text-accent shrink-0 hover:underline">
              Selecionar todos
            </button>
          )}
          {selecionados.length > 0 && (
            <button type="button" onClick={limpar} className="text-[10px] text-text-dim shrink-0 hover:underline">
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
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer border-b border-border/50 last:border-0
                    ${marcado ? "bg-accent/5" : "hover:bg-surface-2/50"}`}
                >
                  <input type="checkbox" checked={marcado} onChange={() => alternar(a.cpf)} className="accent-[var(--accent)]" />
                  <span className="text-text-sub">{a.cpf}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  HISTÓRICO
 * ============================================================*/
/* function HistoricoNotificacoes({ lista, loading }) {
  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  if (!lista.length) {
    return (
      <div className="text-center py-16">
        <Clock size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
        <p className="text-sm text-text-dim">Nenhuma notificação enviada ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-dim text-xs text-left">
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Mensagem</th>
              <th className="px-5 py-3">Destino</th>
              <th className="px-5 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((n, idx) => (
              <tr key={n.id || idx} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50 transition-colors">
                <td className="px-5 py-3 text-sm text-text">{n.titulo}</td>
                <td className="px-5 py-3">
                  <div className="text-xs text-text-sub max-w-xs truncate">{n.mensagem}</div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-dim">
                    {n.destino || "todos"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-text-dim whitespace-nowrap">
                  {formataData(n.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} */
