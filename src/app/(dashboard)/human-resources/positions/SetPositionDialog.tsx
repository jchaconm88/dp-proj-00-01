"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as positionService from "@/services/positionService";
import * as sequenceService from "@/services/sequenceService";

export interface SetPositionDialogProps {
  visible: boolean;
  positionId: string | null;
  onSuccess?: () => void;
}

export default function SetPositionDialog({
  visible,
  positionId,
  onSuccess,
}: SetPositionDialogProps) {
  const router = useRouter();
  const isEdit = !!positionId;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/human-resources/positions");
  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!positionId) {
      setCode("");
      setName("");
      setActive(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    positionService
      .get(positionId)
      .then((data) => {
        if (!data) {
          setError("Cargo no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setName(data.name ?? "");
        setActive(data.active !== false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, positionId]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let finalCode: string;
      try {
        finalCode = await sequenceService.resolveCodeIfEmpty(code, "position");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al generar código.");
        setSaving(false);
        return;
      }
      const payload = {
        code: finalCode,
        name: name.trim(),
        active,
      };
      if (positionId) {
        await positionService.edit(positionId, payload);
      } else {
        await positionService.add(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = !!name.trim();

  return (
    <DpContentSet
      title={isEdit ? "Editar cargo" : "Agregar cargo"}
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
          <DpCodeInput entity="position" label="Código" name="code" value={code} onChange={setCode} />
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Ej. Conductor, Analista" />
          <DpInput type="check" label="Activo" name="active" value={active} onChange={setActive} />
        </div>
      )}
    </DpContentSet>
  );
}
