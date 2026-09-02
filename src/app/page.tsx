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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 md:py-40 border-b border-border/40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 glass text-[11px] uppercase tracking-widest text-muted-foreground mb-8">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            Plataforma Premium
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter mb-6 text-foreground max-w-4xl leading-[1.05]">
            Subastas exclusivas, <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 font-light">resultados en tiempo real.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl leading-relaxed font-light">
            Adquiere y vende piezas exclusivas a través de nuestro sistema de pujas de alta precisión. Sin intermediarios, sin latencia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="#subastas"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-4 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center text-sm shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)]"
            >
              Explorar Colección
            </Link>
            <Link
              href="/vender"
              className="glass border border-white/10 text-foreground hover:bg-white/10 font-medium px-8 py-4 rounded-xl transition-colors flex items-center justify-center text-sm"
            >
              Publicar Artículo
            </Link>
          </div>
        </div>
      </section>

      {/* Grid de Subastas */}
      <section id="subastas" className="py-24 container mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div>
            <h2 className="text-2xl font-medium tracking-tight mb-8">Selección Actual</h2>
            {/* Categorías */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-b border-border/40 w-full lg:w-auto pb-4 lg:pb-0 lg:border-b-0">
              {["Todas", "Vehículos", "Inmuebles", "Electrónica", "Hogar", "Arte y Colecciones", "Otros"].map((cat) => {
                const isActive = (categoria === cat) || (!categoria && cat === "Todas");
                const href = cat === "Todas" ? `/?orden=${orden || ""}` : `/?categoria=${cat}&orden=${orden || ""}`;
                return (
                  <Link
                    key={cat}
                    href={href}
                    scroll={false}
                    className={`text-sm pb-2 border-b-2 transition-colors ${
                      isActive 
                        ? 'border-foreground text-foreground font-medium' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Ordenar Por */}
          <div className="flex items-center gap-3 min-w-fit">
            <span className="text-xs uppercase tracking-widest text-muted-foreground/70">Ordenar</span>
            <div className="flex items-center gap-4">
              <Link 
                href={`/?categoria=${categoria || ""}&orden=`}
                scroll={false}
                className={`text-sm ${!orden ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}`}
              >
                Recientes
              </Link>
              <Link 
                href={`/?categoria=${categoria || ""}&orden=precio_bajo`}
                scroll={false}
                className={`text-sm ${orden === "precio_bajo" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}`}
              >
                Menor Precio
              </Link>
              <Link 
                href={`/?categoria=${categoria || ""}&orden=precio_alto`}
                scroll={false}
                className={`text-sm ${orden === "precio_alto" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}`}
              >
                Mayor Precio
              </Link>
            </div>
          </div>
        </div>

        {!auctions || auctions.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center border border-border/40 border-dashed bg-muted/5">
            <div className="w-12 h-12 mb-6">
              <div className="w-full h-full rounded-full border border-border/50 flex items-center justify-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></span>
              </div>
            </div>
            <h3 className="text-xl font-medium tracking-tight mb-2">Colección Vacía</h3>
            <p className="text-muted-foreground font-light mb-8 max-w-sm">No hay piezas listadas en esta categoría en este momento.</p>
            <Link href="/vender" className="text-sm font-medium border-b border-foreground pb-0.5 hover:text-muted-foreground hover:border-muted-foreground transition-colors">
              Iniciar listado
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {auctions.map((auction) => (
              <SubastaCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
