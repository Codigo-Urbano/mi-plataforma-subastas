import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let isSuspendido = false;

  if (user) {
    const { data: perfil } = await supabase.from("perfiles").select("rol, estado").eq("id", user.id).single();
    isAdmin = perfil?.rol === "admin";
    isSuspendido = perfil?.estado === "suspendido";
  }

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col">
      {isSuspendido && (
        <div className="bg-red-600 text-white text-center px-4 py-2.5 text-xs md:text-sm shadow-md flex items-center justify-center gap-2">
          <span className="text-base">⚠️</span>
          <span>
            Tu cuenta ha sido <strong>suspendida</strong>. No puedes crear subastas ni realizar pujas.
            <Link href="/contacto" className="underline ml-2 hover:text-gray-200">
              Contáctanos si crees que es un error.
            </Link>
          </span>
        </div>
      )}
      <nav className="w-full glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
            SUBASTAS<span className="text-primary">.PRO</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                  {user.email}
                </span>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-md hover:bg-red-500/20 transition-colors"
                  >
                    Panel Admin
                  </Link>
                )}
                <Link
                  href="/vender"
                  className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                    isSuspendido 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none" 
                      : "bg-white text-black hover:bg-gray-200"
                  }`}
                  aria-disabled={isSuspendido}
                  tabIndex={isSuspendido ? -1 : undefined}
                >
                  Crear Subasta
                </Link>
                <Link
                  href="/mi-cuenta"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Mi Cuenta
                </Link>
                <form action="/auth/signout" method="post">
                  <button className="text-sm font-medium hover:text-red-500 transition-colors">
                    Cerrar Sesión
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
