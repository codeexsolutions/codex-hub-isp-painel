import { createContext, useContext, useEffect, useState } from "react";

const PwaInstallCtx = createContext(null);
export const usePwaInstall = () => useContext(PwaInstallCtx);

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// Mesmo padrão do synk-app: captura o beforeinstallprompt o mais cedo
// possível (montado na raiz do painel) — se só escutássemos depois do login
// o evento já teria disparado e passado despercebido.
export function PwaInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [instalado, setInstalado] = useState(isStandalone);

  useEffect(() => {
    const aoPropor = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", aoPropor);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPropor);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const solicitarInstalacao = async () => {
    if (!deferredPrompt) return "indisponivel";
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setInstalado(true);
    return outcome;
  };

  const value = {
    instalado,
    podeInstalar: !!deferredPrompt,
    ios: isIos() && !isStandalone(),
    solicitarInstalacao,
  };

  return <PwaInstallCtx.Provider value={value}>{children}</PwaInstallCtx.Provider>;
}
