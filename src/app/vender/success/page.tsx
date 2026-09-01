import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function VenderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ subastaId?: string; payment_id?: string; status?: string }>;
}) {
  const { subastaId, payment_id, status } = await searchParams;

  if (!subastaId || status !== "approved") {
    redirect("/");
  }

  const supabase = await createClient();

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ahora la activación de la subasta la maneja el Webhook de MercadoPago.
  // Aquí simplemente le mostramos al usuario la pantalla de éxito.

  return (
    <div className="container mx-auto px-4 py-20 text-center max-w-lg">
      <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">¡Subasta Publicada!</h1>
      <p className="text-muted-foreground mb-8">
        El pago de publicación fue exitoso y tu subasta ya está en vivo para que los compradores empiecen a pujar.
      </p>
      
      <div className="space-y-4">
        <Link
          href={`/subastas/${subastaId}`}
          className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-lg transition-colors"
        >
          Ver mi Subasta
        </Link>
        <Link
          href="/"
          className="block w-full bg-transparent hover:bg-white/5 text-foreground border border-border font-medium py-3 px-8 rounded-lg transition-colors"
        >
          Ir al Inicio
        </Link>
      </div>
    </div>
  );
}
