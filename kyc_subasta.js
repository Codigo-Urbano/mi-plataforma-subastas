
const fs = require("fs");

// 1. Añadir Badge a SubastaCard.tsx
let cardContent = fs.readFileSync("src/components/SubastaCard.tsx", "utf8");
if (!cardContent.includes("BadgeCheck")) {
  cardContent = cardContent.replace(
    /import { ([^}]+) } from "lucide-react";/,
    `import { $1, BadgeCheck } from "lucide-react";`
  );
  // Buscar donde se muestra el vendedor y agregar el badge de verificado
  cardContent = cardContent.replace(
    /vendedor:perfiles!subastas_vendedor_id_fkey\([^)]+\)/,
    `vendedor:perfiles!subastas_vendedor_id_fkey(nickname, kyc_status)`
  );
  
  // Agregar el badge visual al lado del nombre del vendedor si está aprobado
  // Actualizamos cómo se renderiza el nickname
  cardContent = cardContent.replace(
    /<span className="text-sm font-medium">@{vendedorNickname}<\/span>/,
    `<span className="text-sm font-medium flex items-center gap-1">@{vendedorNickname} {(auction.vendedor as any)?.kyc_status === "aprobado" && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}</span>`
  );
  fs.writeFileSync("src/components/SubastaCard.tsx", cardContent, "utf8");
}

// 2. Añadir Badge a ConsolaPuja.tsx
let consolaContent = fs.readFileSync("src/app/subastas/[id]/ConsolaPuja.tsx", "utf8");
if (!consolaContent.includes("BadgeCheck")) {
  consolaContent = consolaContent.replace(
    /import { ([^}]+) } from "lucide-react";/,
    `import { $1, BadgeCheck } from "lucide-react";`
  );
  
  // Modificar la vista de pujas para mostrar verificación
  consolaContent = consolaContent.replace(
    /<span className="font-medium">@{puja.comprador\?\.nickname \|\| "Usuario"}<\/span>/g,
    `<span className="font-medium flex items-center gap-1">@{puja.comprador?.nickname || "Usuario"} {(puja.comprador as any)?.kyc_status === "aprobado" && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}</span>`
  );
  fs.writeFileSync("src/app/subastas/[id]/ConsolaPuja.tsx", consolaContent, "utf8");
}

