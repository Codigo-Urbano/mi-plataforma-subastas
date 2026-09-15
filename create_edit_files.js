
const fs = require("fs");
const path = require("path");

const pageContent = `import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditarSubastaForm from "./EditarSubastaForm";

export default async function EditarSubastaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: auction } = await supabase.from("subastas").select("*").eq("id", id).single();
  if (!auction) notFound();
  if (auction.vendedor_id !== user.id) redirect("/");

  const { count } = await supabase.from("pujas").select("*", { count: "exact", head: true }).eq("subasta_id", id);
  const tienePujas = count ? count > 0 : false;

  return <EditarSubastaForm subasta={auction} tienePujas={tienePujas} />;
}
`;

const actionsContent = `"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateAuction(subastaId: string, prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const { data: auction } = await supabase.from("subastas").select("*").eq("id", subastaId).single();
  if (!auction || auction.vendedor_id !== user.id) return { error: "No eres el dueño de esta subasta." };

  const titulo = formData.get("titulo") as string;
  const categoria = formData.get("categoria") as string;
  const descripcion = formData.get("descripcion") as string;
  const anti_sniper = formData.get("anti_sniper") === "on";

  const updateData: any = {
    titulo,
    categoria,
    descripcion,
    anti_sniper
  };

  const { count } = await supabase.from("pujas").select("*", { count: "exact", head: true }).eq("subasta_id", subastaId);
  const tienePujas = count ? count > 0 : false;

  if (!tienePujas) {
    const precio_base = parseFloat(formData.get("precio_base") as string);
    if (!isNaN(precio_base)) {
      updateData.precio_base = precio_base;
      updateData.precio_actual = precio_base;
    }

    const fecha_fin = formData.get("fecha_fin") as string;
    const tz_offset = parseInt(formData.get("tz_offset") as string) || 0;
    if (fecha_fin) {
      const [datePart, timePart] = fecha_fin.split("T");
      const isoString = \`\${datePart}T\${timePart}:00.000Z\`;
      const parsedUtcMs = new Date(isoString).getTime();
      const trueUtcMs = parsedUtcMs + (tz_offset * 60000);
      updateData.fecha_fin = new Date(trueUtcMs).toISOString();
    }
  }

  const imagenes = formData.getAll("imagen") as File[];
  const validImagenes = imagenes.filter(img => img.size > 0).slice(0, 5);

  if (validImagenes.length > 0) {
    let imagenesUrls = [];
    for (const imagen of validImagenes) {
      const fileExt = imagen.name.split(".").pop();
      const fileName = \`\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}.\${fileExt}\`;
      const { error: uploadError } = await supabase.storage.from("productos").upload(fileName, imagen);
      if (uploadError) return { error: "Error al subir una de las imágenes." };
      const { data: publicUrlData } = supabase.storage.from("productos").getPublicUrl(fileName);
      imagenesUrls.push(publicUrlData.publicUrl);
    }
    updateData.imagenes = imagenesUrls;
    updateData.imagen_url = imagenesUrls[0];
  }

  const { error: updateError } = await supabase.from("subastas").update(updateData).eq("id", subastaId);
  if (updateError) return { error: "Error al actualizar la subasta." };

  revalidatePath(\`/subastas/\${subastaId}\`);
  revalidatePath(\`/\`);
  
  redirect(\`/subastas/\${subastaId}\`);
}
`;

const formContent = `"use client";
import { useActionState, useState, useEffect } from "react";
import { updateAuction } from "./actions";
import Link from "next/link";

export default function EditarSubastaForm({ subasta, tienePujas }: { subasta: any, tienePujas: boolean }) {
  const updateAuctionWithId = updateAuction.bind(null, subasta.id);
  const [error, action, isPending] = useActionState(updateAuctionWithId, null);

  const [imagePreviews, setImagePreviews] = useState<string[]>(
    subasta.imagenes?.length > 0 ? subasta.imagenes : (subasta.imagen_url ? [subasta.imagen_url] : [])
  );

  const [fechaFinLocal, setFechaFinLocal] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [tzOffset, setTzOffset] = useState(0);

  useEffect(() => {
    const offset = new Date().getTimezoneOffset();
    setTzOffset(offset);

    if (subasta.fecha_fin) {
      const utcDate = new Date(subasta.fecha_fin).getTime();
      const localDate = new Date(utcDate - offset * 60000).toISOString().slice(0, 16);
      setFechaFinLocal(localDate);
    }

    const nowLocal = new Date(Date.now() - offset * 60000).toISOString().slice(0, 16);
    const maxLocal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 - offset * 60000).toISOString().slice(0, 16);
    setMinDate(nowLocal);
    setMaxDate(maxLocal);
  }, [subasta.fecha_fin]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const limitedFiles = files.slice(0, 5);
    if (limitedFiles.length > 0) {
      const urls = limitedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href={\`/subastas/\${subasta.id}\`} className="text-sm text-primary hover:underline mb-8 inline-flex items-center gap-2">
        &larr; Volver a la subasta
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Editar Subasta</h1>
      <p className="text-muted-foreground mb-8">
        Modifica los detalles de tu publicación. {tienePujas && <span className="text-red-500 font-medium">Como ya hay pujas, el precio base y la fecha no se pueden modificar.</span>}
      </p>

      <div className="glass p-6 md:p-8 rounded-xl border border-border">
        <form action={action} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Información */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="titulo">Título del Producto *</label>
                <input id="titulo" name="titulo" type="text" required defaultValue={subasta.titulo} className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="categoria">Categoría *</label>
                <select id="categoria" name="categoria" required defaultValue={subasta.categoria} className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none">
                  <option value="Vehículos">Vehículos</option>
                  <option value="Inmuebles">Inmuebles</option>
                  <option value="Electrónica">Electrónica</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Arte y Colecciones">Arte y Colecciones</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="descripcion">Descripción</label>
                <textarea id="descripcion" name="descripcion" rows={4} defaultValue={subasta.descripcion} className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="precio_base">Precio Base ($) *</label>
                  <input id="precio_base" name="precio_base" type="number" min="0" step="0.01" required defaultValue={subasta.precio_base} disabled={tienePujas} className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="fecha_fin">Fecha de Fin *</label>
                  <input id="fecha_fin" name="fecha_fin" type="datetime-local" required defaultValue={fechaFinLocal} min={minDate} max={maxDate} disabled={tienePujas} className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm disabled:opacity-50" />
                  <input type="hidden" name="tz_offset" value={tzOffset} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input id="anti_sniper" name="anti_sniper" type="checkbox" defaultChecked={subasta.anti_sniper} className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/50" />
                <label className="text-sm font-medium" htmlFor="anti_sniper">Activar sistema Anti-Sniper</label>
              </div>
            </div>

            {/* Columna Derecha: Imagen */}
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1.5">Fotos del Producto (Nuevas reemplazan a las actuales)</label>
              <div className="relative border-2 border-dashed border-border rounded-xl min-h-[16rem] p-4 flex flex-col items-center justify-center bg-background/30 hover:bg-background/50 transition-colors cursor-pointer group">
                <input type="file" name="imagen" accept="image/png, image/jpeg, image/webp" multiple onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 w-full h-full">
                    {imagePreviews.map((url, i) => (
                      <div key={i} className={\`relative rounded-lg overflow-hidden border border-white/10 \${i === 0 && imagePreviews.length % 2 !== 0 ? "col-span-2 aspect-video" : "aspect-square"}\`}>
                        <img src={url} alt={\`Preview \${i+1}\`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">Principal</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="mt-2 text-sm text-muted-foreground">Sube hasta 5 fotos nuevas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</p>}

          <div className="pt-4 border-t border-border/50 flex justify-end">
            <button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-lg transition-colors flex items-center justify-center min-w-[200px]">
              {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

fs.writeFileSync("src/app/subastas/[id]/editar/page.tsx", pageContent, "utf8");
fs.writeFileSync("src/app/subastas/[id]/editar/actions.ts", actionsContent, "utf8");
fs.writeFileSync("src/app/subastas/[id]/editar/EditarSubastaForm.tsx", formContent, "utf8");

