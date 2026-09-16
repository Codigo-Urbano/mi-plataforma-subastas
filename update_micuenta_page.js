
const fs = require("fs");

let content = fs.readFileSync("src/app/mi-cuenta/page.tsx", "utf8");

// Importar ShieldCheck si no está
if (!content.includes("ShieldCheck")) {
  content = content.replace(
    /import \{([^}]+)\} from "lucide-react";/,
    `import {$1, ShieldCheck, Upload} from "lucide-react";`
  );
}

// Asegurarse de tener importado el Componente de Formulario KYC (lo crearemos aparte para usar UseClient si necesitamos hooks)
if (!content.includes("FormularioKYC")) {
  content = content.replace(
    /import Link from "next\/link";/,
    `import Link from "next/link";\nimport FormularioKYC from "./FormularioKYC";`
  );
}

// Agregar el estado kyc_status a la consulta del perfil
if (!content.includes("kyc_status")) {
  content = content.replace(
    /.select\("nickname, nombre_completo, telefono, avatar_url, estado"\)/,
    `.select("nickname, nombre_completo, telefono, avatar_url, estado, kyc_status")`
  );
}

// Inyectar la sección KYC en el renderizado
const kycBlock = `
        {/* Verificación de Identidad (KYC) */}
        <div className="md:col-span-3 glass p-6 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Verificación de Identidad</h2>
              <p className="text-sm text-muted-foreground">Obtén la insignia de usuario verificado.</p>
            </div>
          </div>
          
          <FormularioKYC kycStatus={perfil?.kyc_status} />
        </div>
`;

if (!content.includes("Verificación de Identidad")) {
  // Inyectar antes del cierre del main grid (buscar el último cierre div)
  content = content.replace(
    /(\s*)<\/div>\s*<\/div>\s*\)\s*;\s*}/,
    `\n${kycBlock}$1</div>\n    </div>\n  );\n}`
  );
}

fs.writeFileSync("src/app/mi-cuenta/page.tsx", content, "utf8");

