"use client";

import { useState } from "react";
import { cambiarEstadoUsuario } from "./actions";

export default function BotonEstadoUsuario({ 
  usuarioId, 
  estadoActual 
}: { 
  usuarioId: string; 
  estadoActual: "activo" | "suspendido";
}) {
  const [cargando, setCargando] = useState(false);

  const handleToggle = async () => {
    try {
      setCargando(true);
      const nuevoEstado = estadoActual === "activo" ? "suspendido" : "activo";
      const razon = prompt(`�Raz�n para ${nuevoEstado === "suspendido" ? "suspender" : "reactivar"} este usuario?`);
      
      if (!razon && nuevoEstado === "suspendido") {
        alert("Debe proveer una raz�n para suspender.");
        return;
      }

      await cambiarEstadoUsuario(usuarioId, nuevoEstado, razon || "Activaci�n manual admin");
    } catch (error) {
      alert("Error al cambiar estado");
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={cargando}
      className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
        estadoActual === "activo"
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-emerald-500 hover:bg-emerald-600 text-white"
      } ${cargando ? "opacity-50" : ""}`}
    >
      {cargando ? "Procesando..." : estadoActual === "activo" ? "Suspender" : "Activar"}
    </button>
  );
}