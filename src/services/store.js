import { uid } from "./format";

const CONFIG = {
  API_BASE: "http://192.168.18.188:3010/v1",
  USE_API: true,
};

const DB_KEYS = {
  provedores: "hubisp_provedores",
  temas: "hubisp_temas",
  banners: "hubisp_banners",
  anuncios: "hubisp_anuncios",
  indicacoes: "hubisp_indicacoes",
  sessao: "hubisp_sessao",
  token: "hubisp_token",
  provedorCache: "hubisp_provedor_cache",
};

function agoraISO() {
  const d = new Date();
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const micro = pad(d.getMilliseconds() * 1000, 6);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${micro}+00`;
}

function ler(chave) {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

function gravar(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function extrairData(json) {
  if (json && typeof json === "object" && "data" in json) {
    if (json.statusCode != null && (json.statusCode < 200 || json.statusCode >= 300)) {
      throw new Error(json.message || "Erro na requisição.");
    }
    return json.data;
  }
  return json;
}

function normalizarProvedor(raw) {
  if (!raw) return null;
  if ("codigo_provedor" in raw) return raw;
  return {
    id: raw.Id,
    codigo: raw.Codigo,
    empresa: raw.Empresa,
    nome_fantasia: raw.NomeFantasia ?? null,
    codigo_provedor: raw.CodigoProvedor != null ? Number(raw.CodigoProvedor) : null,
    status: raw.Status || "ATIVO",
    gerenciador: raw.Gerenciador,
    codigo_api_gerenciador: raw.CodigoApiGerenciador != null ? Number(raw.CodigoApiGerenciador) : null,
    chave_api_gerenciador: raw.ChaveApiGerenciador ?? null,
    nome_administrador: raw.NomeAdministrador,
    cnpj: raw.CpfCnpj,
    dominio_ixc: raw.DominioIxc ?? null,
    usuario: raw.Usuario,
    senha: raw._Senha,
  };
}

async function request(path, options = {}) {
  const token = localStorage.getItem(DB_KEYS.token);
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${CONFIG.API_BASE}${path}`, { ...options, headers });
  const texto = await res.text();
  let json = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {}
  if (res.status === 401) {
    localStorage.removeItem(DB_KEYS.token);
    localStorage.removeItem(DB_KEYS.provedorCache);
    throw new Error((json && json.message) || "Sessão expirada. Faça login novamente.");
  }
  if (!res.ok) {
    throw new Error((json && json.message) || texto || `Erro ${res.status}`);
  }
  return json;
}

// Seed
function seed() {
  if (CONFIG.USE_API) return;
  if (localStorage.getItem("hubisp_seeded")) return;
  const provedores = [
    {
      idx: 1, id: "", created_at: "", empresa: "", gerenciador: "",
      codigo_api_gerenciador: 0, chave_api_gerenciador: "", codigo_provedor: 1,
      nome_administrador: "", cnpj: "", status: "", nome_fantasia: "",
      dominio_ixc: null, usuario: "", senha: "",
    },
  ];
  const temas = [
    { idx: 0, id: 1, created_at: "", tag: "Internet Fibra", accent: "#DB5F00", accent2: "#DB5FFF", logo_url: "", glyph: null, codigo_provedor_fk: 1 },
  ];
  const banners = [
    { id: uid(), provedor_id: "f2f68d52-cff0-44b0-bf26-606c9d5f1049", selo: "INDIQUE E GANHE", titulo: "Indique um amigo e ganhe desconto", subtitulo: "R$ 30 off na sua próxima fatura por indicação.", cta: "Indicar agora", cor1: "#6C4CF1", cor2: "#9B7BFF", emoji: "🎁", link: "" },
    { id: uid(), provedor_id: "f2f68d52-cff0-44b0-bf26-606c9d5f1049", selo: "UPGRADE", titulo: "Turbine para 500 Mega", subtitulo: "Mais velocidade pelo mesmo preço no 1º mês.", cta: "Quero turbinar", cor1: "#2563EB", cor2: "#22B8CF", emoji: "⚡", link: "" },
  ];
  gravar(DB_KEYS.provedores, provedores);
  gravar(DB_KEYS.temas, temas);
  gravar(DB_KEYS.banners, banners);
  localStorage.setItem("hubisp_seeded", "1");
}
seed();

export const Provedores = {
  _listarMock() { return ler(DB_KEYS.provedores); },
  _buscarPorUsuarioMock(usuario) {
    return this._listarMock().find((p) => p.usuario?.toLowerCase() === usuario.toLowerCase()) || null;
  },
  _proximoCodigoMock() {
    const lista = this._listarMock();
    return lista.length ? Math.max(...lista.map((p) => p.codigo_provedor || 0)) + 1 : 1;
  },

  async cadastrar({ empresa, gerenciador, cnpj, nome_administrador, usuario, senha }) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/cadastrar", {
        method: "POST",
        body: JSON.stringify({ empresa, gerenciador, cnpj, nomeAdministrador: nome_administrador, usuario, senha }),
      });
      const data = extrairData(json);
      const provedor = normalizarProvedor(data.provedor ?? data);
      if (data.token) localStorage.setItem(DB_KEYS.token, data.token);
      localStorage.setItem(DB_KEYS.provedorCache, JSON.stringify(provedor));
      return provedor;
    }
    if (this._buscarPorUsuarioMock(usuario)) {
      throw new Error("Este usuário já está em uso. Escolha outro.");
    }
    const lista = this._listarMock();
    const novo = {
      idx: lista.length, id: uid(), created_at: agoraISO(), empresa, gerenciador,
      codigo_api_gerenciador: null, chave_api_gerenciador: null,
      codigo_provedor: this._proximoCodigoMock(), nome_administrador, cnpj,
      status: "ATIVO", nome_fantasia: null, dominio_ixc: null, usuario, senha,
    };
    lista.push(novo);
    gravar(DB_KEYS.provedores, lista);
    localStorage.setItem(DB_KEYS.sessao, novo.id);
    return novo;
  },

  async atualizar(id, patch) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/atualizar", { method: "PATCH", body: JSON.stringify(patch) });
      const provedor = normalizarProvedor(extrairData(json));
      localStorage.setItem(DB_KEYS.provedorCache, JSON.stringify(provedor));
      return provedor;
    }
    const lista = this._listarMock();
    const i = lista.findIndex((p) => p.id === id);
    if (i === -1) throw new Error("Provedor não encontrado.");
    lista[i] = { ...lista[i], ...patch };
    gravar(DB_KEYS.provedores, lista);
    return lista[i];
  },

  async _obterAtual() {
    if (CONFIG.USE_API) {
      const token = localStorage.getItem(DB_KEYS.token);
      if (!token) return null;
      const cache = localStorage.getItem(DB_KEYS.provedorCache);
      return cache ? JSON.parse(cache) : null;
    }
    const id = localStorage.getItem(DB_KEYS.sessao);
    return id ? this._listarMock().find((p) => p.id === id) || null : null;
  },
};

export const Temas = {
  async buscarPorProvedor(codigoProvedor) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/temas");
      return extrairData(json);
    }
    const lista = ler(DB_KEYS.temas);
    return lista.find((t) => t.codigo_provedor_fk === codigoProvedor) || null;
  },

  async salvar(codigoProvedor, dados) {
    if (CONFIG.USE_API) {
      const form = new FormData();
      form.append("codigo_provedor_fk", codigoProvedor);
      form.append("nome_fantasia", dados.nome_fantasia || "");
      form.append("tag", dados.tag);
      form.append("accent", dados.accent);
      form.append("accent2", dados.accent2);
      form.append("glyph", dados.glyph || "");
      if (dados.logo) form.append("logo", dados.logo);
      if (dados.favicon) form.append("favicon", dados.favicon);
      if (dados.icon192) form.append("icon192", dados.icon192);
      if (dados.icon512) form.append("icon512", dados.icon512);
      if (dados.maskable) form.append("maskable", dados.maskable);
      const json = await request("/painel/provedor/temas", { method: "PUT", body: form });
      return extrairData(json);
    }
  },
};

export const Banners = {
  async listar(provedorId) {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/banners"); return extrairData(json) || []; }
    return ler(DB_KEYS.banners).filter((b) => b.provedor_id === provedorId);
  },
  async criar(provedorId, dados) {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/banners", { method: "POST", body: JSON.stringify(dados) }); return extrairData(json); }
    const lista = ler(DB_KEYS.banners);
    const novo = { id: uid(), provedor_id: provedorId, ...dados };
    lista.push(novo);
    gravar(DB_KEYS.banners, lista);
    return novo;
  },
  async atualizar(id, patch) {
    if (CONFIG.USE_API) { const json = await request(`/painel/provedor/banners/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); return extrairData(json); }
    const lista = ler(DB_KEYS.banners);
    const i = lista.findIndex((b) => b.id === id);
    if (i === -1) throw new Error("Banner não encontrado.");
    lista[i] = { ...lista[i], ...patch };
    gravar(DB_KEYS.banners, lista);
    return lista[i];
  },
  async remover(id) {
    if (CONFIG.USE_API) { await request(`/painel/provedor/banners/${id}`, { method: "DELETE" }); return; }
    gravar(DB_KEYS.banners, ler(DB_KEYS.banners).filter((b) => b.id !== id));
  },
};

export const Anuncios = {
  async listar(provedorId) {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/anuncios"); return extrairData(json) || []; }
    return ler(DB_KEYS.anuncios).filter((p) => p.provedor_id === provedorId);
  },
  async criar(provedorId, dados) {
    if (CONFIG.USE_API) {
      const form = new FormData();
      form.append("tipo", dados.tipo);
      form.append("titulo", dados.titulo);
      form.append("subtitulo", dados.subtitulo || "");
      form.append("descricao", dados.descricao || "");
      form.append("link", dados.link || "");
      form.append("ativo", String(dados.ativo));
      if (dados.imagemFile) form.append("imagem", dados.imagemFile);
      const json = await request("/painel/provedor/anuncios", { method: "POST", body: form });
      return extrairData(json);
    }
    const lista = ler(DB_KEYS.anuncios);
    const novo = { id: uid(), provedor_id: provedorId, ...dados };
    lista.push(novo);
    gravar(DB_KEYS.anuncios, lista);
    return novo;
  },
  async atualizar(id, dados) {
    if (CONFIG.USE_API) {
      const form = new FormData();
      form.append("tipo", dados.tipo);
      form.append("titulo", dados.titulo);
      form.append("subtitulo", dados.subtitulo || "");
      form.append("descricao", dados.descricao || "");
      form.append("link", dados.link || "");
      form.append("ativo", String(dados.ativo));
      if (dados.imagemFile) form.append("imagem", dados.imagemFile);
      const json = await request(`/painel/provedor/anuncios/${id}`, { method: "PATCH", body: form });
      return extrairData(json);
    }
    const lista = ler(DB_KEYS.anuncios);
    const i = lista.findIndex((p) => p.id === id);
    if (i === -1) throw new Error("Anúncio não encontrado.");
    lista[i] = { ...lista[i], ...dados };
    gravar(DB_KEYS.anuncios, lista);
    return lista[i];
  },
  async remover(id) {
    if (CONFIG.USE_API) { await request(`/painel/provedor/anuncios/${id}`, { method: "DELETE" }); return; }
    gravar(DB_KEYS.anuncios, ler(DB_KEYS.anuncios).filter((p) => p.id !== id));
  },
};

export const Indicacoes = {
  async listar(provedorId) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/indicacoes");
      return extrairData(json) || [];
    }
    return ler(DB_KEYS.indicacoes).filter((i) => i.provedor_id === provedorId);
  },
};

export const Avaliacoes = {
  async listar(provedorId) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/avaliacoes");
      return extrairData(json) || [];
    }
    return [];
  },
};

export const Notificacoes = {
  
  async enviar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/notificacoes/notificar", {
        method: "POST",
        body: JSON.stringify(dados),
      });
      return extrairData(json);
    }
    return { ok: true, enviadas: 0 };
  },

  async listar() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/notificacoes");
      return extrairData(json) || [];
    }
    return [];
  },

  async buscarTodosAssinantes() {
    if (CONFIG.USE_API) {
      const json = await request("/notificacoes/buscarTodos");
      return extrairData(json) || [];
    }
    return [];
  },

  async buscarPorCpf(cpf) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/notificacoes/buscarPorCpf?cpf=${encodeURIComponent(cpf)}`);
      return extrairData(json);
    }
    return null;
  },
};

export const Sessao = {
  async login(usuario, senha, codigoProvedor) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/login", {
        method: "POST",
        body: JSON.stringify({ usuario, senha, codigoProvedor: Number(codigoProvedor) }),
      });
      const data = extrairData(json);
      const provedor = normalizarProvedor(data.provedor);
      localStorage.setItem(DB_KEYS.token, data.token);
      localStorage.setItem(DB_KEYS.provedorCache, JSON.stringify(provedor));
      return provedor;
    }
    const p = Provedores._buscarPorUsuarioMock(usuario);
    if (!p || p.senha !== senha) throw new Error("Usuário ou senha inválidos.");
    localStorage.setItem(DB_KEYS.sessao, p.id);
    return p;
  },

  async atual() {
    try {
      return await Provedores._obterAtual();
    } catch {
      return null;
    }
  },

  sair() {
    localStorage.removeItem(DB_KEYS.sessao);
    localStorage.removeItem(DB_KEYS.token);
    localStorage.removeItem(DB_KEYS.provedorCache);
  },
};

export { CONFIG };
