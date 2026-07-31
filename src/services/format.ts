export function formatarTelefone(numero:string) {
  if (!numero) return "-";
  const digits = numero.replace(/\D/g, "");

  if (digits.length === 13)
    return digits.replace(/^55(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (digits.length === 11)
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (digits.length === 10)
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");

  return numero;
}

export function formataData(data:string) {
  if (!data) return "-";
  const d = new Date(data);
  return (
    d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function resolveImageUrl(url: string | undefined | null) {
  if (!url || typeof url !== "string") return url;

  // Google Drive
  if (url.includes("drive.google.com")) {
    const match =
      url.match(/\/file\/d\/([^/]+)/) ||
      url.match(/[?&]id=([^&]+)/) ||
      url.match(/\/d\/([^/]+)/);

    if (match) {
      const id = match[1];
      return `https://drive.google.com/thumbnail?id=${id}&sz=w2048`;
    }
  }

  // Supabase Storage
  if (
    url.includes(".supabase.co/storage/") ||
    url.includes("/storage/v1/object/")
  ) {
    return url;
  }

  return url;
}

export function maskCnpj(v:string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function normalizarHex(v:string) {
  if (!v) return null;
  return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : null;
}
