"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as routeService from "@/services/routeService";
import type { StopRecord, RouteRecord } from "@/services/routeService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_ROUTE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import SetStopDialog from "./SetStopDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Orden", column: "order", order: 1, display: true, filter: true },
  { header: "Tipo", column: "type", order: 2, display: true, filter: true },
  { header: "Nombre", column: "name", order: 3, display: true, filter: true },
  { header: "Dirección", column: "address", order: 4, display: true, filter: true },
  { header: "Lat", column: "lat", order: 5, display: true, filter: true },
  { header: "Lng", column: "lng", order: 6, display: true, filter: true },
  { header: "Offset min", column: "estimatedArrivalOffsetMinutes", order: 7, display: true, filter: true },
];

export interface StopsScreenProps {
  routeId: string;
}

export default function StopsScreen({ routeId }: StopsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<StopRecord>>(null);
  const [route, setRoute] = useState<RouteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editStopId, setEditStopId] = useState<string | null>(null);

  const fetchRoute = async () => {
    const r = await routeService.getRoute(routeId);
    setRoute(r ?? null);
  };

  const fetchStops = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await routeService.listStops(routeId);
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
    fetchRoute();
  }, [routeId]);

  useEffect(() => {
    fetchStops();
  }, [routeId, refreshTrigger]);

  const handleRefresh = () => {
    fetchStops();
    fetchRoute();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_ROUTE)) return;
    setShowAdd(true);
    setEditStopId(null);
  };

  const openEdit = (row: StopRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_ROUTE)) return;
    setEditStopId(row.id);
    setShowAdd(false);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_ROUTE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const s of selected) {
        await routeService.removeStop(routeId, s.id);
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
    <DpContent title={route ? `Paradas: ${route.name}` : "Paradas"}>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/transport/routes")}
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Volver a rutas
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

      <DpTable<StopRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay paradas en esta ruta."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetStopDialog
        visible={showDialog}
        routeId={routeId}
        stopId={editStopId}
        onSuccess={onDialogSuccess}
        onHide={() => {
          setShowAdd(false);
          setEditStopId(null);
        }}
      />
    </DpContent>
  );
}
