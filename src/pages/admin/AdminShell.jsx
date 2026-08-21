import PainelShell from "../../components/PainelShell";

const ABAS = [
  { key: "provedores", label: "Provedores" },
  { key: "comissao", label: "Comissão" },
  { key: "pontos", label: "Pontos" },
  { key: "relatorios", label: "Relatórios" },
  { key: "parceiros", label: "Parceiros" },
  { key: "faturamento", label: "Faturamento" },
];

export default function AdminShell({ aba, onAbaChange, onLogout, children }) {
  return (
    <PainelShell marca="Admin" abas={ABAS} aba={aba} onAbaChange={onAbaChange} onLogout={onLogout}>
      {children}
    </PainelShell>
  );
}
