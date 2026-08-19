import { useState, useEffect } from "react";
import { Sessao, Modulos } from "./services/store";
import { ToastProvider } from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ProvedorTab from "./pages/ProvedorTab";
import TemaTab from "./pages/TemaTab";
import BannersTab from "./pages/BannersTab";
import BeneficiosTab from "./pages/BeneficiosTab";
import RecompensasTab from "./pages/RecompensasTab";
import ComprasTab from "./pages/ComprasTab";
import DashboardTab from "./pages/DashboardTab";
import NotificacoesTab from "./pages/NotificacoesTab";
import IndicacoesTab from "./pages/IndicacoesTab";
import AvaliacoesTab from "./pages/AvaliacoesTab";
import AdminApp from "./AdminApp";
import ParceiroApp from "./ParceiroApp";

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return <AdminApp />;
  }
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/parceiro")) {
    return <ParceiroApp />;
  }
  return <ProviderApp />;
}

function ProviderApp() {
  const [provedor, setProvedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [modulos, setModulos] = useState([]);

  useEffect(() => {
    Sessao.atual().then((p) => {
      if (p) setProvedor(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!provedor) return;
    Modulos.meus().then(setModulos).catch(() => setModulos([]));
  }, [provedor]);

  const handleLogin = (p) => {
    setProvedor(p);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    Sessao.sair();
    setProvedor(null);
    setModulos([]);
    setActiveTab("dashboard");
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

  const temBeneficios = modulos.includes("beneficios");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab provedor={provedor} />;
      case "provedor":
        return <ProvedorTab provedor={provedor} onUpdate={handleUpdateProvedor} />;
      case "tema":
        return <TemaTab provedor={provedor} />;
      case "banners":
        return <BannersTab provedor={provedor} />;
      case "beneficios":
        return temBeneficios ? <BeneficiosTab provedor={provedor} /> : null;
      case "recompensas":
        return temBeneficios ? <RecompensasTab /> : null;
      case "compras":
        return temBeneficios ? <ComprasTab /> : null;
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
          temBeneficios={temBeneficios}
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
