"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import * as moduleService from "@/services/moduleService";

export interface SetModuleDialogProps {
  visible: boolean;
  /** Si viene un id, se edita; si es null, se crea. */
  moduleId: string | null;
  onSuccess?: () => void;
}

export default function SetModuleDialog({ visible, moduleId, onSuccess }: SetModuleDialogProps) {
  const router = useRouter();
  const isEdit = !!moduleId;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => {
    router.push("/system/modules");
  };

  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!moduleId) {
      setName("");
      setDescription("");
      setLoading(false);
      return;
    }
    setLoading(true);
    moduleService
      .get(moduleId)
      .then((data) => {
        if (!data) {
          setError("Módulo no encontrado.");
          return;
        }
        setName(data.id);
        setDescription(data.description ?? "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar módulo.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [visible, moduleId]);

  const save = async () => {
    const nameTrim = name.trim();
    const descTrim = description.trim();
    if (!nameTrim) return;
    setSaving(true);
    setError(null);
    try {
      if (moduleId) {
        await moduleService.edit(moduleId, { description: descTrim });
        onSuccess?.();
        hide();
      } else {
        await moduleService.add({ name: nameTrim, description: descTrim });
        onSuccess?.();
        router.push("/system/modules/info/" + encodeURIComponent(nameTrim));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      header={isEdit ? "Editar módulo" : "Agregar módulo"}
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
            <label htmlFor="setmodule-name" className="font-medium text-zinc-700 dark:text-zinc-300">
              Nombre de la colección
            </label>
            <InputText
              id="setmodule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. user"
              className="w-full"
              disabled={isEdit}
            />
            {isEdit && (
              <span className="text-xs text-zinc-500">El nombre no se puede modificar.</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="setmodule-desc" className="font-medium text-zinc-700 dark:text-zinc-300">
              Descripción
            </label>
            <InputText
              id="setmodule-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Usuarios"
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
