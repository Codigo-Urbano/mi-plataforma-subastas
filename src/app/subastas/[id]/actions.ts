"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function pujar(subastaId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para pujar." };
  }

  // Verificar si está suspendido
  const { data: perfil } = await supabase.from("perfiles").select("estado").eq("id", user.id).single();
  if (perfil?.estado === "suspendido") {
    return { error: "Tu cuenta se encuentra suspendida. No puedes realizar pujas." };
  }

  const monto = parseFloat(formData.get("monto") as string);

  if (isNaN(monto)) {
    return { error: "Monto inválido." };
  }

  // Llamar a nuestra función segura RPC creada en SQL
  const { error } = await supabase.rpc("procesar_puja", {
    p_subasta_id: subastaId,
    p_monto: monto,
  });

  if (error) {
    console.error("Error al pujar:", error);
    return { error: error.message || "No se pudo procesar la puja." };
  }

  revalidatePath(`/subastas/${subastaId}`);
  return { success: true };
}

export async function verificarGanador(subastaId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isGanador: false };
  }

  const { data: pujas } = await supabase
    .from("pujas")
    .select("comprador_id")
    .eq("subasta_id", subastaId)
    .order("monto", { ascending: false })
    .limit(1);

  if (pujas && pujas.length > 0 && pujas[0].comprador_id === user.id) {
    return { isGanador: true };
  }

  return { isGanador: false };
}

export async function obtenerDatosContacto(subastaId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Obtener la subasta
  const { data: subasta } = await supabase
    .from("subastas")
    .select("vendedor_id")
    .eq("id", subastaId)
    .single();

  if (!subasta) return null;

  // Obtener el ganador
  const { data: pujas } = await supabase
    .from("pujas")
    .select("comprador_id")
    .eq("subasta_id", subastaId)
    .order("monto", { ascending: false })
    .limit(1);

  const ganadorId = pujas && pujas.length > 0 ? pujas[0].comprador_id : null;

  // Si soy el ganador, quiero ver los datos del vendedor
  if (user.id === ganadorId) {
    const { data: vendedor } = await supabase
      .from("perfiles")
      .select("id, nombre_completo, telefono, email")
      .eq("id", subasta.vendedor_id)
      .single();
    
    return { 
      rol: "comprador",
      contacto: vendedor 
    };
  }
  
  // Si soy el vendedor, quiero ver los datos del ganador
  if (user.id === subasta.vendedor_id && ganadorId) {
    const { data: ganador } = await supabase
      .from("perfiles")
      .select("id, nombre_completo, telefono, email")
      .eq("id", ganadorId)
      .single();
      
    return {
      rol: "vendedor",
      contacto: ganador
    };
  }

  return null;
}

export async function enviarCalificacion(
  subastaId: string,
  evaluadoId: string,
  rolEvaluador: "comprador" | "vendedor",
  puntuacion: number,
  comentario: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("calificaciones")
    .insert({
      subasta_id: subastaId,
      evaluador_id: user.id,
      evaluado_id: evaluadoId,
      rol_evaluador: rolEvaluador,
      puntuacion,
      comentario,
    });

  if (error) {
    if (error.code === '23505') { // Código de unique_violation en PostgreSQL
      return { error: "Ya has calificado esta subasta." };
    }
    console.error("Error insertando calificación:", error);
    return { error: "Error al enviar la calificación." };
  }

  return { success: true };
}

export async function verificarSiYaCalifico(subastaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("calificaciones")
    .select("id")
    .eq("subasta_id", subastaId)
    .eq("evaluador_id", user.id)
    .single();

  return !!data;
}

export async function obtenerPromedioCalificacion(perfilId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("vista_reputacion")
    .select("promedio_estrellas, total_resenas")
    .eq("perfil_id", perfilId)
    .single();

  if (error || !data) {
    return { promedio: 0, total: 0 };
  }

  return { 
    promedio: Number(data.promedio_estrellas), 
    total: Number(data.total_resenas) 
  };
}
