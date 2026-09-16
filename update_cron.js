
const fs = require("fs");
let content = fs.readFileSync("src/app/api/cron/finalizar-subastas/route.ts", "utf8");

content = content.replace(
  `      await supabase\n        .from("subastas")\n        .update({ estado: "finalizada" })\n        .eq("id", subasta.id);`,
  `      await supabase\n        .from("subastas")\n        .update({\n          estado: "finalizada",\n          post_estado: pujaGanadora ? "pendiente_pago" : null\n        })\n        .eq("id", subasta.id);`
);

fs.writeFileSync("src/app/api/cron/finalizar-subastas/route.ts", content, "utf8");

