"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateAuction(subastaId: string, prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const { data: auction } = await supabase.from("subastas").select("*").eq("id", subastaId).single();
  if (!auction || auction.vendedor_id !== user.id) return { error: "No eres el due�o de esta subasta." };

  const titulo = formData.get("titulo") as string;
  const categoria = formData.get("categoria") as string;
  const descripcion = formData.get("descripcion") as string;
  const anti_sniper = formData.get("anti_sniper") === "on";

  const updateData: any = {
    titulo,
    categoria,
    descripcion,
    anti_sniper
  };

  const { count } = await supabase.from("pujas").select("*", { count: "exact", head: true }).eq("subasta_id", subastaId);
  const tienePujas = count ? count > 0 : false;

  if (!tienePujas) {
    const precio_base = parseFloat(formData.get("precio_base") as string);
    if (!isNaN(precio_base)) {
      updateData.precio_base = precio_base;
      updateData.precio_actual = precio_base;
    }

    const fecha_fin = formData.get("fecha_fin") as string;
    const tz_offset = parseInt(formData.get("tz_offset") as string) || 0;
    if (fecha_fin) {
      const [datePart, timePart] = fecha_fin.split("T");
      const isoString = `${datePart}T${timePart}:00.000Z`;
      const parsedUtcMs = new Date(isoString).getTime();
      const trueUtcMs = parsedUtcMs + (tz_offset * 60000);
      updateData.fecha_fin = new Date(trueUtcMs).toISOString();
    }
  }

  const imagenes = formData.getAll("imagen") as File[];
  const validImagenes = imagenes.filter(img => img.size > 0).slice(0, 5);

  if (validImagenes.length > 0) {
    let imagenesUrls = [];
    for (const imagen of validImagenes) {
      const fileExt = imagen.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("productos").upload(fileName, imagen);
      if (uploadError) return { error: "Error al subir una de las im�genes." };
      const { data: publicUrlData } = supabase.storage.from("productos").getPublicUrl(fileName);
      imagenesUrls.push(publicUrlData.publicUrl);
    }
    updateData.imagenes = imagenesUrls;
    updateData.imagen_url = imagenesUrls[0];
  }

  const { error: updateError } = await supabase.from("subastas").update(updateData).eq("id", subastaId);
  if (updateError) return { error: "Error al actualizar la subasta." };

  revalidatePath(`/subastas/${subastaId}`);
  revalidatePath(`/`);
  
  redirect(`/subastas/${subastaId}`);
}
