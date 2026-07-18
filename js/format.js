function formatarTelefone(numero) {
    const digits = numero.replace(/\D/g, "");

    if (digits.length === 13) {
        return digits.replace(
            /^55(\d{2})(\d{5})(\d{4})$/,
            "($1) $2-$3"
        );
    }

    if (digits.length === 11) {
        return digits.replace(
            /^(\d{2})(\d{5})(\d{4})$/,
            "($1) $2-$3"
        );
    }

    if (digits.length === 10) {
        return digits.replace(
            /^(\d{2})(\d{4})(\d{4})$/,
            "($1) $2-$3"
        );
    }
    
    return numero;
}

function formataData(data) {

    if (!data) return "-";

    const d = new Date(data);

    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }) + " " +
    d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

}

const resolveImageUrl = (url) => {
  if (!url || typeof url !== "string") return url;

  // Extrai o ID do arquivo dos formatos mais comuns do Drive
  const match =
    url.match(/\/file\/d\/([^/]+)/) ||     // .../file/d/ID/view
    url.match(/[?&]id=([^&]+)/) ||          // ...?id=ID  /  open?id=ID
    url.match(/\/d\/([^/]+)/);             // .../d/ID

  if (match && url.includes("drive.google.com")) {
    const id = match[1];
    // thumbnail é o endpoint mais confiável para embutir imagem
    return `https://drive.google.com/thumbnail?id=${id}&sz=w2048`;
    // alternativa: return `https://lh3.googleusercontent.com/d/${id}=w1600`;
  }

  return url; // não é Drive: retorna como está
};