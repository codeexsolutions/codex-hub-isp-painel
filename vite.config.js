import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mesmo padrão do synk-app: identificador único do build, usado pelo painel
// instalado (PWA) pra detectar que existe uma versão nova no servidor e
// avisar o provedor a recarregar — sem isso, o painel instalado pode
// continuar rodando o bundle antigo indefinidamente.
const buildId = String(Date.now());

function versionFilePlugin() {
  return {
    name: "write-version-file",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      fs.writeFileSync(path.join(outDir, "version.json"), JSON.stringify({ buildId }));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFilePlugin()],
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
});
