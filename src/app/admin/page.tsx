"use client";

import React, { useState, useEffect } from "react";
import { 
  obtenerTodosUsuarios, 
  cambiarEstadoUsuario, 
  obtenerHistorialAuditoria,
  obtenerConfiguracion,
  actualizarConfiguracion
} from "./actions";
import Estrellas from "@/components/Estrellas";

export default function AdminDashboard() {
  const [tab, setTab] = useState<"usuarios" | "configuracion">("usuarios");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [configuracion, setConfiguracion] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  
  // Estado para modales
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [razon, setRazon] = useState("");
  const [accionEnProceso, setAccionEnProceso] = useState(false);
  const [error, setError] = useState("");
  
  // Historial
  const [historial, setHistorial] = useState<any[]>([]);
  const [verHistorial, setVerHistorial] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [dataUsuarios, dataConfig] = await Promise.all([
        obtenerTodosUsuarios(),
        obtenerConfiguracion()
      ]);
      setUsuarios(dataUsuarios);
      setConfiguracion(dataConfig);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  };

  const handleActualizarConfiguracion = async (formData: FormData) => {
    try {
      await actualizarConfiguracion(formData);
      alert("¡Configuración guardada con éxito!");
      await cargarDatos(); // Refrescar el estado de la UI
    } catch (err: any) {
      alert("Error guardando: " + err.message);
    }
  };

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const data = await obtenerTodosUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setCargando(false);
    }
  };

  const handleVerHistorial = async (user: any) => {
    setUsuarioSeleccionado(user);
    setVerHistorial(true);
    try {
      const logs = await obtenerHistorialAuditoria(user.id);
      setHistorial(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCambiarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razon.trim()) {
      setError("Debes escribir una razón para el registro de auditoría.");
      return;
    }

    setAccionEnProceso(true);
    setError("");

    const nuevoEstado = usuarioSeleccionado.estado === "activo" ? "suspendido" : "activo";

    try {
      await cambiarEstadoUsuario(usuarioSeleccionado.id, nuevoEstado, razon);
      setUsuarioSeleccionado(null);
      setRazon("");
      await cargarUsuarios(); // Recargar la tabla
    } catch (err: any) {
      setError(err.message || "Error al cambiar estado");
    } finally {
      setAccionEnProceso(false);
    }
  };

  if (cargando) {
    return <div className="p-12 text-center">Cargando Panel de Administración...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        🛡️ Panel de Administración
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setTab("usuarios")}
          className={`px-4 py-2 font-bold rounded-lg transition-colors ${tab === "usuarios" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Gestión de Usuarios
        </button>
        <button 
          onClick={() => setTab("configuracion")}
          className={`px-4 py-2 font-bold rounded-lg transition-colors ${tab === "configuracion" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Configuración de Comisiones
        </button>
      </div>

      {tab === "usuarios" && (
        <div className="glass rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4 font-semibold">Usuario</th>
                  <th className="p-4 font-semibold">Reputación</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="font-bold">{u.nombre_completo || "Sin Nombre"}</p>
                      <p className="text-muted-foreground">{u.email}</p>
                      {u.rol === "admin" && <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded mt-1 inline-block font-bold">ADMIN</span>}
                    </td>
                    <td className="p-4">
                      <Estrellas promedio={u.promedio} total={u.totalResenas} />
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.estado === 'activo' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                      }`}>
                        {u.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleVerHistorial(u)}
                        className="text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded transition-colors"
                      >
                        Historial
                      </button>
                      {u.rol !== "admin" && (
                        <button 
                          onClick={() => { setUsuarioSeleccionado(u); setVerHistorial(false); setError(""); setRazon(""); }}
                          className={`text-xs px-3 py-1.5 rounded transition-colors font-medium ${
                            u.estado === 'activo' 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {u.estado === 'activo' ? 'Suspender' : 'Reactivar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "configuracion" && (
        <div className="glass rounded-xl border border-border p-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Comisiones y Tarifas</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Estos valores controlan cuánto se le cobra al usuario en MercadoPago al crear una subasta. Los cambios se aplican inmediatamente.
          </p>

          <form action={handleActualizarConfiguracion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5">Comisión Mínima (ARS)</label>
                <input
                  type="number"
                  name="comision_minima"
                  defaultValue={configuracion?.comision_minima ?? 2000}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-3">Escala 1 (Bienes comunes)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Aplica hasta valor (ARS)</label>
                  <input
                    type="number"
                    name="escala_1_tope"
                    defaultValue={configuracion?.escala_1_tope ?? 5000000}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Porcentaje de Comisión (%)</label>
                  <input
                    type="number"
                    name="escala_1_porcentaje"
                    step="0.01"
                    defaultValue={(configuracion?.escala_1_porcentaje ?? 0.05) * 100}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-3">Escala 2 (Bienes intermedios)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Aplica hasta valor (ARS)</label>
                  <input
                    type="number"
                    name="escala_2_tope"
                    defaultValue={configuracion?.escala_2_tope ?? 20000000}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Porcentaje de Comisión (%)</label>
                  <input
                    type="number"
                    name="escala_2_porcentaje"
                    step="0.01"
                    defaultValue={(configuracion?.escala_2_porcentaje ?? 0.03) * 100}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-3">Escala 3 (Bienes de lujo)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Porcentaje de Comisión (%) (Para todo lo que supere Escala 2)</label>
                  <input
                    type="number"
                    name="escala_3_porcentaje"
                    step="0.01"
                    defaultValue={(configuracion?.escala_3_porcentaje ?? 0.02) * 100}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="bg-primary text-primary-foreground font-medium py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors w-full"
            >
              Guardar Configuración
            </button>
          </form>
        </div>
      )}

      {/* Modal de Acción (Suspender / Reactivar) */}
      {usuarioSeleccionado && !verHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-border p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">
              {usuarioSeleccionado.estado === "activo" ? "Suspender Usuario" : "Reactivar Usuario"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Estás a punto de {usuarioSeleccionado.estado === "activo" ? "suspender" : "reactivar"} a <strong>{usuarioSeleccionado.email}</strong>.
            </p>

            <form onSubmit={handleCambiarEstado}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Razón para la auditoría (Obligatorio)</label>
                <textarea
                  value={razon}
                  onChange={(e) => setRazon(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[100px]"
                  placeholder="Ej: Incumplimiento de pago en la subasta #..."
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setUsuarioSeleccionado(null)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={accionEnProceso}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                    usuarioSeleccionado.estado === "activo" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {accionEnProceso ? "Procesando..." : "Confirmar Acción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {usuarioSeleccionado && verHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-border p-6 rounded-xl max-w-lg w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Historial: {usuarioSeleccionado.email}</h3>
              <button onClick={() => setUsuarioSeleccionado(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
              {historial.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay registros de auditoría para este usuario.</p>
              ) : (
                historial.map(h => (
                  <div key={h.id} className="bg-muted p-4 rounded-lg border border-border text-sm">
                    <div className="flex justify-between mb-2">
                      <span className={`font-bold ${h.accion === 'SUSPENDER' ? 'text-red-500' : 'text-green-500'}`}>
                        {h.accion}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(h.creado_en).toLocaleString()}
                      </span>
                    </div>
                    <p className="mb-2"><strong>Razón:</strong> {h.razon}</p>
                    <p className="text-xs text-muted-foreground">Realizado por: {h.admin?.email}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
