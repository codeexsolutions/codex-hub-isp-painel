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
};

export default function Topbar({ activeTab, status }) {
  const [titulo, sub] = TITULOS[activeTab] || ["", ""];

  return (
    <header className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-10">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-base text-text tracking-tight font-display">{titulo}</h1>
        <p className="text-xs text-text-dim mt-0.5">{sub}</p>
      </div>
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
    </header>
  );
}
