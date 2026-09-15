
const fs = require("fs");
const path = "src/app/subastas/[id]/GaleriaImagenes.tsx";
const content = `"use client";

import { useState } from "react";

export default function GaleriaImagenes({ imagenes }: { imagenes: string[] }) {
  const [activa, setActiva] = useState(0);

  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <span className="text-muted-foreground">Sin foto del producto</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Imagen Principal */}
      <div className="flex-1 relative w-full h-[300px] lg:h-[400px]">
        <img
          src={imagenes[activa]}
          alt="Foto principal del producto"
          className="absolute inset-0 w-full h-full object-contain bg-black/5"
        />
      </div>

      {/* Miniaturas (Solo si hay más de 1) */}
      {imagenes.length > 1 && (
        <div className="flex gap-2 p-2 bg-background/50 border-t border-border overflow-x-auto justify-center">
          {imagenes.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiva(idx)}
              className={\`relative h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all \${
                activa === idx ? "border-primary scale-95 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              }\`}
            >
              <img src={img} alt={\`Miniatura \${idx + 1}\`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}`;
fs.writeFileSync(path, content, "utf8");

