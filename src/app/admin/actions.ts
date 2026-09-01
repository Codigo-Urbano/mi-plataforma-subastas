"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Verifica si el usuario actual es admin
async function checkIsAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  return data?.rol === "admin";
}

// Obtener todos los usuarios y sus datos (Para el dashboard de admin)
export async function obtenerTodosUsuarios() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("No autorizado");

  const supabase = await createClient();
  
  // Traemos los perfiles
  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw error;

  // Calculamos la reputación para cada uno (esto se podría optimizar con una vista compleja, pero para empezar está bien)
  const usuariosConReputacion = await Promise.all(
    perfiles.map(async (p) => {
      const { data: rep } = await supabase
        .from("vista_reputacion")
        .select("promedio_estrellas, total_resenas")
        .eq("perfil_id", p.id)
        .single();
        
      return {
        ...p,
        promedio: rep ? Number(rep.promedio_estrellas) : 0,
        totalResenas: rep ? Number(rep.total_resenas) : 0,
      };
    })
  );

  return usuariosConReputacion;
}

import { createAdminClient } from "@/utils/supabase/admin";

// Cambiar estado de un usuario (Activar o Suspender)
export async function cambiarEstadoUsuario(usuarioId: string, nuevoEstado: "activo" | "suspendido", razon: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("No autorizado");

  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) throw new Error("No autorizado");

  // Usamos el cliente Admin (Service Role) para saltarnos el RLS que bloquea editar perfiles ajenos
  const supabaseAdmin = createAdminClient();

  // 1. Actualizar el estado en el perfil
  const { error: updateError } = await supabaseAdmin
    .from("perfiles")
    .update({ estado: nuevoEstado })
    .eq("id", usuarioId);

  if (updateError) {
    console.error("Error actualizando perfil:", updateError);
    throw updateError;
  }

  // 2. Registrar en auditoría
  const accion = nuevoEstado === "suspendido" ? "SUSPENDER" : "REACTIVAR";
  const { error: auditError } = await supabaseAdmin
    .from("auditoria_admin")
    .insert({
      admin_id: adminUser.id,
      usuario_id: usuarioId,
      accion,
      razon
    });

  if (auditError) {
    console.error("Error insertando auditoria:", auditError);
    throw auditError;
  }

  revalidatePath("/admin");
  return { success: true };
}

// Obtener historial de un usuario
export async function obtenerHistorialAuditoria(usuarioId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("No autorizado");

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("auditoria_admin")
    .select("*, admin:perfiles!admin_id(email, nombre_completo)")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return data;
}

// Obtener Configuración
export async function obtenerConfiguracion() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracion_sistema")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error obteniendo configuracion:", error);
    return null;
  }
  return data;
}

// Actualizar Configuración
export async function actualizarConfiguracion(formData: FormData) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("No autorizado");

  const comision_minima = parseFloat(formData.get("comision_minima") as string);
  const escala_1_tope = parseFloat(formData.get("escala_1_tope") as string);
  const escala_1_porcentaje = parseFloat(formData.get("escala_1_porcentaje") as string) / 100;
  const escala_2_tope = parseFloat(formData.get("escala_2_tope") as string);
  const escala_2_porcentaje = parseFloat(formData.get("escala_2_porcentaje") as string) / 100;
  const escala_3_porcentaje = parseFloat(formData.get("escala_3_porcentaje") as string) / 100;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("configuracion_sistema")
    .update({
      comision_minima,
      escala_1_tope,
      escala_1_porcentaje,
      escala_2_tope,
      escala_2_porcentaje,
      escala_3_porcentaje,
      actualizado_en: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) throw error;
  revalidatePath("/admin");
  return { success: true };
}
