"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as routeService from "@/services/routeService";
import type { RouteRecord } from "@/services/routeService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_ROUTE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { RouteRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
  { header: "Plan", column: "planCodeDisplay", order: 3, display: true, filter: true },
  { header: "Km estimados", column: "totalEstimatedKm", order: 4, display: true, filter: true },
  { header: "Horas estimadas", column: "totalEstimatedHours", order: 5, display: true, filter: true },
  { header: "Activo", column: "active", order: 6, display: true, filter: true },
];

export interface RoutesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function RoutesScreen({ refreshTrigger, onRefresh }: RoutesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<RouteRecord & { planCodeDisplay?: string }>>(null);
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
      const routes = await routeService.listRoutes();
      tableRef.current?.setDatasource(
        routes.map((r) => ({
          ...r,
          planCodeDisplay: (r.planCode || r.planId || "—").trim(),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar rutas.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_ROUTE)) return;
    router.push("/transport/routes/add");
  };

  const openEdit = (row: RouteRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_ROUTE)) return;
    router.push(`/transport/routes/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_ROUTE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await routeService.removeManyRoutes(selected);
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
    <DpContent title="RUTAS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre, código..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<RouteRecord & { planCodeDisplay?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay rutas en la colección "routes".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
