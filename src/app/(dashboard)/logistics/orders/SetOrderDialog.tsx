"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import * as orderService from "@/services/orderService";
import type { OrderStatus } from "@/services/orderService";
import * as clientService from "@/services/clientService";
import type { ClientRecord } from "@/services/clientService";

export interface SetOrderDialogProps {
  visible: boolean;
  orderId: string | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pendiente", value: "pending" },
  { label: "Confirmado", value: "confirmed" },
  { label: "En curso", value: "in_progress" },
  { label: "Entregado", value: "delivered" },
  { label: "Cancelado", value: "cancelled" },
];

export default function SetOrderDialog({
  visible,
  orderId,
  onSuccess,
}: SetOrderDialogProps) {
  const router = useRouter();
  const isEdit = !!orderId;
  const [clients, setClients] = useState<ClientRecord[]>([]);
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

  return (
    <Dialog
      header={isEdit ? "Editar pedido" : "Agregar pedido"}
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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Cliente</label>
            <Dropdown
              value={clientId}
              options={clients.map((c) => ({
                id: c.id,
                label: (c.commercialName?.trim() ? c.commercialName : c.businessName) || "",
              }))}
              onChange={(e) => setClientId(e.value ?? "")}
              optionLabel="label"
              optionValue="id"
              placeholder="Seleccione un cliente"
              filter
              filterPlaceholder="Buscar cliente"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Dirección de entrega</label>
            <InputText
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Av. Brasil 1200"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Ubicación (coordenadas)</label>
            <div className="grid grid-cols-2 gap-2">
              <InputText
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                type="number"
                step="any"
                placeholder="Lat: -12.067"
                className="w-full"
              />
              <InputText
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                type="number"
                step="any"
                placeholder="Lng: -77.048"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Ventana de entrega</label>
            <div className="grid grid-cols-2 gap-2">
              <InputText
                value={deliveryWindowStart}
                onChange={(e) => setDeliveryWindowStart(e.target.value)}
                type="time"
                className="w-full"
              />
              <InputText
                value={deliveryWindowEnd}
                onChange={(e) => setDeliveryWindowEnd(e.target.value)}
                type="time"
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Peso</label>
              <InputText
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                type="number"
                placeholder="800"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Volumen</label>
              <InputText
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                type="number"
                step="any"
                placeholder="4"
                className="w-full"
              />
            </div>
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
            <Button label={saving ? "Guardando…" : "Guardar"} onClick={save} disabled={saving || !valid} loading={saving} />
          </div>
        </div>
      )}
    </Dialog>
  );
}
