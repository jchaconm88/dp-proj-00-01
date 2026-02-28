"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import * as tripService from "@/services/tripService";
import type { TripStatus } from "@/services/tripService";
import * as routeService from "@/services/routeService";
import * as driverService from "@/services/driverService";
import type { DriverRecord } from "@/services/driverService";
import * as vehicleService from "@/services/vehicleService";
import type { VehicleRecord } from "@/services/vehicleService";

export interface SetTripDialogProps {
  visible: boolean;
  tripId: string | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { label: string; value: TripStatus }[] = [
  { label: "Programado", value: "scheduled" },
  { label: "En curso", value: "in_progress" },
  { label: "Completado", value: "completed" },
  { label: "Cancelado", value: "cancelled" },
];

export default function SetTripDialog({
  visible,
  tripId,
  onSuccess,
}: SetTripDialogProps) {
  const router = useRouter();
  const isEdit = !!tripId;
  const [code, setCode] = useState("");
  const [routeId, setRouteId] = useState<string | null>(null);
  const [routeCode, setRouteCode] = useState("");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driver, setDriver] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [status, setStatus] = useState<TripStatus>("scheduled");
  const [scheduledStart, setScheduledStart] = useState("");
  const [routes, setRoutes] = useState<routeService.RouteRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/trips");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    routeService.listRoutes().then(setRoutes).catch(() => setRoutes([]));
    driverService.list().then(setDrivers).catch(() => setDrivers([]));
    vehicleService.list().then(setVehicles).catch(() => setVehicles([]));
    if (!tripId) {
      setCode("");
      setRouteId(null);
      setRouteCode("");
      setDriverId(null);
      setDriver("");
      setVehicleId(null);
      setVehicle("");
      setStatus("scheduled");
      setScheduledStart("");
      setLoading(false);
      return;
    }
    setLoading(true);
    tripService
      .getTrip(tripId)
      .then((data) => {
        if (!data) {
          setError("Viaje no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setRouteId(data.routeId || null);
        setRouteCode(data.routeCode ?? "");
        setDriverId(data.driverId || null);
        setDriver(data.driver ?? "");
        setVehicleId(data.vehicleId || null);
        setVehicle(data.vehicle ?? "");
        setStatus(data.status ?? "scheduled");
        setScheduledStart(data.scheduledStart ? data.scheduledStart.slice(0, 16) : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, tripId]);

  // Rellenar driver/vehicle desde listas si al editar venían vacíos (viajes antiguos)
  useEffect(() => {
    if (!driverId || driver) return;
    const d = drivers.find((x) => x.id === driverId);
    if (d) setDriver(`${(d.licenseNo || "").trim()} - ${(d.lastName || "").trim()} ${(d.firstName || "").trim()}`.trim());
  }, [driverId, driver, drivers]);
  useEffect(() => {
    if (!vehicleId || vehicle) return;
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) setVehicle((v.plate || "").trim());
  }, [vehicleId, vehicle, vehicles]);

  const save = async () => {
    if (!routeId || !driverId || !vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: code.trim(),
        routeId,
        routeCode,
        driverId,
        driver,
        vehicleId,
        vehicle,
        status,
        scheduledStart: scheduledStart.trim() || "",
      };
      if (tripId) {
        await tripService.editTrip(tripId, payload);
      } else {
        await tripService.addTrip(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const goToTripStops = () => {
    if (tripId) router.push(`/transport/trips/${encodeURIComponent(tripId)}/trip-stops`);
  };

  const onRouteChange = (value: string) => {
    setRouteId(value);
    const r = routes.find((x) => x.id === value);
    if (r) setRouteCode(r.code ?? "");
  };

  const onDriverChange = (value: string) => {
    const id = value ?? "";
    setDriverId(id);
    const d = drivers.find((x) => x.id === id);
    if (d) setDriver(`${(d.licenseNo || "").trim()} - ${(d.lastName || "").trim()} ${(d.firstName || "").trim()}`.trim());
    else setDriver("");
  };

  const onVehicleChange = (value: string) => {
    const id = value ?? "";
    setVehicleId(id);
    const v = vehicles.find((x) => x.id === id);
    if (v) setVehicle((v.plate || "").trim());
    else setVehicle("");
  };

  const routeOptions = [
    { label: "— Sin ruta —", value: "" },
    ...routes.map((r) => ({ label: `${r.name} (${r.code || r.id})`, value: r.id })),
  ];
  const driverOptions = drivers.map((d) => ({
    label: `${(d.licenseNo || "").trim()} - ${(d.lastName || "").trim()} ${(d.firstName || "").trim()}`.trim() || d.id,
    value: d.id,
  }));
  const vehicleOptions = vehicles.map((v) => ({ label: (v.plate || "").trim() || v.id, value: v.id }));
  const valid = !!routeId && !!driverId && !!vehicleId;

  return (
    <Dialog
      header={isEdit ? "Editar viaje" : "Agregar viaje"}
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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Código</label>
            <InputText
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TRIP-001"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Ruta</label>
            <Dropdown
              value={routeId}
              options={routeOptions}
              onChange={(e) => onRouteChange(e.value ?? "")}
              placeholder="Seleccionar ruta"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Conductor</label>
            <Dropdown
              value={driverId}
              options={driverOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => onDriverChange(e.value ?? "")}
              placeholder="Seleccionar conductor"
              filter
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Vehículo</label>
            <Dropdown
              value={vehicleId}
              options={vehicleOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => onVehicleChange(e.value ?? "")}
              placeholder="Seleccionar vehículo"
              filter
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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Inicio programado</label>
            <InputText
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              type="datetime-local"
              className="w-full"
            />
          </div>
          {isEdit && (
            <Button label="Gestionar paradas del viaje" severity="secondary" onClick={goToTripStops} className="w-full" />
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button label={saving ? "Guardando…" : "Guardar"} onClick={save} disabled={saving || !valid} loading={saving} />
          </div>
        </div>
      )}
    </Dialog>
  );
}
