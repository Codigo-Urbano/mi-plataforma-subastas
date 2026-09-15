
const fs = require("fs");
const envFile = fs.readFileSync(".env.local", "utf8");
let url = "";
let key = "";
envFile.split("\n").forEach(line => {
  if(line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) url = line.split("=")[1].trim();
  if(line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) key = line.split("=")[1].trim();
});

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(url, key);

supabase.from("subastas").select("id, titulo, fecha_fin, creado_en").order("creado_en", { ascending: false }).limit(2).then(res => {
  console.log(JSON.stringify(res.data, null, 2));
});

