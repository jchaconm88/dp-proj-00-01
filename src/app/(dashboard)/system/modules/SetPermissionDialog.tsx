"use client";

import { useState, useEffect } from "react";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as moduleService from "@/services/moduleService";
import type { ModulePermission } from "@/services/moduleService";

export interface SetPermissionDialogProps {
  visible: boolean;
  moduleId: string;
  /** null = agregar, number = editar en ese índice */
  permissionIndex: number | null;
  currentPermissions: ModulePermission[];
  onSuccess: () => void | Promise<void>;
  onHide: () => void;
}

export default function SetPermissionDialog({
  visible,
  moduleId,
  permissionIndex,
  currentPermissions,
  onSuccess,
  onHide,
}: SetPermissionDialogProps) {
  const isEdit = permissionIndex !== null;
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (permissionIndex === null) {
      setCode("");
      setLabel("");
      setDescription("");
    } else {
      const p = currentPermissions[permissionIndex];
      setCode(p?.code ?? "");
      setLabel(p?.label ?? "");
      setDescription(p?.description ?? "");
    }
  }, [visible, permissionIndex, currentPermissions]);

  const save = async () => {
    const codeTrim = code.trim();
    if (!codeTrim) return;
    const value: ModulePermission = {
      code: codeTrim,
      label: label.trim(),
      description: description.trim(),
    };
    setSaving(true);
    setError(null);
    try {
      const existing = Array.isArray(currentPermissions) ? currentPermissions : [];
      const newPermissions =
        permissionIndex === null
          ? [...existing, value]
          : existing.map((p, i) => (i === permissionIndex ? value : p));
      await moduleService.edit(moduleId, { permissions: newPermissions });
      await onSuccess();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentSet
      title={isEdit ? "Editar permiso" : "Agregar permiso"}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving}
      saveDisabled={!code.trim()}
      visible={visible}
      onHide={onHide}
    >
      <div className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <DpInput type="input" label="Código" name="code" value={code} onChange={setCode} placeholder="Ej. view, create, edit" />
        <DpInput type="input" label="Etiqueta" name="label" value={label} onChange={setLabel} placeholder="Ej. Ver, Crear, Editar" />
        <DpInput type="input" label="Descripción" name="description" value={description} onChange={setDescription} placeholder="Ej. Permite visualizar la lista y el detalle." />
      </div>
    </DpContentSet>
  );
}
