
"use client";

import { useState } from "react";
import { obtenerHistorialAuditoria } from "./actions";

export default function ModalHistorialAdmin({ usuarioId, nombre }: { usuarioId: string, nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const abrirModal = async () => {
    setAbierto(true);
    setCargando(true);
    try {
      const data = await obtenerHistorialAuditoria(usuarioId);
      setHistorial(data || []);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  };

  return (
    <>
      <button 
        onClick={abrirModal}
        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        Historial
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-xl border border-border flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Historial: {nombre}</h3>
              <button onClick={() => setAbierto(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {cargando ? (
                <div className="text-center text-sm py-4">Cargando...</div>
              ) : historial.length === 0 ? (
                <div className="text-center text-sm py-4 text-muted-foreground">No hay historial registrado.</div>
              ) : (
                <ul className="space-y-3">
                  {historial.map((item) => (
                    <li key={item.id} className="text-sm p-3 bg-secondary/30 rounded-lg border border-border/50">
                      <div className="flex justify-between mb-1">
                        <strong className={item.accion === "SUSPENDER" ? "text-red-500" : "text-emerald-500"}>
                          {item.accion}
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.creado_en).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <p className="text-muted-foreground">"{item.razon}"</p>
                      <p className="text-xs mt-2 opacity-60">Por: {item.admin?.email || "Admin"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

