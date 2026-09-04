import { useEffect, useState } from "react";
import { ToastProvider } from "./components/Toast";
import { Admin } from "./services/store";
import { useSessaoExpirada } from "./hooks/useSessaoExpirada";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminShell from "./pages/admin/AdminShell";
import AdminModulosPage from "./pages/admin/AdminModulosPage";
import AdminComissaoPage from "./pages/admin/AdminComissaoPage";
import AdminPontosPage from "./pages/admin/AdminPontosPage";
import AdminRelatoriosPage from "./pages/admin/AdminRelatoriosPage";
import AdminParceirosPage from "./pages/admin/AdminParceirosPage";
import AdminFaturamentoPage from "./pages/admin/AdminFaturamentoPage";
import AdminPlanosPage from "./pages/admin/AdminPlanosPage";
import AdminIptvPage from "./pages/admin/AdminIptvPage";
import AdminLicencasTvPage from "./pages/admin/AdminLicencasTvPage";

export default function AdminApp() {
  const [logado, setLogado] = useState(() => !!Admin.atual());
  const [aba, setAba] = useState("provedores");
  const [sessaoExpirada, limparSessaoExpirada] = useSessaoExpirada("admin");

  useEffect(() => {
    if (sessaoExpirada) setLogado(false);
  }, [sessaoExpirada]);

  const handleLogout = () => {
    Admin.sair();
    limparSessaoExpirada();
    setLogado(false);
  };

  return (
    <ToastProvider>
      {logado ? (
        <AdminShell aba={aba} onAbaChange={setAba} onLogout={handleLogout}>
          {aba === "provedores" && <AdminModulosPage />}
          {aba === "comissao" && <AdminComissaoPage />}
          {aba === "pontos" && <AdminPontosPage />}
          {aba === "relatorios" && <AdminRelatoriosPage />}
          {aba === "parceiros" && <AdminParceirosPage />}
          {aba === "faturamento" && <AdminFaturamentoPage />}
          {aba === "planos" && <AdminPlanosPage />}
          {aba === "iptv" && <AdminIptvPage />}
          {aba === "licencas-tv" && <AdminLicencasTvPage />}
        </AdminShell>
      ) : (
        <AdminLoginPage
          onLogin={() => { limparSessaoExpirada(); setLogado(true); }}
          mensagem={sessaoExpirada ? "Sessão expirada. Faça login novamente." : null}
        />
      )}
    </ToastProvider>
  );
}
