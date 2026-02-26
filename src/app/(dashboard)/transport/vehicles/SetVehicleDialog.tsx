"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import * as vehicleService from "@/services/vehicleService";
import type { VehicleStatus } from "@/services/vehicleService";

export interface SetVehicleDialogProps {
  visible: boolean;
  vehicleId: string | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { label: string; value: VehicleStatus }[] = [
  { label: "Disponible", value: "available" },
  { label: "Asignado", value: "assigned" },
];

const TYPE_OPTIONS = [
  { label: "Camión", value: "truck" },
  { label: "Camioneta", value: "van" },
  { label: "Otro", value: "other" },
];

export default function SetVehicleDialog({
  visible,
  vehicleId,
  onSuccess,
}: SetVehicleDialogProps) {
  const router = useRouter();
  const isEdit = !!vehicleId;
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [capacityKg, setCapacityKg] = useState<string>("");
  const [status, setStatus] = useState<VehicleStatus>("available");
  const [currentTripId, setCurrentTripId] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/vehicles");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!vehicleId) {
      setPlate("");
      setType("");
      setBrand("");
      setModel("");
      setCapacityKg("");
      setStatus("available");
      setCurrentTripId("");
      setActive(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    vehicleService
      .get(vehicleId)
      .then((data) => {
        if (!data) {
          setError("Vehículo no encontrado.");
          return;
        }
        setPlate(data.plate ?? "");
        setType(data.type ?? "");
        setBrand(data.brand ?? "");
        setModel(data.model ?? "");
        setCapacityKg(String(data.capacityKg ?? ""));
        setStatus(data.status ?? "available");
        setCurrentTripId(data.currentTripId ?? "");
        setActive(data.active ?? true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, vehicleId]);

  const save = async () => {
    if (!plate.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        plate: plate.trim(),
        type: type.trim(),
        brand: brand.trim(),
        model: model.trim(),
        capacityKg: Number(capacityKg) || 0,
        status,
        currentTripId: currentTripId.trim() || "",
        active,
      };
      if (vehicleId) {
        await vehicleService.edit(vehicleId, payload);
      } else {
        await vehicleService.add(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = plate.trim();

  return (
    <Dialog
      header={isEdit ? "Editar vehículo" : "Agregar vehículo"}
      visible={visible}
      style={{ width: "28rem" }}
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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Placa</label>
            <InputText
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="ABC-123"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
            <Dropdown
              value={type}
              options={TYPE_OPTIONS}
              onChange={(e) => setType(e.value ?? "")}
              placeholder="Seleccionar tipo"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Marca</label>
            <InputText
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Volvo"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Modelo</label>
            <InputText
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="FH16"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Capacidad (kg)</label>
            <InputText
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value)}
              type="number"
              placeholder="18000"
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
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Viaje actual</label>
            <InputText
              value={currentTripId}
              onChange={(e) => setCurrentTripId(e.target.value)}
              placeholder="TRIP-2026-0001"
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox inputId="active" checked={active} onChange={(e) => setActive(e.checked ?? true)} />
            <label htmlFor="active" className="font-medium text-zinc-700 dark:text-zinc-300">Activo</label>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button label={saving ? "Guardando…" : "Guardar"} onClick={save} disabled={saving || !valid} loading={saving} />
          </div>
        </div>
      )}
    </Dialog>
  );
}
