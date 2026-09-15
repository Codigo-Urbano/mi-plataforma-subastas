"use client";

import { useActionState, useState, useEffect } from "react";
import { createAuction } from "./actions";
import { useRouter } from "next/navigation";

export default function VenderPage() {
  const router = useRouter();
  const [error, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createAuction(formData);
      
      if (result?.success && result.subastaId) {
        // Redirigir a la API de checkout para cobrar la publicación usando window.location
        // Esto evita el error de hidratación "Failed to fetch" porque la API redirige a un dominio externo (MercadoPago)
        window.location.href = `/api/checkout-publicacion?subastaId=${result.subastaId}`;
      }
      
      return result?.error || null;
    },
    null
  );

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Limitar a máximo 5 fotos
    const limitedFiles = files.slice(0, 5);
    
    // Revocar URLs viejas para evitar memory leaks
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    if (limitedFiles.length > 0) {
      const urls = limitedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
    } else {
      setImagePreviews([]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Crear Nueva Subasta</h1>
      <p className="text-muted-foreground mb-8">
        Sube hasta 5 fotos de tu producto, establece un precio base y deja que comience la puja.
      </p>

      <div className="glass p-6 md:p-8 rounded-xl border border-border">
        <form action={action} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Información */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="titulo">
                  Título del Producto *
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="Ej. Reloj Rolex Submariner"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="categoria">
                  Categoría *
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none"
                >
                  <option value="Vehículos">Vehículos</option>
                  <option value="Inmuebles">Inmuebles</option>
                  <option value="Electrónica">Electrónica</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Arte y Colecciones">Arte y Colecciones</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="descripcion">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={4}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none"
                  placeholder="Describe los detalles, estado y características..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="precio_base">
                    Precio Base ($) *
                  </label>
                  <input
                    id="precio_base"
                    name="precio_base"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="fecha_fin">
                    Fecha de Fin *
                  </label>
                  <input
                    id="fecha_fin"
                    name="fecha_fin"
                    type="datetime-local"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="anti_sniper"
                  name="anti_sniper"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/50"
                />
                <label className="text-sm font-medium" htmlFor="anti_sniper">
                  Activar sistema Anti-Sniper
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Extiende el tiempo si hay pujas en los últimos minutos.
              </p>
            </div>

            {/* Columna Derecha: Imagen */}
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1.5">
                Fotos del Producto (Máx 5) *
              </label>
              <div className="relative border-2 border-dashed border-border rounded-xl min-h-[16rem] p-4 flex flex-col items-center justify-center bg-background/30 hover:bg-background/50 transition-colors cursor-pointer group">
                <input
                  type="file"
                  name="imagen"
                  accept="image/png, image/jpeg, image/webp"
                  multiple
                  required
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 w-full h-full">
                    {imagePreviews.map((url, i) => (
                      <div key={i} className={`relative rounded-lg overflow-hidden border border-white/10 ${i === 0 && imagePreviews.length % 2 !== 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                        <img src={url} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">Principal</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <svg className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Haz clic o arrastra hasta 5 fotos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      La primera foto será la principal
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</p>}

          <div className="pt-4 border-t border-border/50 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-lg transition-colors flex items-center justify-center min-w-[200px]"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Publicar Subasta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
