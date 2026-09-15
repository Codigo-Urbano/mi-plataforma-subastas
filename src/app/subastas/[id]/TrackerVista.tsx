"use client";

import { useEffect, useRef } from "react";

export default function TrackerVista({ subastaId }: { subastaId: string }) {
  const rastreado = useRef(false);

  useEffect(() => {
    // Evitar doble conteo
    if (rastreado.current) return;
    rastreado.current = true;

    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subastaId }),
    }).catch(() => {});
  }, [subastaId]);

  return null;
}
