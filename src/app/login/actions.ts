"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nombre_completo = formData.get("nombre_completo") as string;
  const telefono = formData.get("telefono") as string;
  const terminos = formData.get("terminos");

  if (!email || !password || !nombre_completo || !telefono || !terminos) {
    return { error: "Todos los campos son obligatorios y debes aceptar los términos" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_completo,
        telefono,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Verificar si se requiere confirmación de email (la sesión suele venir nula en ese caso)
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "Este correo electrónico ya está registrado." };
  }

  return { success: true, message: "¡Registro exitoso! Por favor revisa tu bandeja de entrada o carpeta de spam para confirmar tu correo electrónico." };
}
