
const fs = require("fs");
let content = fs.readFileSync("src/app/subastas/[id]/page.tsx", "utf8");

// Buscamos donde inyectamos isWinner y agregamos isLiderActual
const queryTope = `
  let topeMaximoActual = null;
  if (isWinner && subasta.estado === "activa") {
    const { data: topeData } = await supabase
      .from("ofertas_automaticas")
      .select("monto_maximo")
      .eq("subasta_id", subasta.id)
      .eq("comprador_id", user?.id)
      .single();
    if (topeData) {
      topeMaximoActual = topeData.monto_maximo;
    }
  }
`;

if (!content.includes("topeMaximoActual")) {
  content = content.replace(
    `const isWinner = pujaGanadora?.comprador_id === user?.id;`,
    `const isWinner = pujaGanadora?.comprador_id === user?.id;\n${queryTope}`
  );
}

const uiTope = `
            {subasta.estado === "activa" && isWinner && topeMaximoActual && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl mt-4 text-emerald-600 flex items-center gap-3">
                <div className="text-xl">??</div>
                <div>
                  <h4 className="font-bold text-sm">Eres el líder actual</h4>
                  <p className="text-xs opacity-90">El sistema defiende tu posición automáticamente hasta un tope de <strong>\${topeMaximoActual.toLocaleString("es-AR")}</strong>.</p>
                </div>
              </div>
            )}
`;

if (!content.includes("Eres el líder actual")) {
  content = content.replace(
    `<ConsolaPuja`,
    `${uiTope}\n            <ConsolaPuja`
  );
}

fs.writeFileSync("src/app/subastas/[id]/page.tsx", content, "utf8");

