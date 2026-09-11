import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    const { data: subastasFinalizadas, error: errSubastas } = await supabase
      .from("subastas")
      .select("id, titulo, vendedor_id, precio_actual")
      .eq("estado", "activa")
      .lt("fecha_fin", new Date().toISOString());

    if (errSubastas) {
      throw new Error("Error consultando subastas: " + errSubastas.message);
    }

    if (!subastasFinalizadas || subastasFinalizadas.length === 0) {
      return NextResponse.json({ success: true, mensaje: "No hay subastas nuevas para finalizar." });
    }

    let emailsEnviados = 0;
    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const subasta of subastasFinalizadas) {
      const { data: pujaGanadora } = await supabase
        .from("pujas")
        .select("comprador_id, monto")
        .eq("subasta_id", subasta.id)
        .order("monto", { ascending: false })
        .limit(1)
        .single();

      if (pujaGanadora) {
        const { data: vendedor } = await supabase
          .from("perfiles")
          .select("email, nombre_completo, telefono")
          .eq("id", subasta.vendedor_id)
          .single();

        const { data: comprador } = await supabase
          .from("perfiles")
          .select("email, nombre_completo, telefono")
          .eq("id", pujaGanadora.comprador_id)
          .single();

        if (vendedor && comprador && process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: "Subastas Pro <notificaciones@subastas-pro.com>",
            to: [vendedor.email],
            subject: `¡Tu subasta "${subasta.titulo}" ha finalizado con éxito!`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaeb; border-radius: 10px;">
                <h2 style="color: #2e7d32;">¡Felicidades ${vendedor.nombre_completo || "Vendedor"}!</h2>
                <p style="color: #555; line-height: 1.5;">Tu subasta <strong>"${subasta.titulo}"</strong> ha concluido exitosamente con un precio final de <strong>$${pujaGanadora.monto.toLocaleString("es-AR")}</strong>.</p>
                <h3 style="color: #333; margin-top: 25px;">Datos del Ganador:</h3>
                <ul style="color: #555; line-height: 1.8; background: #f9f9f9; padding: 15px 35px; border-radius: 5px;">
                  <li><strong>Nombre:</strong> ${comprador.nombre_completo || "No especificado"}</li>
                  <li><strong>Email:</strong> ${comprador.email}</li>
                  <li><strong>Teléfono / WhatsApp:</strong> ${comprador.telefono || "No especificado"}</li>
                </ul>
                <p style="color: #555; line-height: 1.5; margin-top: 20px;">Por favor, contáctate con el ganador para coordinar el pago y la entrega del producto.</p>
              </div>
            `
          });

          await resend.emails.send({
            from: "Subastas Pro <notificaciones@subastas-pro.com>",
            to: [comprador.email],
            subject: `¡Eres el ganador de: ${subasta.titulo}!`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaeb; border-radius: 10px;">
                <h2 style="color: #2e7d32;">¡Felicidades ${comprador.nombre_completo || "Ganador"}!</h2>
                <p style="color: #555; line-height: 1.5;">Has ganado la subasta de <strong>"${subasta.titulo}"</strong> con tu oferta de <strong>$${pujaGanadora.monto.toLocaleString("es-AR")}</strong>.</p>
                <h3 style="color: #333; margin-top: 25px;">Datos del Vendedor:</h3>
                <ul style="color: #555; line-height: 1.8; background: #f9f9f9; padding: 15px 35px; border-radius: 5px;">
                  <li><strong>Nombre:</strong> ${vendedor.nombre_completo || "No especificado"}</li>
                  <li><strong>Email:</strong> ${vendedor.email}</li>
                  <li><strong>Teléfono / WhatsApp:</strong> ${vendedor.telefono || "No especificado"}</li>
                </ul>
                <p style="color: #555; line-height: 1.5; margin-top: 20px;">Por favor, contáctate con el vendedor para coordinar el pago y la entrega del producto.</p>
              </div>
            `
          });

          emailsEnviados += 2;
        }
      }

      await supabase
        .from("subastas")
        .update({ estado: "finalizada" })
        .eq("id", subasta.id);
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: \`Proceso finalizado. Se procesaron \${subastasFinalizadas.length} subastas y se enviaron \${emailsEnviados} correos.\` 
    });

  } catch (error: any) {
    console.error("Error en Cron Job de Finalización:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
