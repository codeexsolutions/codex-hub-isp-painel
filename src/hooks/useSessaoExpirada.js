import { useEffect, useState } from "react";

// Ouve o aviso disparado pelo store.js quando uma requisição volta 401/403
// (ou o token já nasceu vencido ao abrir o painel) — permite forçar o
// logout na hora em vez de deixar a tela "logada" parada até o usuário
// notar que as ações estão falhando.
export function useSessaoExpirada(escopo) {
  const [expirada, setExpirada] = useState(false);

  useEffect(() => {
    const onExpirar = (e) => {
      if (e.detail?.escopo === escopo) setExpirada(true);
    };
    window.addEventListener("synk:sessao-expirada", onExpirar);
    return () => window.removeEventListener("synk:sessao-expirada", onExpirar);
  }, [escopo]);

  return [expirada, () => setExpirada(false)];
}
