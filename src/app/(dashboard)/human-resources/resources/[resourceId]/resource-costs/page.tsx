"use client";

import { useParams, useRouter } from "next/navigation";
import { DpContent } from "@/components/DpContent";
import ResourceCostsScreen from "./ResourceCostsScreen";

export default function ResourceCostsPage() {
  const params = useParams();
  const resourceId = typeof params.resourceId === "string" ? params.resourceId : "";
  const router = useRouter();

  if (!resourceId) {
    return (
      <DpContent title="Costos del recurso">
        <p className="text-zinc-500">Recurso no especificado.</p>
        <button
          type="button"
          onClick={() => router.push("/human-resources/resources")}
          className="mt-2 text-primary-600 hover:underline"
        >
          Volver a recursos
        </button>
      </DpContent>
    );
  }

  return <ResourceCostsScreen resourceId={resourceId} />;
}
