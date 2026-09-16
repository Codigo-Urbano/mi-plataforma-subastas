"use client";

import { useState } from "react";
import { solicitarKYC } from "./actions";

export default function FormularioKYC({ kycStatus }: { kycStatus: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    
    try {
      const form = new FormData(e.currentTarget);
      await solicitarKYC(form);
      setExito(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar la solicitud");
    } finally {
      setCargando(false);
    }
  };

  if (kycStatus === "aprobado") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl flex items-center gap-4 text-emerald-600">
        <div className="text-4xl">?</div>
        <div>
          <h3 className="font-bold text-lg mb-1">�Cuenta Verificada!</h3>
          <p className="text-sm opacity-80">Tu identidad ha sido comprobada. Tu perfil ahora luce el tilde azul de confianza.</p>
        </div>
      </div>
    );
  }

  if (kycStatus === "en_revision" || exito) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-xl flex items-center gap-4 text-yellow-600">
        <div className="text-4xl">?</div>
        <div>
          <h3 className="font-bold text-lg mb-1">En Revisi�n</h3>
          <p className="text-sm opacity-80">Nuestro equipo est� revisando tus documentos de forma segura. Te notificaremos cuando termine el proceso.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {kycStatus === "rechazado" && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mb-6 text-red-500 text-sm">
          <strong>Tu solicitud anterior fue rechazada.</strong> Por favor, aseg�rate de que las fotos sean n�tidas, bien iluminadas y que el rostro de la selfie coincida claramente con el DNI. Int�ntalo de nuevo.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <p className="text-sm text-muted-foreground mb-4">
          Para garantizar la seguridad de la plataforma, necesitamos verificar tu identidad real. Estos documentos se almacenan bajo estricta seguridad privada y nunca ser�n p�blicos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Frente del DNI/Documento</label>
            <input type="file" name="docFrente" accept="image/*" required className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-border/50 rounded-lg p-2 bg-background/50" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dorso del DNI/Documento</label>
            <input type="file" name="docDorso" accept="image/*" required className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-border/50 rounded-lg p-2 bg-background/50" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Fotograf�a Selfie (Rostro claro y visible)</label>
            <input type="file" name="selfie" accept="image/*" required className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-border/50 rounded-lg p-2 bg-background/50" />
            <p className="text-xs text-muted-foreground mt-2">La foto debe ser actual, sin gafas de sol ni gorros, para compararla con tu documento.</p>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {cargando ? "Enviando de forma segura..." : "Enviar Documentos para Revisi�n"}
        </button>
      </form>
    </div>
  );
}
