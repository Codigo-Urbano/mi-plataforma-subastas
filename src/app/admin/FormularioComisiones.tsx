
"use client";

import { useActionState } from "react";
import { actualizarConfiguracion } from "./actions";

export default function FormularioComisiones({ config }: { config: any }) {
  const [estado, formAction, pendiente] = useActionState(async (prevState: any, formData: FormData) => {
    try {
      await actualizarConfiguracion(formData);
      return { success: "Configuración actualizada correctamente" };
    } catch (e) {
      return { error: "Error al actualizar" };
    }
  }, null);

  return (
    <div className="glass rounded-xl p-8 border border-border/50 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Estructura de Comisiones</h2>
        <p className="text-sm text-muted-foreground">Configura cómo se calculan las comisiones (escalas progresivas).</p>
      </div>

      <form action={formAction} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Comisión Mínima Fija ($)</label>
          <input 
            type="number" 
            name="comision_minima" 
            defaultValue={config.comision_minima} 
            className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 items-end bg-secondary/20 p-4 rounded-lg border border-border/30">
          <div>
            <label className="block text-sm font-medium mb-1">Escala 1: Hasta ($)</label>
            <input type="number" name="escala_1_tope" defaultValue={config.escala_1_tope} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Porcentaje (%)</label>
            <input type="number" step="0.1" name="escala_1_porcentaje" defaultValue={config.escala_1_porcentaje * 100} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end bg-secondary/20 p-4 rounded-lg border border-border/30">
          <div>
            <label className="block text-sm font-medium mb-1">Escala 2: Hasta ($)</label>
            <input type="number" name="escala_2_tope" defaultValue={config.escala_2_tope} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Porcentaje (%)</label>
            <input type="number" step="0.1" name="escala_2_porcentaje" defaultValue={config.escala_2_porcentaje * 100} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="bg-secondary/20 p-4 rounded-lg border border-border/30">
           <label className="block text-sm font-medium mb-1">Escala 3 (Restante): Porcentaje (%)</label>
           <input type="number" step="0.1" name="escala_3_porcentaje" defaultValue={config.escala_3_porcentaje * 100} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
        </div>

        {estado?.error && <p className="text-red-500 text-sm">{estado.error}</p>}
        {estado?.success && <p className="text-emerald-500 text-sm">{estado.success}</p>}

        <button type="submit" disabled={pendiente} className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          {pendiente ? "Guardando..." : "Guardar Configuración"}
        </button>
      </form>
    </div>
  );
}

