"use client";

import { useState } from "react";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as tripService from "@/services/tripService";

export interface SetEvidenceDialogProps {
  visible: boolean;
  tripId: string;
  stopId: string;
  onSuccess?: () => void;
  onHide: () => void;
}

export default function SetEvidenceDialog({
  visible,
  tripId,
  stopId,
  onSuccess,
  onHide,
}: SetEvidenceDialogProps) {
  const [id, setId] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!url.trim() || !id.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const evidenceId = id.trim().toLowerCase().replace(/\s+/g, "-");
      await tripService.addEvidence(tripId, stopId, { id: evidenceId, url: url.trim() });
      onSuccess?.();
      onHide();
      setId("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = id.trim() && url.trim();

  return (
    <DpContentSet
      title="Agregar evidencia"
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving}
      saveDisabled={!valid}
      visible={visible}
      onHide={onHide}
    >
      <div className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <DpInput type="input" label="Id (ej. photo01)" name="id" value={id} onChange={setId} placeholder="photo01" className="font-mono text-sm" />
        <DpInput type="input" label="URL" name="url" value={url} onChange={setUrl} placeholder="https://..." />
      </div>
    </DpContentSet>
  );
}
