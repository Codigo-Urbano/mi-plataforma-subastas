
const fs = require("fs");
let content = fs.readFileSync("src/app/subastas/[id]/ConsolaPuja.tsx", "utf8");

const minBidLogic = `
  // Proxy Bidding dynamic increment logic for the UI
  const getMinIncrement = (current: number) => {
    if (current < 10000) return 500;
    if (current < 50000) return 1000;
    if (current < 200000) return 2500;
    if (current < 1000000) return 10000;
    return 25000;
  };
  
  const minRequiredTope = precioActual === precioBase ? precioBase : precioActual + getMinIncrement(precioActual);
`;

if (!content.includes("getMinIncrement")) {
  content = content.replace(
    `  return (\n    <div className="bg-background/80`,
    minBidLogic + `\n  return (\n    <div className="bg-background/80`
  );
}

const oldInput = `<div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                name="monto"
                required
                min={precioActual + 1}
                step="1"
                placeholder={\`Mínimo $\${(precioActual + 1).toLocaleString("es-AR")}\`}
                className="w-full pl-8 pr-4 py-3 bg-secondary/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground font-bold px-8 rounded-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? "Procesando..." : "Pujar"}
            </button>
          </div>`;

const newInput = `<div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <input
                  type="number"
                  name="monto"
                  required
                  min={minRequiredTope}
                  step="1"
                  placeholder={\`Ej. $\${(minRequiredTope + getMinIncrement(minRequiredTope)).toLocaleString("es-AR")}\`}
                  className="w-full pl-8 pr-4 py-3 bg-secondary/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground font-bold px-8 rounded-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
              >
                {isPending ? "Enviando..." : "Fijar Tope"}
              </button>
            </div>
            <div className="text-xs text-muted-foreground/80 mt-1 px-1">
              Ingresa el <strong>monto máximo</strong> que estás dispuesto a pagar. El sistema pujará por ti automáticamente en incrementos de $\\{getMinIncrement(precioActual).toLocaleString("es-AR")\\} solo si alguien intenta superarte. <strong className="text-primary/70">Tu tope es 100% secreto.</strong>
            </div>
            <div className="text-xs font-medium mt-1 px-1 text-yellow-600/90 dark:text-yellow-400/80">
              Mínimo aceptado por el sistema: $\\{minRequiredTope.toLocaleString("es-AR")\\}
            </div>
          </div>`;

content = content.replace(oldInput, newInput);
fs.writeFileSync("src/app/subastas/[id]/ConsolaPuja.tsx", content, "utf8");

