"use client";

import { useState, useEffect } from "react";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as routeService from "@/services/routeService";
import type { StopStatus, StopType } from "@/services/routeService";
import { STOP_STATUS, statusToSelectOptions } from "@/constants/statusOptions";
import * as orderService from "@/services/orderService";
import type { OrderRecord } from "@/services/orderService";

const STOP_TYPE_OPTIONS: { label: string; value: StopType }[] = [
  { label: "Origen", value: "origin" },
  { label: "Recojo", value: "pickup" },
  { label: "Entrega", value: "delivery" },
  { label: "Punto de control", value: "checkpoint" },
  { label: "Descanso", value: "rest" },
];

const STOP_STATUS_OPTIONS = statusToSelectOptions(STOP_STATUS);

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
    <DpContentSet
      title={isEdit ? "Editar parada" : "Agregar parada"}
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
          <DpInput
            type="select"
            label="Pedido"
            name="orderId"
            value={orderId}
            onChange={(v) => setOrderId(String(v))}
            options={orderOptions}
            placeholder="Seleccione un pedido (opcional)"
            filter
          />
          <DpInput type="number" label="Secuencia" name="sequence" value={sequence} onChange={setSequence} placeholder="1" />
          <DpInput type="time" label="ETA" name="eta" value={eta} onChange={setEta} />
          <div className="grid grid-cols-2 gap-2">
            <DpInput type="time" label="Ventana inicio" name="arrivalWindowStart" value={arrivalWindowStart} onChange={setArrivalWindowStart} />
            <DpInput type="time" label="Ventana fin" name="arrivalWindowEnd" value={arrivalWindowEnd} onChange={setArrivalWindowEnd} />
          </div>
          <DpInput type="select" label="Estado" name="status" value={status} onChange={(v) => setStatus(v as StopStatus)} options={STOP_STATUS_OPTIONS} />
          <DpInput type="select" label="Tipo" name="type" value={type} onChange={(v) => setType(v as StopType)} options={STOP_TYPE_OPTIONS} />
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Almacén Lima" />
          <DpInput type="input" label="Dirección" name="address" value={address} onChange={setAddress} placeholder="Av. Industrial 123" />
          <DpInput type="number" label="Latitud" name="lat" value={lat} onChange={setLat} placeholder="-12.0464" />
          <DpInput type="number" label="Longitud" name="lng" value={lng} onChange={setLng} placeholder="-77.0428" />
        </div>
      )}
    </DpContentSet>
  );
}
