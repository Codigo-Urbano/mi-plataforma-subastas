
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { subastaId } = await request.json();
    if (!subastaId) {
      return NextResponse.json({ error: "Falta subastaId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Registramos la vista. Supabase RLS permite el insert
    await supabase.from("vistas_subastas").insert([{
      subasta_id: subastaId,
      visitante_id: user?.id || null,
    }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

