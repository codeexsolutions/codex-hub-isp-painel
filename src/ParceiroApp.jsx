import { useState } from "react";
import { ToastProvider } from "./components/Toast";
import { Parceiro } from "./services/store";
import PainelShell from "./components/PainelShell";
import ParceiroLoginPage from "./pages/parceiro/ParceiroLoginPage";
import ParceiroFinanceiroPage from "./pages/parceiro/ParceiroFinanceiroPage";
import ParceiroCupomPage from "./pages/parceiro/ParceiroCupomPage";
import ParceiroOfertasPage from "./pages/parceiro/ParceiroOfertasPage";

const ABAS = [
  { key: "ofertas", label: "Minhas ofertas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "cupom", label: "Validar cupom" },
];

export default function ParceiroApp() {
  const [logado, setLogado] = useState(() => !!Parceiro.atual());
  const [aba, setAba] = useState("ofertas");

  const handleLogout = () => {
    Parceiro.sair();
    setLogado(false);
  };

  return (
    <ToastProvider>
      {logado ? (
        <PainelShell marca="Parceiro" abas={ABAS} aba={aba} onAbaChange={setAba} onLogout={handleLogout}>
          {aba === "ofertas" && <ParceiroOfertasPage />}
          {aba === "financeiro" && <ParceiroFinanceiroPage />}
          {aba === "cupom" && <ParceiroCupomPage />}
        </PainelShell>
      ) : (
        <ParceiroLoginPage onLogin={() => setLogado(true)} />
      )}
    </ToastProvider>
  );
}
