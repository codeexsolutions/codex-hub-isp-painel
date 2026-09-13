import PainelShell from "../../components/PainelShell";

const ABAS = [
  { key: "onboarding", label: "Onboarding rápido" },
  { key: "provedores", label: "Provedores" },
  { key: "comissao", label: "Comissão" },
  { key: "pontos", label: "Pontos" },
  { key: "relatorios", label: "Relatórios" },
  { key: "parceiros", label: "Parceiros" },
  { key: "faturamento", label: "Faturamento" },
  { key: "planos", label: "Planos" },
  { key: "iptv", label: "IPTV" },
  { key: "licencas-tv", label: "Licenças TV" },
];

export default function AdminShell({ aba, onAbaChange, onLogout, children }) {
  return (
    <PainelShell marca="Admin" abas={ABAS} aba={aba} onAbaChange={onAbaChange} onLogout={onLogout}>
      {children}
    </PainelShell>
  );
}
