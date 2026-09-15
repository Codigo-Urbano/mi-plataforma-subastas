"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

export async function pujar(subastaId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para pujar." };
  }

  // Verificar si está suspendido
  const { data: perfil } = await supabase.from("perfiles").select("estado, nombre_completo").eq("id", user.id).single();
  if (perfil?.estado === "suspendido") {
    return { error: "Tu cuenta se encuentra suspendida. No puedes realizar pujas." };
  }

  const monto = parseFloat(formData.get("monto") as string);

  if (isNaN(monto)) {
    return { error: "Monto inválido." };
  }

  // Obtener al pujador más alto ANTES de procesar esta nueva puja
  const { data: previousBid } = await supabase
    .from("pujas")
    .select("comprador_id, perfiles(email, nombre_completo)")
    .eq("subasta_id", subastaId)
    .order("monto", { ascending: false })
    .limit(1)
    .single();

  // Llamar a nuestra función segura RPC creada en SQL
  const { error } = await supabase.rpc("procesar_puja", {
    p_subasta_id: subastaId,
    p_monto: monto,
  });

  if (error) {
    console.error("Error al pujar:", error);
    return { error: error.message || "No se pudo procesar la puja." };
  }

  // SI LA PUJA FUE EXITOSA: Enviar email al usuario que fue superado (si existe y no somos nosotros mismos)
  if (previousBid && previousBid.comprador_id !== user.id) {
    try {
      // Obtener el título de la subasta para el correo
      const { data: subasta } = await supabase.from("subastas").select("titulo").eq("id", subastaId).single();
      
      if (subasta && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const emailAnterior = (previousBid.perfiles as any).email;
        const nombreAnterior = (previousBid.perfiles as any).nombre_completo || "Usuario";
        
        await resend.emails.send({
          from: 'Subastas Pro <notificaciones@subastas-pro.com>',
          to: [emailAnterior],
          subject: `¡Han superado tu oferta en: ${subasta.titulo}!`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaeb; border-radius: 10px;">
              <h2 style="color: #d32f2f;">¡Te han superado!</h2>
              <p style="color: #555; line-height: 1.5;">Hola ${nombreAnterior},</p>
              <p style="color: #555; line-height: 1.5;">Alguien acaba de hacer una oferta mayor a la tuya en la subasta <strong>"${subasta.titulo}"</strong>.</p>
              <p style="color: #555; line-height: 1.5;">El nuevo precio actual es de <strong>$${monto.toLocaleString("es-AR")}</strong>.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/subastas/${subastaId}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Pujar de nuevo y recuperar el liderazgo
                </a>
              </div>
            </div>
          `
        });
      }
    } catch (e) {
      console.error("Error enviando email de puja superada:", e);
    }
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

export async function hacerPregunta(subastaId: string, pregunta: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesi�n para preguntar." };

  const { error } = await supabase
    .from("preguntas")
    .insert({
      subasta_id: subastaId,
      comprador_id: user.id,
      pregunta: pregunta.trim()
    });

  if (error) return { error: "Error al enviar la pregunta." };

  revalidatePath("/subastas/" + subastaId);
  return { success: true };
}

export async function responderPregunta(preguntaId: string, subastaId: string, respuesta: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const { data: subasta } = await supabase
    .from("subastas")
    .select("vendedor_id")
    .eq("id", subastaId)
    .single();

  if (subasta?.vendedor_id !== user.id) {
    return { error: "Solo el vendedor puede responder." };
  }

  const { error } = await supabase
    .from("preguntas")
    .update({
      respuesta: respuesta.trim(),
      respondido_en: new Date().toISOString()
    })
    .eq("id", preguntaId);

  if (error) return { error: "Error al enviar la respuesta." };

  revalidatePath("/subastas/" + subastaId);
  return { success: true };
}
