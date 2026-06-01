"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ZoomableAvatarProps {
  src?: string | null;
  alt: string;
  fallbackText: string;
  className?: string; // Por exemplo: "w-28 h-28"
  fallbackClassName?: string;
  avatarClassName?: string;
}

export function ZoomableAvatar({
  src,
  alt,
  fallbackText,
  className = "w-28 h-28",
  fallbackClassName = "",
  avatarClassName = "",
}: ZoomableAvatarProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isZoomed) return;

    // Bloquear scroll da página enquanto ampliado
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isZoomed]);

  const hasImage = !!src;

  return (
    <>
      <div
        onClick={() => hasImage && setIsZoomed(true)}
        className={`group relative ${className} select-none ${
          hasImage ? "cursor-pointer" : ""
        }`}
      >
        <Avatar className={`w-full h-full shadow-md border-[3px] border-white dark:border-card transition-transform duration-300 ${hasImage ? "group-hover:scale-[1.03]" : ""} ${avatarClassName}`}>
          {src ? (
            <AvatarImage src={src} alt={alt} className="object-cover" />
          ) : (
            <AvatarFallback className={`bg-primary text-white font-bold ${fallbackClassName}`}>
              {fallbackText}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Hover overlay para indicar possibilidade de zoom */}
        {hasImage && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-[3px] border-transparent">
            <span className="material-symbols-outlined text-white text-3xl font-light animate-in zoom-in-75 duration-200">
              zoom_in
            </span>
          </div>
        )}
      </div>

      {/* Lightbox / Modal de zoom */}
      {isZoomed && src && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-black/20 animate-in zoom-in-95 duration-300 flex items-center justify-center"
          >
            {/* Botão de Fechar */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition-all border border-white/20"
              aria-label="Fechar visualização"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Imagem Ampliada */}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl select-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
