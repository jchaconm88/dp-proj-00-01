"use client";

import { useParams, useRouter } from "next/navigation";
import { DpContent } from "@/components/DpContent";
import LocationsScreen from "./LocationsScreen";

export default function ClientLocationsPage() {
  const params = useParams();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const router = useRouter();

  if (!clientId) {
    return (
      <DpContent title="Ubicaciones">
        <p className="text-zinc-500">Cliente no especificado.</p>
        <button
          type="button"
          onClick={() => router.push("/masters/clients")}
          className="mt-2 text-primary-600 hover:underline"
        >
          Volver a clientes
        </button>
      </DpContent>
    );
  }

  return <LocationsScreen clientId={clientId} />;
}
