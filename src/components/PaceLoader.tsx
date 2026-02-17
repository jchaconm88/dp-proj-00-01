"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/** Tiempo para ir de 0% a 90% (avance “rápido” hasta esperar la carga real) */
const PROGRESS_DURATION_MS = 400;
/** Tiempo en 100% antes de ocultar */
const COMPLETE_DELAY_MS = 200;
/** Si no hay cambio de ruta, completar y ocultar tras este tiempo (evita quedarse en 90% para siempre) */
const MAX_WAIT_MS = 8000;

export default function PaceLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const isFirstMount = useRef(true);
  const loadingStarted = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number>(0);

  const clearAll = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  /** Inicia la barra (p. ej. al hacer clic en un enlace). Avanza hasta 90% y se queda esperando. */
  const startLoading = () => {
    loadingStarted.current = true;
    setVisible(true);
    setProgress(0);

    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(90, (elapsed / PROGRESS_DURATION_MS) * 90);
      setProgress(p);
      if (p < 90) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  /** Lleva la barra a 100% y la oculta (cuando la ruta ya cambió o tras timeout). */
  const completeAndHide = () => {
    clearAll();
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      loadingStarted.current = false;
    }, COMPLETE_DELAY_MS);
    timeoutsRef.current.push(t);
  };

  // Al hacer clic en un enlace interno, arrancar la barra
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;
      startLoading();
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Cuando cambia la ruta, la nueva página está lista: completar y ocultar
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (loadingStarted.current) {
      completeAndHide();
      return;
    }

    // Navegación programática (router.push, etc.): mostrar barra breve y cerrar
    setVisible(true);
    setProgress(0);
    const t1 = setTimeout(() => setProgress(90), 80);
    const t2 = setTimeout(completeAndHide, 300);
    timeoutsRef.current = [t1, t2];
    return clearAll;
  }, [pathname]);

  // Si llevamos mucho en 90% sin cambio de ruta (enlace ancla, error, etc.), cerrar igual
  useEffect(() => {
    if (!visible || progress < 90 || progress >= 100) return;
    const t = setTimeout(completeAndHide, MAX_WAIT_MS);
    timeoutsRef.current.push(t);
    return () => clearTimeout(t);
  }, [visible, progress]);

  if (!visible) return null;

  return (
    <div
      className="pace-loader fixed left-0 top-0 z-[9999] h-1 w-full overflow-hidden"
      aria-hidden
    >
      <div
        className="pace-bar h-full transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
