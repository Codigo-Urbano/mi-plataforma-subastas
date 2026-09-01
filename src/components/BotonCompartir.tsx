"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface BotonCompartirProps {
  url: string;
  titulo: string;
}

export default function BotonCompartir({ url, titulo }: BotonCompartirProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTexto = encodeURIComponent(`¡Mira esta subasta: ${titulo}!\n\n`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-border"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartir
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold mb-4 text-center">Compartir Subasta</h3>

            {/* Código QR */}
            <div className="flex justify-center mb-6 bg-white p-4 rounded-xl mx-auto w-fit">
              <QRCodeSVG 
                value={url} 
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Copiar Enlace */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Enlace directo</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={url} 
                  readOnly 
                  className="flex-1 bg-muted border border-input rounded-lg px-3 py-2 text-sm outline-none text-muted-foreground"
                />
                <button 
                  onClick={handleCopy}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="grid grid-cols-2 gap-3">
              <a 
                href={`https://wa.me/?text=${encodedTexto}${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
              >
                WhatsApp
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
