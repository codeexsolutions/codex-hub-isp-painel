import { useState, useEffect, useCallback, useRef } from "react";
import { Megaphone, Pencil, Trash2, Upload, X } from "lucide-react";
import Modal from "../components/Modal";
import { Label, Input, Select, Textarea, Help } from "../components/Field";
import { Anuncios } from "../services/store";
import { resolveImageUrl } from "../services/format";
import { useToast } from "../components/Toast";

export default function AnunciosTab({ provedor }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm());
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  function initialForm() {
    return { tipo: "imagem", titulo: "", subtitulo: "", descricao: "", link: "", ativo: "true", imagemFile: null };
  }

  const load = useCallback(async () => {
    try {
      const data = await Anuncios.listar(provedor.id);
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar anúncios");
    } finally {
      setLoading(false);
    }
  }, [provedor.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const openModal = (id = null) => {
    setEditId(id);
    if (id) {
      const p = lista.find((x) => x.id === id);
      setForm({
        tipo: p?.tipo || "imagem", titulo: p?.titulo || "", subtitulo: p?.subtitulo || "",
        descricao: p?.descricao || "",
        link: p?.link_acao || "", ativo: p?.ativo !== undefined ? String(p.ativo) : "true",
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
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setForm((f) => ({ ...f, imagemFile: null }));
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const salvar = async () => {
    if (!form.titulo.trim()) { toast("Informe ao menos o título do anúncio"); return; }
    const dados = {
      tipo: form.tipo, titulo: form.titulo.trim(), subtitulo: form.subtitulo.trim(),
      descricao: form.descricao.trim(), imagemFile: form.imagemFile,
      link: form.link.trim() || null, ativo: form.ativo === "true",
    };
    try {
      if (editId) await Anuncios.atualizar(editId, dados);
      else await Anuncios.criar(provedor.id, dados);
      setModalOpen(false);
      await load();
      toast("Anúncio salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar anúncio");
    }
  };

  const excluir = async (id) => {
    if (!confirm("Excluir este anúncio?")) return;
    try {
      await Anuncios.remover(id);
      await load();
      toast("Anúncio excluído");
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim max-w-md">
          Os anúncios aparecem em formato de carrossel na tela inicial do aplicativo.
        </p>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 shrink-0"
        >
          + Novo anúncio
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((a) => (
            <AnuncioCard key={a.id} anuncio={a} onEdit={() => openModal(a.id)} onDelete={() => excluir(a.id)} />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar anúncio" : "Novo anúncio"}>
        <div className="space-y-4">
          <div>
            <Label>Tipo do anúncio</Label>
            <Select value={form.tipo} onChange={set("tipo")}>
              <option value="imagem">Anúncio com imagem</option>
              <option value="texto">Card de texto</option>
            </Select>
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input value={form.subtitulo} onChange={set("subtitulo")} placeholder="Opcional" />
          </div>
          <div>
            <Label>Título</Label>
            <Input value={form.titulo} onChange={set("titulo")} placeholder="Título do anúncio" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={set("descricao")} rows={3} placeholder="Descrição do anúncio" />
          </div>

          {/* File upload */}
          <div>
            <Label>Imagem do anúncio</Label>
            <div className="space-y-2">
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={previewUrl} alt="preview" className="w-full h-36 object-cover" onError={(e) => { e.target.style.display = "none"; }} />
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
                  <span className="text-[10px] opacity-60">PNG, JPG ou WebP · 1600×700px recomendado</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Help>Se não enviar imagem, será criado automaticamente um card de texto.</Help>
            </div>
          </div>

          <div>
            <Label>Link de destino</Label>
            <Input value={form.link} onChange={set("link")} placeholder="https://…" />
          </div>
          <div>
            <Label>Ativo</Label>
            <Select value={form.ativo} onChange={set("ativo")}>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </div>

          {/* Text preview fallback */}
          {!previewUrl && (
            <div className="rounded-xl p-4 text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
              <div className="text-[10px] tracking-widest uppercase opacity-75">
                {form.tipo === "texto" ? "Card de texto" : "Anúncio"}
              </div>
              <div className="text-sm mt-1 font-display">{form.titulo || "Título do anúncio"}</div>
              {form.subtitulo && <div className="text-xs opacity-85 mt-0.5">{form.subtitulo}</div>}
              {form.descricao && <div className="text-[11px] opacity-75 mt-1">{form.descricao}</div>}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button onClick={salvar} className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
              Salvar anúncio
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AnuncioCard({ anuncio, onEdit, onDelete }) {
  const a = anuncio;
  const isAtivo = a.ativo === true || a.ativo === "true";
  const imgSrc = resolveImageUrl(a.link_imagem);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          className="w-full h-32 object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      {!imgSrc && (
        <div className="h-20 flex items-center justify-center text-2xl bg-surface-2">
          {a.tipo === "texto" ? "📝" : "🖼️"}
        </div>
      )}
      <div className="p-4 space-y-2">
        <p className="text-sm text-text">{a.titulo || "Sem título"}</p>
        <p className="text-xs text-text-sub">{a.subtitulo || a.descricao || ""}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-dim">
            {a.tipo === "texto" ? "Card de texto" : "Banner com imagem"}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            isAtivo ? "text-success border-success/30 bg-success/8" : "text-text-dim border-border bg-surface-2"
          }`}>
            {isAtivo ? "Ativo" : "Inativo"}
          </span>
        </div>
        {a.link_acao ? (
          <p className="text-[11px] text-accent truncate">🔗 {a.link_acao}</p>
        ) : (
          <p className="text-[11px] text-text-dim">Sem link</p>
        )}
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
      <Megaphone size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhum anúncio cadastrado ainda.</p>
      <p className="text-xs text-text-dim mt-1">Clique em "+ Novo anúncio" para criar o primeiro.</p>
    </div>
  );
}
