"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as serviceTypeService from "@/services/serviceTypeService";
import type { ServiceTypeRecord } from "@/services/serviceTypeService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_TRANSPORT_SERVICE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import { SERVICE_TYPE_CATEGORY, CALCULATION_TYPE } from "@/constants/statusOptions";

export type { ServiceTypeRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
  { header: "Descripción", column: "description", order: 3, display: true, filter: true },
  { header: "Categoría", column: "category", order: 4, display: true, filter: true, type: "status", typeOptions: SERVICE_TYPE_CATEGORY },
  { header: "Tiempo (min)", column: "defaultServiceTimeMin", order: 5, display: true, filter: true },
  { header: "Tipo de cálculo", column: "calculationType", order: 6, display: true, filter: true, type: "status", typeOptions: CALCULATION_TYPE },
  { header: "Cita", column: "requiresAppointment", order: 7, display: true, filter: false, type: "bool" },
  { header: "Consolidar", column: "allowConsolidation", order: 8, display: true, filter: false, type: "bool" },
  { header: "Activo", column: "active", order: 9, display: true, filter: true, type: "bool" },
];

export interface TransportServicesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function TransportServicesScreen({ refreshTrigger, onRefresh }: TransportServicesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<ServiceTypeRecord>>(null);
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
      const list = await serviceTypeService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar servicios de transporte.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRANSPORT_SERVICE)) return;
    router.push("/transport/transport-services/add");
  };

  const openEdit = (row: ServiceTypeRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRANSPORT_SERVICE)) return;
    router.push(`/transport/transport-services/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRANSPORT_SERVICE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await serviceTypeService.removeMany(selected);
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
    <DpContent title="SERVICIOS DE TRANSPORTE">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por código, nombre..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ServiceTypeRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay servicios en la colección "transport-services".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
