
const fs = require("fs");
let content = fs.readFileSync("src/app/subastas/[id]/actions.ts", "utf8");

content += `

// --- ESTADOS POST-SUBASTA ---

export async function actualizarEstadoPostSubasta(subastaId: string, nuevoEstado: "pagado" | "enviado" | "recibido") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes estar autenticado para realizar esta accion");

  const { data: subasta, error } = await supabase
    .from("subastas")
    .select("vendedor_id, estado, post_estado")
    .eq("id", subastaId)
    .single();

  if (error || !subasta) throw new Error("Subasta no encontrada");
  if (subasta.estado !== "finalizada") throw new Error("La subasta no ha finalizado");

  // Obtener al comprador ganador
  const { data: pujaGanadora } = await supabase
    .from("pujas")
    .select("comprador_id")
    .eq("subasta_id", subastaId)
    .order("monto", { ascending: false })
    .limit(1)
    .single();

  if (!pujaGanadora) throw new Error("No hay ganador para esta subasta");

  const isSeller = user.id === subasta.vendedor_id;
  const isWinner = user.id === pujaGanadora.comprador_id;

  if (!isSeller && !isWinner) throw new Error("No tienes permisos para modificar el estado de esta subasta");

  // Validaciones de flujo lógico
  if (nuevoEstado === "pagado" && !isSeller) throw new Error("Solo el vendedor puede confirmar el pago");
  if (nuevoEstado === "enviado" && !isSeller) throw new Error("Solo el vendedor puede confirmar el envio");
  if (nuevoEstado === "recibido" && !isWinner) throw new Error("Solo el comprador puede confirmar la recepcion");

  // Verificar la secuencia
  if (nuevoEstado === "pagado" && subasta.post_estado !== "pendiente_pago") throw new Error("Estado invalido");
  if (nuevoEstado === "enviado" && subasta.post_estado !== "pagado") throw new Error("Estado invalido, primero debe pagarse");
  if (nuevoEstado === "recibido" && subasta.post_estado !== "enviado") throw new Error("Estado invalido, primero debe enviarse");

  const { error: updateError } = await supabase
    .from("subastas")
    .update({ post_estado: nuevoEstado })
    .eq("id", subastaId);

  if (updateError) throw new Error("Error al actualizar el estado");

  revalidatePath(\`/subastas/\${subastaId}\`);
  return { success: true };
}
`;
fs.writeFileSync("src/app/subastas/[id]/actions.ts", content, "utf8");

