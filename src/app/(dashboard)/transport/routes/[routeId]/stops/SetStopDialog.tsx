"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import * as routeService from "@/services/routeService";
import type { StopType } from "@/services/routeService";

const STOP_TYPE_OPTIONS: { label: string; value: StopType }[] = [
  { label: "Origen", value: "origin" },
  { label: "Recojo", value: "pickup" },
  { label: "Entrega", value: "delivery" },
  { label: "Punto de control", value: "checkpoint" },
  { label: "Descanso", value: "rest" },
];

export interface SetStopDialogProps {
  visible: boolean;
  routeId: string;
  stopId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}

export default function SetStopDialog({
  visible,
  routeId,
  stopId,
  onSuccess,
  onHide,
}: SetStopDialogProps) {
  const isEdit = !!stopId;
  const [id, setId] = useState("");
  const [order, setOrder] = useState<string>("");
  const [type, setType] = useState<StopType>("checkpoint");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [estimatedArrivalOffsetMinutes, setEstimatedArrivalOffsetMinutes] = useState<string>("");
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
      setAddress("");
      setLat("");
      setLng("");
      setEstimatedArrivalOffsetMinutes("0");
      setLoading(false);
      return;
    }
    setLoading(true);
    routeService
      .getStop(routeId, stopId)
      .then((data) => {
        if (!data) {
          setError("Parada no encontrada.");
          return;
        }
        setId(data.id ?? "");
        setOrder(String(data.order ?? ""));
        setType(data.type ?? "checkpoint");
        setName(data.name ?? "");
        setAddress(data.address ?? "");
        setLat(String(data.lat ?? ""));
        setLng(String(data.lng ?? ""));
        setEstimatedArrivalOffsetMinutes(String(data.estimatedArrivalOffsetMinutes ?? "0"));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, routeId, stopId]);

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
        address: address.trim(),
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        estimatedArrivalOffsetMinutes: Number(estimatedArrivalOffsetMinutes) || 0,
      };
      if (stopId) {
        await routeService.editStop(routeId, stopId, payload);
      } else {
        await routeService.addStop(routeId, { id: stopIdNorm, ...payload });
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
      header={isEdit ? "Editar parada" : "Agregar parada"}
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
            <InputText
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              type="number"
              placeholder="1"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
            <Dropdown
              value={type}
              options={STOP_TYPE_OPTIONS}
              onChange={(e) => setType(e.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <InputText
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Almacén Lima"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Dirección</label>
            <InputText
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Industrial 123"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Latitud</label>
            <InputText
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              type="number"
              step="any"
              placeholder="-12.0464"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Longitud</label>
            <InputText
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              type="number"
              step="any"
              placeholder="-77.0428"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Offset llegada estimada (min)</label>
            <InputText
              value={estimatedArrivalOffsetMinutes}
              onChange={(e) => setEstimatedArrivalOffsetMinutes(e.target.value)}
              type="number"
              placeholder="0"
              className="w-full"
            />
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
