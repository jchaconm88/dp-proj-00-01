"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
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
    <Dialog
      header={isEdit ? "Editar permiso" : "Agregar permiso"}
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
        <div className="flex flex-col gap-2">
          <label htmlFor="setperm-code" className="font-medium text-zinc-700 dark:text-zinc-300">
            Código
          </label>
          <InputText
            id="setperm-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. view, create, edit"
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="setperm-label" className="font-medium text-zinc-700 dark:text-zinc-300">
            Etiqueta
          </label>
          <InputText
            id="setperm-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej. Ver, Crear, Editar"
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="setperm-desc" className="font-medium text-zinc-700 dark:text-zinc-300">
            Descripción
          </label>
          <InputText
            id="setperm-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Permite visualizar la lista y el detalle."
            className="w-full"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
          <Button
            label={saving ? "Guardando…" : "Guardar"}
            onClick={save}
            disabled={saving || !code.trim()}
            loading={saving}
          />
        </div>
      </div>
    </Dialog>
  );
}
