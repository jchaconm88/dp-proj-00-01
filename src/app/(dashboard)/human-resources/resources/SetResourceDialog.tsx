"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as resourceService from "@/services/resourceService";
import type { ResourceEngagementType, ResourceStatus } from "@/services/resourceService";
import * as positionService from "@/services/positionService";
import * as sequenceService from "@/services/sequenceService";
import * as documentService from "@/services/documentService";
import {
  RESOURCE_ENGAGEMENT_TYPE,
  RESOURCE_STATUS,
  statusToSelectOptions,
} from "@/constants/statusOptions";

export interface SetResourceDialogProps {
  visible: boolean;
  resourceId: string | null;
  onSuccess?: () => void;
}

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
  const [documentNo, setDocumentNo] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [positionId, setPositionId] = useState("");
  const [position, setPosition] = useState("");
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
  const [hireDate, setHireDate] = useState("");
  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
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
    documentService.list().then((list) => setDocuments(list)).catch(() => setDocuments([]));
    positionService.list().then((list) => setPositions(list.map((p) => ({ id: p.id, name: p.name })))).catch(() => setPositions([]));
    if (!resourceId) {
      setCode("");
      setFirstName("");
      setLastName("");
      setDocumentNo("");
      setDocumentId("");
      setPhone("");
      setEmail("");
      setPositionId("");
      setPosition("");
      setHireDate("");
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
        setDocumentNo(data.documentNo ?? "");
        setDocumentId(data.documentId ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setPositionId(data.positionId ?? "");
        setPosition(data.position ?? "");
        setHireDate(data.hireDate ?? "");
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
        documentNo: documentNo.trim(),
        documentId: documentId.trim(),
        phone: phone.trim(),
        email: email.trim(),
        positionId: positionId.trim(),
        position: position.trim(),
        hireDate: hireDate.trim(),
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

  const documentOptions = documents.map((d) => ({ label: `${d.name} (${d.id})`, value: d.id }));
  const positionOptions = positions.map((p) => ({ label: p.name, value: p.id }));
  const onPositionChange = (v: string | number | boolean | null) => {
    const id = v != null ? String(v) : "";
    setPositionId(id);
    const found = positions.find((p) => p.id === id);
    setPosition(found ? found.name : "");
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
          <DpInput type="input" label="Nº documento" name="documentNo" value={documentNo} onChange={setDocumentNo} placeholder="12345678" />
          <DpInput
            type="select"
            label="Tipo de documento"
            name="documentId"
            value={documentId}
            onChange={(v) => setDocumentId(v != null ? String(v) : "")}
            options={documentOptions}
            placeholder="Seleccionar"
          />
          <DpInput type="input" label="Teléfono" name="phone" value={phone} onChange={setPhone} placeholder="999999999" />
          <DpInput type="input" label="Email" name="email" value={email} onChange={setEmail} placeholder="juan@empresa.com" />
          <DpInput
            type="select"
            label="Cargo"
            name="position"
            value={positionId}
            onChange={(v) => onPositionChange(v)}
            options={positionOptions}
            placeholder="Seleccionar cargo"
          />
          <DpInput type="date" label="Fecha de ingreso" name="hireDate" value={hireDate} onChange={setHireDate} />
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
