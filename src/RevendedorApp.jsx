import { useEffect, useState } from "react";
import { ToastProvider } from "./components/Toast";
import { Revendedor } from "./services/store";
import { useSessaoExpirada } from "./hooks/useSessaoExpirada";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import PainelShell from "./components/PainelShell";
import RevendedorLoginPage from "./pages/revendedor/RevendedorLoginPage";
import RevendedorLicencasPage from "./pages/revendedor/RevendedorLicencasPage";

const ABAS = [{ key: "licencas", label: "Licenças" }];

export default function RevendedorApp() {
  const [logado, setLogado] = useState(() => !!Revendedor.atual());
  const [aba, setAba] = useState("licencas");
  const [sessaoExpirada, limparSessaoExpirada] = useSessaoExpirada("revendedor");

  useDocumentTitle("Synk TV · Portal do Revendedor");

  useEffect(() => {
    if (sessaoExpirada) setLogado(false);
  }, [sessaoExpirada]);

  const handleLogout = () => {
    Revendedor.sair();
    limparSessaoExpirada();
    setLogado(false);
  };

  return (
    <ToastProvider>
      {logado ? (
        <PainelShell marca="Revendedor" abas={ABAS} aba={aba} onAbaChange={setAba} onLogout={handleLogout}>
          {aba === "licencas" && <RevendedorLicencasPage />}
        </PainelShell>
      ) : (
        <RevendedorLoginPage
          onLogin={() => { limparSessaoExpirada(); setLogado(true); }}
          mensagem={sessaoExpirada ? "Sessão expirada. Faça login novamente." : null}
        />
      )}
    </ToastProvider>
  );
}
