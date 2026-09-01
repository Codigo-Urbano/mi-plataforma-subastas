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
    <div className="glass rounded-xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-col relative">
      <div className="relative h-64 overflow-hidden bg-muted flex items-center justify-center">
        {auction.imagen_url ? (
          <img
            src={auction.imagen_url}
            alt={auction.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-muted-foreground">Sin imagen</span>
        )}
        <div className={`absolute top-4 right-4 backdrop-blur-md px-3 py-1 rounded-full border text-sm font-mono font-medium shadow-xl transition-colors ${isActiva ? 'bg-background/80 border-white/10 text-white' : 'bg-red-500/80 border-red-500 text-white'}`}>
          {isActiva ? `⏱ ${tiempoRestanteTexto}` : 'FINALIZADA'}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{auction.titulo}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {auction.descripcion || "Sin descripción"}
        </p>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Puja actual</p>
            <p className="text-2xl font-bold text-primary transition-all duration-300">
              ${Number(precioActual).toLocaleString("es-AR")}
            </p>
          </div>
          <div className="text-right">
            <Link
              href={`/subastas/${auction.id}`}
              className="inline-block bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ver y Pujar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
