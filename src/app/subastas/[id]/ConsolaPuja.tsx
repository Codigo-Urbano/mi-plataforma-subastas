"use client";

import { useEffect, useState, useActionState } from "react";
import { createClient } from "@/utils/supabase/client";
import { pujar, verificarGanador, verificarSiYaCalifico } from "./actions";
import Link from "next/link";
import FormularioCalificacion from "@/components/FormularioCalificacion";

type ConsolaPujaProps = {
  subastaId: string;
  initialPrecioActual: number;
  initialFechaFin: string;
  isOwner: boolean;
  isLoggedIn: boolean;
};

export default function ConsolaPuja({
  subastaId,
  initialPrecioActual,
  initialFechaFin,
  isOwner,
  isLoggedIn,
}: ConsolaPujaProps) {
  const [precioActual, setPrecioActual] = useState(initialPrecioActual);
  const [fechaFin, setFechaFin] = useState(initialFechaFin);
  const [tiempoRestanteTexto, setTiempoRestanteTexto] = useState("");
  const [isActiva, setIsActiva] = useState(true);
  const [isGanador, setIsGanador] = useState(false);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [yaCalifico, setYaCalifico] = useState(false);

  const supabase = createClient();

  const [infoContacto, setInfoContacto] = useState<any>(null);

  // Sincronizar estado cuando cambian las props por navegación en Next.js
  useEffect(() => {
    setPrecioActual(initialPrecioActual);
    setFechaFin(initialFechaFin);
  }, [initialPrecioActual, initialFechaFin]);

  // Action hook para manejar el submit
  const [error, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await pujar(subastaId, formData);
      if (result?.error) {
        return result.error;
      }
      return null;
    },
    null
  );

  // Lógica de cuenta regresiva
  useEffect(() => {
    const calcularTiempo = () => {
      const fin = new Date(fechaFin).getTime();
      const ahora = new Date().getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        if (isActiva) {
          setIsActiva(false);
          // Verificar ganador y obtener datos
          if (isLoggedIn) {
            import("./actions").then(({ verificarGanador, obtenerDatosContacto }) => {
              if (!isOwner) {
                verificarGanador(subastaId).then((res) => {
                  setIsGanador(res.isGanador);
                });
              }
              obtenerDatosContacto(subastaId).then((res) => {
                setInfoContacto(res);
                if (res) {
                  verificarSiYaCalifico(subastaId).then((califico) => setYaCalifico(califico));
                }
              });
            });
          }
        }
        setTiempoRestanteTexto("Finalizada");
        return;
      }

      setIsActiva(true);
      const horas = Math.floor(diferencia / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
      setTiempoRestanteTexto(`${horas}h ${minutos}m ${segundos}s`);
    };

    calcularTiempo(); // llamada inicial
    const intervalo = setInterval(calcularTiempo, 1000);

    return () => clearInterval(intervalo);
  }, [fechaFin, isActiva, isLoggedIn, isOwner, subastaId]);

  // Suscripción a Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`subasta-${subastaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subastas",
          filter: `id=eq.${subastaId}`,
        },
        (payload) => {
          const newDoc = payload.new as any;
          setPrecioActual((prev) => (newDoc.precio_actual > prev ? newDoc.precio_actual : prev));
          setFechaFin((prev) => (newDoc.fecha_fin !== prev ? newDoc.fecha_fin : prev));
          
          if (newDoc.estado !== "activa") {
            setIsActiva(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, subastaId]);

  const minPuja = Number(precioActual) + 1;

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActiva
              ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
              : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
          }`}
        >
          {isActiva ? "EN VIVO" : "FINALIZADA"}
        </span>
        <span className="font-mono text-xl font-bold">{tiempoRestanteTexto}</span>
      </div>

      <div className="glass p-6 md:p-8 rounded-xl border border-border mb-8">
        <p className="text-sm text-muted-foreground mb-2">Precio Actual</p>
        <p className="text-4xl md:text-5xl font-bold text-primary mb-6 transition-all duration-500">
          ${Number(precioActual).toLocaleString("es-AR")}
        </p>

        {isActiva ? (
          isLoggedIn ? (
            isOwner ? (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-center text-yellow-500 text-sm">
                No puedes pujar en tu propia subasta.
              </div>
            ) : (
              <form action={formAction} className="space-y-4">
                <div>
                  <label htmlFor="monto" className="block text-sm mb-2 text-muted-foreground">
                    Tu oferta (mínimo ${minPuja.toLocaleString("es-AR")})
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        id="monto"
                        name="monto"
                        required
                        className="w-full pl-8 pr-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                        placeholder={minPuja.toString()}
                        min={minPuja}
                        step="0.01"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="bg-white text-black font-bold px-8 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                    >
                      {isPending ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        "Pujar"
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  )}
                </div>
              </form>
            )
          ) : (
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Inicia sesión para participar
              </p>
              <Link
                href="/login"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </Link>
            </div>
          )
        ) : (
          <div className="bg-muted p-6 rounded-lg text-center border border-border flex flex-col items-center">
            <p className="text-xl font-bold mb-2">La subasta ha finalizado</p>
            
            {infoContacto ? (
              <div className="mt-4 flex flex-col items-center w-full">
                {infoContacto.rol === "comprador" ? (
                  <span className="bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-1 rounded-full text-sm font-bold mb-4">
                    ¡ERES EL GANADOR! 🎉
                  </span>
                ) : (
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-4 py-1 rounded-full text-sm font-bold mb-4">
                    SUBASTA VENDIDA 🤝
                  </span>
                )}
                
                <div className="bg-background/80 p-4 rounded-lg border border-border w-full text-left mt-2">
                  <p className="text-sm text-muted-foreground mb-3 border-b border-border pb-2">
                    {infoContacto.rol === "comprador" 
                      ? "Contacta al vendedor para coordinar pago y envío:" 
                      : "Contacta al ganador para cobrar y enviar el producto:"}
                  </p>
                  <p className="font-bold text-lg mb-1">{infoContacto.contacto.nombre_completo}</p>
                  <div className="space-y-1 text-sm">
                    <p>📞 <a href={`https://wa.me/${infoContacto.contacto.telefono?.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{infoContacto.contacto.telefono}</a></p>
                    <p>✉️ <a href={`mailto:${infoContacto.contacto.email}`} className="text-primary hover:underline">{infoContacto.contacto.email}</a></p>
                  </div>
                </div>

                {!yaCalifico && infoContacto.contacto.id && (
                  <div className="w-full mt-2">
                    <FormularioCalificacion 
                      subastaId={subastaId}
                      evaluadoId={infoContacto.contacto.id}
                      rolEvaluador={infoContacto.rol}
                      onSuccess={() => setYaCalifico(true)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground mt-2">
                {isOwner 
                  ? "El tiempo ha concluido sin pujas ganadoras." 
                  : "No lograste ganar esta subasta. ¡Suerte en la próxima!"}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
