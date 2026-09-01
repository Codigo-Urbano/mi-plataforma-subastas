"use client";

import React, { useActionState, useState } from "react";
import { enviarMensajeContacto } from "./actions";
import Link from "next/link";

export default function ContactoPage() {
  const [success, setSuccess] = useState(false);
  const [error, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await enviarMensajeContacto(formData);
      if (result?.success) {
        setSuccess(true);
        return null;
      }
      return result?.error || "Error desconocido";
    },
    null
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-flex items-center gap-2">
        &larr; Volver al inicio
      </Link>

      <div className="glass p-8 md:p-12 rounded-2xl border border-border">
        <h1 className="text-3xl font-bold mb-2">Contáctanos</h1>
        <p className="text-muted-foreground mb-8">
          ¿Tienes alguna duda, sugerencia de mejora o problema? Escríbenos y te responderemos lo antes posible.
        </p>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-6 rounded-xl text-center">
            <h3 className="text-xl font-bold mb-2">¡Mensaje Enviado!</h3>
            <p>Gracias por contactarnos. Hemos recibido tu mensaje y lo leeremos pronto.</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-6 text-sm underline hover:text-green-500"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form action={action} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="nombre">Tu Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="email">Tu Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="motivo">Motivo</label>
              <select
                id="motivo"
                name="motivo"
                required
                className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
              >
                <option value="">Selecciona una opción...</option>
                <option value="Soporte y Ayuda">Necesito Soporte / Ayuda</option>
                <option value="Sugerencia de Mejora">Sugerencia de Mejora</option>
                <option value="Reporte de Usuario">Reportar a un usuario</option>
                <option value="Otro">Otro motivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="mensaje">Mensaje</label>
              <textarea
                id="mensaje"
                name="mensaje"
                required
                rows={5}
                className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                placeholder="Escribe tu mensaje aquí detalladamente..."
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center mt-2"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Enviar Mensaje"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
