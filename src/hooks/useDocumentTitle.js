import { useEffect } from "react";

// As 3 áreas do painel (provedor/admin/parceiro) são a mesma SPA — sem isso,
// o título da aba do navegador fica sempre o padrão fixo do index.html
// ("Painel do Provedor"), mesmo estando logado como admin ou parceiro,
// dificultando diferenciar as abas abertas.
export function useDocumentTitle(titulo) {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;
    return () => { document.title = anterior; };
  }, [titulo]);
}
