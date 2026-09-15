
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  DollarSign, 
  Gavel, 
  Users, 
  TrendingUp, 
  Eye, 
  Clock, 
  CheckCircle2,
  Package,
  Calendar
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // TODO: Validar que el usuario sea el administrador real. 
  // Por ahora lo permitimos, pero en un entorno real habría un campo "rol" = "admin"

  // 1. Estadísticas Generales
  const { count: usuariosTotales } = await supabase.from("perfiles").select("*", { count: "exact", head: true });
  const { count: subastasActivas } = await supabase.from("subastas").select("*", { count: "exact", head: true }).eq("estado", "activa");
  const { count: subastasFinalizadas } = await supabase.from("subastas").select("*", { count: "exact", head: true }).eq("estado", "finalizada");
  
  // 2. Ingresos Generados (Suma de precios actuales de las finalizadas)
  const { data: finalizadasData } = await supabase.from("subastas").select("precio_actual").eq("estado", "finalizada");
  const volumenTotalVentas = finalizadasData?.reduce((acc, curr) => acc + curr.precio_actual, 0) || 0;
  
  // Simulamos una comisión del 5% para la plataforma
  const comisionPlataforma = volumenTotalVentas * 0.05;

  // 3. Subastas más vistas
  const { data: subastasPopulares } = await supabase
    .from("subastas")
    .select(`
      id, 
      titulo, 
      estado, 
      vendedor:perfiles!subastas_vendedor_id_fkey(nickname),
      vistas:vistas_subastas(count)
    `)
    .eq("estado", "activa")
    .limit(5);

  // Ordenar por cantidad de vistas (Supabase devuelve count como [{count: X}])
  const popularesOrdenadas = (subastasPopulares || [])
    .map(s => ({
      ...s,
      cantidadVistas: s.vistas?.[0]?.count || 0
    }))
    .sort((a, b) => b.cantidadVistas - a.cantidadVistas);

  // 4. Últimas pujas (Actividad Reciente)
  const { data: pujasRecientes } = await supabase
    .from("pujas")
    .select(`
      id,
      monto,
      creado_en,
      subasta:subastas(titulo),
      comprador:perfiles!pujas_comprador_id_fkey(nickname)
    `)
    .order("creado_en", { ascending: false })
    .limit(5);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <BarChart3 className="text-primary h-8 w-8" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">Resumen general y métricas de la plataforma SUBASTAS.PRO</p>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Ingresos (Comisión 5%)</p>
          <p className="text-3xl font-bold text-emerald-500">${comisionPlataforma.toLocaleString("es-AR")}</p>
          <p className="text-xs text-muted-foreground mt-2">De ${volumenTotalVentas.toLocaleString("es-AR")} transaccionados</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Gavel className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Subastas Activas</p>
          <p className="text-3xl font-bold text-primary">{subastasActivas || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">En proceso de puja</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Completadas</p>
          <p className="text-3xl font-bold text-foreground">{subastasFinalizadas || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">Subastas cerradas con éxito</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Usuarios Registrados</p>
          <p className="text-3xl font-bold text-foreground">{usuariosTotales || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">Compradores y vendedores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Subastas Más Vistas */}
        <div className="glass rounded-2xl border border-border/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 bg-background/30 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Subastas Más Populares</h2>
          </div>
          <div className="p-0 flex-1">
            {popularesOrdenadas.length > 0 ? (
              <ul className="divide-y divide-border/30">
                {popularesOrdenadas.map((sub) => (
                  <li key={sub.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div>
                      <Link href={`/subastas/${sub.id}`} className="font-medium hover:text-primary transition-colors block mb-1">
                        {sub.titulo}
                      </Link>
                      <span className="text-xs text-muted-foreground">Vendedor: @{sub.vendedor?.nickname || "Usuario"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary/50 text-secondary-foreground px-3 py-1 rounded-full">
                      <Eye className="w-4 h-4" />
                      {sub.cantidadVistas}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-muted-foreground">No hay subastas activas.</div>
            )}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="glass rounded-2xl border border-border/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 bg-background/30 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Actividad en Tiempo Real</h2>
          </div>
          <div className="p-0 flex-1">
            {pujasRecientes && pujasRecientes.length > 0 ? (
              <ul className="divide-y divide-border/30">
                {pujasRecientes.map((puja) => (
                  <li key={puja.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm">
                        <span className="font-medium text-primary">@{puja.comprador?.nickname || "Alguien"}</span> pujó 
                        <span className="font-bold ml-1">${puja.monto.toLocaleString("es-AR")}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(puja.creado_en).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      En: {puja.subasta?.titulo}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-muted-foreground">No hay pujas recientes.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

