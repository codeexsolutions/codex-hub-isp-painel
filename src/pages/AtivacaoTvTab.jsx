import { useState, useEffect } from "react";
import { Label, Input, Help } from "../components/Field";
import { AtivacaoTv } from "../services/store";
import { useToast } from "../components/Toast";

export default function AtivacaoTvTab() {
  const toast = useToast();
  const [lista, setLista] = useState(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [gerando, setGerando] = useState(false);
  const [revogandoId, setRevogandoId] = useState(null);

  const carregar = () => {
    AtivacaoTv.listar().then(setLista).catch(() => setLista([]));
  };

  useEffect(() => { carregar(); }, []);

  const gerar = async () => {
    setGerando(true);
    try {
      await AtivacaoTv.gerar(nomeCliente.trim() || null);
      setNomeCliente("");
      toast("Código de ativação gerado");
      carregar();
    } catch (err) {
      toast(err.message || "Erro ao gerar código de ativação");
    } finally {
      setGerando(false);
    }
  };

  const revogar = async (id) => {
    setRevogandoId(id);
    try {
      await AtivacaoTv.revogar(id);
      toast("Código revogado");
      carregar();
    } catch (err) {
      toast(err.message || "Erro ao revogar código");
    } finally {
      setRevogandoId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div>
          <h3 className="text-sm text-text font-display">Gerar código de ativação</h3>
          <p className="text-xs text-text-dim mt-1">
            Gere um código pra cada cliente e envie a ele. É esse código — não o código do provedor,
            que é público e usado só pra identificar a marca — que libera o app Synk TV sem cobrar a licença anual.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="w-full sm:max-w-xs">
            <Label>Nome do cliente (opcional)</Label>
            <Input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Ex.: João da Silva" />
            <Help>Ajuda a identificar pra quem foi enviado cada código na lista abaixo.</Help>
          </div>
          <button
            onClick={gerar}
            disabled={gerando}
            className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
              hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50 shrink-0"
          >
            {gerando ? "Gerando…" : "Gerar código"}
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h3 className="text-sm text-text font-display">Códigos gerados</h3>

        {!lista ? (
          <div className="text-xs text-text-dim py-4">Carregando…</div>
        ) : lista.length === 0 ? (
          <div className="text-xs text-text-dim py-4">Nenhum código gerado ainda.</div>
        ) : (
          <div className="divide-y divide-border">
            {lista.map((item) => {
              const revogado = item.status === "revogado";
              return (
                <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-text font-mono tracking-wider">{item.codigo}</div>
                    <div className="text-[11px] text-text-dim mt-0.5 truncate">
                      {item.cliente_nome || "Sem nome"}
                      {item.usado_em && ` · usado em ${new Date(item.usado_em).toLocaleDateString("pt-BR")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      revogado ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
                    }`}>
                      {revogado ? "Revogado" : "Ativo"}
                    </span>
                    {!revogado && (
                      <button
                        onClick={() => revogar(item.id)}
                        disabled={revogandoId === item.id}
                        className="text-xs text-text-dim hover:text-danger transition-colors disabled:opacity-50"
                      >
                        {revogandoId === item.id ? "Revogando…" : "Revogar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
