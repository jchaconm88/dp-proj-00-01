"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import * as roleService from "@/services/roleService";

export interface SetRoleDialogProps {
  /** Si es true, se muestra el diálogo. */
  visible: boolean;
  /** Si viene un id, se edita; si es null, se crea. */
  roleId: string | null;
  onSuccess?: () => void;
}

export default function SetRoleDialog({ visible, roleId, onSuccess }: SetRoleDialogProps) {
  const router = useRouter();
  const isEdit = !!roleId;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => {
    router.push("/system/roles");
  };

  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!roleId) {
      setName("");
      setDescription("");
      setLoading(false);
      return;
    }
    setLoading(true);
    roleService
      .get(roleId)
      .then((data) => {
        if (!data) {
          setError("Rol no encontrado.");
          return;
        }
        setName(data.name ?? "");
        setDescription(data.description ?? "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar rol.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [visible, roleId]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (roleId) {
        await roleService.edit(roleId, {
          name: name.trim(),
          description: description.trim() || null,
        });
      } else {
        await roleService.add({
          name: name.trim(),
          description: description.trim() || null,
        });
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      header={isEdit ? "Editar rol" : "Agregar rol"}
      visible={visible}
      style={{ width: "28rem" }}
      onHide={onHide}
      closable={!saving}
      closeOnEscape={!saving}
      dismissableMask={!saving}
      modal
    >
      {loading ? (
        <div className="py-8 text-center text-zinc-500">Cargando…</div>
      ) : (
        <div className="flex flex-col gap-4 pt-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="setrole-name" className="font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
            </label>
            <InputText
              id="setrole-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. admin, editor"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="setrole-desc" className="font-medium text-zinc-700 dark:text-zinc-300">
              Descripción
            </label>
            <InputText
              id="setrole-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del rol"
              className="w-full"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button
              label={saving ? "Guardando…" : "Guardar"}
              onClick={save}
              disabled={saving || !name.trim()}
              loading={saving}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
