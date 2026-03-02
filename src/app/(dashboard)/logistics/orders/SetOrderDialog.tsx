"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as orderService from "@/services/orderService";
import type { OrderStatus } from "@/services/orderService";
import { ORDER_STATUS, statusToSelectOptions } from "@/constants/statusOptions";
import * as clientService from "@/services/clientService";
import type { ClientRecord } from "@/services/clientService";

export interface SetOrderDialogProps {
  visible: boolean;
  orderId: string | null;
  onSuccess?: () => void;
}

const ORDER_STATUS_OPTIONS = statusToSelectOptions(ORDER_STATUS);

export default function SetOrderDialog({
  visible,
  orderId,
  onSuccess,
}: SetOrderDialogProps) {
  const router = useRouter();
  const isEdit = !!orderId;
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [code, setCode] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [deliveryWindowStart, setDeliveryWindowStart] = useState("08:00");
  const [deliveryWindowEnd, setDeliveryWindowEnd] = useState("12:00");
  const [weight, setWeight] = useState<string>("");
  const [volume, setVolume] = useState<string>("");
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/logistics/orders");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    clientService.list().then(setClients).catch(() => setClients([]));
    if (!orderId) {
      setCode("");
      setClientId("");
      setDeliveryAddress("");
      setLatitude("");
      setLongitude("");
      setDeliveryWindowStart("08:00");
      setDeliveryWindowEnd("12:00");
      setWeight("");
      setVolume("");
      setStatus("pending");
      setLoading(false);
      return;
    }
    setLoading(true);
    orderService
      .get(orderId)
      .then((data) => {
        if (!data) {
          setError("Pedido no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setClientId(data.clientId ?? "");
        setDeliveryAddress(data.deliveryAddress ?? "");
        setLatitude(String(data.location?.latitude ?? ""));
        setLongitude(String(data.location?.longitude ?? ""));
        setDeliveryWindowStart(data.deliveryWindowStart ?? "08:00");
        setDeliveryWindowEnd(data.deliveryWindowEnd ?? "12:00");
        setWeight(String(data.weight ?? ""));
        setVolume(String(data.volume ?? ""));
        setStatus(data.status ?? "pending");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, orderId]);

  const save = async () => {
    const selected = clients.find((c) => c.id === clientId);
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const clientName = selected.commercialName?.trim() || selected.businessName?.trim() || selected.code || "";
      const payload = {
        code: code.trim(),
        clientId: selected.id,
        client: clientName,
        deliveryAddress: deliveryAddress.trim(),
        location: {
          latitude: Number(latitude) || 0,
          longitude: Number(longitude) || 0,
        },
        deliveryWindowStart: deliveryWindowStart.trim() || "08:00",
        deliveryWindowEnd: deliveryWindowEnd.trim() || "12:00",
        weight: Number(weight) || 0,
        volume: Number(volume) || 0,
        status,
      };
      if (orderId) {
        await orderService.edit(orderId, payload);
      } else {
        await orderService.add(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = !!clientId;
  const clientOptions = clients.map((c) => ({
    label: (c.commercialName?.trim() ? c.commercialName : c.businessName) || c.code || c.id,
    value: c.id,
  }));

  return (
    <DpContentSet
      title={isEdit ? "Editar pedido" : "Agregar pedido"}
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
          <DpInput type="input" label="Código" name="code" value={code} onChange={setCode} placeholder="PED-001" />
          <DpInput
            type="select"
            label="Cliente"
            name="clientId"
            value={clientId}
            onChange={(v) => setClientId(String(v))}
            options={clientOptions}
            placeholder="Seleccione un cliente"
            filter
          />
          <DpInput type="input" label="Dirección de entrega" name="deliveryAddress" value={deliveryAddress} onChange={setDeliveryAddress} placeholder="Av. Brasil 1200" />
          <div className="grid grid-cols-2 gap-2">
            <DpInput type="number" label="Lat" name="latitude" value={latitude} onChange={setLatitude} placeholder="-12.067" />
            <DpInput type="number" label="Lng" name="longitude" value={longitude} onChange={setLongitude} placeholder="-77.048" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DpInput type="time" label="Ventana inicio" name="deliveryWindowStart" value={deliveryWindowStart} onChange={setDeliveryWindowStart} />
            <DpInput type="time" label="Ventana fin" name="deliveryWindowEnd" value={deliveryWindowEnd} onChange={setDeliveryWindowEnd} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DpInput type="number" label="Peso" name="weight" value={weight} onChange={setWeight} placeholder="800" />
            <DpInput type="number" label="Volumen" name="volume" value={volume} onChange={setVolume} placeholder="4" />
          </div>
          <DpInput type="select" label="Estado" name="status" value={status} onChange={(v) => setStatus(v as OrderStatus)} options={ORDER_STATUS_OPTIONS} />
        </div>
      )}
    </DpContentSet>
  );
}
