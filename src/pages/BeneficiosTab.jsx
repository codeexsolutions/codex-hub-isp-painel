import { useState, useEffect, useCallback, useRef } from "react";
import { Tag, Pencil, Trash2, Upload, X } from "lucide-react";
import Modal from "../components/Modal";
import { Label, Input, Select, Textarea, Help } from "../components/Field";
import { Beneficios } from "../services/store";
import { resolveImageUrl } from "../services/format";
import { useToast } from "../components/Toast";

const CATEGORIAS = [
  { value: "entretenimento", label: "Entretenimento" },
  { value: "consumo_local", label: "Consumo local" },
  { value: "digital", label: "Digital" },
];

const labelCategoria = (v) => CATEGORIAS.find((c) => c.value === v)?.label || v;

export default function BeneficiosTab({ provedor }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm());
  const [previewUrl, setPreviewUrl] = useState(null);
  const [parceirosPortal, setParceirosPortal] = useState([]);
  const fileRef = useRef(null);

  function initialForm() {
    return {
      categoria: "entretenimento", parceiro: "", titulo: "", subtitulo: "",
      descricao: "", link: "", ativo: "true", valor: "", parceiro_id_fk: "", imagemFile: null,
    };
  }

  const load = useCallback(async () => {
    try {
      const data = await Beneficios.listar(provedor.id);
      setLista(data);
    } catch (err) {
      toast(err.message || "Erro ao carregar benefícios");
    } finally {
      setLoading(false);
    }
  }, [provedor.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);
  useEffect(() => {
    Beneficios.listarParceirosDisponiveis(provedor.codigo_provedor).then(setParceirosPortal).catch(() => {});
  }, [provedor.codigo_provedor]);

  const openModal = (id = null) => {
    setEditId(id);
    if (id) {
      const p = lista.find((x) => x.id === id);
      setForm({
        categoria: p?.categoria || "entretenimento", parceiro: p?.parceiro || "",
        titulo: p?.titulo || "", subtitulo: p?.subtitulo || "", descricao: p?.descricao || "",
        link: p?.link_acao || p?.link || "", ativo: p?.ativo !== undefined ? String(p.ativo) : "true",
        valor: p?.valor != null ? String(p.valor) : "",
        parceiro_id_fk: p?.parceiro_id_fk != null ? String(p.parceiro_id_fk) : "",
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
      setPreviewUrl(URL.createObjectURL(file));
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
    if (!form.titulo.trim()) { toast("Informe ao menos o título do benefício"); return; }
    if (!form.parceiro.trim()) { toast("Informe o nome do parceiro"); return; }
    const dados = {
      categoria: form.categoria, parceiro: form.parceiro.trim(), titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim(), descricao: form.descricao.trim(), imagemFile: form.imagemFile,
      link: form.link.trim() || null, ativo: form.ativo === "true",
      valor: form.valor.trim() || null,
      parceiro_id_fk: form.parceiro_id_fk || null,
    };
    try {
      if (editId) await Beneficios.atualizar(editId, dados);
      else await Beneficios.criar(provedor.id, dados);
      setModalOpen(false);
      await load();
      toast("Benefício salvo");
    } catch (err) {
      toast(err.message || "Erro ao salvar benefício");
    }
  };

  const excluir = async (id) => {
    if (!confirm("Excluir este benefício?")) return;
    try {
      const resultado = await Beneficios.remover(id);
      await load();
      toast(
        resultado?.removido === false
          ? "Este benefício já tem cliques/compras registrados, então foi desativado (não aparece mais no app) em vez de excluído — isso preserva o histórico nos relatórios."
          : "Benefício excluído"
      );
    } catch (err) {
      toast(err.message || "Erro ao excluir");
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim max-w-md">
          Os benefícios aparecem na Central de Benefícios do aplicativo, organizados por categoria.
        </p>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 shrink-0"
        >
          + Novo benefício
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-text-dim text-center py-12">Carregando…</div>
      ) : !lista.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((b) => (
            <BeneficioCard key={b.id} beneficio={b} onEdit={() => openModal(b.id)} onDelete={() => excluir(b.id)} />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar benefício" : "Novo benefício"}>
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
            <Label>Parceiro</Label>
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
            <Textarea value={form.descricao} onChange={set("descricao")} rows={3} placeholder="Detalhes do benefício" />
          </div>

          {/* File upload */}
          <div>
            <Label>Imagem do benefício</Label>
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
                automaticamente para esse formato — se a imagem não for quadrada, o corte é centralizado
                e pode cortar as bordas, então prefira já enviar uma foto quadrada ou com o assunto centralizado.
              </Help>
              <Help>Se não enviar imagem, o benefício aparece com ícone e cor no app.</Help>
            </div>
          </div>

          <div>
            <Label>Valor (R$)</Label>
            <Input value={form.valor} onChange={set("valor")} placeholder="ex.: 18.00" inputMode="decimal" />
            <Help>Preenchido, o benefício vira comprável no app (o cliente compra e recebe um cupom). Em branco, continua só informativo, como hoje.</Help>
          </div>
          <div>
            <Label>Parceiro (portal)</Label>
            <Select value={form.parceiro_id_fk} onChange={set("parceiro_id_fk")}>
              <option value="">Nenhum (sem acesso ao portal)</option>
              {parceirosPortal.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
            <Help>Vincula a conta do parceiro que valida os cupons desse benefício. Cadastrada pelo admin.</Help>
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

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-sub hover:text-text border border-border hover:border-border-2 transition-colors">
              Cancelar
            </button>
            <button onClick={salvar} className="px-5 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
              Salvar benefício
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BeneficioCard({ beneficio, onEdit, onDelete }) {
  const b = beneficio;
  const isAtivo = b.ativo === true || b.ativo === "true";
  const imgSrc = resolveImageUrl(b.link_imagem);

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
          🎁
        </div>
      )}
      <div className="p-4 space-y-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
          {labelCategoria(b.categoria)}
        </span>
        <p className="text-xs text-text-sub">{b.parceiro || "Sem parceiro"}</p>
        <p className="text-sm text-text">{b.titulo || "Sem título"}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            isAtivo ? "text-success border-success/30 bg-success/8" : "text-text-dim border-border bg-surface-2"
          }`}>
            {isAtivo ? "Ativo" : "Inativo"}
          </span>
          {b.valor != null && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border text-accent border-accent/30 bg-accent/8">
              Comprável · R$ {Number(b.valor).toFixed(2)}
            </span>
          )}
        </div>
        {b.link_acao || b.link ? (
          <p className="text-[11px] text-accent truncate">🔗 {b.link_acao || b.link}</p>
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
      <Tag size={40} className="mx-auto text-text-dim mb-3 opacity-40" />
      <p className="text-sm text-text-dim">Nenhum benefício cadastrado ainda.</p>
      <p className="text-xs text-text-dim mt-1">Clique em "+ Novo benefício" para criar o primeiro.</p>
    </div>
  );
}
