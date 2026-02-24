"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as roleService from "@/services/roleService";
import type { RoleRecord, RolePermissions } from "@/services/roleService";
import { DpContentInfo, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import SetRolePermissionDialog from "../../SetRolePermissionDialog";

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
