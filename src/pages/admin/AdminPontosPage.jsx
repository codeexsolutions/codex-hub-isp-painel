import { useState, useEffect, useCallback } from "react";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";

export default function AdminPontosPage() {
  const toast = useToast();
  const [pontosPorReal, setPontosPorReal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const config = await Admin.obterConfigPontos();
      setPontosPorReal(String(config.pontos_por_real));
    } catch (err) {
      toast(err.message || "Erro ao carregar configuração de pontos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const valido = Number(pontosPorReal) > 0;

  const salvar = async () => {
    if (!valido) { toast("A taxa precisa ser maior que zero"); return; }
    setSaving(true);
    try {
      await Admin.definirConfigPontos({ pontos_por_real: Number(pontosPorReal) });
      toast("Configuração de pontos salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-text-dim text-center py-12">Carregando…</div>;
  }

  return (
    <div className="max-w-lg space-y-6">
      <p className="text-xs text-text-dim">
        Quantos pontos o cliente ganha por real gasto em compras de benefícios. Recompensas são
        cadastradas pelo próprio provedor (aba "Recompensas" do painel dele).
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div>
          <Label>Pontos por R$1 gasto</Label>
          <Input value={pontosPorReal} onChange={(e) => setPontosPorReal(e.target.value)} inputMode="decimal" placeholder="ex.: 1" />
        </div>

        <button
          onClick={salvar}
          disabled={saving || !valido}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}
