import { useState, useEffect, useCallback } from "react";
import { Label, Input } from "../../components/Field";
import { Admin } from "../../services/store";
import { useToast } from "../../components/Toast";

export default function AdminIptvPage() {
  const toast = useToast();
  const [urlPadrao, setUrlPadrao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const config = await Admin.obterConfigIptv();
      setUrlPadrao(config?.url_padrao ?? "");
    } catch (err) {
      toast(err.message || "Erro ao carregar configuração de IPTV");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const salvar = async () => {
    setSaving(true);
    try {
      await Admin.definirConfigIptv(urlPadrao.trim());
      toast("Configuração de IPTV salva");
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
        URL do servidor Xtream Codes usada pelo app de TV quando o cliente não informa uma
        própria na tela de login (ele digita só usuário e senha). Deixe em branco se cada
        cliente sempre for informar o próprio servidor.
      </p>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div>
          <Label>URL padrão do servidor Xtream</Label>
          <Input
            value={urlPadrao}
            onChange={(e) => setUrlPadrao(e.target.value)}
            placeholder="ex.: http://meuservidor.com:8080"
          />
        </div>

        <button
          onClick={salvar}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}
