"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NotFoundPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const isForbidden = reason === "forbidden";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 md:p-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {isForbidden ? "Sin permisos" : "Página no encontrada"}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {isForbidden
            ? "No tiene permisos para acceder a esta página."
            : "La página que busca no existe o ha sido movida."}
        </p>
        <Link
          href="/home"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
