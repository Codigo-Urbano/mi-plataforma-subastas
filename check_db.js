
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

supabase.from("subastas")
  .select("id, titulo, fecha_fin, estado")
  .order("creado_en", { ascending: false })
  .limit(5)
  .then(res => {
    console.log("SUBASTAS:", res.data);
  });

