"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as moduleService from "@/services/moduleService";
import type { ModuleRecord } from "@/services/moduleService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_MODULE,
  PERMISSION_VIEW,
  PERMISSION_CREATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { ModuleRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Colección", column: "id", order: 1, display: true, filter: true },
  { header: "Descripción", column: "description", order: 2, display: true, filter: true },
];

export interface ModulesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function ModulesScreen({ refreshTrigger, onRefresh }: ModulesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<ModuleRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await moduleService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar módulos.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchModules();
    onRefresh?.();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_MODULE)) return;
    router.push("/system/modules/add");
  };

  const openEdit = (module: ModuleRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_VIEW, MODULE_MODULE)) return;
    router.push("/system/modules/edit/" + encodeURIComponent(module.id));
  };

  /** Al hacer clic en el nombre de la colección (link): abre la pantalla info. */
  const openInfo = (module: ModuleRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_VIEW, MODULE_MODULE)) return;
    router.push("/system/modules/info/" + encodeURIComponent(module.id));
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_MODULE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await moduleService.removeMany(selected);
      tableRef.current?.clearSelectedRows();
      await fetchModules();
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
    <DpContent title="MÓDULOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por colección o descripción..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ModuleRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="id"
        onDetail={openInfo}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por colección o descripción..."
        emptyMessage='No hay módulos en la colección "modules".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
