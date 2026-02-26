"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as employeeService from "@/services/employeeService";
import type { EmployeeRecord } from "@/services/employeeService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_EMPLOYEE,
  PERMISSION_VIEW,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { EmployeeRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "firstName", order: 2, display: true, filter: true },
  { header: "Apellido", column: "lastName", order: 3, display: true, filter: true },
  { header: "Nº Doc", column: "documentNo", order: 4, display: true, filter: true },
  { header: "Tipo doc", column: "documentId", order: 5, display: true, filter: true },
  { header: "Teléfono", column: "phoneNo", order: 6, display: true, filter: true },
  { header: "Salario", column: "salary", order: 7, display: true, filter: true },
  { header: "F. ingreso", column: "hireDate", order: 8, display: true, filter: true },
];

export interface EmployeesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function EmployeesScreen({ refreshTrigger, onRefresh }: EmployeesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<EmployeeRecord>>(null);
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
      const list = await employeeService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar empleados.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_EMPLOYEE)) return;
    router.push("/masters/employees/add");
  };

  const openEdit = (row: EmployeeRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_EMPLOYEE)) return;
    router.push(`/masters/employees/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_EMPLOYEE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await employeeService.removeMany(selected);
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
    <DpContent title="EMPLEADOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre, documento..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<EmployeeRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="firstName"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay empleados en la colección "employees".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
