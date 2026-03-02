"use client";

import { useState, useEffect } from "react";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import { MultiSelect } from "primereact/multiselect";
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

  const moduleOptions = modules.map((m) => ({ label: m.description || m.id, value: m.id }));

  return (
    <DpContentSet
      title={isEdit ? "Editar permisos del módulo" : "Agregar permisos por módulo"}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving}
      saveDisabled={!selectedModuleId}
      visible={visible}
      onHide={onHide}
    >
      <div className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        {!isEdit && (
          <DpInput
            type="select"
            label="Módulo"
            name="moduleId"
            value={selectedModuleId ?? ""}
            onChange={(v) => setSelectedModuleId(v ? String(v) : null)}
            options={moduleOptions}
            placeholder="Seleccionar módulo"
          />
        )}
        {isEdit && selectedModuleId && (
          <div className="flex flex-col gap-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Módulo</span>
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
      </div>
    </DpContentSet>
  );
}
