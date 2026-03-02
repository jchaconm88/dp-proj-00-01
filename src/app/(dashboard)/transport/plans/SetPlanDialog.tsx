"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "primereact/multiselect";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as planService from "@/services/planService";
import type { PlanStatus } from "@/services/planService";
import { PLAN_STATUS, statusToSelectOptions } from "@/constants/statusOptions";
import * as orderService from "@/services/orderService";
import type { OrderRecord } from "@/services/orderService";

export interface SetPlanDialogProps {
  visible: boolean;
  planId: string | null;
  onSuccess?: () => void;
}

const PLAN_STATUS_OPTIONS = statusToSelectOptions(PLAN_STATUS);

export default function SetPlanDialog({
  visible,
  planId,
  onSuccess,
}: SetPlanDialogProps) {
  const router = useRouter();
  const isEdit = !!planId;
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [zone, setZone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [status, setStatus] = useState<PlanStatus>("draft");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/plans");
  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    orderService.list().then(setOrders).catch(() => setOrders([]));
    if (!planId) {
      setCode("");
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
      setZone("");
      setVehicleType("");
      setOrderIds([]);
      setStatus("draft");
      setLoading(false);
      return;
    }
    setLoading(true);
    planService
      .get(planId)
      .then((data) => {
        if (!data) {
          setError("Plan no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setDate(data.date ?? "");
        setZone(data.zone ?? "");
        setVehicleType(data.vehicleType ?? "");
        setOrderIds(data.orderIds ?? []);
        setStatus(data.status ?? "draft");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, planId]);

  const save = async () => {
    if (!date.trim() || !zone.trim() || !vehicleType.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: code.trim(),
        date: date.trim(),
        zone: zone.trim(),
        vehicleType: vehicleType.trim(),
        orderIds: [...orderIds],
        status,
      };
      if (planId) {
        await planService.edit(planId, payload);
      } else {
        await planService.add(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const orderOptions = orders.map((o) => ({
    label: `${(o.code || o.id).trim()} — ${o.client} — ${o.deliveryAddress}`,
    value: o.id,
  }));

  const valid = !!date.trim() && !!zone.trim() && !!vehicleType.trim();

  return (
    <DpContentSet
      title={isEdit ? "Editar plan" : "Agregar plan"}
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

          <DpInput type="input" label="Código" name="code" value={code} onChange={setCode} placeholder="plan_20260226_LIM01" />
          <DpInput type="date" label="Fecha" name="date" value={date} onChange={setDate} />

          <DpInput type="input" label="Zona" name="zone" value={zone} onChange={setZone} placeholder="Lima Metropolitana" />
          <DpInput type="input" label="Tipo de vehículo" name="vehicleType" value={vehicleType} onChange={setVehicleType} placeholder="Camión 5TN" />

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Pedidos</label>
            <MultiSelect
              value={orderIds}
              options={orderOptions}
              onChange={(e) => setOrderIds(e.value ?? [])}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione pedidos"
              filter
              filterPlaceholder="Buscar por cliente o dirección"
              className="w-full"
            />
          </div>

          <DpInput type="select" label="Estado" name="status" value={status} onChange={(v) => setStatus(v as PlanStatus)} options={PLAN_STATUS_OPTIONS} />
        </div>
      )}
    </DpContentSet>
  );
}
