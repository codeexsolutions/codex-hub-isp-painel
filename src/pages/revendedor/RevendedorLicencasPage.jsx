import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Tv } from "lucide-react";
import { Label, Input } from "../../components/Field";
import { Revendedor } from "../../services/store";
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

export default function RevendedorLicencasPage() {
  const toast = useToast();

  const [licencas, setLicencas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  const [linkEditando, setLinkEditando] = useState({});
  const [salvandoLinkId, setSalvandoLinkId] = useState(null);

  const [criarNome, setCriarNome] = useState("");
  const [criarTelefone, setCriarTelefone] = useState("");
  const [criando, setCriando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLicencas(await Revendedor.listarLicencas());
    } catch (err) {
      toast(err.message || "Erro ao carregar licenças");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const criarLicenca = async () => {
    if (!criarNome.trim() || !criarTelefone.trim()) {
      toast("Informe nome e telefone");
      return;
    }
    setCriando(true);
    try {
      const resultado = await Revendedor.criarLicenca(criarNome.trim(), criarTelefone.trim());
      setCriarNome("");
      setCriarTelefone("");
      await carregar();
      toast(`Licença criada: ${resultado.chave} — envie essa chave pro cliente`);
    } catch (err) {
      toast(err.message || "Erro ao criar licença");
    } finally {
      setCriando(false);
    }
  };

  const aprovar = async (item) => {
    setSalvandoId(item.id);
    try {
      await Revendedor.aprovarLicenca(item.id);
      await carregar();
      toast("Licença aprovada — válida por 1 ano");
    } catch (err) {
      toast(err.message || "Erro ao aprovar");
    } finally {
      setSalvandoId(null);
    }
  };

  const cancelar = async (item) => {
    if (!confirm(`Cancelar a licença de ${item.nome}?`)) return;
    setSalvandoId(item.id);
    try {
      await Revendedor.cancelarLicenca(item.id);
      await carregar();
      toast("Licença cancelada");
    } catch (err) {
      toast(err.message || "Erro ao cancelar");
    } finally {
      setSalvandoId(null);
    }
  };

  const salvarLinkLista = async (item) => {
    const link = (linkEditando[item.id] ?? item.link_pagamento_lista ?? "").trim();
    setSalvandoLinkId(item.id);
    try {
      await Revendedor.definirLinkPagamentoLista(item.id, link);
      await carregar();
      toast("Link de renovação da lista salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar link");
    } finally {
      setSalvandoLinkId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <p className="text-xs text-text-dim">
        Cadastre seus clientes aqui pra gerar a chave do Synk TV deles. Depois de criar, envie a chave pro
        cliente digitar no app — ele usa ela pra renovar o aplicativo e, se você preencher o link de
        pagamento, também pra renovar a lista.
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 max-w-sm">
        <div>
          <h3 className="text-sm text-text font-display">Cadastrar cliente</h3>
          <p className="text-xs text-text-dim mt-1">Gera a chave na hora — copie e envie pro cliente.</p>
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

      <div>
        <p className="text-xs text-text-dim mb-2 font-medium">Meus clientes</p>
        {!licencas.length ? (
          <div className="text-center py-12">
            <Tv size={32} className="mx-auto text-text-dim mb-3 opacity-40" />
            <p className="text-sm text-text-dim">Nenhum cliente cadastrado ainda.</p>
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
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${COR_STATUS[item.status]}`}>
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
