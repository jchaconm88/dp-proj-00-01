"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as resourceService from "@/services/resourceService";
import type {
  ResourceRole,
  ResourceEngagementType,
  ResourceStatus,
} from "@/services/resourceService";
import * as sequenceService from "@/services/sequenceService";
import {
  RESOURCE_ROLE,
  RESOURCE_ENGAGEMENT_TYPE,
  RESOURCE_STATUS,
  statusToSelectOptions,
} from "@/constants/statusOptions";

export interface SetResourceDialogProps {
  visible: boolean;
  resourceId: string | null;
  onSuccess?: () => void;
}

const ROLE_OPTIONS = statusToSelectOptions(RESOURCE_ROLE);
const ENGAGEMENT_OPTIONS = statusToSelectOptions(RESOURCE_ENGAGEMENT_TYPE);
const STATUS_OPTIONS = statusToSelectOptions(RESOURCE_STATUS);

export default function SetResourceDialog({
  visible,
  resourceId,
  onSuccess,
}: SetResourceDialogProps) {
  const router = useRouter();
  const isEdit = !!resourceId;
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<ResourceRole>("driver");
  const [engagementType, setEngagementType] = useState<ResourceEngagementType>("sporadic");
  const [status, setStatus] = useState<ResourceStatus>("active");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/human-resources/resources");
  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!resourceId) {
      setCode("");
      setFirstName("");
      setLastName("");
      setRole("driver");
      setEngagementType("sporadic");
      setStatus("active");
      setLoading(false);
      return;
    }
    setLoading(true);
    resourceService
      .getResource(resourceId)
      .then((data) => {
        if (!data) {
          setError("Recurso no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setRole(data.role ?? "driver");
        setEngagementType(data.engagementType ?? "sporadic");
        setStatus(data.status ?? "active");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, resourceId]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let finalCode: string;
      try {
        finalCode = await sequenceService.resolveCodeIfEmpty(code, "resource");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al generar código.");
        setSaving(false);
        return;
      }
      const payload = {
        code: finalCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        engagementType,
        status,
      };
      if (resourceId) {
        await resourceService.editResource(resourceId, payload);
      } else {
        await resourceService.addResource(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = !!firstName.trim() && !!lastName.trim();

  return (
    <DpContentSet
      title={isEdit ? "Editar recurso" : "Agregar recurso"}
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
          <DpCodeInput entity="resource" label="Código" name="code" value={code} onChange={setCode} />
          <DpInput type="input" label="Nombre" name="firstName" value={firstName} onChange={setFirstName} placeholder="Miguel" />
          <DpInput type="input" label="Apellidos" name="lastName" value={lastName} onChange={setLastName} placeholder="Torres" />
          <DpInput
            type="select"
            label="Rol"
            name="role"
            value={role}
            onChange={(v) => setRole(v as ResourceRole)}
            options={ROLE_OPTIONS}
          />
          <DpInput
            type="select"
            label="Tipo de vinculación"
            name="engagementType"
            value={engagementType}
            onChange={(v) => setEngagementType(v as ResourceEngagementType)}
            options={ENGAGEMENT_OPTIONS}
          />
          <DpInput
            type="select"
            label="Estado"
            name="status"
            value={status}
            onChange={(v) => setStatus(v as ResourceStatus)}
            options={STATUS_OPTIONS}
          />
        </div>
      )}
    </DpContentSet>
  );
}
