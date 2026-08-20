import { Import } from "lucide-react";
import { uid } from "./format";

const URL_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_LOCAL;

const CONFIG = {
  API_BASE: URL_BASE,
  USE_API: true,
};

const DB_KEYS = {
  provedores: "hubisp_provedores",
  temas: "hubisp_temas",
  banners: "hubisp_banners",
  beneficios: "hubisp_beneficios",
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

export const Modulos = {
  // módulos ativos do PRÓPRIO provedor logado (ex.: ["beneficios"])
  async meus() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/modulos"); return extrairData(json) || []; }
    return [];
  },
};

const ADMIN_TOKEN_KEY = "hubisp_admin_token";

export const Admin = {
  async login(usuario, senha) {
    const json = await request("/painel/admin/login", {
      method: "POST",
      body: JSON.stringify({ usuario, senha }),
    });
    const { token } = extrairData(json);
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    return token;
  },
  atual() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  sair() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
  async _request(path, options = {}) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
    const res = await fetch(`${CONFIG.API_BASE}${path}`, { ...options, headers });
    const texto = await res.text();
    let json = null;
    try { json = texto ? JSON.parse(texto) : null; } catch {}
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      throw new Error((json && json.message) || "Sessão de admin expirada.");
    }
    if (!res.ok) throw new Error((json && json.message) || texto || `Erro ${res.status}`);
    return json;
  },
  async listarProvedores() {
    const json = await this._request("/painel/admin/provedores");
    return extrairData(json) || [];
  },
  async definirModulo(codigoProvedor, modulo, ativo) {
    const json = await this._request(`/painel/admin/provedores/${codigoProvedor}/modulos/${modulo}`, {
      method: "PATCH",
      body: JSON.stringify({ ativo }),
    });
    return extrairData(json);
  },
  async definirStatus(codigoProvedor, status) {
    const json = await this._request(`/painel/admin/provedores/${codigoProvedor}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return extrairData(json);
  },
  async obterConfigComissao() {
    const json = await this._request("/painel/admin/config-comissao");
    return extrairData(json);
  },
  async definirConfigComissao(config) {
    const json = await this._request("/painel/admin/config-comissao", {
      method: "PUT",
      body: JSON.stringify(config),
    });
    return extrairData(json);
  },
  async obterRelatorioCompras() {
    const json = await this._request("/painel/admin/compras");
    return extrairData(json);
  },
  async obterConfigPontos() {
    const json = await this._request("/painel/admin/config-pontos");
    return extrairData(json);
  },
  async definirConfigPontos(config) {
    const json = await this._request("/painel/admin/config-pontos", {
      method: "PUT",
      body: JSON.stringify(config),
    });
    return extrairData(json);
  },
  async criarParceiro(dados) {
    const json = await this._request("/painel/admin/parceiros", { method: "POST", body: JSON.stringify(dados) });
    return extrairData(json);
  },
  async listarParceiros() {
    const json = await this._request("/painel/admin/parceiros");
    return extrairData(json) || [];
  },
  async definirStatusParceiro(id, ativo) {
    const json = await this._request(`/painel/admin/parceiros/${id}/status`, { method: "PATCH", body: JSON.stringify({ ativo }) });
    return extrairData(json);
  },
  async definirProvedorParceiro(id, codigoProvedorFk) {
    const json = await this._request(`/painel/admin/parceiros/${id}/provedor`, { method: "PATCH", body: JSON.stringify({ codigo_provedor_fk: codigoProvedorFk }) });
    return extrairData(json);
  },
  async definirLocalizacaoParceiro(id, cidade, uf) {
    const json = await this._request(`/painel/admin/parceiros/${id}/localizacao`, { method: "PATCH", body: JSON.stringify({ cidade, uf }) });
    return extrairData(json);
  },
  async definirContatoParceiro(id, endereco, contato) {
    const json = await this._request(`/painel/admin/parceiros/${id}/contato`, { method: "PATCH", body: JSON.stringify({ endereco, contato }) });
    return extrairData(json);
  },
  async validarCompra(id) {
    const json = await this._request(`/painel/admin/compras/${id}/validar`, { method: "PATCH" });
    return extrairData(json);
  },
};

export const Compras = {
  // relatório de compras/comissão do provedor logado
  async listar() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/compras"); return extrairData(json) || []; }
    return [];
  },
};

const PARCEIRO_TOKEN_KEY = "hubisp_parceiro_token";

export const Parceiro = {
  async login(usuario, senha) {
    const json = await request("/parceiros/login", {
      method: "POST",
      body: JSON.stringify({ usuario, senha }),
    });
    const { token } = extrairData(json);
    localStorage.setItem(PARCEIRO_TOKEN_KEY, token);
    return token;
  },
  atual() {
    return localStorage.getItem(PARCEIRO_TOKEN_KEY);
  },
  sair() {
    localStorage.removeItem(PARCEIRO_TOKEN_KEY);
  },
  async _request(path, options = {}) {
    const token = localStorage.getItem(PARCEIRO_TOKEN_KEY);
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${CONFIG.API_BASE}${path}`, { ...options, headers });
    const texto = await res.text();
    let json = null;
    try { json = texto ? JSON.parse(texto) : null; } catch {}
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(PARCEIRO_TOKEN_KEY);
      throw new Error((json && json.message) || "Sessão do parceiro expirada.");
    }
    if (!res.ok) throw new Error((json && json.message) || texto || `Erro ${res.status}`);
    return json;
  },
  async financeiro() {
    const json = await this._request("/parceiros/financeiro");
    return extrairData(json);
  },
  async buscarCupom(codigo) {
    const json = await this._request(`/parceiros/cupom/${encodeURIComponent(codigo)}`);
    return extrairData(json);
  },
  async validarCupom(codigo) {
    const json = await this._request(`/parceiros/cupom/${encodeURIComponent(codigo)}/validar`, { method: "PATCH" });
    return extrairData(json);
  },
  async cancelarCupom(codigo) {
    const json = await this._request(`/parceiros/cupom/${encodeURIComponent(codigo)}/cancelar`, { method: "PATCH" });
    return extrairData(json);
  },
  // OFERTAS — o parceiro cria/gerencia; o provedor só ativa (ver Beneficios.catalogo/ativar)
  async listarOfertas() {
    const json = await this._request("/parceiros/ofertas");
    return extrairData(json) || [];
  },
  async criarOferta(dados) {
    const json = await this._request("/parceiros/ofertas", { method: "POST", body: montarFormDataOferta(dados) });
    return extrairData(json);
  },
  async atualizarOferta(id, dados) {
    const json = await this._request(`/parceiros/ofertas/${id}`, { method: "PATCH", body: montarFormDataOferta(dados) });
    return extrairData(json);
  },
  async removerOferta(id) {
    const json = await this._request(`/parceiros/ofertas/${id}`, { method: "DELETE" });
    return extrairData(json);
  },
};

function montarFormDataOferta(dados) {
  const form = new FormData();
  form.append("categoria", dados.categoria);
  form.append("parceiro", dados.parceiro);
  form.append("titulo", dados.titulo);
  form.append("subtitulo", dados.subtitulo || "");
  form.append("descricao", dados.descricao || "");
  form.append("link", dados.link || "");
  form.append("ativo", String(dados.ativo));
  form.append("valor", dados.valor || "");
  form.append("valor_original", dados.valor_original || "");
  form.append("validade_fim", dados.validade_fim || "");
  form.append("regras", dados.regras || "");
  if (dados.imagemFile) form.append("imagem", dados.imagemFile);
  return form;
}

export const Recompensas = {
  async listar() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/pontos/recompensas"); return extrairData(json) || []; }
    return [];
  },
  async criar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/pontos/recompensas", { method: "POST", body: JSON.stringify(dados) });
      return extrairData(json);
    }
  },
  async atualizar(id, dados) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/pontos/recompensas/${id}`, { method: "PATCH", body: JSON.stringify(dados) });
      return extrairData(json);
    }
  },
  async remover(id) {
    if (CONFIG.USE_API) { await request(`/painel/provedor/pontos/recompensas/${id}`, { method: "DELETE" }); }
  },
  // concessão manual de pontos (ex.: cliente pagou em dia) — cpf/cnpj + nome + pontos + motivo
  async concederPontos(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/pontos/conceder", { method: "POST", body: JSON.stringify(dados) });
      return extrairData(json);
    }
  },
};

// Ofertas são criadas pelo parceiro (ver objeto Parceiro) — o provedor só vê o
// catálogo de todas as ofertas disponíveis e ativa/desativa pra própria base.
export const Beneficios = {
  async catalogo() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/ofertas/catalogo"); return extrairData(json) || []; }
    return ler(DB_KEYS.beneficios);
  },
  async ativar(id, ativo) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/ofertas/${id}/ativar`, { method: "PATCH", body: JSON.stringify({ ativo }) });
      return extrairData(json);
    }
    return { id, ativo };
  },
};

export const Metricas = {
  async obter(provedorId) {
    if (CONFIG.USE_API) {
      try {
        const json = await request("/painel/provedor/metricas");
        return extrairData(json);
      } catch {
        return this._mock();
      }
    }
    return this._mock();
  },
  _mock() {
    return {
      clientesConectados: 0,
      usuariosAtivos: 0,
      compras: 0,
      vendasGeradas: 0,
      comissao: 0,
      beneficiosUtilizados: 0,
    };
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
  // marca a indicação como efetivada e credita os pontos padrão pro cliente que indicou
  async efetivar(id) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/indicacoes/${id}/efetivar`, { method: "PATCH" });
      return extrairData(json);
    }
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
