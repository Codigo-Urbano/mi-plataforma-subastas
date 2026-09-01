import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Inicializamos el cliente de Supabase con la SERVICE_ROLE_KEY para saltarnos el RLS
// porque este script se ejecuta en segundo plano como "Administrador" del sistema.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  // Verificación de Seguridad: Comprobar token CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    // 1. Encontrar subastas finalizadas
    const { data: subastasFinalizadas, error: errSubastas } = await supabase
      .from("subastas")
      .select("id, titulo, vendedor_id, fecha_fin")
      .eq("estado", "activa")
      .lt("fecha_fin", new Date().toISOString());

    if (errSubastas || !subastasFinalizadas) {
      throw new Error("No se pudieron obtener las subastas finalizadas");
    }

    let emailsEnviados = 0;

    // 2. Por cada subasta finalizada, revisar si faltan calificaciones
    for (const subasta of subastasFinalizadas) {
      const fechaFinMs = new Date(subasta.fecha_fin).getTime();
      const hoyMs = new Date().getTime();
      const diasPasados = Math.floor((hoyMs - fechaFinMs) / (1000 * 60 * 60 * 24));

      // Solo enviar recordatorios si han pasado 3, 8 o 13 días
      if (diasPasados === 3 || diasPasados === 8 || diasPasados === 13) {
        
        // Obtener el ganador
        const { data: pujaGanadora } = await supabase
          .from("pujas")
          .select("comprador_id")
          .eq("subasta_id", subasta.id)
          .order("monto", { ascending: false })
          .limit(1)
          .single();

        if (pujaGanadora) {
          const vendedorId = subasta.vendedor_id;
          const compradorId = pujaGanadora.comprador_id;

          // Revisar calificaciones existentes
          const { data: calificaciones } = await supabase
            .from("calificaciones")
            .select("evaluador_id")
            .eq("subasta_id", subasta.id);

          const evaluadoresIds = calificaciones?.map(c => c.evaluador_id) || [];
          
          const faltaCalificarVendedor = !evaluadoresIds.includes(vendedorId);
          const faltaCalificarComprador = !evaluadoresIds.includes(compradorId);

          // Si le falta calificar al Vendedor
          if (faltaCalificarVendedor) {
            const { data: perfilVendedor } = await supabase.from("perfiles").select("email, nombre_completo").eq("id", vendedorId).single();
            if (perfilVendedor) {
              await enviarEmailRecordatorio(perfilVendedor.email, perfilVendedor.nombre_completo, subasta.titulo);
              emailsEnviados++;
            }
          }

          // Si le falta calificar al Comprador
          if (faltaCalificarComprador) {
            const { data: perfilComprador } = await supabase.from("perfiles").select("email, nombre_completo").eq("id", compradorId).single();
            if (perfilComprador) {
              await enviarEmailRecordatorio(perfilComprador.email, perfilComprador.nombre_completo, subasta.titulo);
              emailsEnviados++;
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: `Proceso Cron finalizado. Se enviaron ${emailsEnviados} correos recordatorios.` 
    });

  } catch (error: any) {
    console.error("Error en Cron Job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Función auxiliar para enviar el email con Resend
async function enviarEmailRecordatorio(emailDestino: string, nombreUsuario: string, tituloSubasta: string) {
  try {
    await resend.emails.send({
      // Resend en su plan gratuito solo permite enviar desde un dominio verificado 
      // o desde 'onboarding@resend.dev' para pruebas
      from: 'Acme <onboarding@resend.dev>',
      to: [emailDestino],
      subject: `Por favor califica tu experiencia: ${tituloSubasta}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaeb; border-radius: 10px;">
          <h2 style="color: #333;">Hola ${nombreUsuario || 'Usuario'},</h2>
          <p style="color: #555; line-height: 1.5;">Esperamos que tu transacción por la subasta <strong>"${tituloSubasta}"</strong> haya salido excelente.</p>
          <p style="color: #555; line-height: 1.5;">La reputación es el corazón de nuestra plataforma. Por favor, tómate un minuto para calificar a tu contraparte y contar cómo fue la experiencia.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/mi-cuenta" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Calificar ahora
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px;">Si ya enviaste tu calificación, por favor ignora este correo.</p>
        </div>
      `
    });
  } catch (e) {
    console.error(`Error enviando email a ${emailDestino}:`, e);
  }
}
