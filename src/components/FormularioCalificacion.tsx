"use client";

import React, { useState } from "react";
import { enviarCalificacion } from "@/app/subastas/[id]/actions";

interface FormularioCalificacionProps {
  subastaId: string;
  evaluadoId: string;
  rolEvaluador: "comprador" | "vendedor";
  onSuccess?: () => void;
}

export default function FormularioCalificacion({
  subastaId,
  evaluadoId,
  rolEvaluador,
  onSuccess
}: FormularioCalificacionProps) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [hoverPuntuacion, setHoverPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (puntuacion === 0) {
      setError("Por favor, selecciona una puntuación de 1 a 5 estrellas.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await enviarCalificacion(
        subastaId,
        evaluadoId,
        rolEvaluador,
        puntuacion,
        comentario
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-xl mt-4 flex flex-col items-center justify-center text-center">
        <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-semibold">¡Gracias por tu calificación!</p>
        <p className="text-sm mt-1">Tu reseña ayuda a mantener la plataforma segura.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/50 p-5 rounded-xl border border-border mt-4">
      <h4 className="font-semibold mb-3">
        Califica al {rolEvaluador === "comprador" ? "Vendedor" : "Comprador"}
      </h4>
      
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setPuntuacion(star)}
            onMouseEnter={() => setHoverPuntuacion(star)}
            onMouseLeave={() => setHoverPuntuacion(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <svg
              className={`w-8 h-8 ${
                star <= (hoverPuntuacion || puntuacion)
                  ? "text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="¿Cómo fue la experiencia? (Opcional)"
          className="w-full bg-background border border-input rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          rows={3}
          maxLength={300}
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Enviando..." : "Enviar Calificación"}
      </button>
    </form>
  );
}
