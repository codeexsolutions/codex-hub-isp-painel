import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import { NotificacoesPainel } from "../services/store";
import { formataData } from "../services/format";

const TITULOS = {
  dashboard: ["Dashboard", "Visão geral do impacto comercial do seu Synk"],
  provedor: ["Dados do provedor", "Informações cadastrais e credenciais do gerenciador"],
  tema: ["Tema do app", "Cores e logomarca exibidas para os assinantes"],
  banners: ["Banners", "Carrossel de ofertas na tela inicial do app"],
  beneficios: ["Benefícios", "Ofertas e vantagens exclusivas para seus clientes"],
  compras: ["Relatórios", "Compras, cupons e comissão gerados pelos benefícios"],
  faturamento: ["Faturamento", "Sua assinatura e faturas com a Synk"],
  recompensas: ["Recompensas", "O que o cliente pode trocar pelos pontos acumulados"],
  notificacoes: ["Notificações Push", "Envie notificações para os assinantes do app"],
  indicacoes: ["Indicações", "Clientes que indicaram novos assinantes pelo aplicativo"],
  avaliacoes: ["Avaliações", "Clientes que avaliaram o serviço"],
  "planos-moveis": ["Internet Móvel", "Planos de dados móvel que o cliente pode solicitar pelo app"],
  "landpage": ["Landing Page", "Sua página pública com planos e um jeito rápido do cliente te chamar"],
};

const INTERVALO_POLL_MS = 30000;

export default function Topbar({ activeTab, status }) {
  const [titulo, sub] = TITULOS[activeTab] || ["", ""];

  return (
    <header className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-10">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-base text-text tracking-tight font-display">{titulo}</h1>
        <p className="text-xs text-text-dim mt-0.5">{sub}</p>
      </div>

      <div className="flex items-center gap-3">
        <SinoNotificacoes />
        {status && (
          <span
            className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border
              ${status === "ATIVO"
                ? "text-success border-success/30 bg-success/8"
                : "text-warning border-warning/30 bg-warning/8"}`}
          >
            {status}
          </span>
        )}
      </div>
    </header>
  );
}

// Sino de notificações do painel — hoje avisa sobre chamado novo aberto por
// um assinante (o ReceitaNet não notifica isso sozinho). Feito pra crescer
// pra outros tipos de aviso depois.
function SinoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const boxRef = useRef(null);

  const carregarContagem = useCallback(() => {
    NotificacoesPainel.contarNaoLidas().then(setNaoLidas).catch(() => {});
  }, []);

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
      NotificacoesPainel.listar()
        .then(setNotificacoes)
        .catch(() => setNotificacoes([]))
        .finally(() => setCarregando(false));
    }
  };

  const marcarLida = async (id) => {
    setNotificacoes((lista) => lista.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    setNaoLidas((n) => Math.max(0, n - 1));
    try {
      await NotificacoesPainel.marcarLida(id);
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
