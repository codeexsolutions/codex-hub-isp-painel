import { useState } from "react";
import { ToastProvider } from "./components/Toast";
import { Parceiro } from "./services/store";
import PainelShell from "./components/PainelShell";
import ParceiroLoginPage from "./pages/parceiro/ParceiroLoginPage";
import ParceiroFinanceiroPage from "./pages/parceiro/ParceiroFinanceiroPage";
import ParceiroCupomPage from "./pages/parceiro/ParceiroCupomPage";

const ABAS = [
  { key: "financeiro", label: "Financeiro" },
  { key: "cupom", label: "Validar cupom" },
];

export default function ParceiroApp() {
  const [logado, setLogado] = useState(() => !!Parceiro.atual());
  const [aba, setAba] = useState("cupom");

  const handleLogout = () => {
    Parceiro.sair();
    setLogado(false);
  };

  return (
    <ToastProvider>
      {logado ? (
        <PainelShell marca="Parceiro" abas={ABAS} aba={aba} onAbaChange={setAba} onLogout={handleLogout}>
          {aba === "financeiro" && <ParceiroFinanceiroPage />}
          {aba === "cupom" && <ParceiroCupomPage />}
        </PainelShell>
      ) : (
        <ParceiroLoginPage onLogin={() => setLogado(true)} />
      )}
    </ToastProvider>
  );
}
