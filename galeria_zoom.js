
const fs = require("fs");
const content = `"use client";

import { useState, useRef, MouseEvent } from "react";

export default function GaleriaImagenes({ imagenes }: { imagenes: string[] }) {
  const [activa, setActiva] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({});
  const [isZooming, setIsZooming] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <span className="text-muted-foreground">Sin foto del producto</span>
      </div>
    );
  }

  const handleMouseMove = (e) => {
    if (!contenedorRef.current) return;
    
    // Obtener dimensiones y posición del contenedor
    const { left, top, width, height } = contenedorRef.current.getBoundingClientRect();
    
    // Calcular posición del mouse relativa al contenedor en porcentaje (0 a 100%)
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      transformOrigin: \`\${x}% \${y}%\`,
      transform: "scale(2.5)"
    });
  };

  const handleMouseEnter = () => setIsZooming(true);
  
  const handleMouseLeave = () => {
    setIsZooming(false);
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)"
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-background/50 rounded-lg overflow-hidden border border-border/50">
      {/* Imagen Principal */}
      <div 
        ref={contenedorRef}
        className="flex-1 relative w-full h-[300px] lg:h-[400px] overflow-hidden cursor-zoom-in group bg-black/5"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Imagen Base (sin zoom) para que la caja mantenga la forma y color */}
        <img
          src={imagenes[activa]}
          alt="Foto principal del producto base"
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
          style={{ opacity: isZooming ? 0 : 1 }}
        />
        
        {/* Imagen con Zoom que solo se muestra/aumenta al hacer hover */}
        <img
          src={imagenes[activa]}
          alt="Foto principal del producto con zoom"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-75 ease-out"
          style={{ 
            ...zoomStyle, 
            opacity: isZooming ? 1 : 0,
            willChange: "transform" 
          }}
        />
      </div>

      {/* Miniaturas (Solo si hay más de 1) */}
      {imagenes.length > 1 && (
        <div className="flex gap-2 p-3 bg-background border-t border-border overflow-x-auto justify-center">
          {imagenes.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiva(idx)}
              className={\`relative h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all \${
                activa === idx ? "border-primary scale-105 shadow-md opacity-100 ring-2 ring-primary/20" : "border-transparent opacity-50 hover:opacity-100 hover:scale-95"
              }\`}
            >
              <img src={img} alt={\`Miniatura \${idx + 1}\`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync("src/app/subastas/[id]/GaleriaImagenes.tsx", content, "utf8");

