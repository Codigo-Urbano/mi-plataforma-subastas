import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { MercadoPagoConfig, Payment } from "mercadopago";

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener la firma y el body para verificación de seguridad (Recomendado en Producción)
    // Para simplificar, confiaremos en que MP nos envía un id válido que luego consultaremos a la API real.
    
    const body = await req.json();
    console.log("🔔 Webhook MercadoPago recibido:", body);

    // 2. Verificar que sea un evento de pago
    if (body.type === "payment" && body.data?.id) {
      const paymentId = body.data.id;

      // 3. Configurar SDK de MercadoPago
      const client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN || "",
      });
      const paymentClient = new Payment(client);

      // 4. Consultar a MercadoPago el estado REAL del pago
      const payment = await paymentClient.get({ id: paymentId });

      // 5. Verificar si el pago fue aprobado
      if (payment.status === "approved") {
        // En el checkout, guardamos el ID de la subasta en el description o item id (ej: "pub_uuid-de-subasta")
        const externalReference = payment.external_reference; 
        // Si no usamos external_reference, buscamos en el primer item
        const itemId = payment.additional_info?.items?.[0]?.id || "";
        
        let subastaId = "";
        
        if (itemId && itemId.startsWith("pub_")) {
          subastaId = itemId.replace("pub_", "");
        } else if (externalReference) {
          subastaId = externalReference;
        }

        if (subastaId) {
          // 6. Activar la subasta en la base de datos de manera segura usando Service Role
          const supabaseAdmin = createAdminClient();
          
          const { error } = await supabaseAdmin
            .from("subastas")
            .update({ estado: "activa" })
            .eq("id", subastaId)
            .eq("estado", "pendiente_pago"); // Solo activar si estaba pendiente

          if (error) {
            console.error("❌ Error activando subasta desde Webhook:", error);
            return NextResponse.json({ error: "No se pudo activar la subasta" }, { status: 500 });
          } else {
            console.log(`✅ Subasta ${subastaId} activada exitosamente por Webhook.`);
          }
        } else {
          console.warn("⚠️ Pago aprobado pero no se pudo identificar la subasta.");
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error en Webhook de MercadoPago:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
