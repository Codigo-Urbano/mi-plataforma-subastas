
const fs = require("fs");
let content = fs.readFileSync("src/app/subastas/[id]/page.tsx", "utf8");

// The issue is that we injected the JSX banner outside the scope where `subasta`, `isWinner`, and `topeMaximoActual` are defined.
// In Next.js App Router, the `page.tsx` exports the default async function SubastaPage.
// Inside it, it fetches the subasta. 

// We need to inject the banner INSIDE the return statement of SubastaPage.
// We previously injected it before `<ConsolaPuja`. Let us find where it is currently and move it.

const brokenBanner = `            {subasta.estado === "activa" && isWinner && topeMaximoActual && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl mt-4 text-emerald-600 flex items-center gap-3">
                <div className="text-xl">??</div>
                <div>
                  <h4 className="font-bold text-sm">Eres el líder actual</h4>
                  <p className="text-xs opacity-90">El sistema defiende tu posición automáticamente hasta un tope de <strong>\${topeMaximoActual.toLocaleString("es-AR")}</strong>.</p>
                </div>
              </div>
            )}`;

// Remove it from wherever it was wrongly placed
content = content.replace(brokenBanner, "");

// Now let us inject it properly RIGHT ABOVE the ConsolaPuja INSIDE the JSX return
const targetSpot = `<ConsolaPuja\n              subastaId={subasta.id}`;

if (content.includes(targetSpot)) {
  content = content.replace(targetSpot, brokenBanner + "\n            " + targetSpot);
}

fs.writeFileSync("src/app/subastas/[id]/page.tsx", content, "utf8");

