import { useState, useEffect, useRef } from "react";
import { Label, Input, Help, ColorField, FieldRow } from "../components/Field";
import { Temas, HomeConfig, Atendimento } from "../services/store";
import { resolveImageUrl, normalizarHex } from "../services/format";
import { useToast } from "../components/Toast";

const BLOCOS_HOME = [
  { key: "banner", label: "Banners", descricao: "Carrossel de banners/campanhas no topo da Home" },
  { key: "fatura", label: "Fatura em aberto", descricao: "Card com a fatura pendente e botão de pagar" },
  { key: "consumo", label: "Consumo mensal", descricao: "Gráfico de download/upload do mês" },
  { key: "atalhos", label: "Atalhos", descricao: "Grade de atalhos (2ª via, suporte, contrato, indicação…)" },
];

export default function TemaTab({ provedor }) {
  const toast = useToast();
  const [form, setForm] = useState({
    tag: "", accent: "#2563EB", accent2: "#7C3AED", glyph: "",
  });
  const [saving, setSaving] = useState(false);
  const [logoPrev, setLogoPrev] = useState('')

  const [homeConfig, setHomeConfig] = useState(null);
  const [salvandoBloco, setSalvandoBloco] = useState(null);

  useEffect(() => {
    HomeConfig.obter().then(setHomeConfig).catch(() => setHomeConfig({ banner: true, fatura: true, consumo: true, atalhos: true }));
  }, []);

  const alternarBloco = async (chave) => {
    const novoConfig = { ...homeConfig, [chave]: !homeConfig[chave] };
    setSalvandoBloco(chave);
    try {
      const salvo = await HomeConfig.salvar(novoConfig);
      setHomeConfig(salvo);
    } catch (err) {
      toast(err.message || "Erro ao salvar configuração da Home");
    } finally {
      setSalvandoBloco(null);
    }
  };

  const [atendimento, setAtendimento] = useState({ whatsapp: "", telefone: "", email: "", site: "", instagram: "" });
  const [savingAtendimento, setSavingAtendimento] = useState(false);

  useEffect(() => {
    Atendimento.obter()
      .then((a) => setAtendimento({
        whatsapp: a?.whatsapp || "", telefone: a?.telefone || "", email: a?.email || "",
        site: a?.site || "", instagram: a?.instagram || "",
      }))
      .catch(() => {});
  }, []);

  const setAtend = (k) => (e) => setAtendimento((f) => ({ ...f, [k]: e.target.value }));

  const salvarAtendimento = async () => {
    setSavingAtendimento(true);
    try {
      await Atendimento.salvar(atendimento);
      toast("Canais de atendimento salvos");
    } catch (err) {
      toast(err.message || "Erro ao salvar canais de atendimento");
    } finally {
      setSavingAtendimento(false);
    }
  };

  const logoRef = useRef(null);
  const faviconRef = useRef(null);
  const icon192Ref = useRef(null);
  const icon512Ref = useRef(null);
  const maskableRef = useRef(null);

  useEffect(() => {
    if (!provedor) return;
    (async () => {
      try {
        const tema = await Temas.buscarPorProvedor(provedor.codigo_provedor);
        if (tema) {
          setForm({
            tag: tema.tag || "",
            accent: tema.accent || "#2563EB",
            accent2: tema.accent2 || "#7C3AED",
            glyph: tema.glyph || "",
          });
        }
      } catch (err) {
        toast(err.message || "Erro ao carregar tema");
      }
    })();
  }, [provedor]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === "string" ? v : v.target.value }));

  const accent = form.accent || "#2563EB";
  const accent2 = form.accent2 || "#7C3AED";
  const glyph = form.glyph || "◈";

  const salvar = async () => {
    setSaving(true);
    try {
      await Temas.salvar(provedor.codigo_provedor, {
        ...form,
        nome_fantasia: provedor.nome_fantasia || provedor.empresa,
        logo: logoRef.current?.files[0] || null,
        favicon: faviconRef.current?.files[0] || null,
        icon192: icon192Ref.current?.files[0] || null,
        icon512: icon512Ref.current?.files[0] || null,
        maskable: maskableRef.current?.files[0] || null,
      });
      toast("Tema salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar tema");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
     setLogoPrev(logoRef.current?.files[0]);
  }, [])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identidade visual */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm text-text font-display">Identidade visual</h3>

          <div>
            <Label>Tag (frase da marca)</Label>
            <Input value={form.tag} onChange={(e) => set("tag")(e.target.value)} placeholder="ex.: Internet Fibra" />
          </div>

          <FieldRow>
            <div>
              <Label>Cor principal (accent)</Label>
              <ColorField value={form.accent} onChange={set("accent")} />
            </div>
            <div>
              <Label>Cor secundária (accent2)</Label>
              <ColorField value={form.accent2} onChange={set("accent2")} />
            </div>
          </FieldRow>

          <div className="border-t border-border pt-4">
            <div className="text-xs text-text-sub mb-3">Arquivos da identidade visual</div>
          </div>

          <div>
            <Label>Logomarca (600x600, quadrada)</Label>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="w-full text-xs text-text-sub file:mr-3 file:py-2 file:px-4 file:rounded-lg
                file:border file:border-border file:bg-surface-2 file:text-text-sub file:text-xs
                file:cursor-pointer hover:file:bg-surface-3 transition-colors" />
          </div>

          <div>
            <Label>Favicon (32x32 ou 48x48)</Label>
            <input ref={faviconRef} type="file" accept="image/png,image/x-icon,image/svg+xml"
              className="w-full text-xs text-text-sub file:mr-3 file:py-2 file:px-4 file:rounded-lg
                file:border file:border-border file:bg-surface-2 file:text-text-sub file:text-xs
                file:cursor-pointer hover:file:bg-surface-3 transition-colors" />
          </div>

          <div>
            <Label>Ícone PWA 192x192</Label>
            <input ref={icon192Ref} type="file" accept="image/png"
              className="w-full text-xs text-text-sub file:mr-3 file:py-2 file:px-4 file:rounded-lg
                file:border file:border-border file:bg-surface-2 file:text-text-sub file:text-xs
                file:cursor-pointer hover:file:bg-surface-3 transition-colors" />
          </div>

          <div>
            <Label>Ícone PWA 512x512</Label>
            <input ref={icon512Ref} type="file" accept="image/png"
              className="w-full text-xs text-text-sub file:mr-3 file:py-2 file:px-4 file:rounded-lg
                file:border file:border-border file:bg-surface-2 file:text-text-sub file:text-xs
                file:cursor-pointer hover:file:bg-surface-3 transition-colors" />
          </div>

          <div>
            <Label>Ícone Maskable 512x512</Label>
            <input ref={maskableRef} type="file" accept="image/png"
              className="w-full text-xs text-text-sub file:mr-3 file:py-2 file:px-4 file:rounded-lg
                file:border file:border-border file:bg-surface-2 file:text-text-sub file:text-xs
                file:cursor-pointer hover:file:bg-surface-3 transition-colors" />
          </div>

          <div>
            <Label>Glifo (opcional)</Label>
            <Input value={form.glyph} onChange={(e) => set("glyph")(e.target.value)} maxLength={2} placeholder="◈" className="w-20" />
            <Help>Os ícones serão utilizados para o favicon, instalação do PWA e atalhos do aplicativo.</Help>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm text-text font-display">Pré-visualização no app</h3>

          <div className="bg-canvas rounded-2xl border border-border overflow-hidden max-w-xs mx-auto">
            {/* Phone header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
                style={{ background: accent }}
              >
                {glyph}
              
              </div>
              <div>
                <div className="text-sm text-text">{provedor?.nome_fantasia || provedor?.empresa || "Sua Empresa"}</div>
                <div className="text-[11px] text-text-dim">{form.tag || "Internet Fibra"}</div>
              </div>
            </div>

            {/* Plan card */}
            <div className="p-4">
              <div
                className="rounded-xl p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}
              >
                <div className="text-[10px] tracking-widest uppercase opacity-80">SEU PLANO</div>
                <div className="text-base mt-1">200 Mega</div>
                <div className="text-xs opacity-80 mt-0.5">R$ 74,90/mês</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar tema"}
        </button>
      </div>

      {/* Blocos da Home do app */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div>
          <h3 className="text-sm text-text font-display">Blocos da Home do app</h3>
          <p className="text-xs text-text-dim mt-1">Escolha o que aparece na tela inicial do app dos seus clientes.</p>
        </div>

        {!homeConfig ? (
          <div className="text-xs text-text-dim py-4">Carregando…</div>
        ) : (
          <div className="divide-y divide-border">
            {BLOCOS_HOME.map((bloco) => {
              const ativo = homeConfig[bloco.key];
              const salvandoEste = salvandoBloco === bloco.key;
              return (
                <div key={bloco.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm text-text">{bloco.label}</div>
                    <div className="text-[11px] text-text-dim mt-0.5">{bloco.descricao}</div>
                  </div>
                  <button
                    onClick={() => alternarBloco(bloco.key)}
                    disabled={salvandoEste}
                    aria-pressed={ativo}
                    className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 shrink-0 ${
                      ativo ? "bg-accent" : "bg-surface-3"
                    }`}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: ativo ? 22 : 2 }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Canais de atendimento */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div>
          <h3 className="text-sm text-text font-display">Canais de atendimento</h3>
          <p className="text-xs text-text-dim mt-1">Exibidos pro cliente na tela de suporte do app. Deixe em branco pra ocultar um canal.</p>
        </div>

        <FieldRow>
          <div>
            <Label>WhatsApp</Label>
            <Input value={atendimento.whatsapp} onChange={setAtend("whatsapp")} placeholder="(85) 99999-9999" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={atendimento.telefone} onChange={setAtend("telefone")} placeholder="(85) 3333-3333" />
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label>E-mail</Label>
            <Input value={atendimento.email} onChange={setAtend("email")} placeholder="contato@suaempresa.com.br" />
          </div>
          <div>
            <Label>Site</Label>
            <Input value={atendimento.site} onChange={setAtend("site")} placeholder="https://suaempresa.com.br" />
          </div>
        </FieldRow>

        <div>
          <Label>Instagram</Label>
          <Input value={atendimento.instagram} onChange={setAtend("instagram")} placeholder="@suaempresa" className="max-w-xs" />
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={salvarAtendimento}
            disabled={savingAtendimento}
            className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
              hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
          >
            {savingAtendimento ? "Salvando…" : "Salvar canais"}
          </button>
        </div>
      </div>
    </div>
  );
}
