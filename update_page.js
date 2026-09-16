
const fs = require("fs");
let content = fs.readFileSync("src/app/subastas/[id]/page.tsx", "utf8");

// Import PanelSeguimiento
if (!content.includes("PanelSeguimiento")) {
  content = content.replace(
    `import GaleriaImagenes from "./GaleriaImagenes";`,
    `import GaleriaImagenes from "./GaleriaImagenes";\nimport PanelSeguimiento from "./PanelSeguimiento";`
  );
}

// Add post_estado to the select
if (!content.includes("post_estado")) {
  content = content.replace(
    `.select(\`\n      *,\n      vendedor:perfiles!subastas_vendedor_id_fkey(*)\n    \`)`,
    `.select(\`\n      *,\n      vendedor:perfiles!subastas_vendedor_id_fkey(*),\n      post_estado\n    \`)`
  );
}

// Ensure pujas are fetched correctly and we get the winner
// Looking for: const isVendedor = subasta.vendedor_id === user?.id;
const isVendedorMatch = `const isVendedor = subasta.vendedor_id === user?.id;`;

if (!content.includes("const isWinner")) {
  content = content.replace(
    isVendedorMatch,
    `const isVendedor = subasta.vendedor_id === user?.id;\n  \n  const { data: pujaGanadora } = await supabase\n    .from("pujas")\n    .select("comprador_id, comprador:perfiles!pujas_comprador_id_fkey(nombre_completo, email, telefono)")\n    .eq("subasta_id", subasta.id)\n    .order("monto", { ascending: false })\n    .limit(1)\n    .single();\n\n  const isWinner = pujaGanadora?.comprador_id === user?.id;\n  \n  let contraparte = null;\n  if (subasta.estado === "finalizada") {\n    if (isVendedor && pujaGanadora) contraparte = pujaGanadora.comprador;\n    if (isWinner) contraparte = subasta.vendedor;\n  }`
  );
}

// Render PanelSeguimiento
if (!content.includes("<PanelSeguimiento")) {
  // We place it right after ConsolaPuja
  content = content.replace(
    `<ConsolaPuja\n              subastaId={subasta.id}\n              precioActual={subasta.precio_actual}\n              estado={subasta.estado}\n              precioBase={subasta.precio_base}\n              userId={user?.id}\n            />`,
    `<ConsolaPuja\n              subastaId={subasta.id}\n              precioActual={subasta.precio_actual}\n              estado={subasta.estado}\n              precioBase={subasta.precio_base}\n              userId={user?.id}\n            />\n\n            {subasta.estado === "finalizada" && subasta.post_estado && (isVendedor || isWinner) && (\n              <PanelSeguimiento \n                subastaId={subasta.id} \n                estadoActual={subasta.post_estado as any} \n                isSeller={isVendedor} \n                isWinner={isWinner} \n                contraparte={contraparte as any} \n              />\n            )}`
  );
}

fs.writeFileSync("src/app/subastas/[id]/page.tsx", content, "utf8");

