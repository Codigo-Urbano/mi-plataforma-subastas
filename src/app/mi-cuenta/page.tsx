import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Estrellas from "@/components/Estrellas";
import { obtenerPromedioCalificacion } from "../subastas/[id]/actions";

export const revalidate = 0;

export default async function MiCuentaPage() {
  const supabase = await createClient();

  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener Perfil y Reputación
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const reputacion = await obtenerPromedioCalificacion(user.id);

  // 3. Obtener Mis Ventas (Subastas creadas por el usuario)
  const { data: misVentas } = await supabase
    .from("subastas")
    .select("*")
    .eq("vendedor_id", user.id)
    .order("fecha_fin", { ascending: false });

  // 4. Obtener Mis Compras (Subastas donde el usuario fue el comprador/ganador en las pujas)
  // Nota: Esto requiere un join complejo o dos queries. Lo hacemos con dos queries para mayor legibilidad.
  const { data: misPujasGanadoras } = await supabase
    .from("pujas")
    .select("subasta_id")
    .eq("comprador_id", user.id);

  // Extraer IDs únicos de las subastas donde pujó
  const subastasPujadasIds = [...new Set(misPujasGanadoras?.map(p => p.subasta_id) || [])];
  
  let misCompras: any[] = [];
  if (subastasPujadasIds.length > 0) {
    // Buscar todas esas subastas
    const { data: subastasInteres } = await supabase
      .from("subastas")
      .select("*")
      .in("id", subastasPujadasIds)
      .lt("fecha_fin", new Date().toISOString()) // Solo finalizadas
      .order("fecha_fin", { ascending: false });

    // Filtrar solo aquellas en las que realmente fue el mayor postor (el ganador)
    if (subastasInteres) {
      for (const subasta of subastasInteres) {
        const { data: mayorPuja } = await supabase
          .from("pujas")
          .select("comprador_id")
          .eq("subasta_id", subasta.id)
          .order("monto", { ascending: false })
          .limit(1)
          .single();

        if (mayorPuja?.comprador_id === user.id) {
          misCompras.push(subasta);
        }
      }
    }
  }

  // 5. Obtener Mis Favoritos
  const { data: favoritosData } = await supabase
    .from("favoritos")
    .select("subasta_id, subastas(*)")
    .eq("usuario_id", user.id)
    .order("creado_en", { ascending: false });
  
  // Extraer las subastas del join (subastas puede ser array o un solo objeto dependiendo del setup, como es FK a id único es un objeto)
  const misFavoritos = favoritosData?.map(f => f.subastas).filter(Boolean) || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-flex items-center gap-2">
        &larr; Volver al inicio
      </Link>
      
      {/* Cabecera del Perfil */}
      <div className="glass rounded-2xl p-8 border border-border mb-12 flex flex-col md:flex-row items-center md:items-start gap-6 mt-4">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
          {perfil?.nombre_completo ? perfil.nombre_completo.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-1">{perfil?.nombre_completo || "Usuario"}</h1>
          <p className="text-muted-foreground mb-4">{user.email}</p>
          <div className="flex items-center justify-center md:justify-start gap-2 bg-background/50 inline-flex p-3 rounded-lg border border-border">
            <span className="font-semibold mr-2">Mi Reputación:</span>
            <Estrellas promedio={reputacion.promedio} total={reputacion.total} size="md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Columna: Mis Compras */}
        <div>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-border flex items-center gap-2">
            🛍️ Mis Compras
          </h2>
          {misCompras.length === 0 ? (
            <p className="text-muted-foreground bg-muted p-4 rounded-lg">No has ganado ninguna subasta todavía.</p>
          ) : (
            <div className="space-y-4">
              {misCompras.map(compra => (
                <div key={compra.id} className="glass p-5 rounded-xl border border-border flex justify-between items-center hover:border-primary/50 transition-colors">
                  <div>
                    <h3 className="font-bold mb-1 truncate max-w-[200px]">{compra.titulo}</h3>
                    <p className="text-sm text-green-500 font-semibold">Ganaste por ${Number(compra.precio_actual).toLocaleString("es-AR")}</p>
                  </div>
                  <Link href={`/subastas/${compra.id}`} className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
                    Ver Detalle / Calificar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna: Mis Ventas */}
        <div>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-border flex items-center gap-2">
            🏪 Mis Ventas
          </h2>
          {misVentas && misVentas.length === 0 ? (
            <p className="text-muted-foreground bg-muted p-4 rounded-lg">No has publicado ninguna subasta.</p>
          ) : (
            <div className="space-y-4">
              {misVentas?.map(venta => {
                const finalizada = new Date(venta.fecha_fin).getTime() < Date.now();
                return (
                  <div key={venta.id} className={`glass p-5 rounded-xl border ${finalizada ? 'border-border' : 'border-blue-500/30'} flex justify-between items-center hover:border-primary/50 transition-colors`}>
                    <div>
                      <h3 className="font-bold mb-1 truncate max-w-[200px]">{venta.titulo}</h3>
                      <p className={`text-sm font-semibold ${finalizada ? 'text-muted-foreground' : 'text-blue-500'}`}>
                        {finalizada ? `Cerró en $${Number(venta.precio_actual).toLocaleString("es-AR")}` : 'En vivo'}
                      </p>
                    </div>
                    <Link href={`/subastas/${venta.id}`} className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
                      {finalizada ? "Ver Detalle / Calificar" : "Ver Subasta"}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fila: Mis Favoritos */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-border flex items-center gap-2">
          ❤️ Mis Favoritos
        </h2>
        {misFavoritos.length === 0 ? (
          <p className="text-muted-foreground bg-muted p-4 rounded-lg">No tienes subastas guardadas en tus favoritos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {misFavoritos.map((favorito: any) => {
              const finalizada = new Date(favorito.fecha_fin).getTime() < Date.now();
              return (
                <div key={favorito.id} className="glass p-5 rounded-xl border border-border flex flex-col hover:border-red-500/50 transition-colors relative group">
                  <div className="flex-1 mb-4">
                    <h3 className="font-bold mb-1 truncate">{favorito.titulo}</h3>
                    <p className={`text-sm font-semibold ${finalizada ? 'text-muted-foreground' : 'text-foreground'}`}>
                      ${Number(favorito.precio_actual).toLocaleString("es-AR")}
                    </p>
                    {finalizada && <span className="text-xs text-red-500 mt-1 inline-block font-medium">FINALIZADA</span>}
                  </div>
                  <Link href={`/subastas/${favorito.id}`} className="text-sm text-center bg-background border border-border hover:border-red-500/50 hover:text-red-500 px-4 py-2 rounded-lg transition-colors w-full">
                    Ver Subasta
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
