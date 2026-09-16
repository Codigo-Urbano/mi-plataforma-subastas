
const fs = require("fs");
const content = `"use client";

import { useState } from "react";
import { actualizarEstadoPostSubasta } from "./actions";
import { CheckCircle2, Circle, Truck, DollarSign, PackageCheck, User } from "lucide-react";

type PostEstado = "pendiente_pago" | "pagado" | "enviado" | "recibido";

interface PanelSeguimientoProps {
  subastaId: string;
  estadoActual: PostEstado;
  isSeller: boolean;
  isWinner: boolean;
  contraparte: {
    nombre_completo: string | null;
    email: string;
    telefono: string | null;
  } | null;
}

export default function PanelSeguimiento({ subastaId, estadoActual, isSeller, isWinner, contraparte }: PanelSeguimientoProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleActualizar = async (nuevoEstado: "pagado" | "enviado" | "recibido") => {
    try {
      setCargando(true);
      setError("");
      await actualizarEstadoPostSubasta(subastaId, nuevoEstado);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al actualizar");
    } finally {
      setCargando(false);
    }
  };

  const pasos = [
    { id: "pendiente_pago", label: "Pendiente de Pago", icon: DollarSign },
    { id: "pagado", label: "Pagado", icon: CheckCircle2 },
    { id: "enviado", label: "Enviado", icon: Truck },
    { id: "recibido", label: "Recibido", icon: PackageCheck },
  ];

  const currentStepIndex = pasos.findIndex(p => p.id === estadoActual);

  return (
    <div className="glass p-6 rounded-2xl border border-border/50 mt-8">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <PackageCheck className="text-primary w-6 h-6" /> Seguimiento de Transacción
      </h3>

      {contraparte && (
        <div className="bg-secondary/30 p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-border/50">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              {isSeller ? "Datos del Comprador" : "Datos del Vendedor"}
            </p>
            <div className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4 text-primary" /> {contraparte.nombre_completo || "Usuario"}
            </div>
            <div className="text-sm mt-1 text-muted-foreground">
              <p>Email: {contraparte.email}</p>
              <p>Teléfono: {contraparte.telefono || "No especificado"}</p>
            </div>
          </div>
          <a href={\`mailto:\${contraparte.email}\`} className="bg-primary/10 text-primary font-medium px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors text-sm">
            Contactar por Email
          </a>
        </div>
      )}

      {/* Timeline Visual */}
      <div className="relative flex justify-between items-center mb-10">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 rounded-full transition-all duration-500" 
          style={{ width: \`\${(currentStepIndex / (pasos.length - 1)) * 100}%\` }}
        ></div>

        {pasos.map((paso, index) => {
          const Icon = paso.icon;
          const isCompleted = currentStepIndex >= index;
          const isCurrent = currentStepIndex === index;

          return (
            <div key={paso.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors \${isCompleted ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.5)]" : "bg-background border-border text-muted-foreground"}\`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={\`text-xs font-semibold absolute top-12 whitespace-nowrap \${isCurrent ? "text-primary" : (isCompleted ? "text-foreground" : "text-muted-foreground")}\`}>
                {paso.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-14 space-y-4">
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        {isSeller && (
          <div className="flex flex-wrap gap-3">
            {estadoActual === "pendiente_pago" && (
              <button 
                onClick={() => handleActualizar("pagado")} 
                disabled={cargando}
                className="flex-1 bg-primary text-primary-foreground font-medium py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" /> Marcar como Pagado
              </button>
            )}
            {estadoActual === "pagado" && (
              <button 
                onClick={() => handleActualizar("enviado")} 
                disabled={cargando}
                className="flex-1 bg-primary text-primary-foreground font-medium py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" /> Marcar como Enviado
              </button>
            )}
            {estadoActual === "enviado" && (
              <div className="flex-1 text-center py-3 bg-secondary/50 rounded-xl text-secondary-foreground text-sm font-medium">
                Esperando a que el comprador confirme la recepción...
              </div>
            )}
          </div>
        )}

        {isWinner && (
          <div className="flex flex-wrap gap-3">
            {(estadoActual === "pendiente_pago" || estadoActual === "pagado") && (
              <div className="flex-1 text-center py-3 bg-secondary/50 rounded-xl text-secondary-foreground text-sm font-medium">
                {estadoActual === "pendiente_pago" ? "El vendedor debe confirmar el pago para continuar." : "El vendedor está preparando el envío."}
              </div>
            )}
            {estadoActual === "enviado" && (
              <button 
                onClick={() => handleActualizar("recibido")} 
                disabled={cargando}
                className="flex-1 bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-5 h-5" /> Confirmar Recepción
              </button>
            )}
          </div>
        )}

        {estadoActual === "recibido" && (
           <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-center gap-3 text-emerald-600">
             <CheckCircle2 className="w-6 h-6" />
             <span className="font-bold">¡Transacción Finalizada con Éxito!</span>
           </div>
        )}

      </div>
    </div>
  );
}`;
fs.writeFileSync("src/app/subastas/[id]/PanelSeguimiento.tsx", content, "utf8");

