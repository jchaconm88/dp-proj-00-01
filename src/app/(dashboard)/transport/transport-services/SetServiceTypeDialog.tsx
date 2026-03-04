"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as serviceTypeService from "@/services/serviceTypeService";
import type { ServiceTypeCategory } from "@/services/serviceTypeService";
import type { CalculationType } from "@/services/contractService";
import { SERVICE_TYPE_CATEGORY, CALCULATION_TYPE, statusToSelectOptions } from "@/constants/statusOptions";

export interface SetServiceTypeDialogProps {
  visible: boolean;
  serviceTypeId: string | null;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = statusToSelectOptions(SERVICE_TYPE_CATEGORY);
const CALCULATION_TYPE_OPTIONS = statusToSelectOptions(CALCULATION_TYPE);

export default function SetServiceTypeDialog({
  visible,
  serviceTypeId,
  onSuccess,
}: SetServiceTypeDialogProps) {
  const router = useRouter();
  const isEdit = !!serviceTypeId;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceTypeCategory>("distribution");
  const [defaultServiceTimeMin, setDefaultServiceTimeMin] = useState("");
  const [calculationType, setCalculationType] = useState<CalculationType>("fixed");
  const [requiresAppointment, setRequiresAppointment] = useState(false);
  const [allowConsolidation, setAllowConsolidation] = useState(true);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/transport-services");
  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!serviceTypeId) {
      setCode("");
      setName("");
      setDescription("");
      setCategory("distribution");
      setDefaultServiceTimeMin("30");
      setCalculationType("fixed");
      setRequiresAppointment(false);
      setAllowConsolidation(true);
      setActive(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    serviceTypeService
      .get(serviceTypeId)
      .then((data) => {
        if (!data) {
          setError("Servicio no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setName(data.name ?? "");
        setDescription(data.description ?? "");
        setCategory(data.category ?? "distribution");
        setDefaultServiceTimeMin(String(data.defaultServiceTimeMin ?? 30));
        setCalculationType(data.calculationType ?? "fixed");
        setRequiresAppointment(!!data.requiresAppointment);
        setAllowConsolidation(data.allowConsolidation !== false);
        setActive(data.active !== false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, serviceTypeId]);

  const save = async () => {
    if (!code.trim() || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const timeMin = Number(defaultServiceTimeMin) || 0;
      if (serviceTypeId) {
        await serviceTypeService.edit(serviceTypeId, {
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          category,
          defaultServiceTimeMin: timeMin,
          calculationType,
          requiresAppointment,
          allowConsolidation,
          active,
        });
      } else {
        await serviceTypeService.add({
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          category,
          defaultServiceTimeMin: timeMin,
          calculationType,
          requiresAppointment,
          allowConsolidation,
          active,
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

  const valid = !!code.trim() && !!name.trim();

  return (
    <DpContentSet
      title={isEdit ? "Editar servicio de transporte" : "Agregar servicio de transporte"}
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
          <DpInput type="input" label="Código" name="code" value={code} onChange={setCode} placeholder="LOCAL_DELIVERY" />
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Entrega Local" />
          <DpInput type="textarea" label="Descripción" name="description" value={description} onChange={setDescription} placeholder="Distribución dentro de la ciudad" rows={2} />
          <DpInput type="select" label="Categoría" name="category" value={category} onChange={(v) => setCategory(v as ServiceTypeCategory)} options={CATEGORY_OPTIONS} />
          <DpInput type="number" label="Tiempo de servicio por defecto (min)" name="defaultServiceTimeMin" value={defaultServiceTimeMin} onChange={setDefaultServiceTimeMin} placeholder="30" />
          <DpInput type="select" label="Tipo de cálculo" name="calculationType" value={calculationType} onChange={(v) => setCalculationType(v as CalculationType)} options={CALCULATION_TYPE_OPTIONS} />
          <DpInput type="check" label="Requiere cita" name="requiresAppointment" value={requiresAppointment} onChange={setRequiresAppointment} />
          <DpInput type="check" label="Permitir consolidación" name="allowConsolidation" value={allowConsolidation} onChange={setAllowConsolidation} />
          <DpInput type="check" label="Activo" name="active" value={active} onChange={setActive} />
        </div>
      )}
    </DpContentSet>
  );
}
