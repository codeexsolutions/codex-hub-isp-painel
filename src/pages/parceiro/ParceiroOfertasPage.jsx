import { useState, useEffect, useCallback, useRef } from "react";
import { Tag, Pencil, Trash2, Upload, X } from "lucide-react";
import Modal from "../../components/Modal";
import { Label, Input, Select, Textarea, Help } from "../../components/Field";
import { Parceiro } from "../../services/store";
import { resolveImageUrl } from "../../services/format";
import { useToast } from "../../components/Toast";

const CATEGORIAS = [
  { value: "entretenimento", label: "Entretenimento" },
  { value: "consumo_local", label: "Consumo local" },
  { value: "digital", label: "Digital" },
];

const labelCategoria = (v) => CATEGORIAS.find((c) => c.value === v)?.label || v;

// O parceiro cria/gerencia as próprias ofertas aqui. O provedor não cadastra mais nada
// — ele só vê essas ofertas no catálogo dele e ativa as que quiser (ver BeneficiosTab).
export default function ParceiroOfertasPage() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm());
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  function initialForm() {
    return {
      categoria: "entretenimento", parceiro: "", titulo: "", subtitulo: "",
      descricao: "", link: "", ativo: "true", valor: "", valor_original: "",
      validade_fim: "", regras: "", imagemFile: null,
    };
  }

  const load = useCallback(async () => {
    try {
      const data = await Parceiro.listarOfertas();
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar ofertas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (id = null) => {
    setEditId(id);
    if (id) {
      const p = lista.find((x) => x.id === id);
      setForm({
        categoria: p?.categoria || "entretenimento", parceiro: p?.parceiro || "",
        titulo: p?.titulo || "", subtitulo: p?.subtitulo || "", descricao: p?.descricao || "",
        link: p?.link_acao || p?.link || "", ativo: p?.ativo !== undefined ? String(p.ativo) : "true",
        valor: p?.valor != null ? String(p.valor) : "",
        valor_original: p?.valor_original != null ? String(p.valor_original) : "",
        validade_fim: p?.validade_fim ? String(p.validade_fim).slice(0, 10) : "",
        regras: p?.regras || "",
        imagemFile: null,
      });
      setPreviewUrl(resolveImageUrl(p?.link_imagem) || null);
    } else {
      setForm(initialForm());
      setPreviewUrl(null);
    }
    if (fileRef.current) fileRef.current.value = "";
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, imagemFile: file }));
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const clearFile = () => {
    setForm((f) => ({ ...f, imagemFile: null }));
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const salvar = async () => {
    if (!form.titulo.trim()) { toast("Informe ao menos o título da oferta"); return; }
    if (!form.parceiro.trim()) { toast("Informe o nome do seu negócio"); return; }
    const dados = {
      categoria: form.categoria, parceiro: form.parceiro.trim(), titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim(), descricao: form.descricao.trim(), imagemFile: form.imagemFile,
      link: form.link.trim() || null, ativo: form.ativo === "true",
      valor: form.valor.trim() || null,
      valor_original: form.valor_original.trim() || null,
      validade_fim: form.validade_fim || null,
      regras: form.regras.trim() || null,
    };
    try {
      if (editId) await Parceiro.atualizarOferta(editId, dados);
      else await Parceiro.criarOferta(dados);
      setModalOpen(false);
      await load();
      toast("Oferta salva");
    } catch (err) {
      toast(err.message || "Erro ao salvar oferta");
    }
  };

  const excluir = async (id) => {
    if (!confirm("Excluir esta oferta?")) return;
    try {
      const resultado = await Parceiro.removerOferta(id);
      await load();
      toast(
        resultado?.removido === false
          ? "Esta oferta já tem cliques/compras registrados, então foi desativada em vez de excluída — isso preserva o histórico."
          : "Oferta excluída"
      );
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim max-w-md">
          Suas ofertas ficam disponíveis pra qualquer provedor ativar. Cadastre uma vez, use em vários.
        </p>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-xl bg-accent-gradient text-white text-sm
            hover:brightness-110 transition-all duration-200 shadow-glow shrink-0"
        >
          + Nova oferta
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((b) => (
            <OfertaCard key={b.id} oferta={b} onEdit={() => openModal(b.id)} onDelete={() => excluir(b.id)} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar oferta" : "Nova oferta"}>
        <div className="space-y-4">
          <div>
            <Label>Categoria</Label>
            <Select value={form.categoria} onChange={set("categoria")}>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Nome do seu negócio</Label>
            <Input value={form.parceiro} onChange={set("parceiro")} placeholder="ex.: Cinema X" />
          </div>
          <div>
            <Label>Selo/subtítulo</Label>
            <Input value={form.subtitulo} onChange={set("subtitulo")} placeholder="ex.: ATÉ 40% OFF" />
          </div>
          <div>
            <Label>Título</Label>
            <Input value={form.titulo} onChange={set("titulo")} placeholder="ex.: Ingresso por R$ 18" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={set("descricao")} rows={3} placeholder="Detalhes da oferta" />
          </div>

          <div>
            <Label>Imagem da oferta</Label>
            <div className="space-y-2">
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border w-40 mx-auto">
                  <img src={previewUrl} alt="preview" className="w-full aspect-square object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-canvas/80 backdrop-blur-sm border border-border
                      flex items-center justify-center text-text-sub hover:text-danger transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl py-8
                    flex flex-col items-center gap-2 text-text-dim
                    hover:border-accent/40 hover:text-text-sub transition-colors cursor-pointer"
                >
                  <Upload size={24} className="opacity-50" />
                  <span className="text-xs">Clique para enviar uma imagem</span>
                  <span className="text-[10px] opacity-60">PNG, JPG ou WebP · opcional</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Help>
                Tamanho recomendado: <strong>1080 × 1080px (quadrada)</strong>. O sistema recorta
                automaticamente pra esse formato — prefira já enviar uma foto quadrada.
              </Help>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço cheio (R$)</Label>
              <Input value={form.valor_original} onChange={set("valor_original")} placeholder="ex.: 30.00" inputMode="decimal" />
            </div>
            <div>
              <Label>Preço com desconto (R$)</Label>
              <Input value={form.valor} onChange={set("valor")} placeholder="ex.: 18.00" inputMode="decimal" />
            </div>
          </div>
          <Help>Preenchendo o preço com desconto, a oferta vira comprável no app (o cliente compra e recebe um cupom). Em branco, continua só informativa.</Help>

          <div>
            <Label>Válida até</Label>
            <Input type="date" value={form.validade_fim} onChange={set("validade_fim")} />
          </div>
          <div>
            <Label>Regras de uso</Label>
            <Textarea value={form.regras} onChange={set("regras")} rows={2} placeholder="ex.: válido de segunda a quinta, não cumulativo com outras promoções" />
          </div>
          <div>
            <Label>Link de destino</Label>
            <Input value={form.link} onChange={set("link")} placeholder="https://…" />
          </div>
          <div>
            <Label>Ativa</Label>
            <Select value={form.ativo} onChange={set("ativo")}>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
            <Help>Desativar aqui tira a oferta de todos os provedores que a ativaram.</Help>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button onClick={salvar} className="px-5 py-2 rounded-xl bg-accent-gradient text-white text-sm hover:brightness-110 transition-all shadow-glow">
              Salvar oferta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function OfertaCard({ oferta: b, onEdit, onDelete }) {
  const isAtivo = b.ativo === true || b.ativo === "true";
  const imgSrc = resolveImageUrl(b.link_imagem);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-soft">
      {imgSrc ? (
        <img src={imgSrc} alt="" className="w-full h-32 object-cover" onError={(e) => { e.target.style.display = "none"; }} />
      ) : (
        <div className="h-20 flex items-center justify-center text-2xl bg-surface-2">🎁</div>
      )}
      <div className="p-4 space-y-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
          {labelCategoria(b.categoria)}
        </span>
        <p className="text-sm text-text">{b.titulo || "Sem título"}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            isAtivo ? "text-success border-success/30 bg-success/8" : "text-text-dim border-border bg-surface-2"
          }`}>
            {isAtivo ? "Ativa" : "Inativa"}
          </span>
          {b.valor != null && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border text-accent border-accent/30 bg-accent/8">
              R$ {Number(b.valor).toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <div className="flex border-t border-border">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-text-sub hover:text-accent hover:bg-accent/5 transition-colors">
          <Pencil size={13} /> Editar
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-text-sub hover:text-danger hover:bg-danger/5 transition-colors border-l border-border">
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-center py-16">
      <Tag size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhuma oferta cadastrada ainda.</p>
      <p className="text-xs text-text-dim mt-1">Clique em "+ Nova oferta" para criar a primeira.</p>
    </div>
  );
}
