"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import * as planService from "@/services/planService";
import type { PlanStatus } from "@/services/planService";
import * as orderService from "@/services/orderService";
import type { OrderRecord } from "@/services/orderService";

export interface SetPlanDialogProps {
  visible: boolean;
  planId: string | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { label: string; value: PlanStatus }[] = [
  { label: "Borrador", value: "draft" },
  { label: "Confirmado", value: "confirmed" },
  { label: "En curso", value: "in_progress" },
  { label: "Completado", value: "completed" },
  { label: "Cancelado", value: "cancelled" },
];

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
    <Dialog
      header={isEdit ? "Editar plan" : "Agregar plan"}
      visible={visible}
      style={{ width: "32rem" }}
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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Código</label>
            <InputText
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="plan_20260226_LIM01"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Fecha</label>
            <InputText
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Zona</label>
            <InputText
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Lima Metropolitana"
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de vehículo</label>
            <InputText
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder="Camión 5TN"
              className="w-full"
            />
          </div>

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

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
            <Dropdown
              value={status}
              options={STATUS_OPTIONS}
              onChange={(e) => setStatus(e.value)}
              className="w-full"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button
              label={saving ? "Guardando…" : "Guardar"}
              onClick={save}
              disabled={saving || !valid}
              loading={saving}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
