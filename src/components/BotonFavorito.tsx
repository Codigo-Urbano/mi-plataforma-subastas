
"use client";

import { useState } from "react";
import { toggleFavorito } from "@/app/favoritos/actions";

export default function BotonFavorito({ subastaId, initialIsFavorito, currentPath }: { subastaId: string, initialIsFavorito: boolean, currentPath: string }) {
  const [isFavorito, setIsFavorito] = useState(initialIsFavorito);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Evitar que se dispare otro evento en la card
    
    if (isLoading) return;
    setIsLoading(true);

    // Optimistic update
    setIsFavorito(!isFavorito);

    const result = await toggleFavorito(subastaId, currentPath);
    if (result?.error) {
      alert(result.error);
      setIsFavorito(isFavorito); // Revertir en caso de error
    } else if (result?.success) {
      setIsFavorito(result.isFavorito!);
    }
    
    setIsLoading(false);
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isLoading}
      className={`absolute top-4 left-4 z-10 p-2 rounded-full backdrop-blur-md border shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center
        ${isFavorito 
          ? "bg-red-500/90 border-red-500 text-white" 
          : "bg-background/80 border-white/10 text-muted-foreground hover:text-foreground"
        }`}
      aria-label={isFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={isFavorito ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-5 h-5"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}

