
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const url = "https://qphayejiiatqcbknoltd.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGF5ZWppaWF0cWNia25vbHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA0OTU2NiwiZXhwIjoyMTAyNjI1NTY2fQ.OGwFD0YmNyR0tKaVZYWBg65x-uDIAuhxZPHElUdytqI";
  const supabase = createClient(url, key);

  console.log("Creando bucket kyc_documentos...");
  const { data, error } = await supabase.storage.createBucket("kyc_documentos", { public: false });
  if (error) console.log("Bucket ya existe o error:", error.message);
  else console.log("Bucket creado:", data);
}
main();

