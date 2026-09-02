"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type SubastaCardProps = {
  auction: any;
};

export default function SubastaCard({ auction }: SubastaCardProps) {
  const [precioActual, setPrecioActual] = useState(auction.precio_actual);
  const [fechaFin, setFechaFin] = useState(auction.fecha_fin);
  const [tiempoRestanteTexto, setTiempoRestanteTexto] = useState("");
  const [isActiva, setIsActiva] = useState(auction.estado === "activa");
  const supabase = createClient();

  useEffect(() => {
    const calcularTiempo = () => {
      const fin = new Date(fechaFin).getTime();
      const ahora = new Date().getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        setIsActiva(false);
        setTiempoRestanteTexto("Finalizada");
        return;
      }

      setIsActiva(true);
      const horas = Math.floor(diferencia / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
      setTiempoRestanteTexto(`${horas}h ${minutos}m ${segundos}s`);
    };

    calcularTiempo();
    const intervalo = setInterval(calcularTiempo, 1000);
    return () => clearInterval(intervalo);
  }, [fechaFin]);

  useEffect(() => {
    const channel = supabase
      .channel(`card-${auction.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subastas",
          filter: `id=eq.${auction.id}`,
        },
        (payload) => {
          const newDoc = payload.new as any;
          setPrecioActual((prev: any) => (newDoc.precio_actual > prev ? newDoc.precio_actual : prev));
          setFechaFin((prev: any) => (newDoc.fecha_fin !== prev ? newDoc.fecha_fin : prev));
          if (newDoc.estado !== "activa") setIsActiva(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, auction.id]);

  return (
    <div className="glass rounded-2xl overflow-hidden hover:border-primary/50 transition-colors duration-300 group flex flex-col border border-white/10">
      <div className="relative h-[320px] overflow-hidden bg-muted/20">
        {auction.imagen_url ? (
          <img
            src={auction.imagen_url}
            alt={auction.titulo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-0 group-hover:saturate-100 mix-blend-luminosity group-hover:mix-blend-normal"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs uppercase tracking-widest font-mono">
            [ Sin Imagen ]
          </div>
        )}
        <div className={`absolute top-4 right-4 px-3 py-1.5 text-[10px] font-medium tracking-widest uppercase backdrop-blur-md rounded-full border shadow-xl transition-colors ${isActiva ? 'bg-background/80 border-white/10 text-white' : 'bg-red-500/80 border-red-500 text-white'}`}>
          {isActiva ? `⏱ ${tiempoRestanteTexto}` : 'FINALIZADA'}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-medium mb-2 tracking-tight text-foreground">{auction.titulo}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 font-light leading-relaxed">
          {auction.descripcion || "Sin descripción detallada."}
        </p>

        <div className="mt-auto pt-5 border-t border-border/30 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Puja Actual</span>
            <span className="text-2xl font-semibold tracking-tighter text-foreground">
              ${Number(precioActual).toLocaleString("es-AR")}
            </span>
          </div>
          <Link
            href={`/subastas/${auction.id}`}
            className="text-sm font-medium border-b border-transparent hover:border-foreground transition-colors pb-0.5 text-muted-foreground hover:text-foreground"
          >
            Participar ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
