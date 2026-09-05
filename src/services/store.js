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

// Decodifica o payload do JWT (sem validar assinatura — só pra saber se já
// venceu e evitar mostrar o painel "logado" com token vencido até a primeira
// requisição falhar). Se não der pra decodificar ou não tiver "exp", deixa o
// backend decidir (401) em vez de forçar logout por engano.
function tokenExpirado(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

// Avisa a árvore de componentes (App/AdminApp/ParceiroApp) que a sessão
// caiu, pra forçar o logout imediatamente em vez de deixar a tela "logada"
// parada até o usuário reparar que as chamadas estão falhando.
function avisarSessaoExpirada(escopo) {
  window.dispatchEvent(new CustomEvent("synk:sessao-expirada", { detail: { escopo } }));
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
    avisarSessaoExpirada("provedor");
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
      if (!token || tokenExpirado(token)) {
        localStorage.removeItem(DB_KEYS.token);
        localStorage.removeItem(DB_KEYS.provedorCache);
        return null;
      }
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

export const AtivacaoTv = {
  async listar() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/tv-ativacoes");
      return extrairData(json);
    }
    return [];
  },

  async gerar(clienteNome) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/tv-ativacoes", {
        method: "POST",
        body: JSON.stringify({ clienteNome }),
      });
      return extrairData(json);
    }
  },

  async revogar(id) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/tv-ativacoes/${id}`, { method: "DELETE" });
      return extrairData(json);
    }
  },
};

// DNS/servidor Xtream próprio do provedor pro app Synk TV — em branco usa
// o padrão do admin (ver Iptv.controller.ts::ObterUrlPadraoDoProvedor).
export const IptvDns = {
  async obter() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/iptv-dns");
      return extrairData(json)?.urlDns ?? "";
    }
    return "";
  },
  async definir(urlDns) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/iptv-dns", {
        method: "PUT",
        body: JSON.stringify({ urlDns }),
      });
      return extrairData(json)?.urlDns ?? "";
    }
  },
};

export const HomeConfig = {
  async obter() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/home-config");
      return extrairData(json);
    }
    return { banner: true, fatura: true, consumo: true, atalhos: true };
  },

  async salvar(config) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/home-config", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      return extrairData(json);
    }
    return config;
  },
};

export const Atendimento = {
  async obter() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/atendimento");
      return extrairData(json);
    }
    return { whatsapp: "", telefone: "", email: "", site: "", instagram: "" };
  },

  async salvar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/atendimento", {
        method: "PUT",
        body: JSON.stringify(dados),
      });
      return extrairData(json);
    }
    return dados;
  },
};

export const IxcOsConfig = {
  async obter() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/ixc-os-config");
      return extrairData(json);
    }
    return { id_assunto: "", id_filial: "", setor: "", id_evento_mensagem: "" };
  },

  async salvar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/ixc-os-config", {
        method: "PUT",
        body: JSON.stringify(dados),
      });
      return extrairData(json);
    }
    return dados;
  },
};

export const IxcAssuntos = {
  async listar() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/ixc-assuntos");
      return extrairData(json) || [];
    }
    return [];
  },

  async criar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/ixc-assuntos", {
        method: "POST",
        body: JSON.stringify(dados),
      });
      return extrairData(json);
    }
    return dados;
  },

  async excluir(id) {
    if (CONFIG.USE_API) {
      await request(`/painel/provedor/ixc-assuntos/${id}`, { method: "DELETE" });
    }
  },
};

export const IxcContratoConfig = {
  async obter() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/ixc-contrato-config");
      return extrairData(json);
    }
    return { resource_imprimir: "" };
  },

  async salvar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/ixc-contrato-config", {
        method: "PUT",
        body: JSON.stringify(dados),
      });
      return extrairData(json);
    }
    return dados;
  },
};

export const ClubeBeneficios = {
  async obter() {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/clube-beneficios");
      return extrairData(json);
    }
    return { nome: "", mensagem: "" };
  },

  async salvar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/clube-beneficios", {
        method: "PUT",
        body: JSON.stringify(dados),
      });
      return extrairData(json);
    }
    return dados;
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
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token || tokenExpirado(token)) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      return null;
    }
    return token;
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
      avisarSessaoExpirada("admin");
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
  async listarFaturasComissao() {
    const json = await this._request("/painel/admin/comissao/faturamento");
    return extrairData(json) || [];
  },
  async marcarFaturaComissaoPaga(id) {
    const json = await this._request(`/painel/admin/comissao/faturas/${id}/pagar`, { method: "PATCH" });
    return extrairData(json);
  },
  async marcarFaturaComissaoCancelada(id) {
    const json = await this._request(`/painel/admin/comissao/faturas/${id}/cancelar`, { method: "PATCH" });
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
  async aprovarParceiro(id, usuario, senha) {
    const json = await this._request(`/painel/admin/parceiros/${id}/aprovar`, { method: "PATCH", body: JSON.stringify({ usuario, senha }) });
    return extrairData(json);
  },
  async rejeitarParceiro(id) {
    const json = await this._request(`/painel/admin/parceiros/${id}/rejeitar`, { method: "PATCH" });
    return extrairData(json);
  },
  async validarCompra(id) {
    const json = await this._request(`/painel/admin/compras/${id}/validar`, { method: "PATCH" });
    return extrairData(json);
  },
  // FATURAMENTO SYNK (mensalidade que o provedor paga pra Synk)
  async listarFaturamento() {
    const json = await this._request("/painel/admin/faturamento");
    return extrairData(json) || [];
  },
  async configurarAssinatura(codigoProvedor, dados) {
    const json = await this._request(`/painel/admin/faturamento/${codigoProvedor}/assinatura`, { method: "POST", body: JSON.stringify(dados) });
    return extrairData(json);
  },
  async marcarFaturaPaga(id) {
    const json = await this._request(`/painel/admin/faturas/${id}/pagar`, { method: "PATCH" });
    return extrairData(json);
  },
  async marcarFaturaCancelada(id) {
    const json = await this._request(`/painel/admin/faturas/${id}/cancelar`, { method: "PATCH" });
    return extrairData(json);
  },
  async reabrirFatura(id) {
    const json = await this._request(`/painel/admin/faturas/${id}/reabrir`, { method: "PATCH" });
    return extrairData(json);
  },
  async listarFaturasProvedor(codigoProvedor) {
    const json = await this._request(`/painel/admin/faturamento/${codigoProvedor}/faturas`);
    return extrairData(json) || [];
  },
  async obterRecibo(id) {
    const json = await this._request(`/painel/admin/faturas/${id}/recibo`);
    return extrairData(json);
  },
  async obterConfigPix() {
    const json = await this._request("/painel/admin/config-pix");
    return extrairData(json);
  },
  async definirConfigPix(dados) {
    const json = await this._request("/painel/admin/config-pix", { method: "PUT", body: JSON.stringify(dados) });
    return extrairData(json);
  },
  async obterConfigIptv() {
    const json = await this._request("/painel/admin/config-iptv");
    return extrairData(json);
  },
  async definirConfigIptv(urlPadrao) {
    const json = await this._request("/painel/admin/config-iptv", { method: "PUT", body: JSON.stringify({ url_padrao: urlPadrao }) });
    return extrairData(json);
  },
  async obterConfigLicencaTv() {
    const json = await this._request("/painel/admin/config-licenca-tv");
    return extrairData(json);
  },
  async definirConfigLicencaTv(dados) {
    const json = await this._request("/painel/admin/config-licenca-tv", { method: "PUT", body: JSON.stringify(dados) });
    return extrairData(json);
  },
  async listarLicencasTv() {
    const json = await this._request("/painel/admin/licencas-tv");
    return extrairData(json) || [];
  },
  async criarLicencaTv(nome, telefone) {
    const json = await this._request("/painel/admin/licencas-tv", { method: "POST", body: JSON.stringify({ nome, telefone }) });
    return extrairData(json);
  },
  async aprovarLicencaTv(id) {
    const json = await this._request(`/painel/admin/licencas-tv/${id}/aprovar`, { method: "PATCH" });
    return extrairData(json);
  },
  async cancelarLicencaTv(id) {
    const json = await this._request(`/painel/admin/licencas-tv/${id}/cancelar`, { method: "PATCH" });
    return extrairData(json);
  },
  async listarPlanos() {
    const json = await this._request("/painel/admin/planos");
    return extrairData(json) || [];
  },
  async criarPlano(dados) {
    const json = await this._request("/painel/admin/planos", { method: "POST", body: JSON.stringify(dados) });
    return extrairData(json);
  },
  async editarPlano(id, dados) {
    const json = await this._request(`/painel/admin/planos/${id}`, { method: "PUT", body: JSON.stringify(dados) });
    return extrairData(json);
  },
  async definirStatusPlano(id, ativo) {
    const json = await this._request(`/painel/admin/planos/${id}/status`, { method: "PATCH", body: JSON.stringify({ ativo }) });
    return extrairData(json);
  },
};

export const Faturamento = {
  async obter() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/faturamento"); return extrairData(json); }
    return { assinatura: null, faturas: [], modulosAtivos: [], pixCopiaCola: null };
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
    const token = localStorage.getItem(PARCEIRO_TOKEN_KEY);
    if (!token || tokenExpirado(token)) {
      localStorage.removeItem(PARCEIRO_TOKEN_KEY);
      return null;
    }
    return token;
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
      avisarSessaoExpirada("parceiro");
      throw new Error((json && json.message) || "Sessão do parceiro expirada.");
    }
    if (!res.ok) throw new Error((json && json.message) || texto || `Erro ${res.status}`);
    return json;
  },
  async financeiro() {
    const json = await this._request("/parceiros/financeiro");
    return extrairData(json);
  },
  async faturamentoComissao() {
    const json = await this._request("/parceiros/comissao/faturamento");
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

export const PlanosMoveis = {
  async listar() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/planos-moveis"); return extrairData(json) || []; }
    return [];
  },
  async criar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/planos-moveis", { method: "POST", body: JSON.stringify(dados) });
      return extrairData(json);
    }
  },
  async atualizar(id, dados) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/planos-moveis/${id}`, { method: "PATCH", body: JSON.stringify(dados) });
      return extrairData(json);
    }
  },
  async remover(id) {
    if (CONFIG.USE_API) { await request(`/painel/provedor/planos-moveis/${id}`, { method: "DELETE" }); }
  },
  async listarSolicitacoes() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/planos-moveis/solicitacoes"); return extrairData(json) || []; }
    return [];
  },
  async atualizarStatusSolicitacao(id, status) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/planos-moveis/solicitacoes/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      return extrairData(json);
    }
  },
};

// Catálogo de internet fixa (fibra) — alimenta a Landing Page (módulo "landpage").
export const PlanosInternet = {
  async listar() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/planos-internet"); return extrairData(json) || []; }
    return [];
  },
  async criar(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/planos-internet", { method: "POST", body: JSON.stringify(dados) });
      return extrairData(json);
    }
  },
  async atualizar(id, dados) {
    if (CONFIG.USE_API) {
      const json = await request(`/painel/provedor/planos-internet/${id}`, { method: "PATCH", body: JSON.stringify(dados) });
      return extrairData(json);
    }
  },
  async remover(id) {
    if (CONFIG.USE_API) { await request(`/painel/provedor/planos-internet/${id}`, { method: "DELETE" }); }
  },
};

// Config da Landing Page pública do provedor.
export const LpConfig = {
  async obter() {
    if (CONFIG.USE_API) { const json = await request("/painel/provedor/lp-config"); return extrairData(json); }
    return { ativa: false, headline: "", subheadline: "", cidade: "" };
  },
  async definir(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/painel/provedor/lp-config", { method: "PUT", body: JSON.stringify(dados) });
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
      const json = await request(`/notificacoes/buscarPorCpf?cpf=${encodeURIComponent(cpf)}`);
      return extrairData(json);
    }
    return null;
  },

  async listarTemplates() {
    if (CONFIG.USE_API) {
      const json = await request("/notificacoes/templates");
      return extrairData(json) || [];
    }
    return [];
  },

  async criarTemplate(dados) {
    if (CONFIG.USE_API) {
      const json = await request("/notificacoes/templates", {
        method: "POST",
        body: JSON.stringify(dados),
      });
      return extrairData(json);
    }
    return dados;
  },

  async excluirTemplate(id) {
    if (CONFIG.USE_API) {
      await request(`/notificacoes/templates/${id}`, { method: "DELETE" });
    }
  },

  async obterChavePublica() {
    const json = await request("/notificacoes/public-key");
    return extrairData(json);
  },
};

// Central de notificações do PAINEL (sino do provedor) — separada do objeto
// Notificacoes acima, que é o disparo de push PARA os assinantes do app.
export const NotificacoesPainel = {
  async inscrever(subscription) {
    const json = await request("/painel/notificacoes/inscrever", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
    return extrairData(json);
  },
  async listar() {
    const json = await request("/painel/notificacoes");
    return extrairData(json) || [];
  },
  async contarNaoLidas() {
    const json = await request("/painel/notificacoes/nao-lidas");
    return extrairData(json) || 0;
  },
  async marcarLida(id) {
    const json = await request(`/painel/notificacoes/${id}/lida`, { method: "PATCH" });
    return extrairData(json);
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
