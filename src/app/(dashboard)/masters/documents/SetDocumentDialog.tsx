"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as documentService from "@/services/documentService";
import * as documentTypeService from "@/services/documentTypeService";
import type { DocumentTypeRecord } from "@/services/documentTypeService";

export interface SetDocumentDialogProps {
  visible: boolean;
  documentId: string | null;
  onSuccess?: () => void;
}

export default function SetDocumentDialog({
  visible,
  documentId,
  onSuccess,
}: SetDocumentDialogProps) {
  const router = useRouter();
  const isEdit = !!documentId;
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => {
    router.push("/masters/documents");
  };

  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    documentTypeService.list().then(setDocumentTypes).catch(() => setDocumentTypes([]));
    if (!documentId) {
      setId("");
      setName("");
      setSelectedDocumentTypeId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    documentService
      .get(documentId)
      .then((data) => {
        if (!data) {
          setError("Documento no encontrado.");
          return;
        }
        setId(data.id ?? "");
        setName(data.name ?? "");
        setSelectedDocumentTypeId(data.documentType || null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar.");
      })
      .finally(() => setLoading(false));
  }, [visible, documentId]);

  const save = async () => {
    const trimmedId = id.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name.trim() || !selectedDocumentTypeId) return;
    if (!isEdit && !trimmedId) return;
    setSaving(true);
    setError(null);
    try {
      if (documentId) {
        await documentService.edit(documentId, {
          name: name.trim(),
          documentType: selectedDocumentTypeId,
        });
      } else {
        await documentService.add({
          id: trimmedId,
          name: name.trim(),
          documentType: selectedDocumentTypeId,
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

  const documentTypeOptions = documentTypes.map((dt) => ({
    label: dt.name,
    value: dt.id,
  }));

  const valid = name.trim() && selectedDocumentTypeId && (isEdit || id.trim());

  return (
    <DpContentSet
      title={isEdit ? "Editar documento" : "Agregar documento"}
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
          <DpInput type="input" label="Id (en la colección)" name="id" value={id} onChange={setId} placeholder="Ej. dni" className="font-mono text-sm" disabled={isEdit} />
          {isEdit && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              El id no se puede modificar al editar.
            </span>
          )}
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Ej. Documento Nacional de Identidad" />
          <DpInput
            type="select"
            label="Tipo de documento"
            name="documentType"
            value={selectedDocumentTypeId ?? ""}
            onChange={(v) => setSelectedDocumentTypeId(v != null ? String(v) : null)}
            options={documentTypeOptions}
            placeholder="Seleccionar tipo"
          />
        </div>
      )}
    </DpContentSet>
  );
}
