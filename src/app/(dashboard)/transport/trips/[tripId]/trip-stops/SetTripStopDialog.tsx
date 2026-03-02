"use client";

import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as tripService from "@/services/tripService";
import type { TripStopType, TripStopStatus } from "@/services/tripService";
import { STOP_STATUS, statusToSelectOptions } from "@/constants/statusOptions";

const TYPE_OPTIONS: { label: string; value: TripStopType }[] = [
  { label: "Origen", value: "origin" },
  { label: "Recojo", value: "pickup" },
  { label: "Entrega", value: "delivery" },
  { label: "Punto de control", value: "checkpoint" },
  { label: "Descanso", value: "rest" },
];

const TRIP_STOP_STATUS_OPTIONS = statusToSelectOptions(STOP_STATUS);

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
    <DpContentSet
      title={isEdit ? "Editar parada del viaje" : "Agregar parada del viaje"}
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
          {!isEdit && (
            <DpInput type="input" label="Id (en la colección)" name="id" value={id} onChange={setId} placeholder="stop01" className="font-mono text-sm" />
          )}
          <DpInput type="number" label="Orden" name="order" value={order} onChange={setOrder} placeholder="1" />
          <DpInput type="select" label="Tipo" name="type" value={type} onChange={(v) => setType(v as TripStopType)} options={TYPE_OPTIONS} />
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Almacén Lima" />
          <DpInput type="number" label="Latitud" name="lat" value={lat} onChange={setLat} placeholder="-12.0464" />
          <DpInput type="number" label="Longitud" name="lng" value={lng} onChange={setLng} placeholder="-77.0428" />
          <DpInput type="select" label="Estado" name="status" value={status} onChange={(v) => setStatus(v as TripStopStatus)} options={TRIP_STOP_STATUS_OPTIONS} />
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Llegada planificada</label>
            <InputText value={plannedArrival} onChange={(e) => setPlannedArrival(e.target.value)} type="datetime-local" className="w-full" />
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
            <Button label="Ver evidencias" severity="secondary" onClick={() => onOpenEvidence({ id: stopId })} className="w-full" />
          )}
        </div>
      )}
    </DpContentSet>
  );
}
