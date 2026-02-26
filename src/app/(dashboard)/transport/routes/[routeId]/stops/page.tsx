"use client";

import { useRouter, useParams } from "next/navigation";
import { DpContent } from "@/components/DpContent";
import StopsScreen from "./StopsScreen";

export default function RouteStopsPage() {
  const params = useParams();
  const routeId = typeof params.routeId === "string" ? params.routeId : "";
  const router = useRouter();

  if (!routeId) {
    return (
      <DpContent title="Paradas">
        <p className="text-zinc-500">Ruta no especificada.</p>
        <button
          type="button"
          onClick={() => router.push("/transport/routes")}
          className="mt-2 text-primary-600 hover:underline"
        >
          Volver a rutas
        </button>
      </DpContent>
    );
  }

  return <StopsScreen routeId={routeId} />;
}
