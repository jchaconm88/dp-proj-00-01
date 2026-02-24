"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as userService from "@/services/userService";
import type { UserRecord } from "@/services/userService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_USER,
  PERMISSION_VIEW,
  PERMISSION_CREATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { UserRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "displayName", order: 1, display: true, filter: true },
  { header: "Correo", column: "email", order: 2, display: true, filter: true },
  { header: "Roles", column: "role", order: 3, display: true, filter: true },
];

export interface UsersScreenProps {
  /** Cuando cambia, se vuelve a cargar la lista (ej. tras guardar en un diálogo) */
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function UsersScreen({ refreshTrigger, onRefresh }: UsersScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<UserRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await userService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchUsers();
    onRefresh?.();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_USER)) return;
    router.push("/system/users/add");
  };

  const openEdit = (user: UserRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_VIEW, MODULE_USER)) return;
    router.push(`/system/users/edit/${user.id}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_USER)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await userService.removeMany(selected);
      tableRef.current?.clearSelectedRows();
      await fetchUsers();
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
    <DpContent title="USUARIOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre, correo o rol..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<UserRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="displayName"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por nombre, correo o rol..."
        emptyMessage='No hay usuarios en la colección "users".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
