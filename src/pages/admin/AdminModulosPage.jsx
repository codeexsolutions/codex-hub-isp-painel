import { useState, useEffect, useCallback } from "react";
import { Tag } from "lucide-react";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";

const MODULOS = [
  { key: "beneficios", label: "Benefícios" },
  { key: "recompensas", label: "Recompensas" },
  { key: "desbloqueio_confianca", label: "Desbloqueio de confiança" },
  { key: "iptv", label: "IPTV Ao Vivo" },
];

export default function AdminModulosPage() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoChave, setSalvandoChave] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await Admin.listarProvedores();
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar provedores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (provedor, modulo) => {
    const chave = `${provedor.codigo_provedor}:${modulo}`;
    const ativoAtual = (provedor.modulos || []).includes(modulo);
    setSalvandoChave(chave);
    try {
      await Admin.definirModulo(provedor.codigo_provedor, modulo, !ativoAtual);
      setLista((atual) =>
        atual.map((p) => {
          if (p.codigo_provedor !== provedor.codigo_provedor) return p;
          const modulos = ativoAtual
            ? (p.modulos || []).filter((m) => m !== modulo)
            : [...(p.modulos || []), modulo];
          return { ...p, modulos };
        })
      );
      toast(`Módulo ${!ativoAtual ? "ativado" : "desativado"} para ${provedor.nome_fantasia || provedor.empresa}`);
    } catch (err) {
      toast(err.message || "Erro ao atualizar módulo");
    } finally {
      setSalvandoChave(null);
    }
  };

  const toggleStatus = async (provedor) => {
    const chave = `status:${provedor.codigo_provedor}`;
    const novoStatus = provedor.status === "ATIVO" ? "INATIVO" : "ATIVO";
    setSalvandoChave(chave);
    try {
      await Admin.definirStatus(provedor.codigo_provedor, novoStatus);
      setLista((atual) =>
        atual.map((p) => (p.codigo_provedor === provedor.codigo_provedor ? { ...p, status: novoStatus } : p))
      );
      toast(`${provedor.nome_fantasia || provedor.empresa} ${novoStatus === "ATIVO" ? "ativado" : "desativado"}`);
    } catch (err) {
      toast(err.message || "Erro ao atualizar status");
    } finally {
      setSalvandoChave(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-dim max-w-md">
        Ative ou desative módulos vendáveis, como Benefícios, e o próprio provedor.
      </p>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <div className="text-center py-16">
          <Tag size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-sm text-text-dim">Nenhum provedor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-dim uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Código</th>
                <th className="px-4 py-3 font-normal">Provedor</th>
                <th className="px-4 py-3 font-normal">Status</th>
                {MODULOS.map((m) => (
                  <th key={m.key} className="px-4 py-3 font-normal">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.codigo_provedor} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-sub">{p.codigo_provedor}</td>
                  <td className="px-4 py-3 text-text">{p.nome_fantasia || p.empresa}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(p)}
                      disabled={salvandoChave === `status:${p.codigo_provedor}`}
                      className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors disabled:opacity-50 ${
                        p.status === "ATIVO"
                          ? "text-success border-success/30 bg-success/8 hover:bg-success/15"
                          : "text-danger border-danger/30 bg-danger/8 hover:bg-danger/15"
                      }`}
                      title={p.status === "ATIVO" ? "Clique para desativar" : "Clique para ativar"}
                    >
                      {p.status}
                    </button>
                  </td>
                  {MODULOS.map((m) => {
                    const ativo = (p.modulos || []).includes(m.key);
                    const salvando = salvandoChave === `${p.codigo_provedor}:${m.key}`;
                    return (
                      <td key={m.key} className="px-4 py-3">
                        <button
                          onClick={() => toggle(p, m.key)}
                          disabled={salvando}
                          aria-pressed={ativo}
                          className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 ${
                            ativo ? "bg-accent" : "bg-surface-3"
                          }`}
                        >
                          <span
                            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                            style={{ left: ativo ? 22 : 2 }}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
