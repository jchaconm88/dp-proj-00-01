"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as moduleService from "@/services/moduleService";
import type { ModuleRecord, ModuleColumn, ModulePermission } from "@/services/moduleService";
import { DpContentInfo, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import SetPermissionDialog from "../../SetPermissionDialog";
import SetColumnDialog from "../../SetColumnDialog";

interface PermissionRow extends ModulePermission {
  id: string;
}

interface ColumnRow extends ModuleColumn {
  id: string;
}

const PERMISSIONS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Etiqueta", column: "label", order: 2, display: true, filter: true },
  { header: "Descripción", column: "description", order: 3, display: true, filter: true },
];

const COLUMNS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Orden", column: "order", order: 1, display: true, filter: false },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
  { header: "Encabezado", column: "header", order: 3, display: true, filter: true },
  { header: "Filtro", column: "filter", order: 4, display: true, filter: false },
  { header: "Formato", column: "format", order: 5, display: true, filter: true },
];

export default function ModuleInfoPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = typeof params.id === "string" ? params.id : "";
  const [module, setModule] = useState<ModuleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState("");
  const [columnFilter, setColumnFilter] = useState("");
  const [selectedPermissionCount, setSelectedPermissionCount] = useState(0);
  const [selectedColumnCount, setSelectedColumnCount] = useState(0);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionEditIndex, setPermissionEditIndex] = useState<number | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [columnEditIndex, setColumnEditIndex] = useState<number | null>(null);
  const permissionTableRef = useRef<DpTableRef<PermissionRow>>(null);
  const columnTableRef = useRef<DpTableRef<ColumnRow>>(null);

  const fetchModule = async () => {
    if (!moduleId) return;
    setError(null);
    try {
      const data = await moduleService.get(moduleId);
      setModule(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar módulo.");
    }
  };

  const fetchModuleWithLoading = async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await moduleService.get(moduleId);
      setModule(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar módulo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleWithLoading();
  }, [moduleId]);

  useEffect(() => {
    if (module == null) return;
    const pRows: PermissionRow[] = (Array.isArray(module.permissions) ? module.permissions : []).map((p, i) => ({
      id: String(i),
      code: p?.code ?? "",
      label: p?.label ?? "",
      description: p?.description ?? "",
    }));
    const cRows: ColumnRow[] = (Array.isArray(module.columns) ? module.columns : []).map((col, i) => ({
      id: String(i),
      ...col,
    }));
    permissionTableRef.current?.setDatasource(pRows);
    columnTableRef.current?.setDatasource(cRows);
  }, [module]);

  const permissionRows: PermissionRow[] = (Array.isArray(module?.permissions) ? module.permissions : []).map((p, i) => ({
    id: String(i),
    code: p?.code ?? "",
    label: p?.label ?? "",
    description: p?.description ?? "",
  }));

  const columnRows: ColumnRow[] = (Array.isArray(module?.columns) ? module.columns : []).map((col, i) => ({
    id: String(i),
    ...col,
  }));

  const openAddPermission = () => {
    setPermissionEditIndex(null);
    setPermissionDialogOpen(true);
  };

  const openEditPermission = (row: PermissionRow) => {
    setPermissionEditIndex(parseInt(row.id, 10));
    setPermissionDialogOpen(true);
  };

  const openAddColumn = () => {
    setColumnEditIndex(null);
    setColumnDialogOpen(true);
  };

  const openEditColumn = (row: ColumnRow) => {
    setColumnEditIndex(parseInt(row.id, 10));
    setColumnDialogOpen(true);
  };

  const deletePermissions = async () => {
    if (!module || !moduleId) return;
    const selected = permissionTableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    const indices = new Set(selected.map((r) => parseInt(r.id, 10)));
    const newPermissions = (Array.isArray(module.permissions) ? module.permissions : []).filter((_, i) => !indices.has(i));
    setSaving(true);
    try {
      await moduleService.edit(moduleId, { permissions: newPermissions });
      await fetchModule();
      permissionTableRef.current?.clearSelectedRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const deleteColumns = async () => {
    if (!module || !moduleId) return;
    const selected = columnTableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    const indices = new Set(selected.map((r) => parseInt(r.id, 10)));
    const newColumns = module.columns.filter((_, i) => !indices.has(i));
    setSaving(true);
    try {
      await moduleService.edit(moduleId, { columns: newColumns });
      await fetchModule();
      columnTableRef.current?.clearSelectedRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionFilter = (value: string) => {
    setPermissionFilter(value);
    permissionTableRef.current?.filter(value);
  };

  const handleColumnFilter = (value: string) => {
    setColumnFilter(value);
    columnTableRef.current?.filter(value);
  };

  const backToModules = () => router.push("/system/modules");
  const editModule = () => router.push("/system/modules/edit/" + encodeURIComponent(moduleId));

  if (!moduleId) {
    return (
      <DpContentInfo
        title="MÓDULO"
        backLabel="Volver a módulos"
        onBack={backToModules}
      >
        <p className="text-zinc-500">ID de módulo no válido.</p>
      </DpContentInfo>
    );
  }

  if (loading && !module) {
    return (
      <DpContentInfo
        title="MÓDULO"
        backLabel="Volver a módulos"
        onBack={backToModules}
      >
        <p className="text-zinc-500">Cargando…</p>
      </DpContentInfo>
    );
  }

  if (!module) {
    return (
      <DpContentInfo
        title="MÓDULO"
        backLabel="Volver a módulos"
        onBack={backToModules}
      >
        <p className="text-zinc-500">Módulo no encontrado.</p>
      </DpContentInfo>
    );
  }

  return (
    <DpContentInfo
      title={module.description || module.id}
      backLabel="Volver a módulos"
      onBack={backToModules}
      editLabel="Editar módulo"
      onEdit={editModule}
    >
      <div className="space-y-8">

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Permisos */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Permisos</h2>
        <DpContentHeader
          filterValue={permissionFilter}
          onFilter={handlePermissionFilter}
          onCreate={openAddPermission}
          onDelete={deletePermissions}
          deleteDisabled={selectedPermissionCount === 0 || saving}
          filterPlaceholder="Filtrar permisos..."
        />
        <DpTable<PermissionRow>
          ref={permissionTableRef}
          tableDef={PERMISSIONS_TABLE_DEF}
          linkColumn="code"
          onDetail={openEditPermission}
          onEdit={openEditPermission}
          onSelectionChange={(rows) => setSelectedPermissionCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage="No hay permisos. Agregar para definir."
          emptyFilterMessage="No hay resultados."
        />
      </section>

      {/* Columnas */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Columnas</h2>
        <DpContentHeader
          filterValue={columnFilter}
          onFilter={handleColumnFilter}
          onCreate={openAddColumn}
          onDelete={deleteColumns}
          deleteDisabled={selectedColumnCount === 0 || saving}
          filterPlaceholder="Filtrar columnas..."
        />
        <DpTable<ColumnRow>
          ref={columnTableRef}
          tableDef={COLUMNS_TABLE_DEF}
          linkColumn="name"
          onDetail={openEditColumn}
          onEdit={openEditColumn}
          onSelectionChange={(rows) => setSelectedColumnCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage="No hay columnas. Agregar para definir."
          emptyFilterMessage="No hay resultados."
        />
      </section>

      <SetPermissionDialog
        visible={permissionDialogOpen}
        moduleId={moduleId}
        permissionIndex={permissionEditIndex}
        currentPermissions={Array.isArray(module.permissions) ? module.permissions : []}
        onSuccess={async () => {
          setPermissionDialogOpen(false);
          await fetchModule();
        }}
        onHide={() => setPermissionDialogOpen(false)}
      />
      <SetColumnDialog
        visible={columnDialogOpen}
        moduleId={moduleId}
        columnIndex={columnEditIndex}
        currentColumns={Array.isArray(module.columns) ? module.columns : []}
        onSuccess={async () => {
          setColumnDialogOpen(false);
          await fetchModule();
        }}
        onHide={() => setColumnDialogOpen(false)}
      />
      </div>
    </DpContentInfo>
  );
}
