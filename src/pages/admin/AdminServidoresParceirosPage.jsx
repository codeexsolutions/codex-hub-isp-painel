import { useState, useEffect, useCallback } from "react";
import { Server, Copy } from "lucide-react";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";

const LABEL_STATUS = {
  ativo: "Ativo",
  inativo: "Inativo",
  pendente: "Pendente",
  cancelado: "Cancelado",
};

const COR_STATUS = {
  ativo: "border-success/30 bg-success/10 text-success",
  inativo: "border-border bg-surface-2 text-text-dim",
  pendente: "border-warning/30 bg-warning/10 text-warning",
  cancelado: "border-danger/30 bg-danger/10 text-danger",
};

const PROXIMO_STATUS = { ativo: "inativo", inativo: "ativo" };

export default function AdminServidoresParceirosPage() {
  const toast = useToast();

  const [servidores, setServidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [edicao, setEdicao] = useState({}); // { [id]: { urlServidor?, valorMensal? } }

  const [criarNome, setCriarNome] = useState("");
  const [criarUrl, setCriarUrl] = useState("");
  const [criarValor, setCriarValor] = useState("");
  const [criando, setCriando] = useState(false);

  const load = useCallback(async () => {
    try {
      setServidores(await Admin.listarServidoresParceiros());
    } catch (err) {
      toast(err.message || "Erro ao carregar servidores parceiros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const criar = async () => {
    if (!criarNome.trim() || !criarUrl.trim() || !criarValor) {
      toast("Informe nome do servidor, URL e valor mensal");
      return;
    }
    setCriando(true);
    try {
      const resultado = await Admin.criarServidorParceiro(criarNome.trim(), criarUrl.trim(), Number(criarValor));
      setCriarNome("");
      setCriarUrl("");
      setCriarValor("");
      await load();
      toast(`Servidor cadastrado — código parceiro: ${resultado.codigo_parceiro}`);
    } catch (err) {
      toast(err.message || "Erro ao cadastrar servidor");
    } finally {
      setCriando(false);
    }
  };

  const alternarStatus = async (item) => {
    const novo = PROXIMO_STATUS[item.status] || "ativo";
    setSalvandoId(item.id);
    try {
      await Admin.atualizarServidorParceiro(item.id, { status: novo });
      await load();
    } catch (err) {
      toast(err.message || "Erro ao atualizar status");
    } finally {
      setSalvandoId(null);
    }
  };

  const cancelar = async (item) => {
    if (!confirm(`Cancelar o servidor parceiro "${item.nome_servidor}"? O código ${item.codigo_parceiro} para de liberar o app.`)) return;
    setSalvandoId(item.id);
    try {
      await Admin.atualizarServidorParceiro(item.id, { status: "cancelado" });
      await load();
      toast("Servidor parceiro cancelado");
    } catch (err) {
      toast(err.message || "Erro ao cancelar");
    } finally {
      setSalvandoId(null);
    }
  };

  const salvarEdicao = async (item) => {
    const campos = edicao[item.id];
    if (!campos) return;
    setSalvandoId(item.id);
    try {
      await Admin.atualizarServidorParceiro(item.id, {
        urlServidor: campos.urlServidor?.trim() || undefined,
        valorMensal: campos.valorMensal ? Number(campos.valorMensal) : undefined,
      });
      setEdicao((m) => { const { [item.id]: _removido, ...resto } = m; return resto; });
      await load();
      toast("Servidor parceiro atualizado");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSalvandoId(null);
    }
  };

  const copiarCodigo = (codigo) => {
    navigator.clipboard?.writeText(codigo);
    toast("Código copiado");
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <p className="text-xs text-text-dim">
        Servidores de IPTV parceiros: o servidor paga uma mensalidade ao Synk e, em troca, os
        clientes dele usam o app sem pagar licença — o app detecta o código parceiro, libera o
        uso e já resolve a URL do servidor (o cliente final só digita usuário e senha do Xtream).
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-sm">
        <div>
          <h3 className="text-sm text-text font-display">Cadastrar servidor parceiro</h3>
          <p className="text-xs text-text-dim mt-1">
            O código parceiro é gerado automaticamente — copie e envie pro servidor depois de criar.
          </p>
        </div>

        <div>
          <Label>Nome do servidor</Label>
          <Input value={criarNome} onChange={(e) => setCriarNome(e.target.value)} placeholder="ex.: IPTV Fulano" />
        </div>

        <div>
          <Label>URL do servidor (Xtream)</Label>
          <Input value={criarUrl} onChange={(e) => setCriarUrl(e.target.value)} placeholder="http://servidor.com:8080" />
        </div>

        <div>
          <Label>Valor mensal (R$)</Label>
          <Input value={criarValor} onChange={(e) => setCriarValor(e.target.value)} inputMode="decimal" placeholder="ex.: 150,00" />
        </div>

        <button
          onClick={criar}
          disabled={criando}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {criando ? "Cadastrando…" : "Cadastrar servidor"}
        </button>
      </div>

      <div>
        <p className="text-xs text-text-dim mb-2 font-medium">Servidores parceiros cadastrados</p>
        {!servidores.length ? (
          <div className="text-center py-12">
            <Server size={32} className="mx-auto text-text-dim mb-3 opacity-40" />
            <p className="text-sm text-text-dim">Nenhum servidor parceiro cadastrado ainda.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                  <th className="px-4 py-3 font-normal">Nome do servidor</th>
                  <th className="px-4 py-3 font-normal">Código parceiro</th>
                  <th className="px-4 py-3 font-normal">URL</th>
                  <th className="px-4 py-3 font-normal">Valor mensal</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {servidores.map((item) => {
                  const salvando = salvandoId === item.id;
                  const campos = edicao[item.id] || {};
                  const urlAtual = campos.urlServidor ?? item.url_servidor;
                  const valorAtual = campos.valorMensal ?? String(item.valor_mensal ?? "");
                  const temEdicao = campos.urlServidor !== undefined || campos.valorMensal !== undefined;
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-text">{item.nome_servidor}</td>
                      <td className="px-4 py-3 text-text-sub font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          {item.codigo_parceiro}
                          <button onClick={() => copiarCodigo(item.codigo_parceiro)} className="text-text-dim hover:text-text transition-colors">
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={urlAtual}
                          onChange={(e) => setEdicao((m) => ({ ...m, [item.id]: { ...m[item.id], urlServidor: e.target.value } }))}
                          className="text-xs min-w-[180px]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={valorAtual}
                          onChange={(e) => setEdicao((m) => ({ ...m, [item.id]: { ...m[item.id], valorMensal: e.target.value } }))}
                          inputMode="decimal"
                          className="text-xs w-24"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => alternarStatus(item)}
                          disabled={salvando || item.status === "cancelado"}
                          className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide transition-colors disabled:opacity-50 ${COR_STATUS[item.status]}`}
                        >
                          {LABEL_STATUS[item.status]}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {temEdicao && (
                            <button
                              onClick={() => salvarEdicao(item)}
                              disabled={salvando}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {salvando ? "..." : "Salvar"}
                            </button>
                          )}
                          {item.status !== "cancelado" && (
                            <button
                              onClick={() => cancelar(item)}
                              disabled={salvando}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
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
