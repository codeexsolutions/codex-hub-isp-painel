import { useEffect, useState } from "react";

const INTERVALO = 5 * 60 * 1000;

// Mesmo mecanismo do synk-app: detecta quando existe um build mais novo no
// servidor. Necessário pro painel instalado (PWA) — diferente de uma aba de
// navegador comum, ele não costuma refazer a navegação/rede sozinho ao
// voltar pro primeiro plano, então pode ficar rodando o bundle antigo
// indefinidamente sem isso. Não recarrega sozinho (perderia o que o
// provedor estiver fazendo) — só avisa, e quem decide a hora é o botão.
export function useAppUpdateWatcher() {
  const [atualizacaoDisponivel, setAtualizacaoDisponivel] = useState(false);

  useEffect(() => {
    if (typeof __APP_BUILD_ID__ === "undefined") return; // dev: sem versionamento de build

    const verificar = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (buildId && buildId !== __APP_BUILD_ID__) setAtualizacaoDisponivel(true);
      } catch {
        // rede indisponível — tenta de novo no próximo ciclo
      }
    };

    verificar();
    const onVisivel = () => { if (document.visibilityState === "visible") verificar(); };
    document.addEventListener("visibilitychange", onVisivel);
    window.addEventListener("focus", verificar);
    const id = setInterval(verificar, INTERVALO);

    return () => {
      document.removeEventListener("visibilitychange", onVisivel);
      window.removeEventListener("focus", verificar);
      clearInterval(id);
    };
  }, []);

  return atualizacaoDisponivel;
}
