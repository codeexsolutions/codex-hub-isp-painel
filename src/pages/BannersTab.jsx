import { useState, useEffect, useCallback } from "react";
import { Image, Pencil, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import { Label, Input, ColorField, FieldRow, Help } from "../components/Field";
import { Banners } from "../services/store";
import { normalizarHex } from "../services/format";
import { useToast } from "../components/Toast";

export default function BannersTab({ provedor }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm());

  function initialForm() {
    return { selo: "", titulo: "", subtitulo: "", cta: "", emoji: "✨", cor1: "#6C4CF1", cor2: "#9B7BFF", link: "" };
  }

  const load = useCallback(async () => {
    try {
      const data = await Banners.listar(provedor.id);
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar banners");
    } finally {
      setLoading(false);
    }
  }, [provedor.id]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const openModal = (id = null) => {
    setEditId(id);
    if (id) {
      const b = lista.find((x) => x.id === id);
      setForm({
        selo: b?.selo || "", titulo: b?.titulo || "", subtitulo: b?.subtitulo || "",
        cta: b?.cta || "", emoji: b?.emoji || "✨",
        cor1: b?.cor1 || "#6C4CF1", cor2: b?.cor2 || "#9B7BFF", link: b?.link || "",
      });
    } else {
      setForm(initialForm());
    }
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.titulo.trim()) { toast("Informe ao menos o título do banner"); return; }
    const dados = { ...form, titulo: form.titulo.trim(), selo: form.selo.trim(), subtitulo: form.subtitulo.trim(), cta: form.cta.trim(), link: form.link.trim() };
    try {
      if (editId) await Banners.atualizar(editId, dados);
      else await Banners.criar(provedor.id, dados);
      setModalOpen(false);
      await load();
      toast("Banner salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar banner");
    }
  };

  const excluir = async (id) => {
    if (!confirm("Excluir este banner?")) return;
    try {
      await Banners.remover(id);
      await load();
      toast("Banner excluído");
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === "string" ? v : v.target.value }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim">
          Aparecem no carrossel da tela inicial do app, na ordem cadastrada.
        </p>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 shrink-0"
        >
          + Novo banner
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((b) => (
            <BannerCard key={b.id} banner={b} onEdit={() => openModal(b.id)} onDelete={() => excluir(b.id)} />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar banner" : "Novo banner"}>
        <div className="space-y-4">
          <div>
            <Label>Selo</Label>
            <Input value={form.selo} onChange={set("selo")} placeholder="ex.: INDIQUE E GANHE" />
          </div>
          <div>
            <Label>Título</Label>
            <Input value={form.titulo} onChange={set("titulo")} placeholder="Título curto e direto" />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input value={form.subtitulo} onChange={set("subtitulo")} placeholder="Complemento em uma linha" />
          </div>
          <FieldRow>
            <div>
              <Label>Texto do botão (CTA)</Label>
              <Input value={form.cta} onChange={set("cta")} placeholder="ex.: Indicar agora" />
            </div>
            <div>
              <Label>Emoji</Label>
              <Input value={form.emoji} onChange={set("emoji")} maxLength={4} placeholder="🎁" className="w-20" />
            </div>
          </FieldRow>
          <FieldRow>
            <div>
              <Label>Cor inicial</Label>
              <ColorField value={form.cor1} onChange={set("cor1")} />
            </div>
            <div>
              <Label>Cor final</Label>
              <ColorField value={form.cor2} onChange={set("cor2")} />
            </div>
          </FieldRow>
          <div>
            <Label>Link de destino</Label>
            <Input value={form.link} onChange={set("link")} placeholder="https://… ou /app/faturas" />
            <Help>Deixe em branco se o banner é só informativo.</Help>
          </div>

          {/* Preview */}
          <div
            className="rounded-xl p-4 text-white relative overflow-hidden min-h-[100px]"
            style={{ background: `linear-gradient(135deg, ${form.cor1}, ${form.cor2})` }}
          >
            <div className="text-[10px] tracking-widest uppercase opacity-90">{form.selo}</div>
            <div className="text-sm mt-1 font-display">{form.titulo || "Título do banner"}</div>
            <div className="text-xs opacity-85 mt-0.5">{form.subtitulo}</div>
            <span className="absolute right-0 bottom-0 text-5xl opacity-15">{form.emoji || "✨"}</span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button onClick={salvar} className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
              Salvar banner
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BannerCard({ banner, onEdit, onDelete }) {
  const b = banner;
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden group">
      <div
        className="p-4 text-white relative overflow-hidden min-h-[100px]"
        style={{ background: `linear-gradient(135deg, ${b.cor1 || "#2563EB"}, ${b.cor2 || "#7C3AED"})` }}
      >
        <div className="text-[10px] tracking-widest uppercase opacity-90">{b.selo}</div>
        <div className="text-sm mt-1 font-display">{b.titulo || "Sem título"}</div>
        <span className="absolute right-0 bottom-0 text-5xl opacity-15">{b.emoji || "✨"}</span>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-text-sub">{b.subtitulo || ""}</p>
        {b.link ? (
          <p className="text-[11px] text-accent truncate">🔗 {b.link}</p>
        ) : (
          <p className="text-[11px] text-text-dim">Sem link (apenas informativo)</p>
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
      <Image size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhum banner cadastrado ainda.</p>
      <p className="text-xs text-text-dim mt-1">Clique em "+ Novo banner" para criar o primeiro.</p>
    </div>
  );
}
