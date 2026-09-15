"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createAuction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes estar autenticado para crear una subasta." };
  }

  // Verificar estado del perfil
  const { data: perfil } = await supabase.from("perfiles").select("estado").eq("id", user.id).single();
  if (perfil?.estado === "suspendido") {
    return { error: "Tu cuenta se encuentra suspendida. No puedes publicar subastas." };
  }

  const titulo = formData.get("titulo") as string;
  const categoria = formData.get("categoria") as string;
  const descripcion = formData.get("descripcion") as string;
  const precio_base = parseFloat(formData.get("precio_base") as string);
  const fecha_fin = formData.get("fecha_fin") as string;
  const anti_sniper = formData.get("anti_sniper") === "on";
  const imagenes = formData.getAll("imagen") as File[];
  const validImagenes = imagenes.filter(img => img.size > 0).slice(0, 5); // Máximo 5 imágenes

  if (!titulo || !categoria || isNaN(precio_base) || !fecha_fin) {
    return { error: "Faltan campos obligatorios." };
  }

  // Validación Fuerte: La subasta no puede durar más de 30 días
  const limiteMaximoMs = Date.now() + (30 * 24 * 60 * 60 * 1000);
  const fechaIngresadaMs = new Date(fecha_fin).getTime();

  if (fechaIngresadaMs > limiteMaximoMs) {
    return { error: "La subasta no puede exceder el límite máximo de 30 días." };
  }

  let imagenesUrls: string[] = [];
  let imagen_url = null; // Para retrocompatibilidad

  for (const imagen of validImagenes) {
    const fileExt = imagen.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("productos")
      .upload(fileName, imagen);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Error al subir una de las imágenes." };
    }

    const { data: publicUrlData } = supabase.storage
      .from("productos")
      .getPublicUrl(fileName);

    imagenesUrls.push(publicUrlData.publicUrl);
  }

  if (imagenesUrls.length > 0) {
    imagen_url = imagenesUrls[0]; // La primera es la principal para código viejo
  }

  const { data, error: insertError } = await supabase.from("subastas").insert([
    {
      vendedor_id: user.id,
      titulo,
      categoria,
      descripcion,
      precio_base,
      precio_actual: precio_base,
      fecha_fin: new Date(fecha_fin).toISOString(),
      anti_sniper,
      imagen_url, // Legacy
      imagenes: imagenesUrls, // Nuevo array
      estado: "pendiente_pago",
    },
  ]).select().single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return { error: "Error al guardar la subasta en la base de datos." };
  }

  // Devolvemos el ID de la subasta para que el cliente redirija a MercadoPago
  return { success: true, subastaId: data.id };
}
