
async function main() {
  const url = "https://qphayejiiatqcbknoltd.supabase.co/rest/v1/";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGF5ZWppaWF0cWNia25vbHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA0OTU2NiwiZXhwIjoyMTAyNjI1NTY2fQ.OGwFD0YmNyR0tKaVZYWBg65x-uDIAuhxZPHElUdytqI";
  
  const pgQuery = `
    -- 1. Agregar columnas a la tabla perfiles
    ALTER TABLE perfiles 
      ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pendiente' CHECK (kyc_status IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
      ADD COLUMN IF NOT EXISTS kyc_doc_frente text,
      ADD COLUMN IF NOT EXISTS kyc_doc_dorso text,
      ADD COLUMN IF NOT EXISTS kyc_selfie text;

    -- 2. Crear bucket privado para documentos
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('kyc_documentos', 'kyc_documentos', false)
    ON CONFLICT (id) DO NOTHING;
  `;
  
  // Try to use rpc function "exec_sql" if it exists from previous scripts (often people add an exec_sql for this)
  const res = await fetch(url + "rpc/exec_sql", {
    method: "POST",
    headers: {
      "apikey": key,
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: pgQuery })
  });
  
  console.log(res.status, await res.text());
}
main();

