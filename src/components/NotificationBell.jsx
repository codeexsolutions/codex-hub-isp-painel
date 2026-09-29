import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import { formataData } from "../services/format";

const INTERVALO_POLL_MS = 30000;

// Sino de notificações genérico — recebe o "store" (objeto com
// contarNaoLidas/listar/marcarLida) pra ser reaproveitado tanto no painel do
// provedor (NotificacoesPainel) quanto no do parceiro (NotificacoesParceiro).
export default function NotificationBell({ store }) {
  const [aberto, setAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const boxRef = useRef(null);

  const carregarContagem = useCallback(() => {
    store.contarNaoLidas().then(setNaoLidas).catch(() => {});
  }, [store]);

  useEffect(() => {
    carregarContagem();
    const id = setInterval(carregarContagem, INTERVALO_POLL_MS);
    return () => clearInterval(id);
  }, [carregarContagem]);

  useEffect(() => {
    if (!aberto) return;

    const aoClicarFora = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  const alternar = () => {
    const vaiAbrir = !aberto;
    setAberto(vaiAbrir);
    if (vaiAbrir) {
      setCarregando(true);
      store.listar()
        .then(setNotificacoes)
        .catch(() => setNotificacoes([]))
        .finally(() => setCarregando(false));
    }
  };

  const marcarLida = async (id) => {
    setNotificacoes((lista) => lista.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    setNaoLidas((n) => Math.max(0, n - 1));
    try {
      await store.marcarLida(id);
    } catch {
      // silencioso — próxima abertura resincroniza
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={alternar}
        className="relative w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-text-sub hover:text-text transition-colors"
        aria-label="Notificações"
      >
        <Bell size={16} />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-h-96 overflow-y-auto bg-surface border border-border rounded-2xl shadow-soft z-20">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-text">Notificações</div>

          {carregando ? (
            <div className="text-xs text-text-dim text-center py-8">Carregando…</div>
          ) : notificacoes.length === 0 ? (
            <div className="text-xs text-text-dim text-center py-8">Nenhuma notificação ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.lida && marcarLida(n.id)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-2 ${!n.lida ? "bg-accent/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.lida && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-text">{n.titulo}</div>
                      <div className="text-[11px] text-text-dim mt-0.5">{n.corpo}</div>
                      <div className="text-[10px] text-text-dim mt-1">{formataData(n.criadoEm)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
