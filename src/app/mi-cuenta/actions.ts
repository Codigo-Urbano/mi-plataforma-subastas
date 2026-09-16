
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function solicitarKYC(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const docFrente = formData.get("docFrente") as File;
    const docDorso = formData.get("docDorso") as File;
    const selfie = formData.get("selfie") as File;

    if (!docFrente || !docDorso || !selfie || docFrente.size === 0 || docDorso.size === 0 || selfie.size === 0) {
      return { success: false, error: "Debes proporcionar las 3 imágenes requeridas." };
    }

    // Vercel Serverless Functions have a maximum execution time (usually 10s on hobby plan).
    // Uploading 3 large files sequentially could exceed this. Let us do it concurrently.
    const uploadFile = async (file: File, suffix: string) => {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}_${suffix}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from("kyc_documentos")
        .upload(fileName, file, { upsert: true });
        
      if (error) throw new Error(`Error al subir imagen ${suffix}: ${error.message}`);
      
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/kyc_documentos/${data.path}`;
    };

    // Subir en paralelo
    const [urlFrente, urlDorso, urlSelfie] = await Promise.all([
      uploadFile(docFrente, "frente"),
      uploadFile(docDorso, "dorso"),
      uploadFile(selfie, "selfie")
    ]);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({
        kyc_status: "en_revision",
        kyc_doc_frente: urlFrente,
        kyc_doc_dorso: urlDorso,
        kyc_selfie: urlSelfie
      })
      .eq("id", user.id);

    if (updateError) return { success: false, error: updateError.message };
    
    revalidatePath("/mi-cuenta");
    return { success: true };

  } catch (err: any) {
    console.error("Error en solicitarKYC:", err);
    return { success: false, error: err.message || "Error inesperado al procesar documentos" };
  }
}

