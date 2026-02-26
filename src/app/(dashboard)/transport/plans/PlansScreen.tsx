"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as planService from "@/services/planService";
import type { PlanRecord } from "@/services/planService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_PLAN,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { PlanRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Fecha", column: "date", order: 1, display: true, filter: true },
  { header: "Zona", column: "zone", order: 2, display: true, filter: true },
  { header: "Tipo vehículo", column: "vehicleType", order: 3, display: true, filter: true },
  { header: "Pedidos", column: "orderIdsStr", order: 4, display: true, filter: true },
  { header: "Estado", column: "status", order: 5, display: true, filter: true },
];

export interface PlansScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function PlansScreen({ refreshTrigger, onRefresh }: PlansScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<PlanRecord & { orderIdsStr?: string }>>(null);
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
      const list = await planService.list();
      tableRef.current?.setDatasource(
        list.map((p) => ({
          ...p,
          orderIdsStr:
            p.orderIds.length === 0
              ? "—"
              : `${p.orderIds.length} pedido${p.orderIds.length !== 1 ? "s" : ""}`,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar planes.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_PLAN)) return;
    router.push("/transport/plans/add");
  };

  const openEdit = (row: PlanRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_PLAN)) return;
    router.push(`/transport/plans/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_PLAN)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await planService.removeMany(selected);
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
    <DpContent title="PLANES">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por fecha, zona, tipo..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<PlanRecord & { orderIdsStr?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="date"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay planes en la colección "plans".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
