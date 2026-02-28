"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as routeService from "@/services/routeService";
import type { StopRecord, RouteRecord } from "@/services/routeService";
import { DpContentInfo, DpContentHeader } from "@/components/DpContent";
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
  { header: "Pedido", column: "orderId", order: 1, display: true, filter: true },
  { header: "Secuencia", column: "sequence", order: 2, display: true, filter: true },
  { header: "ETA", column: "eta", order: 3, display: true, filter: true },
  { header: "Ventana", column: "arrivalWindowStr", order: 4, display: true, filter: true },
  { header: "Estado", column: "status", order: 5, display: true, filter: true },
  { header: "Tipo", column: "type", order: 6, display: true, filter: true },
  { header: "Nombre", column: "name", order: 7, display: true, filter: true },
  { header: "Dirección", column: "address", order: 8, display: true, filter: true },
  { header: "Lat", column: "lat", order: 9, display: true, filter: true },
  { header: "Lng", column: "lng", order: 10, display: true, filter: true },
];

export interface StopsScreenProps {
  routeId: string;
}

export default function StopsScreen({ routeId }: StopsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<StopRecord & { arrivalWindowStr?: string }>>(null);
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
      tableRef.current?.setDatasource(
        list.map((s) => ({
          ...s,
          arrivalWindowStr:
            s.arrivalWindowStart || s.arrivalWindowEnd
              ? `${s.arrivalWindowStart || "—"} - ${s.arrivalWindowEnd || "—"}`
              : "—",
        }))
      );
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
  const backToRoutes = () => router.push("/transport/routes");

  return (
    <DpContentInfo
      title={route ? `Paradas: ${route.name}` : "Paradas"}
      backLabel="Volver a rutas"
      onBack={backToRoutes}
    >
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

      <DpTable<StopRecord & { arrivalWindowStr?: string }>
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
    </DpContentInfo>
  );
}
