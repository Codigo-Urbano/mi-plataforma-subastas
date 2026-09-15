
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorito(subastaId: string, currentPath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesion para agregar a favoritos." };
  }

  // Comprobar si ya es favorito
  const { data: existente } = await supabase
    .from("favoritos")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("subasta_id", subastaId)
    .single();

  if (existente) {
    // Eliminar favorito
    const { error } = await supabase
      .from("favoritos")
      .delete()
      .eq("id", existente.id);
    
    if (error) return { error: "No se pudo eliminar de favoritos." };
  } else {
    // Agregar favorito
    const { error } = await supabase
      .from("favoritos")
      .insert({
        usuario_id: user.id,
        subasta_id: subastaId
      });
      
    if (error) return { error: "No se pudo agregar a favoritos." };
  }

  revalidatePath(currentPath);
  return { success: true, isFavorito: !existente };
}

export async function obtenerIdsFavoritos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("favoritos")
    .select("subasta_id")
    .eq("usuario_id", user.id);

  return data?.map(f => f.subasta_id) || [];
}

