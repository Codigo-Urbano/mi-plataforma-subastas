"use client";

import { useState } from "react";
import { rechazarKYC, aprobarKYC } from "./actions";

export default function PanelKYC({ solicitudes }: { solicitudes: any[] }) {
  const [seleccionado, setSeleccionado] = useState<any | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleAprobar = async () => {
    if (!seleccionado) return;
    setCargando(true);
    await aprobarKYC(seleccionado.id);
    setCargando(false);
    setSeleccionado(null);
  };

  const handleRechazar = async () => {
    if (!seleccionado) return;
    const motivo = prompt("Indica el motivo del rechazo para que el usuario pueda corregirlo (ej: Foto borrosa):");
    if (!motivo) return;
    
    setCargando(true);
    await rechazarKYC(seleccionado.id, motivo);
    setCargando(false);
    setSeleccionado(null);
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-background/50 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4">Usuario / Email</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No hay solicitudes pendientes de revisi�n.
                  </td>
                </tr>
              ) : (
                solicitudes.map((sol) => (
                  <tr key={sol.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground mb-1">{sol.nombre_completo || "Sin nombre"}</div>
                      <div className="text-muted-foreground text-xs">{sol.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                        EN REVISI�N
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSeleccionado(sol)}
                        className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors"
                      >
                        Revisar Documentos
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {seleccionado && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-5xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-lg">Revisi�n KYC: {seleccionado.nombre_completo || seleccionado.email}</h3>
              <button onClick={() => setSeleccionado(null)} className="text-muted-foreground hover:text-foreground text-xl px-2">
                ?
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 p-4 rounded-lg mb-6 text-sm">
                <strong>Precauci�n de Seguridad:</strong> Comprueba visualmente que el rostro en la selfie coincida exactamente con la fotograf�a del documento de identidad. Verifica que los documentos sean legibles y no presenten signos de alteraci�n digital.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm mb-3 text-center uppercase tracking-wider text-muted-foreground">Frente del Documento</h4>
                  <div className="bg-black/20 rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center border border-border">
                    <img src={seleccionado.kyc_doc_frente} alt="Frente DNI" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm mb-3 text-center uppercase tracking-wider text-muted-foreground">Dorso del Documento</h4>
                  <div className="bg-black/20 rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center border border-border">
                    <img src={seleccionado.kyc_doc_dorso} alt="Dorso DNI" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm mb-3 text-center uppercase tracking-wider text-muted-foreground">Fotograf�a Selfie</h4>
                  <div className="bg-black/20 rounded-lg overflow-hidden aspect-[3/4] md:aspect-[4/3] flex items-center justify-center border border-border">
                    <img src={seleccionado.kyc_selfie} alt="Selfie" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/30">
              <button 
                onClick={handleRechazar}
                disabled={cargando}
                className="px-6 py-2 rounded-lg font-medium text-sm border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                {cargando ? "Procesando..." : "Rechazar Solicitud"}
              </button>
              <button 
                onClick={handleAprobar}
                disabled={cargando}
                className="px-6 py-2 rounded-lg font-medium text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-2"
              >
                {cargando ? "Procesando..." : "? Aprobar Usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
