"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import * as tripService from "@/services/tripService";
import type { TripStopType, TripStopStatus } from "@/services/tripService";

const TYPE_OPTIONS: { label: string; value: TripStopType }[] = [
  { label: "Origen", value: "origin" },
  { label: "Recojo", value: "pickup" },
  { label: "Entrega", value: "delivery" },
  { label: "Punto de control", value: "checkpoint" },
  { label: "Descanso", value: "rest" },
];

const STATUS_OPTIONS: { label: string; value: TripStopStatus }[] = [
  { label: "Pendiente", value: "pending" },
  { label: "Llegado", value: "arrived" },
  { label: "Completado", value: "completed" },
  { label: "Omitido", value: "skipped" },
];

export interface SetTripStopDialogProps {
  visible: boolean;
  tripId: string;
  stopId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
  onOpenEvidence?: (row: { id: string }) => void;
}

export default function SetTripStopDialog({
  visible,
  tripId,
  stopId,
  onSuccess,
  onHide,
  onOpenEvidence,
}: SetTripStopDialogProps) {
  const isEdit = !!stopId;
  const [id, setId] = useState("");
  const [order, setOrder] = useState<string>("");
  const [type, setType] = useState<TripStopType>("checkpoint");
  const [name, setName] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [status, setStatus] = useState<TripStopStatus>("pending");
  const [plannedArrival, setPlannedArrival] = useState("");
  const [actualArrival, setActualArrival] = useState("");
  const [actualDeparture, setActualDeparture] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!stopId) {
      setId("");
      setOrder("");
      setType("checkpoint");
      setName("");
      setLat("");
      setLng("");
      setStatus("pending");
      setPlannedArrival("");
      setActualArrival("");
      setActualDeparture("");
      setLoading(false);
      return;
    }
    setLoading(true);
    tripService
      .getTripStop(tripId, stopId)
      .then((data) => {
        if (!data) {
          setError("Parada no encontrada.");
          return;
        }
        setId(data.id ?? "");
        setOrder(String(data.order ?? ""));
        setType(data.type ?? "checkpoint");
        setName(data.name ?? "");
        setLat(String(data.lat ?? ""));
        setLng(String(data.lng ?? ""));
        setStatus(data.status ?? "pending");
        setPlannedArrival(data.plannedArrival ? data.plannedArrival.slice(0, 16) : "");
        setActualArrival(data.actualArrival ? data.actualArrival.slice(0, 16) : "");
        setActualDeparture(data.actualDeparture ? data.actualDeparture.slice(0, 16) : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, tripId, stopId]);

  const save = async () => {
    if (!name.trim()) return;
    if (!isEdit && !id.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const stopIdNorm = id.trim().toLowerCase().replace(/\s+/g, "-");
      const payload = {
        order: Number(order) || 0,
        type,
        name: name.trim(),
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        status,
        plannedArrival: plannedArrival.trim() || "",
        actualArrival: actualArrival.trim() || null,
        actualDeparture: actualDeparture.trim() || null,
      };
      if (stopId) {
        await tripService.editTripStop(tripId, stopId, payload);
      } else {
        await tripService.addTripStop(tripId, { id: stopIdNorm, ...payload });
      }
      onSuccess?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = name.trim() && (isEdit || id.trim());

  return (
    <Dialog
      header={isEdit ? "Editar parada del viaje" : "Agregar parada del viaje"}
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
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Id (en la colección)</label>
              <InputText
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="stop01"
                className="w-full font-mono text-sm"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Orden</label>
            <InputText value={order} onChange={(e) => setOrder(e.target.value)} type="number" placeholder="1" className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
            <Dropdown value={type} options={TYPE_OPTIONS} onChange={(e) => setType(e.value)} className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <InputText value={name} onChange={(e) => setName(e.target.value)} placeholder="Almacén Lima" className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Latitud</label>
            <InputText value={lat} onChange={(e) => setLat(e.target.value)} type="number" step="any" placeholder="-12.0464" className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Longitud</label>
            <InputText value={lng} onChange={(e) => setLng(e.target.value)} type="number" step="any" placeholder="-77.0428" className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
            <Dropdown value={status} options={STATUS_OPTIONS} onChange={(e) => setStatus(e.value)} className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Llegada planificada</label>
            <InputText
              value={plannedArrival}
              onChange={(e) => setPlannedArrival(e.target.value)}
              type="datetime-local"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Llegada real</label>
            <InputText value={actualArrival} onChange={(e) => setActualArrival(e.target.value)} type="datetime-local" className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Salida real</label>
            <InputText value={actualDeparture} onChange={(e) => setActualDeparture(e.target.value)} type="datetime-local" className="w-full" />
          </div>
          {isEdit && stopId && onOpenEvidence && (
            <Button
              label="Ver evidencias"
              severity="secondary"
              onClick={() => onOpenEvidence({ id: stopId })}
              className="w-full"
            />
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
