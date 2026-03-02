"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tripService from "@/services/tripService";
import type { TripRecord } from "@/services/tripService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_TRIP,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import { TRIP_STATUS } from "@/constants/statusOptions";

export type { TripRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Ruta", column: "routeCodeDisplay", order: 2, display: true, filter: true },
  { header: "Conductor", column: "driver", order: 3, display: true, filter: true },
  { header: "Vehículo", column: "vehicle", order: 4, display: true, filter: true },
  { header: "Estado", column: "status", order: 5, display: true, filter: true, type: "status", typeOptions: TRIP_STATUS },
  { header: "Inicio programado", column: "scheduledStart", order: 6, display: true, filter: true, type: "datetime" },
];

export interface TripsScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function TripsScreen({ refreshTrigger, onRefresh }: TripsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<TripRecord & { routeCodeDisplay?: string }>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await tripService.listTrips();
      tableRef.current?.setDatasource(
        list.map((t) => ({
          ...t,
          routeCodeDisplay: (t.routeCode || t.routeId || "—").trim(),
          driver: (t.driver || t.driverId || "—").trim(),
          vehicle: (t.vehicle || t.vehicleId || "—").trim(),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar viajes.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchList();
    onRefresh?.();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRIP)) return;
    router.push("/transport/trips/add");
  };

  const openEdit = (row: TripRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRIP)) return;
    router.push(`/transport/trips/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRIP)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await tripService.removeManyTrips(selected);
      tableRef.current?.clearSelectedRows();
      await fetchList();
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

  return (
    <DpContent title="VIAJES">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por código, id, ruta..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<TripRecord & { routeCodeDisplay?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay viajes en la colección "trips".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
