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
import * as vehicleService from "@/services/vehicleService";

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
  const [id, setId] = useState("");
  const [routeId, setRouteId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [status, setStatus] = useState<TripStatus>("scheduled");
  const [scheduledStart, setScheduledStart] = useState("");
  const [routes, setRoutes] = useState<{ id: string; name: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; label: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/trips");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    routeService.listRoutes().then((list) => setRoutes(list.map((r) => ({ id: r.id, name: r.name })))).catch(() => setRoutes([]));
    driverService.list().then((list) => setDrivers(list.map((d) => ({ id: d.id, label: `${d.firstName} ${d.lastName} (${d.id})` })))).catch(() => setDrivers([]));
    vehicleService.list().then((list) => setVehicles(list.map((v) => ({ id: v.id, label: `${v.plate} - ${v.brand} ${v.model} (${v.id})` })))).catch(() => setVehicles([]));
    if (!tripId) {
      setId("");
      setRouteId(null);
      setDriverId(null);
      setVehicleId(null);
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
        setId(data.id ?? "");
        setRouteId(data.routeId || null);
        setDriverId(data.driverId || null);
        setVehicleId(data.vehicleId || null);
        setStatus(data.status ?? "scheduled");
        setScheduledStart(data.scheduledStart ? data.scheduledStart.slice(0, 16) : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, tripId]);

  const save = async () => {
    if (!routeId || !driverId || !vehicleId) return;
    if (!isEdit && !id.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        routeId,
        driverId,
        vehicleId,
        status,
        scheduledStart: scheduledStart.trim() || "",
      };
      if (tripId) {
        await tripService.editTrip(tripId, payload);
      } else {
        await tripService.addTrip({ id: id.trim(), ...payload });
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

  const routeOptions = routes.map((r) => ({ label: `${r.name} (${r.id})`, value: r.id }));
  const driverOptions = drivers.map((d) => ({ label: d.label, value: d.id }));
  const vehicleOptions = vehicles.map((v) => ({ label: v.label, value: v.id }));
  const valid = !!routeId && !!driverId && !!vehicleId && (isEdit || id.trim());

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
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Id del viaje</label>
              <InputText
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="TRIP-001"
                className="w-full font-mono"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Ruta</label>
            <Dropdown
              value={routeId}
              options={routeOptions}
              onChange={(e) => setRouteId(e.value)}
              placeholder="Seleccionar ruta"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Conductor</label>
            <Dropdown
              value={driverId}
              options={driverOptions}
              onChange={(e) => setDriverId(e.value)}
              placeholder="Seleccionar conductor"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Vehículo</label>
            <Dropdown
              value={vehicleId}
              options={vehicleOptions}
              onChange={(e) => setVehicleId(e.value)}
              placeholder="Seleccionar vehículo"
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
