import type { Metadata } from 'next';
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ConsolaPuja from "./ConsolaPuja";
import Estrellas from "@/components/Estrellas";
import BotonCompartir from "@/components/BotonCompartir";
import BotonFavorito from "@/components/BotonFavorito";
import { obtenerPromedioCalificacion } from "./actions";
import { obtenerIdsFavoritos } from "@/app/favoritos/actions";

export const revalidate = 0;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auction } = await supabase
    .from("subastas")
    .select("titulo, descripcion, imagen_url")
    .eq("id", id)
    .single();

  if (!auction) {
    return { title: 'Subasta no encontrada' };
  }

  const title = `¡Mira esta subasta: ${auction.titulo}!`;
  const description = auction.descripcion ? auction.descripcion.substring(0, 150) + "..." : "Ingresa para ver el precio actual y participar en la puja.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: auction.imagen_url ? [{ url: auction.imagen_url, width: 800, height: 600, alt: auction.titulo }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: auction.imagen_url ? [auction.imagen_url] : [],
    }
  };
}

export default async function SubastaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Obtener la subasta
  const { data: auction, error } = await supabase
    .from("subastas")
    .select("*, perfiles(email, nickname)")
    .eq("id", id)
    .single();

  if (error || !auction) {
    notFound();
  }

  // Obtener reputación del vendedor
  const reputacionVendedor = await obtenerPromedioCalificacion(auction.vendedor_id);

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const misFavoritos = await obtenerIdsFavoritos();

  // Formateador
  const getTiempoRestante = (fechaFin: string) => {
    const fin = new Date(fechaFin).getTime();
    const ahora = new Date().getTime();
    const diferencia = fin - ahora;

    if (diferencia <= 0) return "Finalizada";

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m restantes`;
  };

  const isOwner = user?.id === auction.vendedor_id;
  const isActiva = auction.estado === "activa" && new Date(auction.fecha_fin).getTime() > Date.now();

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-flex items-center gap-2">
        &larr; Volver al inicio
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        {/* Lado Izquierdo: Imagen */}
        <div className="rounded-2xl overflow-hidden glass border border-border bg-muted flex items-center justify-center min-h-[400px] relative">
          <BotonFavorito subastaId={auction.id} initialIsFavorito={misFavoritos.includes(auction.id)} currentPath={`/subastas/${auction.id}`} />
          {auction.imagen_url ? (
            <img
              src={auction.imagen_url}
              alt={auction.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground">Sin foto del producto</span>
          )}
        </div>

        {/* Lado Derecho: Detalles y Pujas */}
        <div className="flex flex-col">
          {/* Título y Compartir */}
          <div className="flex justify-between items-start mb-6 gap-4">
            <h1 className="text-3xl font-bold">{auction.titulo}</h1>
            <BotonCompartir 
              url={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://subastas-pro.com'}/subastas/${auction.id}`} 
              titulo={auction.titulo} 
            />
          </div>

          {/* Consola de Puja en Tiempo Real */}
          <ConsolaPuja
            subastaId={auction.id}
            initialPrecioActual={auction.precio_actual}
            initialFechaFin={auction.fecha_fin}
            isOwner={isOwner}
            isLoggedIn={!!user}
          />

          {/* Detalles Técnicos */}
          <div className="grid grid-cols-2 gap-4 text-sm mt-auto">
            <div className="glass p-4 rounded-lg border border-border">
              <p className="text-muted-foreground">Precio Base</p>
              <p className="font-medium">${Number(auction.precio_base).toLocaleString("es-AR")}</p>
            </div>
            <div className="glass p-4 rounded-lg border border-border">
              <p className="text-muted-foreground">Vendedor</p>
              <p className="font-medium truncate mb-1 text-lg">@{auction.perfiles?.nickname || auction.perfiles?.email?.split('@')[0]}</p>
              <Estrellas 
                promedio={reputacionVendedor.promedio} 
                total={reputacionVendedor.total} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
