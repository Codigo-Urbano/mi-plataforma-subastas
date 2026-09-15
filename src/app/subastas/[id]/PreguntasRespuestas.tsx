"use client";

import { useState } from "react";
import { hacerPregunta, responderPregunta } from "./actions";

type Pregunta = {
  id: string;
  pregunta: string;
  respuesta: string | null;
  creado_en: string;
  respondido_en: string | null;
  perfiles: {
    nickname: string | null;
    email: string | null;
  };
};

type Props = {
  subastaId: string;
  preguntas: Pregunta[];
  isOwner: boolean;
  isLoggedIn: boolean;
  isActiva: boolean;
};

export default function PreguntasRespuestas({
  subastaId,
  preguntas,
  isOwner,
  isLoggedIn,
  isActiva,
}: Props) {
  const [nuevaPregunta, setNuevaPregunta] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [respuestaText, setRespuestaText] = useState<{ [key: string]: string }>({});
  const [isAnswering, setIsAnswering] = useState<{ [key: string]: boolean }>({});

  const handlePreguntar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPregunta.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await hacerPregunta(subastaId, nuevaPregunta);
    
    if (result.error) {
      alert(result.error);
    } else {
      setNuevaPregunta("");
    }
    setIsSubmitting(false);
  };

  const handleResponder = async (preguntaId: string) => {
    const res = respuestaText[preguntaId];
    if (!res?.trim() || isAnswering[preguntaId]) return;

    setIsAnswering(prev => ({ ...prev, [preguntaId]: true }));
    const result = await responderPregunta(preguntaId, subastaId, res);
    
    if (result.error) {
      alert(result.error);
    } else {
      setRespuestaText(prev => ({ ...prev, [preguntaId]: "" }));
    }
    setIsAnswering(prev => ({ ...prev, [preguntaId]: false }));
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-border flex items-center gap-2">
        💬 Preguntas y Respuestas
      </h2>

      {/* Formulario para Preguntar (Solo si no es el dueño, si está logueado y activa) */}
      {!isOwner && isActiva && (
        <div className="mb-8 glass p-6 rounded-xl border border-border">
          {isLoggedIn ? (
            <form onSubmit={handlePreguntar}>
              <label htmlFor="pregunta" className="block text-sm font-medium mb-2">
                ¿Tienes alguna duda sobre este artículo?
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="pregunta"
                  type="text"
                  placeholder="Ej. ¿Haces envíos al interior?"
                  value={nuevaPregunta}
                  onChange={(e) => setNuevaPregunta(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  maxLength={200}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !nuevaPregunta.trim()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? "Enviando..." : "Preguntar"}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Debes <a href="/login" className="text-primary hover:underline font-medium">iniciar sesión</a> para hacer una pregunta.
            </p>
          )}
        </div>
      )}

      {/* Lista de Preguntas */}
      <div className="space-y-6">
        {preguntas.length === 0 ? (
          <p className="text-muted-foreground bg-muted p-4 rounded-lg text-center text-sm">
            Nadie ha hecho preguntas aún. ¡Sé el primero!
          </p>
        ) : (
          preguntas.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 pb-6 border-b border-border/50 last:border-0 last:pb-0">
              {/* Pregunta */}
              <div className="flex items-start gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <p className="text-sm text-foreground">{p.pregunta}</p>
                  <span className="text-xs text-muted-foreground">
                    Preguntado por {p.perfiles?.nickname || p.perfiles?.email?.split('@')[0]} el {new Date(p.creado_en).toLocaleDateString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Respuesta o Formulario para Responder */}
              {p.respuesta ? (
                <div className="flex items-start gap-3 ml-8 pl-4 border-l-2 border-primary/20 mt-1">
                  <span className="text-lg">✔️</span>
                  <div>
                    <p className="text-sm text-foreground/90">{p.respuesta}</p>
                    <span className="text-xs text-muted-foreground">
                      Respondido el {p.respondido_en ? new Date(p.respondido_en).toLocaleDateString("es-AR") : ""}
                    </span>
                  </div>
                </div>
              ) : isOwner && isActiva ? (
                <div className="ml-8 pl-4 border-l-2 border-border mt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe tu respuesta..."
                      value={respuestaText[p.id] || ""}
                      onChange={(e) => setRespuestaText(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={() => handleResponder(p.id)}
                      disabled={isAnswering[p.id] || !respuestaText[p.id]?.trim()}
                      className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      {isAnswering[p.id] ? "..." : "Responder"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ml-8 pl-4 border-l-2 border-border mt-1">
                  <span className="text-xs text-muted-foreground italic">El vendedor aún no ha respondido.</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
