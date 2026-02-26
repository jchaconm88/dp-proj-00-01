"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tripService from "@/services/tripService";
import type { TripStopRecord, TripRecord } from "@/services/tripService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_TRIP,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import SetTripStopDialog from "./SetTripStopDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Orden", column: "order", order: 1, display: true, filter: true },
  { header: "Tipo", column: "type", order: 2, display: true, filter: true },
  { header: "Nombre", column: "name", order: 3, display: true, filter: true },
  { header: "Lat", column: "lat", order: 4, display: true, filter: true },
  { header: "Lng", column: "lng", order: 5, display: true, filter: true },
  { header: "Estado", column: "status", order: 6, display: true, filter: true },
  { header: "Llegada planificada", column: "plannedArrival", order: 7, display: true, filter: true },
];

export interface TripStopsScreenProps {
  tripId: string;
}

export default function TripStopsScreen({ tripId }: TripStopsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<TripStopRecord>>(null);
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editStopId, setEditStopId] = useState<string | null>(null);

  const fetchTrip = async () => {
    const t = await tripService.getTrip(tripId);
    setTrip(t ?? null);
  };

  const fetchStops = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await tripService.listTripStops(tripId);
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar paradas.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  useEffect(() => {
    fetchStops();
  }, [tripId, refreshTrigger]);

  const handleRefresh = () => {
    fetchStops();
    fetchTrip();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRIP)) return;
    setShowAdd(true);
    setEditStopId(null);
  };

  const openEdit = (row: TripStopRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRIP)) return;
    setEditStopId(row.id);
    setShowAdd(false);
  };

  const openEvidence = (row: { id: string }) => {
    router.push(`/transport/trips/${encodeURIComponent(tripId)}/trip-stops/${encodeURIComponent(row.id)}/evidence`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRIP)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const s of selected) {
        await tripService.removeTripStop(tripId, s.id);
      }
      tableRef.current?.clearSelectedRows();
      await fetchStops();
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
    setEditStopId(null);
  };

  const showDialog = showAdd || !!editStopId;

  return (
    <DpContent title={trip ? `Paradas: ${trip.id}` : "Paradas del viaje"}>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/transport/trips")}
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Volver a viajes
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
        filterPlaceholder="Filtrar paradas..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<TripStopRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay paradas en este viaje."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetTripStopDialog
        visible={showDialog}
        tripId={tripId}
        stopId={editStopId}
        onSuccess={onDialogSuccess}
        onHide={() => {
          setShowAdd(false);
          setEditStopId(null);
        }}
        onOpenEvidence={openEvidence}
      />
    </DpContent>
  );
}
