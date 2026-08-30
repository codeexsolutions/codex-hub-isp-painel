import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { usePwaInstall } from "../context/PwaInstallContext";

const DISMISS_KEY = "synk_painel_install_dismissed";

export default function InstallBanner() {
  const { instalado, podeInstalar, ios, solicitarInstalacao } = usePwaInstall();
  const [dispensado, setDispensado] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1");

  if (instalado || dispensado || (!podeInstalar && !ios)) return null;

  const dispensar = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDispensado(true);
  };

  const instalar = async () => {
    const resultado = await solicitarInstalacao();
    if (resultado === "dismissed") dispensar();
  };

  return (
    <div className="mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-2xl border border-border bg-surface flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-accent/12 flex items-center justify-center shrink-0">
        <Download size={17} className="text-accent" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-text">Instale o painel</div>
        <div className="text-[11px] text-text-dim mt-0.5 leading-snug">
          {ios ? (
            <>Toque em <Share size={11} className="inline -mt-0.5" /> e depois em "Adicionar à Tela de Início".</>
          ) : (
            "Acesso mais rápido e notificações direto na tela inicial."
          )}
        </div>
      </div>

      {!ios && (
        <button
          onClick={instalar}
          className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors shrink-0"
        >
          Instalar
        </button>
      )}

      <button onClick={dispensar} className="text-text-dim hover:text-text transition-colors shrink-0" aria-label="Dispensar">
        <X size={16} />
      </button>
    </div>
  );
}
