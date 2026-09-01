import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import SubastaCard from "@/components/SubastaCard";
export const revalidate = 0; // Evitar caché estático para ver siempre las subastas reales

export default async function Home(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const categoria = searchParams?.categoria as string | undefined;
  const orden = searchParams?.orden as string | undefined;

  const supabase = await createClient();
  
  // Construir consulta
  let query = supabase.from("subastas").select("*").eq("estado", "activa");

  if (categoria && categoria !== "Todas") {
    query = query.eq("categoria", categoria);
  }

  // Ordenar
  if (orden === "precio_alto") {
    query = query.order("precio_actual", { ascending: false });
  } else if (orden === "precio_bajo") {
    query = query.order("precio_actual", { ascending: true });
  } else {
    // Por defecto: Más recientes primero
    query = query.order("creado_en", { ascending: false });
  }

  const { data: auctions, error } = await query;

  // Formateador de tiempo simple para el MVP
  const getTiempoRestante = (fechaFin: string) => {
    const fin = new Date(fechaFin).getTime();
    const ahora = new Date().getTime();
    const diferencia = fin - ahora;

    if (diferencia <= 0) return "Finalizada";

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Subastas exclusivas, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300">
                resultados en tiempo real.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Únete a la plataforma más segura para pujar por artículos premium.
              Tecnología anti-sniper y transacciones protegidas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#subastas"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 rounded-lg transition-colors"
              >
                Ver Subastas Activas
              </Link>
              <Link
                href="/vender"
                className="glass hover:bg-white/5 font-medium px-8 py-3 rounded-lg transition-colors border border-border"
              >
                Comenzar a Vender
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Subastas */}
      <section id="subastas" className="py-16 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Subastas en Vivo</h2>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            {/* Categorías */}
            <div className="flex flex-wrap gap-2">
              {["Todas", "Vehículos", "Inmuebles", "Electrónica", "Hogar", "Arte y Colecciones", "Otros"].map((cat) => {
                const isActive = (categoria === cat) || (!categoria && cat === "Todas");
                const href = cat === "Todas" ? `/?orden=${orden || ""}` : `/?categoria=${cat}&orden=${orden || ""}`;
                return (
                  <Link
                    key={cat}
                    href={href}
                    scroll={false}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      isActive 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Ordenar Por */}
          <div className="flex items-center gap-2 min-w-fit mt-4 md:mt-0">
            <span className="text-sm font-medium text-muted-foreground">Ordenar:</span>
            <div className="relative">
              <Link 
                href={`/?categoria=${categoria || ""}&orden=`}
                scroll={false}
                className={`text-sm px-2 ${!orden ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Recientes
              </Link>
              <span className="text-border">|</span>
              <Link 
                href={`/?categoria=${categoria || ""}&orden=precio_bajo`}
                scroll={false}
                className={`text-sm px-2 ${orden === "precio_bajo" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Menor Precio
              </Link>
              <span className="text-border">|</span>
              <Link 
                href={`/?categoria=${categoria || ""}&orden=precio_alto`}
                scroll={false}
                className={`text-sm px-2 ${orden === "precio_alto" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Mayor Precio
              </Link>
            </div>
          </div>
        </div>

        {!auctions || auctions.length === 0 ? (
          <div className="glass p-12 text-center rounded-xl border border-border flex flex-col items-center">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">No hay subastas activas</h3>
            <p className="text-muted-foreground mb-6">Sé el primero en vender un producto en nuestra plataforma.</p>
            <Link href="/vender" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-lg transition-colors">
              Crear Subasta
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <SubastaCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
