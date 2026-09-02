import { RefreshCw } from "lucide-react";

export default function AppUpdateBanner({ onAtualizar }) {
  return (
    <button
      onClick={onAtualizar}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-full
        border border-border bg-surface text-text text-xs font-semibold shadow-soft hover:border-accent/40 transition-colors"
    >
      <RefreshCw size={15} className="text-accent" />
      Nova versão disponível — clique pra atualizar
    </button>
  );
}
