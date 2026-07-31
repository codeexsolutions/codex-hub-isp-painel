import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label, Input, Select, FieldRow, Help } from "../components/Field";
import { Provedores } from "../services/store";
import { useToast } from "../components/Toast";

export default function ProvedorTab({ provedor, onUpdate }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [showSenha, setShowSenha] = useState(false);
  const [showChave, setShowChave] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!provedor) return;
    setForm({
      empresa: provedor.empresa || "",
      nome_fantasia: provedor.nome_fantasia || "",
      cnpj: provedor.cnpj || "",
      nome_administrador: provedor.nome_administrador || "",
      status: provedor.status || "ATIVO",
      codigo_provedor: provedor.codigo_provedor ?? "",
      usuario: provedor.usuario ?? "",
      senha: provedor.senha ?? "",
      gerenciador: provedor.gerenciador || "RECEITANET",
      codigo_api_gerenciador: provedor.codigo_api_gerenciador ?? "",
      dominio_ixc: provedor.dominio_ixc || "",
      chave_api_gerenciador: provedor.chave_api_gerenciador || "",
    });
  }, [provedor]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    setSaving(true);
    try {
      const patch = {
        empresa: form.empresa,
        nome_fantasia: form.nome_fantasia || null,
        cnpj: form.cnpj,
        nome_administrador: form.nome_administrador,
        usuario: form.usuario,
        senha: form.senha,
        status: form.status,
        gerenciador: form.gerenciador,
        codigo_api_gerenciador: form.codigo_api_gerenciador ? Number(form.codigo_api_gerenciador) : null,
        dominio_ixc: form.dominio_ixc || null,
        chave_api_gerenciador: form.chave_api_gerenciador || null,
      };
      const updated = await Provedores.atualizar(provedor.id, patch);
      onUpdate(updated);
      toast("Dados do provedor salvos");
    } catch (err) {
      toast(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados cadastrais */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm text-text font-display">Dados cadastrais</h3>

          <div>
            <Label>Empresa</Label>
            <Input value={form.empresa || ""} onChange={set("empresa")} />
          </div>

          <div>
            <Label>Nome fantasia</Label>
            <Input value={form.nome_fantasia || ""} onChange={set("nome_fantasia")} placeholder="Como o provedor é conhecido" />
          </div>

          <FieldRow>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj || ""} onChange={set("cnpj")} />
            </div>
            <div>
              <Label>Nome do administrador</Label>
              <Input value={form.nome_administrador || ""} onChange={set("nome_administrador")} />
            </div>
          </FieldRow>

          <FieldRow>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "ATIVO"} disabled>
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
                <option value="SUSPENSO">SUSPENSO</option>
              </Select>
            </div>
            <div>
              <Label>Código do provedor</Label>
              <Input value={form.codigo_provedor || ""} disabled />
            </div>
          </FieldRow>

          <FieldRow>
            <div>
              <Label>Usuário</Label>
              <Input value={form.usuario || ""} onChange={set("usuario")} />
            </div>
            <div>
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  value={form.senha || ""}
                  onChange={set("senha")}
                  type={showSenha ? "text" : "password"}
                  placeholder="Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-sub transition-colors"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </FieldRow>
        </div>

        {/* Integração */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm text-text font-display">Integração com o gerenciador</h3>

          <div>
            <Label>Gerenciador</Label>
            <Select value={form.gerenciador || "RECEITANET"} onChange={set("gerenciador")}>
              <option value="RECEITANET">RECEITANET</option>
              <option value="IXCSOFT">IXCSOFT</option>
            </Select>
          </div>

          <FieldRow>
            <div>
              <Label>Código API gerenciador</Label>
              <Input value={form.codigo_api_gerenciador || ""} onChange={set("codigo_api_gerenciador")} placeholder="ex.: 128" inputMode="numeric" />
            </div>
            <div>
              <Label>Domínio IXC</Label>
              <Input value={form.dominio_ixc || ""} onChange={set("dominio_ixc")} placeholder="ex.: suaempresa.ixcsoft.com.br" />
              <Help>Caso gerenciador seja IXCSOFT</Help>
            </div>
          </FieldRow>

          <div>
            <Label>Chave API gerenciador</Label>
            <div className="relative">
              <Input
                value={form.chave_api_gerenciador || ""}
                onChange={set("chave_api_gerenciador")}
                type={showChave ? "text" : "password"}
                placeholder="Token de integração"
              />
              <button
                type="button"
                onClick={() => setShowChave(!showChave)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-sub transition-colors"
              >
                {showChave ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Help>Usada para o app buscar faturas, consumo e dados cadastrais do cliente.</Help>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm
            hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
