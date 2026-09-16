
const fs = require("fs");
let content = fs.readFileSync("src/app/admin/actions.ts", "utf8");

content += `

// --- SISTEMA DE VERIFICACIÓN (KYC) ---

export async function obtenerSolicitudesKYC() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") throw new Error("No autorizado");

  const { data } = await supabase
    .from("perfiles")
    .select("id, email, nombre_completo, kyc_status, kyc_doc_frente, kyc_doc_dorso, kyc_selfie")
    .eq("kyc_status", "en_revision");
    
  return data || [];
}

export async function aprobarKYC(usuarioId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") throw new Error("No autorizado");

  const { error } = await supabase
    .from("perfiles")
    .update({ kyc_status: "aprobado" })
    .eq("id", usuarioId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function rechazarKYC(usuarioId: string, motivo: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") throw new Error("No autorizado");

  // Al rechazar, limpiamos las fotos para que suban unas nuevas
  const { error } = await supabase
    .from("perfiles")
    .update({ 
      kyc_status: "rechazado",
      kyc_doc_frente: null,
      kyc_doc_dorso: null,
      kyc_selfie: null
    })
    .eq("id", usuarioId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
`;
fs.writeFileSync("src/app/admin/actions.ts", content, "utf8");

