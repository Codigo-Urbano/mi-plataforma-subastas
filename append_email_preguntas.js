
const fs = require("fs");
const content = `
export async function enviarEmailNuevaPregunta(subastaId: string, pregunta: string, compradorId: string) {
  try {
    const supabase = await createClient();
    
    // Obtener datos de la subasta, del vendedor y del comprador
    const { data: subasta } = await supabase
      .from("subastas")
      .select("titulo, vendedor_id, perfiles!subastas_vendedor_id_fkey(email, nombre_completo)")
      .eq("id", subastaId)
      .single();
      
    const { data: comprador } = await supabase
      .from("perfiles")
      .select("nombre_completo, nickname, email")
      .eq("id", compradorId)
      .single();

    if (subasta && comprador && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailVendedor = (subasta.perfiles as any).email;
      const nombreVendedor = (subasta.perfiles as any).nombre_completo || "Vendedor";
      const nombreComprador = comprador.nickname || comprador.nombre_completo || comprador.email?.split("@")[0] || "Un usuario";

      await resend.emails.send({
        from: "Subastas Pro <notificaciones@subastas-pro.com>",
        to: [emailVendedor],
        subject: \`Nueva pregunta en tu subasta: \${subasta.titulo}\`,
        html: \`
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaeb; border-radius: 10px;">
            <h2 style="color: #2e7d32;">¡Tienes una nueva pregunta!</h2>
            <p style="color: #555; line-height: 1.5;">Hola \${nombreVendedor},</p>
            <p style="color: #555; line-height: 1.5;"><strong>\${nombreComprador}</strong> acaba de hacer una pregunta sobre tu artículo <strong>"\${subasta.titulo}"</strong>:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2e7d32; margin: 20px 0; border-radius: 0 4px 4px 0;">
              <p style="color: #333; font-style: italic; margin: 0;">"\${pregunta}"</p>
            </div>
            
            <p style="color: #555; line-height: 1.5;">Responder rápido aumenta significativamente tus posibilidades de vender a un mejor precio.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="\${process.env.NEXT_PUBLIC_BASE_URL || "https://subastas-pro.com"}/subastas/\${subastaId}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Responder Pregunta
              </a>
            </div>
          </div>
        \`
      });
    }
  } catch (error) {
    console.error("Error enviando email de nueva pregunta:", error);
  }
}

export async function enviarEmailRespuesta(preguntaId: string, subastaId: string, respuesta: string) {
  try {
    const supabase = await createClient();
    
    // Obtener la pregunta original y el correo del comprador
    const { data: preguntaData } = await supabase
      .from("preguntas")
      .select("pregunta, comprador_id, perfiles!preguntas_comprador_id_fkey(email, nombre_completo)")
      .eq("id", preguntaId)
      .single();
      
    // Obtener la subasta
    const { data: subasta } = await supabase
      .from("subastas")
      .select("titulo")
      .eq("id", subastaId)
      .single();

    if (preguntaData && subasta && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailComprador = (preguntaData.perfiles as any).email;
      const nombreComprador = (preguntaData.perfiles as any).nombre_completo || "Usuario";

      await resend.emails.send({
        from: "Subastas Pro <notificaciones@subastas-pro.com>",
        to: [emailComprador],
        subject: \`El vendedor respondió tu pregunta sobre: \${subasta.titulo}\`,
        html: \`
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaeb; border-radius: 10px;">
            <h2 style="color: #2e7d32;">¡Tienes una nueva respuesta!</h2>
            <p style="color: #555; line-height: 1.5;">Hola \${nombreComprador},</p>
            <p style="color: #555; line-height: 1.5;">El vendedor ha respondido a la pregunta que hiciste en la subasta <strong>"\${subasta.titulo}"</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #666; font-size: 13px; margin: 0 0 5px 0;">Tu pregunta:</p>
              <p style="color: #333; font-style: italic; margin: 0 0 15px 0;">"\${preguntaData.pregunta}"</p>
              
              <p style="color: #2e7d32; font-size: 13px; font-weight: bold; margin: 0 0 5px 0;">Respuesta del vendedor:</p>
              <p style="color: #111; margin: 0;">"\${respuesta}"</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="\${process.env.NEXT_PUBLIC_BASE_URL || "https://subastas-pro.com"}/subastas/\${subastaId}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Ir a la subasta para pujar
              </a>
            </div>
          </div>
        \`
      });
    }
  } catch (error) {
    console.error("Error enviando email de respuesta:", error);
  }
}
`;
fs.appendFileSync("src/app/subastas/[id]/actions.ts", content, "utf8");

