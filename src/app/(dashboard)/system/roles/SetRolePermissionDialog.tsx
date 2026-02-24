"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import * as roleService from "@/services/roleService";
import type { RolePermissions } from "@/services/roleService";
import * as moduleService from "@/services/moduleService";
import type { ModuleRecord, ModulePermission } from "@/services/moduleService";

export interface SetRolePermissionDialogProps {
  visible: boolean;
  roleId: string;
  /** null = agregar (elegir módulo), string = editar ese módulo */
  editModuleId: string | null;
  currentPermissions: RolePermissions;
  onSuccess: () => void | Promise<void>;
  onHide: () => void;
}

export default function SetRolePermissionDialog({
  visible,
  roleId,
  editModuleId,
  currentPermissions,
  onSuccess,
  onHide,
}: SetRolePermissionDialogProps) {
  const isEdit = editModuleId != null;
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(editModuleId);
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setSelectedModuleId(editModuleId);
    if (editModuleId) {
      setSelectedCodes(currentPermissions[editModuleId] ?? []);
    } else {
      setSelectedCodes([]);
    }
  }, [visible, editModuleId, currentPermissions]);

  useEffect(() => {
    if (!visible) return;
    moduleService.list().then(setModules).catch(() => setModules([]));
  }, [visible]);

  useEffect(() => {
    if (!selectedModuleId) {
      setModulePermissions([]);
      return;
    }
    moduleService.get(selectedModuleId).then((m) => {
      setModulePermissions(Array.isArray(m?.permissions) ? m.permissions : []);
      if (isEdit && selectedModuleId === editModuleId) return;
      setSelectedCodes(currentPermissions[selectedModuleId] ?? []);
    }).catch(() => setModulePermissions([]));
  }, [selectedModuleId, isEdit, editModuleId, currentPermissions]);

  const save = async () => {
    const moduleId = isEdit ? editModuleId : selectedModuleId;
    if (!moduleId) return;
    setSaving(true);
    setError(null);
    try {
      const newPermissions: RolePermissions = { ...currentPermissions, [moduleId]: [...selectedCodes] };
      await roleService.edit(roleId, { permissions: newPermissions });
      await onSuccess();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const fullAccessModule = selectedCodes.includes("*");
  const codeOptions = modulePermissions.map((p) => ({ label: p.label || p.code, value: p.code }));
  const selectedCodesOnly = selectedCodes.filter((c) => c !== "*");

  const onFullAccessModuleChange = (checked: boolean) => {
    setSelectedCodes(checked ? ["*"] : []);
  };

  return (
    <Dialog
      header={isEdit ? "Editar permisos del módulo" : "Agregar permisos por módulo"}
      visible={visible}
      style={{ width: "28rem" }}
      onHide={onHide}
      closable={!saving}
      closeOnEscape={!saving}
      dismissableMask={!saving}
      modal
    >
      <div className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        {!isEdit && (
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Módulo</label>
            <Dropdown
              value={selectedModuleId}
              options={modules.map((m) => ({ label: m.description || m.id, value: m.id }))}
              onChange={(e) => setSelectedModuleId(e.value)}
              placeholder="Seleccionar módulo"
              className="w-full"
            />
          </div>
        )}
        {isEdit && selectedModuleId && (
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Módulo</label>
            <span className="text-zinc-600 dark:text-zinc-400">{selectedModuleId}</span>
          </div>
        )}
        {selectedModuleId && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                inputId="module-full-access"
                checked={fullAccessModule}
                onChange={(e) => onFullAccessModuleChange(e.checked === true)}
                disabled={saving}
                className="[&+label]:cursor-pointer"
              />
              <label htmlFor="module-full-access" className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Acceso total al módulo (*)
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Permisos</label>
              <MultiSelect
                value={selectedCodesOnly}
                options={codeOptions}
                onChange={(e) => setSelectedCodes(e.value ?? [])}
                placeholder="Seleccionar permisos"
                className="w-full"
                disabled={fullAccessModule || saving}
              />
              {fullAccessModule && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Con acceso total no se pueden elegir permisos concretos.
                </span>
              )}
            </div>
          </div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
          <Button
            label={saving ? "Guardando…" : "Guardar"}
            onClick={save}
            disabled={saving || !selectedModuleId}
            loading={saving}
          />
        </div>
      </div>
    </Dialog>
  );
}
