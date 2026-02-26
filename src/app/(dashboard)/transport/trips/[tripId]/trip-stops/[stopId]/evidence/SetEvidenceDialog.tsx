"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
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
    <Dialog
      header="Agregar evidencia"
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
          <label className="font-medium text-zinc-700 dark:text-zinc-300">Id (ej. photo01)</label>
          <InputText
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="photo01"
            className="w-full font-mono text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-zinc-700 dark:text-zinc-300">URL</label>
          <InputText
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
          <Button label={saving ? "Guardando…" : "Guardar"} onClick={save} disabled={saving || !valid} loading={saving} />
        </div>
      </div>
    </Dialog>
  );
}
