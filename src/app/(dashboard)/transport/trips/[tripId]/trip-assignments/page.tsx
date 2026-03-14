"use client";

import { useParams, useRouter } from "next/navigation";
import { DpContent } from "@/components/DpContent";
import TripAssignmentsScreen from "./TripAssignmentsScreen";

export default function TripAssignmentsPage() {
  const params = useParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : "";
  const router = useRouter();

  if (!tripId) {
    return (
      <DpContent title="Asignaciones del viaje">
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

  return <TripAssignmentsScreen tripId={tripId} />;
}
