"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as roleService from "@/services/roleService";
import type { RoleRecord } from "@/services/roleService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_ROLE,
  PERMISSION_VIEW,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { RoleRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "name", order: 1, display: true, filter: true },
  { header: "Descripción", column: "description", order: 2, display: true, filter: true },
];

export interface RolesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function RolesScreen({ refreshTrigger, onRefresh }: RolesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<RoleRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await roleService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar roles.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchRoles();
    onRefresh?.();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_ROLE)) return;
    router.push("/system/roles/add");
  };

  const openEdit = (role: RoleRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_ROLE)) return;
    router.push(`/system/roles/edit/${role.id}`);
  };

  /** Al hacer clic en el nombre (link): abre la pantalla info. */
  const openInfo = (role: RoleRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_VIEW, MODULE_ROLE)) return;
    router.push("/system/roles/info/" + encodeURIComponent(role.id));
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_ROLE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await roleService.removeMany(selected);
      tableRef.current?.clearSelectedRows();
      await fetchRoles();
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
    <DpContent title="ROLES">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre o descripción..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<RoleRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openInfo}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por nombre o descripción..."
        emptyMessage='No hay roles en la colección "roles".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
