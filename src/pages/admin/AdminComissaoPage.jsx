import { useState, useEffect, useCallback } from "react";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";

export default function AdminComissaoPage() {
  const toast = useToast();
  const [form, setForm] = useState({ percentual_parceiro: "", percentual_synk: "", percentual_provedor: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const config = await Admin.obterConfigComissao();
      setForm({
        percentual_parceiro: String(config.percentual_parceiro),
        percentual_synk: String(config.percentual_synk),
        percentual_provedor: String(config.percentual_provedor),
      });
    } catch (err) {
      toast(err.message || "Erro ao carregar configuração de comissão");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const soma =
    (Number(form.percentual_parceiro) || 0) +
    (Number(form.percentual_synk) || 0) +
    (Number(form.percentual_provedor) || 0);

  const somaValida = Math.round(soma * 100) / 100 === 100;

  const salvar = async () => {
    if (!somaValida) { toast("Os 3 percentuais precisam somar 100%"); return; }
    setSaving(true);
    try {
      await Admin.definirConfigComissao({
        percentual_parceiro: Number(form.percentual_parceiro),
        percentual_synk: Number(form.percentual_synk),
        percentual_provedor: Number(form.percentual_provedor),
      });
      toast("Configuração de comissão salva");
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
        Percentual fixo aplicado a toda nova compra de benefício (o split é gravado na hora da compra —
        alterar aqui não muda compras já feitas). Precisa somar 100%.
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Parceiro (%)</Label>
            <Input value={form.percentual_parceiro} onChange={set("percentual_parceiro")} inputMode="decimal" />
          </div>
          <div>
            <Label>Synk (%)</Label>
            <Input value={form.percentual_synk} onChange={set("percentual_synk")} inputMode="decimal" />
          </div>
          <div>
            <Label>Provedor (%)</Label>
            <Input value={form.percentual_provedor} onChange={set("percentual_provedor")} inputMode="decimal" />
          </div>
        </div>

        <div className={`text-xs ${somaValida ? "text-success" : "text-danger"}`}>
          Soma atual: {soma}% {somaValida ? "✓" : "— precisa ser 100%"}
        </div>

        <button
          onClick={salvar}
          disabled={saving || !somaValida}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}
