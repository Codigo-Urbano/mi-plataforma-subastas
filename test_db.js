
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(".env.local", "utf-8").split("\n").reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/"/g, "").trim();
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Comprobando subastas finalizadas que sigan activas...");
  const { data: subastas, error: errSub } = await supabase
    .from("subastas")
    .select("id, titulo, estado, fecha_fin")
    .eq("estado", "activa")
    .lt("fecha_fin", new Date().toISOString());
  
  if (errSub) console.error("Error subastas:", errSub);
  console.log("Subastas finalizadas pero activas:", subastas);

  console.log("\nProbando foreign key en pujas...");
  const { data: pujas, error: errPujas } = await supabase
    .from("pujas")
    .select("comprador_id, monto, perfiles!inner(email)")
    .limit(1);
    
  if (errPujas) console.error("Error pujas:", errPujas);
  console.log("Pujas test:", JSON.stringify(pujas, null, 2));
}

test();

