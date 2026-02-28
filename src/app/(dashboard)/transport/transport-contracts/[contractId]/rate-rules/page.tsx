"use client";

import { useParams } from "next/navigation";
import RateRulesScreen from "./RateRulesScreen";

export default function RateRulesPage() {
  const params = useParams();
  const contractId = typeof params.contractId === "string" ? params.contractId : "";
  if (!contractId) return <div className="p-4 text-zinc-500">Contrato no especificado.</div>;
  return <RateRulesScreen contractId={contractId} />;
}
