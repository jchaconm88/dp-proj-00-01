"use client";

import { useParams, useRouter } from "next/navigation";
import { DpContent } from "@/components/DpContent";
import EvidenceScreen from "./EvidenceScreen";

export default function EvidencePage() {
  const params = useParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : "";
  const stopId = typeof params.stopId === "string" ? params.stopId : "";
  const router = useRouter();

  if (!tripId || !stopId) {
    return (
      <DpContent title="Evidencias">
        <p className="text-zinc-500">Viaje o parada no especificados.</p>
        <button
          type="button"
          onClick={() => router.push("/transport/trips")}
          className="mt-2 text-primary-600 hover:underline"
        >
          Volver a viajes
        </button>
      </DpContent>
    );
  }

  return <EvidenceScreen tripId={tripId} stopId={stopId} />;
}
