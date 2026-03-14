"use client";

import { useParams, useRouter } from "next/navigation";
import { DpContent } from "@/components/DpContent";
import TripChargesScreen from "./TripChargesScreen";

export default function TripChargesPage() {
  const params = useParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : "";
  const router = useRouter();

  if (!tripId) {
    return (
      <DpContent title="Cargos del viaje">
        <p className="text-zinc-500">Viaje no especificado.</p>
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

  return <TripChargesScreen tripId={tripId} />;
}
