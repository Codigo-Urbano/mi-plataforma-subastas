
const fs = require("fs");
const content = `
export async function hacerPregunta(subastaId: string, pregunta: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para preguntar." };

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
`;
fs.appendFileSync("src/app/subastas/[id]/actions.ts", content, "utf8");

