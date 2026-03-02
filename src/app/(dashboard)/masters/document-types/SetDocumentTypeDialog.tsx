"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as documentTypeService from "@/services/documentTypeService";

export interface SetDocumentTypeDialogProps {
  visible: boolean;
  documentTypeId: string | null;
  onSuccess?: () => void;
}

export default function SetDocumentTypeDialog({
  visible,
  documentTypeId,
  onSuccess,
}: SetDocumentTypeDialogProps) {
  const router = useRouter();
  const isEdit = !!documentTypeId;
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => {
    router.push("/masters/document-types");
  };

  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!documentTypeId) {
      setId("");
      setName("");
      setLoading(false);
      return;
    }
    setLoading(true);
    documentTypeService
      .get(documentTypeId)
      .then((data) => {
        if (!data) {
          setError("Tipo de documento no encontrado.");
          return;
        }
        setId(data.id ?? "");
        setName(data.name ?? "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar.");
      })
      .finally(() => setLoading(false));
  }, [visible, documentTypeId]);

  const save = async () => {
    const trimmedId = id.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name.trim()) return;
    if (!isEdit && !trimmedId) return;
    setSaving(true);
    setError(null);
    try {
      if (documentTypeId) {
        await documentTypeService.edit(documentTypeId, { name: name.trim() });
      } else {
        await documentTypeService.add({ id: trimmedId, name: name.trim() });
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = name.trim() && (isEdit || id.trim());

  return (
    <DpContentSet
      title={isEdit ? "Editar tipo de documento" : "Agregar tipo de documento"}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving}
      saveDisabled={!valid}
      visible={visible}
      onHide={onHide}
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
          <DpInput
            type="input"
            label="Id (en la colección)"
            name="id"
            value={id}
            onChange={setId}
            placeholder="Ej. identity"
            className="font-mono text-sm"
            disabled={isEdit}
          />
          {isEdit && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              El id no se puede modificar al editar.
            </span>
          )}
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Ej. Identidad" />
        </div>
      )}
    </DpContentSet>
  );
}
