"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "primereact/checkbox";
import * as roleService from "@/services/roleService";
import type { RoleRecord, RolePermissions } from "@/services/roleService";
import { DpContentInfo, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import SetRolePermissionDialog from "../../SetRolePermissionDialog";

const FULL_ACCESS_MODULE = "*";
const FULL_ACCESS_CODE = "*";

interface PermissionRow {
  id: string;
  moduleId: string;
  permissions: string[];
}

const PERMISSIONS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Módulo", column: "moduleId", order: 1, display: true, filter: true },
  { header: "Permisos", column: "permissions", order: 2, display: true, filter: true },
];

export default function RoleInfoPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = typeof params.id === "string" ? params.id : "";
  const [role, setRole] = useState<RoleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState("");
  const [selectedPermissionCount, setSelectedPermissionCount] = useState(0);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionEditModuleId, setPermissionEditModuleId] = useState<string | null>(null);
  const permissionTableRef = useRef<DpTableRef<PermissionRow>>(null);

  const fetchRole = async () => {
    if (!roleId) return;
    setError(null);
    try {
      const data = await roleService.get(roleId);
      setRole(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar rol.");
    }
  };

  const fetchRoleWithLoading = async () => {
    if (!roleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await roleService.get(roleId);
      setRole(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar rol.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleWithLoading();
  }, [roleId]);

  useEffect(() => {
    if (role == null) return;
    const perms = role.permissions ?? {};
    const rows: PermissionRow[] = Object.entries(perms).map(([moduleId, codes]) => ({
      id: moduleId,
      moduleId,
      permissions: Array.isArray(codes) ? codes : [],
    }));
    permissionTableRef.current?.setDatasource(rows);
  }, [role]);

  const permissionRows: PermissionRow[] = role
    ? Object.entries(role.permissions ?? {}).map(([moduleId, codes]) => ({
        id: moduleId,
        moduleId,
        permissions: Array.isArray(codes) ? codes : [],
      }))
    : [];

  const openAddPermission = () => {
    setPermissionEditModuleId(null);
    setPermissionDialogOpen(true);
  };

  const openEditPermission = (row: PermissionRow) => {
    setPermissionEditModuleId(row.moduleId);
    setPermissionDialogOpen(true);
  };

  const deletePermissions = async () => {
    if (!role || !roleId) return;
    const selected = permissionTableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    const toRemove = new Set(selected.map((r) => r.moduleId));
    const newPermissions: RolePermissions = {};
    for (const [moduleId, codes] of Object.entries(role.permissions ?? {})) {
      if (!toRemove.has(moduleId)) newPermissions[moduleId] = codes;
    }
    setSaving(true);
    try {
      await roleService.edit(roleId, { permissions: newPermissions });
      await fetchRole();
      permissionTableRef.current?.clearSelectedRows();
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

  const hasFullAccess =
    role != null && Array.isArray(role.permissions?.[FULL_ACCESS_MODULE]) && role.permissions[FULL_ACCESS_MODULE].includes(FULL_ACCESS_CODE);

  const onFullAccessChange = async (checked: boolean) => {
    if (!role || !roleId) return;
    setSaving(true);
    setError(null);
    const newPermissions: RolePermissions = { ...(role.permissions ?? {}) };
    if (checked) {
      newPermissions[FULL_ACCESS_MODULE] = [FULL_ACCESS_CODE];
    } else {
      delete newPermissions[FULL_ACCESS_MODULE];
    }
    try {
      await roleService.edit(roleId, { permissions: newPermissions });
      await fetchRole();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar acceso total.");
    } finally {
      setSaving(false);
    }
  };

  const backToRoles = () => router.push("/system/roles");
  const editRole = () => router.push("/system/roles/edit/" + encodeURIComponent(roleId));

  if (!roleId) {
    return (
      <DpContentInfo title="ROL" backLabel="Volver a roles" onBack={backToRoles}>
        <p className="text-zinc-500">ID de rol no válido.</p>
      </DpContentInfo>
    );
  }

  if (loading && !role) {
    return (
      <DpContentInfo title="ROL" backLabel="Volver a roles" onBack={backToRoles}>
        <p className="text-zinc-500">Cargando…</p>
      </DpContentInfo>
    );
  }

  if (!role) {
    return (
      <DpContentInfo title="ROL" backLabel="Volver a roles" onBack={backToRoles}>
        <p className="text-zinc-500">Rol no encontrado.</p>
      </DpContentInfo>
    );
  }

  return (
    <DpContentInfo
      title={role.description || role.name}
      backLabel="Volver a roles"
      onBack={backToRoles}
      editLabel="Editar rol"
      onEdit={editRole}
    >
      <div className="space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Acceso</h2>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <Checkbox
              inputId="role-full-access"
              checked={hasFullAccess}
              onChange={(e) => onFullAccessChange(e.checked === true)}
              disabled={saving}
              className="[&+label]:cursor-pointer"
            />
            <label htmlFor="role-full-access" className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
              Acceso total (permiso <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-600">*:*</code>)
            </label>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Si está activo, el rol tendrá todos los permisos sin definir módulos concretos.
            </span>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Permisos por módulo</h2>
          <DpContentHeader
            filterValue={permissionFilter}
            onFilter={handlePermissionFilter}
            onCreate={openAddPermission}
            onDelete={deletePermissions}
            deleteDisabled={selectedPermissionCount === 0 || saving}
            filterPlaceholder="Filtrar por módulo o permisos..."
          />
          <DpTable<PermissionRow>
            ref={permissionTableRef}
            tableDef={PERMISSIONS_TABLE_DEF}
            linkColumn="moduleId"
            onDetail={openEditPermission}
            onEdit={openEditPermission}
            onSelectionChange={(rows) => setSelectedPermissionCount(rows.length)}
            showFilterInHeader={false}
            emptyMessage="No hay permisos asignados. Agregar para definir."
            emptyFilterMessage="No hay resultados."
          />
        </section>

        <SetRolePermissionDialog
          visible={permissionDialogOpen}
          roleId={roleId}
          editModuleId={permissionEditModuleId}
          currentPermissions={role.permissions ?? {}}
          onSuccess={async () => {
            setPermissionDialogOpen(false);
            await fetchRole();
          }}
          onHide={() => setPermissionDialogOpen(false)}
        />
      </div>
    </DpContentInfo>
  );
}
