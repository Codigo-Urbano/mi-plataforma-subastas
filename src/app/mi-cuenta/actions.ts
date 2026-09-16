
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
    const fileName = `${user.id}/${Date.now()}_${suffix}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from("kyc_documentos")
      .upload(fileName, file, { upsert: true });
      
    if (error) throw new Error(`Error subiendo ${suffix}: ${error.message}`);
    
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/kyc_documentos/${data.path}`;
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

