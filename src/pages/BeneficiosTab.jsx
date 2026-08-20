import { useState, useEffect, useCallback } from "react";
import { Tag, MapPin } from "lucide-react";
import { Beneficios } from "../services/store";
import { resolveImageUrl } from "../services/format";
import { useToast } from "../components/Toast";

const CATEGORIAS = [
  { value: "entretenimento", label: "Entretenimento" },
  { value: "consumo_local", label: "Consumo local" },
  { value: "digital", label: "Digital" },
];

const labelCategoria = (v) => CATEGORIAS.find((c) => c.value === v)?.label || v;

// Ofertas são criadas pelos parceiros (portal deles) — aqui o provedor só navega o
// catálogo de todas as ofertas disponíveis e escolhe quais ativar pra própria base.
export default function BeneficiosTab({ provedor }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await Beneficios.catalogo();
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar catálogo de ofertas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const toggle = async (oferta) => {
    const novoValor = !ativoParaMim(oferta);
    setSalvandoId(oferta.id);
    try {
      await Beneficios.ativar(oferta.id, novoValor);
      setLista((atual) => atual.map((o) => (o.id === oferta.id ? { ...o, ativo_para_mim: novoValor } : o)));
      toast(novoValor ? "Oferta ativada pro seu provedor" : "Oferta desativada");
    } catch (err) {
      toast(err.message || "Erro ao atualizar oferta");
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <p className="text-xs text-text-dim max-w-md">
        Catálogo de ofertas cadastradas pelos parceiros. Ative as que fizerem sentido pra sua
        base — elas passam a aparecer na Central de Benefícios do aplicativo.
      </p>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((o) => (
            <OfertaCard
              key={o.id}
              oferta={o}
              ativo={ativoParaMim(o)}
              salvando={salvandoId === o.id}
              onToggle={() => toggle(o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ativoParaMim(o) {
  return o.ativo_para_mim === true || o.ativo_para_mim === "true";
}

function OfertaCard({ oferta: b, ativo, salvando, onToggle }) {
  const imgSrc = resolveImageUrl(b.link_imagem);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt=""
          className="w-full h-32 object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <div className="h-20 flex items-center justify-center text-2xl bg-surface-2">🎁</div>
      )}
      <div className="p-4 space-y-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
          {labelCategoria(b.categoria)}
        </span>
        <p className="text-xs text-text-sub">{b.parceiro || "Sem parceiro"}</p>
        <p className="text-sm text-text">{b.titulo || "Sem título"}</p>
        {b.parceiro_cidade || b.parceiro_uf ? (
          <p className="flex items-center gap-1 text-[11px] text-text-dim">
            <MapPin size={11} />
            {[b.parceiro_cidade, b.parceiro_uf].filter(Boolean).join(" · ")}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-[11px] text-warning">
            <MapPin size={11} />
            Localização não informada
          </p>
        )}
        {b.valor != null && (
          <div className="flex items-center gap-2">
            {b.valor_original != null && Number(b.valor_original) > Number(b.valor) && (
              <span className="text-[11px] text-text-dim line-through">
                R$ {Number(b.valor_original).toFixed(2)}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full border text-accent border-accent/30 bg-accent/8">
              R$ {Number(b.valor).toFixed(2)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-text-sub">{ativo ? "Ativa pra você" : "Desativada"}</span>
        <button
          onClick={onToggle}
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
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-center py-16">
      <Tag size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhuma oferta disponível ainda.</p>
      <p className="text-xs text-text-dim mt-1">Assim que um parceiro cadastrar uma oferta, ela aparece aqui.</p>
    </div>
  );
}
