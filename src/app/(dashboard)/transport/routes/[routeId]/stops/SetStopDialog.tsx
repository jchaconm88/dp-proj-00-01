"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import * as routeService from "@/services/routeService";
import type { StopStatus, StopType } from "@/services/routeService";
import * as orderService from "@/services/orderService";
import type { OrderRecord } from "@/services/orderService";

const STOP_TYPE_OPTIONS: { label: string; value: StopType }[] = [
  { label: "Origen", value: "origin" },
  { label: "Recojo", value: "pickup" },
  { label: "Entrega", value: "delivery" },
  { label: "Punto de control", value: "checkpoint" },
  { label: "Descanso", value: "rest" },
];

const STOP_STATUS_OPTIONS: { label: string; value: StopStatus }[] = [
  { label: "Pendiente", value: "pending" },
  { label: "Llegado", value: "arrived" },
  { label: "Completado", value: "completed" },
  { label: "Omitido", value: "skipped" },
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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderId, setOrderId] = useState<string>("");
  const [sequence, setSequence] = useState<string>("");
  const [eta, setEta] = useState<string>("");
  const [arrivalWindowStart, setArrivalWindowStart] = useState<string>("");
  const [arrivalWindowEnd, setArrivalWindowEnd] = useState<string>("");
  const [status, setStatus] = useState<StopStatus>("pending");
  const [type, setType] = useState<StopType>("checkpoint");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    orderService.list().then(setOrders).catch(() => setOrders([]));
    if (!stopId) {
      setId("");
      setOrderId("");
      setSequence("");
      setEta("");
      setArrivalWindowStart("");
      setArrivalWindowEnd("");
      setStatus("pending");
      setType("checkpoint");
      setName("");
      setAddress("");
      setLat("");
      setLng("");
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
        setOrderId(String(data.orderId ?? ""));
        setSequence(String(data.sequence ?? data.order ?? ""));
        setEta(String(data.eta ?? ""));
        setArrivalWindowStart(String(data.arrivalWindowStart ?? ""));
        setArrivalWindowEnd(String(data.arrivalWindowEnd ?? ""));
        setStatus(data.status ?? "pending");
        setType(data.type ?? "checkpoint");
        setName(data.name ?? "");
        setAddress(data.address ?? "");
        setLat(String(data.lat ?? ""));
        setLng(String(data.lng ?? ""));
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
      const seq = Number(sequence) || 0;
      const payload = {
        orderId: orderId.trim(),
        sequence: seq,
        eta: eta.trim() || "",
        arrivalWindowStart: arrivalWindowStart.trim() || "",
        arrivalWindowEnd: arrivalWindowEnd.trim() || "",
        status,
        order: seq,
        type,
        name: name.trim(),
        address: address.trim(),
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        estimatedArrivalOffsetMinutes: 0,
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
  const orderOptions = [
    { label: "— Sin pedido —", value: "" },
    ...orders.map((o) => ({ label: `${o.client} — ${o.deliveryAddress}`, value: o.id })),
  ];

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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Pedido</label>
            <Dropdown
              value={orderId}
              options={orderOptions}
              onChange={(e) => setOrderId(e.value ?? "")}
              placeholder="Seleccione un pedido (opcional)"
              filter
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Secuencia</label>
            <InputText
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              type="number"
              placeholder="1"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">ETA</label>
            <InputText
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              type="time"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Ventana de llegada</label>
            <div className="grid grid-cols-2 gap-2">
              <InputText
                value={arrivalWindowStart}
                onChange={(e) => setArrivalWindowStart(e.target.value)}
                type="time"
                className="w-full"
              />
              <InputText
                value={arrivalWindowEnd}
                onChange={(e) => setArrivalWindowEnd(e.target.value)}
                type="time"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
            <Dropdown
              value={status}
              options={STOP_STATUS_OPTIONS}
              onChange={(e) => setStatus(e.value)}
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
          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button label={saving ? "Guardando…" : "Guardar"} onClick={save} disabled={saving || !valid} loading={saving} />
          </div>
        </div>
      )}
    </Dialog>
  );
}
