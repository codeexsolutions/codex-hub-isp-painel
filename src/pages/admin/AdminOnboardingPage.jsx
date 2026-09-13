import { useState, useEffect, useCallback } from "react";
import { Rocket, Plus, Trash2 } from "lucide-react";
import { Admin } from "../../services/store";
import { Label, Input, Select, ColorField } from "../../components/Field";
import { useToast } from "../../components/Toast";

const MODULOS = [
  { key: "beneficios", label: "Benefícios" },
  { key: "recompensas", label: "Recompensas" },
  { key: "desbloqueio_confianca", label: "Desbloqueio de confiança" },
  { key: "iptv", label: "IPTV Ao Vivo (app do assinante)" },
  { key: "app_tv", label: "App Synk TV" },
  { key: "planos_moveis", label: "Internet Móvel (planos de dados)" },
  { key: "landpage", label: "Vitrine de Planos (página pública do provedor)" },
  { key: "ia_suporte", label: "Sugestão de IA antes de abrir chamado" },
];

function novoPlano() {
  return { nome: "", velocidade_mega: "", valor: "", beneficios: "", destaque: false };
}

// Onboarding rápido — pra quem fecha a venda já deixar o provedor pronto
// (marca, planos, Vitrine, módulos) num save só, em vez do provedor precisar
// configurar aba por aba sozinho depois. Feedback real de campo: donos de
// provedor pequeno não querem "montar" o app, querem receber pronto.
export default function AdminOnboardingPage() {
  const toast = useToast();

  const [provedores, setProvedores] = useState([]);
  const [loadingProvedores, setLoadingProvedores] = useState(true);
  const [codigoSelecionado, setCodigoSelecionado] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [accent, setAccent] = useState("#2563EB");
  const [accent2, setAccent2] = useState("#7C3AED");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [planos, setPlanos] = useState([novoPlano()]);
  const [modulosSelecionados, setModulosSelecionados] = useState(["beneficios", "landpage"]);

  const load = useCallback(async () => {
    try {
      setProvedores(await Admin.listarProvedores());
    } catch (err) {
      toast(err.message || "Erro ao carregar provedores");
    } finally {
      setLoadingProvedores(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const provedorAtual = provedores.find((p) => String(p.codigo_provedor) === String(codigoSelecionado));

  const toggleModulo = (chave) => {
    setModulosSelecionados((atual) => atual.includes(chave) ? atual.filter((m) => m !== chave) : [...atual, chave]);
  };

  const setPlano = (idx, campo) => (e) => {
    const valor = campo === "destaque" ? e.target.checked : e.target.value;
    setPlanos((atual) => atual.map((p, i) => i === idx ? { ...p, [campo]: valor } : p));
  };

  const adicionarPlano = () => setPlanos((atual) => [...atual, novoPlano()]);
  const removerPlano = (idx) => setPlanos((atual) => atual.filter((_, i) => i !== idx));

  const salvar = async () => {
    if (!codigoSelecionado) { toast("Selecione o provedor"); return; }

    setSalvando(true);
    try {
      // Tema só é enviado se algo foi preenchido — não sobrescreve com vazio
      // um tema que o provedor já tenha configurado sozinho antes.
      if (accent || accent2 || nomeFantasia.trim() || logoFile) {
        await Admin.atualizarTema(codigoSelecionado, { accent, accent2, nomeFantasia: nomeFantasia.trim(), logoFile });
      }

      const planosValidos = planos
        .filter((p) => p.nome.trim() && Number(p.velocidade_mega) > 0 && Number(p.valor) > 0)
        .map((p) => ({
          nome: p.nome.trim(),
          velocidade_mega: Number(p.velocidade_mega),
          valor: Number(p.valor),
          beneficios: p.beneficios.trim() || null,
          destaque: !!p.destaque,
        }));

      await Admin.onboardingRapido(codigoSelecionado, {
        whatsapp: whatsapp.trim() || undefined,
        telefone: telefone.trim() || undefined,
        cidade: cidade.trim() || undefined,
        endereco: endereco.trim() || undefined,
        planosInternet: planosValidos,
        modulos: modulosSelecionados,
      });

      toast("Provedor configurado! Já pode mandar o link pronto pra ele.");
      await load();
    } catch (err) {
      toast(err.message || "Erro ao configurar o provedor");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-sm text-text font-display flex items-center gap-2">
          <Rocket size={16} className="text-accent" /> Onboarding rápido
        </h2>
        <p className="text-xs text-text-dim mt-1">
          Configure marca, planos, contato e módulos de um provedor novo num só save — ele recebe tudo pronto,
          sem precisar montar nada sozinho.
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div>
          <Label>Provedor</Label>
          {loadingProvedores ? (
            <div className="text-xs text-text-dim py-2">Carregando…</div>
          ) : (
            <Select value={codigoSelecionado} onChange={(e) => setCodigoSelecionado(e.target.value)}>
              <option value="">Selecione…</option>
              {provedores.map((p) => (
                <option key={p.codigo_provedor} value={p.codigo_provedor}>
                  {p.codigo_provedor} — {p.nome_fantasia || p.empresa}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {codigoSelecionado && (
        <>
          <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
            <h3 className="text-sm text-text font-display">Marca</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor principal</Label>
                <ColorField value={accent} onChange={setAccent} />
              </div>
              <div>
                <Label>Cor secundária</Label>
                <ColorField value={accent2} onChange={setAccent2} />
              </div>
            </div>
            <div>
              <Label>Nome fantasia (opcional)</Label>
              <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder={provedorAtual?.nome_fantasia || provedorAtual?.empresa || ""} />
            </div>
            <div>
              <Label>Logo (opcional)</Label>
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-xs text-text-sub" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
            <h3 className="text-sm text-text font-display">Contato e Vitrine de Planos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(85) 99999-9999" />
              </div>
              <div>
                <Label>Telefone (opcional)</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(85) 3000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="ex.: Fortaleza - CE" />
              </div>
              <div>
                <Label>Endereço (opcional)</Label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="ex.: Av. Principal, 123" />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-text font-display">Planos de internet</h3>
              <button onClick={adicionarPlano} className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
                <Plus size={13} /> Adicionar plano
              </button>
            </div>
            {planos.map((p, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="col-span-3">
                  <Label>Nome</Label>
                  <Input value={p.nome} onChange={setPlano(idx, "nome")} placeholder="300 MEGA" />
                </div>
                <div className="col-span-2">
                  <Label>Mega</Label>
                  <Input value={p.velocidade_mega} onChange={setPlano(idx, "velocidade_mega")} inputMode="numeric" placeholder="300" />
                </div>
                <div className="col-span-2">
                  <Label>Valor</Label>
                  <Input value={p.valor} onChange={setPlano(idx, "valor")} inputMode="decimal" placeholder="99.90" />
                </div>
                <div className="col-span-3">
                  <Label>Benefícios (opcional)</Label>
                  <Input value={p.beneficios} onChange={setPlano(idx, "beneficios")} placeholder="Wi-Fi grátis" />
                </div>
                <div className="col-span-1 flex items-center gap-1.5 pb-2">
                  <input type="checkbox" checked={p.destaque} onChange={setPlano(idx, "destaque")} />
                  <span className="text-[11px] text-text-dim">Destaque</span>
                </div>
                <div className="col-span-1 flex justify-end pb-2">
                  {planos.length > 1 && (
                    <button onClick={() => removerPlano(idx)} className="text-text-dim hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
            <h3 className="text-sm text-text font-display">Módulos a ativar</h3>
            <div className="grid grid-cols-2 gap-2">
              {MODULOS.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-xs text-text-sub cursor-pointer">
                  <input type="checkbox" checked={modulosSelecionados.includes(m.key)} onChange={() => toggleModulo(m.key)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={salvar}
              disabled={salvando}
              className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {salvando ? "Configurando…" : "Salvar e ativar tudo"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
