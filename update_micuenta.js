
const fs = require("fs");

let actions = fs.readFileSync("src/app/mi-cuenta/actions.ts", "utf8");

if (!actions.includes("solicitarKYC")) {
  actions += `
// --- VERIFICACIÓN DE IDENTIDAD (KYC) ---

export async function solicitarKYC(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const docFrente = formData.get("docFrente") as File;
  const docDorso = formData.get("docDorso") as File;
  const selfie = formData.get("selfie") as File;

  if (!docFrente || !docDorso || !selfie || docFrente.size === 0 || docDorso.size === 0 || selfie.size === 0) {
    throw new Error("Debes proporcionar las 3 imágenes requeridas.");
  }

  // Helper para subir archivo y obtener la URL
  const uploadFile = async (file: File, suffix: string) => {
    const ext = file.name.split(".").pop();
    const fileName = \`\${user.id}/\${Date.now()}_\${suffix}.\${ext}\`;
    
    const { data, error } = await supabase.storage
      .from("kyc_documentos")
      .upload(fileName, file, { upsert: true });
      
    if (error) throw new Error(\`Error subiendo \${suffix}: \${error.message}\`);
    
    // Obtener URL pública (aunque el bucket es privado, para el admin usaremos una URL firmada o renderizado directo si tiene permisos RLS)
    // Supabase permite acceder a objetos privados si el usuario está autenticado y pasa las RLS.
    // Usaremos la URL de endpoint genérico que luego es evaluada por RLS.
    return \`\${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/kyc_documentos/\${data.path}\`;
  };

  const urlFrente = await uploadFile(docFrente, "frente");
  const urlDorso = await uploadFile(docDorso, "dorso");
  const urlSelfie = await uploadFile(selfie, "selfie");

  const { error: updateError } = await supabase
    .from("perfiles")
    .update({
      kyc_status: "en_revision",
      kyc_doc_frente: urlFrente,
      kyc_doc_dorso: urlDorso,
      kyc_selfie: urlSelfie
    })
    .eq("id", user.id);

  if (updateError) throw new Error(updateError.message);
  
  revalidatePath("/mi-cuenta");
}
`;
  fs.writeFileSync("src/app/mi-cuenta/actions.ts", actions, "utf8");
}

