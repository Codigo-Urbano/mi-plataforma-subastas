"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function enviarMensajeContacto(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const motivo = formData.get("motivo") as string;
  const mensaje = formData.get("mensaje") as string;

  if (!nombre || !email || !motivo || !mensaje) {
    return { error: "Todos los campos son obligatorios" };
  }

  const supabase = await createClient();

  // 1. Guardar en base de datos
  const { error: dbError } = await supabase.from("mensajes_contacto").insert({
    nombre,
    email,
    motivo,
    mensaje
  });

  if (dbError) {
    console.error("Error guardando contacto:", dbError);
    return { error: "No se pudo enviar el mensaje. Intenta más tarde." };
  }

  // 2. Enviar email de notificación al Admin
  try {
    await resend.emails.send({
      from: 'Subastas Pro <notificaciones@subastas-pro.com>',
      to: ['codigo.urbano.solutions@gmail.com'], // Siempre al admin principal
      subject: `[${motivo}] Nuevo mensaje de ${nombre}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Motivo:</strong> ${motivo}</p>
        <br/>
        <p><strong>Mensaje:</strong></p>
        <p>${mensaje.replace(/\n/g, '<br/>')}</p>
      `
    });
  } catch (error) {
    console.error("Error enviando email al admin:", error);
    // No devolvemos error al usuario si falla el email, porque ya se guardó en la DB
  }

  return { success: true };
}
