"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as driverService from "@/services/driverService";
import type { DriverRecord } from "@/services/driverService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_DRIVER,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { DriverRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "firstName", order: 2, display: true, filter: true },
  { header: "Apellido", column: "lastName", order: 3, display: true, filter: true },
  { header: "Nº Doc", column: "documentNo", order: 4, display: true, filter: true },
  { header: "Tipo doc", column: "documentId", order: 5, display: true, filter: true },
  { header: "Teléfono", column: "phoneNo", order: 6, display: true, filter: true },
  { header: "Licencia", column: "licenseNo", order: 7, display: true, filter: true },
  { header: "Categoría", column: "licenseCategory", order: 8, display: true, filter: true },
  { header: "Venc. licencia", column: "licenseExpiration", order: 9, display: true, filter: true },
  { header: "Tipo vínculo", column: "relationshipType", order: 10, display: true, filter: true },
  { header: "Estado", column: "status", order: 11, display: true, filter: true },
  { header: "Viaje actual", column: "currentTripId", order: 12, display: true, filter: true },
  { header: "Id empleado", column: "employeeId", order: 13, display: true, filter: true },
];

export interface DriversScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function DriversScreen({ refreshTrigger, onRefresh }: DriversScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<DriverRecord>>(null);
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
      const list = await driverService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar conductores.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_DRIVER)) return;
    router.push("/transport/drivers/add");
  };

  const openEdit = (row: DriverRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_DRIVER)) return;
    router.push(`/transport/drivers/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_DRIVER)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await driverService.removeMany(selected);
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
    <DpContent title="CONDUCTORES">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre, licencia..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<DriverRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="firstName"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay conductores en la colección "drivers".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
