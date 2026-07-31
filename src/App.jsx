import { useState, useEffect } from "react";
import { Sessao } from "./services/store";
import { ToastProvider } from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ProvedorTab from "./pages/ProvedorTab";
import TemaTab from "./pages/TemaTab";
import BannersTab from "./pages/BannersTab";
import AnunciosTab from "./pages/AnunciosTab";
import NotificacoesTab from "./pages/NotificacoesTab";
import IndicacoesTab from "./pages/IndicacoesTab";
import AvaliacoesTab from "./pages/AvaliacoesTab";

export default function App() {
  const [provedor, setProvedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("provedor");

  useEffect(() => {
    Sessao.atual().then((p) => {
      if (p) setProvedor(p);
      setLoading(false);
    });
  }, []);

  const handleLogin = (p) => {
    setProvedor(p);
    setActiveTab("provedor");
  };

  const handleLogout = () => {
    Sessao.sair();
    setProvedor(null);
    setActiveTab("provedor");
  };

  const handleUpdateProvedor = (updated) => {
    setProvedor(updated);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  if (!provedor) {
    return (
      <ToastProvider>
        <LoginPage onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "provedor":
        return <ProvedorTab provedor={provedor} onUpdate={handleUpdateProvedor} />;
      case "tema":
        return <TemaTab provedor={provedor} />;
      case "banners":
        return <BannersTab provedor={provedor} />;
      case "anuncios":
        return <AnunciosTab provedor={provedor} />;
      case "notificacoes":
        return <NotificacoesTab provedor={provedor} />;
      case "indicacoes":
        return <IndicacoesTab provedor={provedor} />;
      case "avaliacoes":
        return <AvaliacoesTab provedor={provedor} />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-canvas">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          providerName={provedor.nome_fantasia || provedor.empresa}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <Topbar activeTab={activeTab} status={provedor.status} />
          <div className="flex-1 overflow-y-auto">
            {renderTab()}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
