
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, DollarSign, Gavel, Users, TrendingUp, Eye, Clock, CheckCircle2, ShieldAlert
} from "lucide-react";
import BotonEstadoUsuario from "./BotonEstadoUsuario";
import ModalHistorialAdmin from "./ModalHistorialAdmin";
import FormularioComisiones from "./FormularioComisiones";
import { 
  obtenerTodosUsuarios, 
  obtenerConfiguracion 
} from "./actions";

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const tab = params.tab || "metricas";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") redirect("/");

  // SECCIÓN 1: MÉTRICAS Y ANALÍTICAS
  const { count: usuariosTotales } = await supabase.from("perfiles").select("*", { count: "exact", head: true });
  const { count: subastasActivas } = await supabase.from("subastas").select("*", { count: "exact", head: true }).eq("estado", "activa");
  const { count: subastasFinalizadas } = await supabase.from("subastas").select("*", { count: "exact", head: true }).eq("estado", "finalizada");
  
  const { data: finalizadasData } = await supabase.from("subastas").select("precio_actual").eq("estado", "finalizada");
  const volumenTotalVentas = finalizadasData?.reduce((acc, curr) => acc + curr.precio_actual, 0) || 0;
  
  const configComisiones = await obtenerConfiguracion();
  const comisionPlataforma = volumenTotalVentas * (configComisiones?.escala_1_porcentaje || 0.05);

  const { data: subastasPopulares } = await supabase
    .from("subastas")
    .select(`id, titulo, estado, vendedor:perfiles!subastas_vendedor_id_fkey(nickname), vistas:vistas_subastas(count)`)
    .eq("estado", "activa")
    .limit(5);

  const popularesOrdenadas = (subastasPopulares || [])
    .map(s => ({ ...s, cantidadVistas: s.vistas?.[0]?.count || 0 }))
    .sort((a, b) => b.cantidadVistas - a.cantidadVistas);

  const { data: pujasRecientes } = await supabase
    .from("pujas")
    .select(`id, monto, creado_en, subasta:subastas(titulo), comprador:perfiles!pujas_comprador_id_fkey(nickname)`)
    .order("creado_en", { ascending: false })
    .limit(5);

  // SECCIÓN 2: GESTIÓN DE USUARIOS
  const usuarios = tab === "usuarios" ? await obtenerTodosUsuarios() : [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="text-primary h-8 w-8" />
            Panel de Administración
          </h1>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex gap-2 mb-8 border-b border-border/50 pb-2 overflow-x-auto">
        <Link href="/admin?tab=metricas" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'metricas' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5 text-muted-foreground'}`}>Métricas y Analíticas</Link>
        <Link href="/admin?tab=usuarios" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'usuarios' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5 text-muted-foreground'}`}>Gestión de Usuarios</Link>
        <Link href="/admin?tab=comisiones" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'comisiones' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5 text-muted-foreground'}`}>Configuración de Comisiones</Link>
      </div>

      {/* CONTENIDO TAB: MÉTRICAS */}
      {tab === "metricas" && (
        <div className="space-y-8">
          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Ingresos (Estimado)</p>
              <p className="text-3xl font-bold text-emerald-500">${comisionPlataforma.toLocaleString("es-AR")}</p>
              <p className="text-xs text-muted-foreground mt-2">De ${volumenTotalVentas.toLocaleString("es-AR")} transaccionados</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Gavel className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Subastas Activas</p>
              <p className="text-3xl font-bold text-primary">{subastasActivas || 0}</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Completadas</p>
              <p className="text-3xl font-bold text-foreground">{subastasFinalizadas || 0}</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Usuarios</p>
              <p className="text-3xl font-bold text-foreground">{usuariosTotales || 0}</p>
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
                          <span className="text-xs text-muted-foreground">Vendedor: @{(sub.vendedor as any)?.nickname || "Usuario"}</span>
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
                            <span className="font-medium text-primary">@{(puja.comprador as any)?.nickname || "Alguien"}</span> pujó 
                            <span className="font-bold ml-1">${puja.monto.toLocaleString("es-AR")}</span>
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(puja.creado_en).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          En: {(puja.subasta as any)?.titulo}
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
      )}

      {/* CONTENIDO TAB: USUARIOS */}
      {tab === "usuarios" && (
        <div className="glass rounded-xl overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-background/50 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Reputación</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground mb-1">{u.nombre_completo || "Sin Nombre"}</div>
                      <div className="text-muted-foreground text-xs">{u.email}</div>
                      {u.rol === "admin" && <span className="inline-block mt-1 text-[10px] font-bold text-primary uppercase">Admin</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {"★".repeat(Math.round(u.promedio))}
                        {"☆".repeat(5 - Math.round(u.promedio))}
                        <span className="text-muted-foreground text-xs ml-1">
                          {u.totalResenas > 0 ? `${u.promedio.toFixed(1)} (${u.totalResenas})` : "Nuevo"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.estado === "activo" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {u.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        <ModalHistorialAdmin usuarioId={u.id} nombre={u.nombre_completo || u.email} />
                        {u.rol !== "admin" && (
                          <BotonEstadoUsuario usuarioId={u.id} estadoActual={u.estado} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB: COMISIONES */}
      {tab === "comisiones" && configComisiones && (
        <FormularioComisiones config={configComisiones} />
      )}
    </div>
  );
}
