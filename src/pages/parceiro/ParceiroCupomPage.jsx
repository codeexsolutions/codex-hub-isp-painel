import { useState } from "react";
import { Search, CheckCircle2, XCircle, Ticket } from "lucide-react";
import { Parceiro } from "../../services/store";
import { formataData } from "../../services/format";
import { useToast } from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ParceiroCupomPage() {
  const toast = useToast();
  const [codigo, setCodigo] = useState("");
  const [compra, setCompra] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [processando, setProcessando] = useState(false);

  const buscar = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setBuscando(true);
    setCompra(null);
    try {
      const resultado = await Parceiro.buscarCupom(codigo.trim().toUpperCase());
      setCompra(resultado);
    } catch (err) {
      toast(err.message || "Cupom não encontrado");
    } finally {
      setBuscando(false);
    }
  };

  const validar = async () => {
    setProcessando(true);
    try {
      const atualizado = await Parceiro.validarCupom(compra.cupom_codigo);
      setCompra(atualizado);
      toast("Uso confirmado — cliente já recebeu os pontos");
    } catch (err) {
      toast(err.message || "Erro ao validar cupom");
    } finally {
      setProcessando(false);
    }
  };

  const cancelar = async () => {
    if (!confirm("Cancelar este cupom? O cliente não será cobrado.")) return;
    setProcessando(true);
    try {
      const atualizado = await Parceiro.cancelarCupom(compra.cupom_codigo);
      setCompra(atualizado);
      toast("Cupom cancelado");
    } catch (err) {
      toast(err.message || "Erro ao cancelar cupom");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <p className="text-xs text-text-dim">
        Digite o código que o cliente apresentar pra confirmar (ou cancelar) o uso do benefício.
      </p>

      <form onSubmit={buscar} className="flex gap-3">
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Código do cupom"
          className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text
            font-mono tracking-widest placeholder:text-text-dim placeholder:tracking-normal placeholder:font-sans outline-none
            focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
        />
        <button
          type="submit"
          disabled={buscando}
          className="px-5 rounded-xl bg-accent-gradient text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 shadow-glow flex items-center gap-2"
        >
          <Search size={16} /> {buscando ? "…" : "Buscar"}
        </button>
      </form>

      {compra && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-dim">
              <Ticket size={16} />
              <span className="text-sm font-mono tracking-widest text-text">{compra.cupom_codigo}</span>
            </div>
            <StatusBadge status={compra.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Cliente" value={compra.cliente_nome} />
            <Info label="Valor" value={brl(compra.valor)} />
            <Info label="Data da compra" value={formataData(compra.criado_em)} />
            {compra.validado_em && <Info label="Validado em" value={formataData(compra.validado_em)} />}
          </div>

          {compra.status === "pendente" && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={cancelar}
                disabled={processando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-danger/30 text-danger text-sm hover:bg-danger/10 transition-colors disabled:opacity-50"
              >
                <XCircle size={16} /> Cancelar
              </button>
              <button
                onClick={validar}
                disabled={processando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-gradient text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 shadow-glow"
              >
                <CheckCircle2 size={16} /> {processando ? "…" : "Confirmar uso"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-text-dim">{label}</p>
      <p className="text-text mt-0.5">{value}</p>
    </div>
  );
}
