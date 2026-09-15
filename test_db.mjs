
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
    .select("comprador_id, monto, perfiles(email)")
    .limit(1);
    
  if (errPujas) console.error("Error pujas:", errPujas);
  console.log("Pujas test:", JSON.stringify(pujas, null, 2));
}

test();

