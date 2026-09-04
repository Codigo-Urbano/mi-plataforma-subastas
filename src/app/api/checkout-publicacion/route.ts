import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function GET(req: NextRequest) {
  try {
    const subastaId = req.nextUrl.searchParams.get("subastaId");

    if (!subastaId) {
      return NextResponse.json({ error: "ID de subasta requerido" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener la subasta
    const { data: subasta, error: subastaError } = await supabase
      .from("subastas")
      .select("*")
      .eq("id", subastaId)
      .single();

    if (subastaError || !subasta) {
      return NextResponse.json({ error: "Subasta no encontrada" }, { status: 404 });
    }

    // 3. Verificar que el usuario actual es el vendedor y que la subasta está pendiente de pago
    if (subasta.vendedor_id !== user.id) {
      return NextResponse.json({ error: "No autorizado para pagar esta subasta" }, { status: 403 });
    }

    if (subasta.estado !== "pendiente_pago") {
      return NextResponse.json({ error: "La subasta ya fue pagada o no está en estado pendiente" }, { status: 400 });
    }

    // 4. Calcular Comisión Escalonada
    const { data: config } = await supabase
      .from("configuracion_sistema")
      .select("*")
      .eq("id", 1)
      .single();

    if (!config) {
      return NextResponse.json({ error: "No se pudo cargar la configuración de comisiones" }, { status: 500 });
    }

    let costoPublicacion = 0;
    const precioBase = Number(subasta.precio_base);

    if (precioBase <= Number(config.escala_1_tope)) {
      costoPublicacion = precioBase * Number(config.escala_1_porcentaje);
    } else if (precioBase <= Number(config.escala_2_tope)) {
      costoPublicacion = precioBase * Number(config.escala_2_porcentaje);
    } else {
      costoPublicacion = precioBase * Number(config.escala_3_porcentaje);
    }

    // El cobro mínimo absoluto
    costoPublicacion = Math.max(costoPublicacion, Number(config.comision_minima));

    // Forzamos localhost si no hay una URL de entorno válida para evitar que NextJS asigne "null"
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl || !baseUrl.startsWith("http")) {
      baseUrl = "http://localhost:3000";
    }

    const successUrl = `${baseUrl}/vender/success?subastaId=${subastaId}`;
    const failureUrl = `${baseUrl}/vender/error`;
    const pendingUrl = `${baseUrl}/vender/success?subastaId=${subastaId}`;

    // SI EL COSTO ES CERO (Freemium): Activamos inmediatamente sin pasar por MercadoPago
    if (costoPublicacion === 0) {
      console.log(`Subasta ${subastaId} es gratuita (Freemium). Activando directamente.`);
      const { createAdminClient } = await import("@/utils/supabase/admin");
      const supabaseAdmin = createAdminClient();
      
      const { error: updateError } = await supabaseAdmin
        .from("subastas")
        .update({ estado: "activa" })
        .eq("id", subastaId);

      if (updateError) {
        console.error("Error activando subasta gratuita:", updateError);
        return NextResponse.json({ error: "Error interno al activar subasta gratuita" }, { status: 500 });
      }

      return NextResponse.redirect(successUrl);
    }

    // 5. Configurar MercadoPago (Solo si cuesta más de $0)
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || "",
    });

    const preference = new Preference(client);
    
    console.log("URLs generadas para MP:", { successUrl, failureUrl, pendingUrl });

    const result = await preference.create({
      body: {
        items: [
          {
            id: `pub_${subastaId}`,
            title: `Publicación de Subasta: ${subasta.titulo}`,
            quantity: 1,
            unit_price: Number(costoPublicacion),
          },
        ],
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        notification_url: `${baseUrl}/api/webhook/mercadopago`,
        external_reference: subastaId,
      },
    });

    // Redirigir directamente al link de pago de MercadoPago
    return NextResponse.redirect(result.init_point!);
  } catch (error: any) {
    console.error("Error al crear preferencia MP de publicación:", error);
    return NextResponse.json({ error: "Error interno del servidor al crear pago" }, { status: 500 });
  }
}
