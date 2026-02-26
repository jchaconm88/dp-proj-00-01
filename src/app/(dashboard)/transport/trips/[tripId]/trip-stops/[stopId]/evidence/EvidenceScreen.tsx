"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tripService from "@/services/tripService";
import type { EvidenceRecord } from "@/services/tripService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import { MODULE_TRIP, PERMISSION_CREATE, PERMISSION_DELETE } from "@/constants/permissions";
import SetEvidenceDialog from "./SetEvidenceDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Id", column: "id", order: 1, display: true, filter: true },
  { header: "URL", column: "url", order: 2, display: true, filter: true },
  { header: "Subida", column: "uploadedAt", order: 3, display: true, filter: true },
];

export interface EvidenceScreenProps {
  tripId: string;
  stopId: string;
}

export default function EvidenceScreen({ tripId, stopId }: EvidenceScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<EvidenceRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);

  const fetchEvidence = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await tripService.listEvidence(tripId, stopId);
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar evidencias.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [tripId, stopId, refreshTrigger]);

  const handleRefresh = () => fetchEvidence();

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRIP)) return;
    setShowAdd(true);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRIP)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const e of selected) {
        await tripService.removeEvidence(tripId, stopId, e.id);
      }
      tableRef.current?.clearSelectedRows();
      await fetchEvidence();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const onDialogSuccess = () => {
    setRefreshTrigger((k) => k + 1);
    setShowAdd(false);
  };

  return (
    <DpContent title="Evidencias de la parada">
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(`/transport/trips/${encodeURIComponent(tripId)}/trip-stops`)}
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Volver a paradas del viaje
        </button>
      </div>
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<EvidenceRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="url"
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay evidencias en esta parada."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetEvidenceDialog
        visible={showAdd}
        tripId={tripId}
        stopId={stopId}
        onSuccess={onDialogSuccess}
        onHide={() => setShowAdd(false)}
      />
    </DpContent>
  );
}
