import { useEffect, useState } from "react";
import { ToastProvider } from "./components/Toast";
import { Parceiro } from "./services/store";
import { useSessaoExpirada } from "./hooks/useSessaoExpirada";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import PainelShell from "./components/PainelShell";
import ParceiroLoginPage from "./pages/parceiro/ParceiroLoginPage";
import ParceiroFinanceiroPage from "./pages/parceiro/ParceiroFinanceiroPage";
import ParceiroCupomPage from "./pages/parceiro/ParceiroCupomPage";
import ParceiroOfertasPage from "./pages/parceiro/ParceiroOfertasPage";
import ParceiroPerfilPage from "./pages/parceiro/ParceiroPerfilPage";

const ABAS = [
  { key: "ofertas", label: "Minhas ofertas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "cupom", label: "Validar cupom" },
  { key: "perfil", label: "Meu perfil" },
];

export default function ParceiroApp() {
  const [logado, setLogado] = useState(() => !!Parceiro.atual());
  const [aba, setAba] = useState("ofertas");
  const [sessaoExpirada, limparSessaoExpirada] = useSessaoExpirada("parceiro");

  useDocumentTitle("Synk ISP · Painel do Parceiro");

  useEffect(() => {
    if (sessaoExpirada) setLogado(false);
  }, [sessaoExpirada]);

  const handleLogout = () => {
    Parceiro.sair();
    limparSessaoExpirada();
    setLogado(false);
  };

  return (
    <ToastProvider>
      {logado ? (
        <PainelShell marca="Parceiro" abas={ABAS} aba={aba} onAbaChange={setAba} onLogout={handleLogout}>
          {aba === "ofertas" && <ParceiroOfertasPage />}
          {aba === "financeiro" && <ParceiroFinanceiroPage />}
          {aba === "cupom" && <ParceiroCupomPage />}
          {aba === "perfil" && <ParceiroPerfilPage />}
        </PainelShell>
      ) : (
        <ParceiroLoginPage
          onLogin={() => { limparSessaoExpirada(); setLogado(true); }}
          mensagem={sessaoExpirada ? "Sessão expirada. Faça login novamente." : null}
        />
      )}
    </ToastProvider>
  );
}
