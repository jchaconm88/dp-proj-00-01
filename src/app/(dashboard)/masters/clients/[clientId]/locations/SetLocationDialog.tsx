"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import * as clientLocationService from "@/services/clientLocationService";
import type { LocationType } from "@/services/clientLocationService";

export interface SetLocationDialogProps {
  visible: boolean;
  clientId: string;
  locationId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}

const TYPE_OPTIONS: { label: string; value: LocationType }[] = [
  { label: "Almacén", value: "warehouse" },
  { label: "Tienda", value: "store" },
  { label: "Oficina", value: "office" },
  { label: "Planta", value: "plant" },
];

export default function SetLocationDialog({
  visible,
  clientId,
  locationId,
  onSuccess,
  onHide,
}: SetLocationDialogProps) {
  const isEdit = !!locationId;
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("warehouse");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [windowStart, setWindowStart] = useState("08:00");
  const [windowEnd, setWindowEnd] = useState("16:00");
  const [serviceTimeMin, setServiceTimeMin] = useState<string>("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!locationId) {
      setName("");
      setType("warehouse");
      setAddress("");
      setDistrict("");
      setCity("");
      setCountry("Perú");
      setLatitude("");
      setLongitude("");
      setWindowStart("08:00");
      setWindowEnd("16:00");
      setServiceTimeMin("");
      setActive(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    clientLocationService
      .getLocation(clientId, locationId)
      .then((data) => {
        if (!data) {
          setError("Ubicación no encontrada.");
          return;
        }
        setName(data.name ?? "");
        setType(data.type ?? "warehouse");
        setAddress(data.address ?? "");
        setDistrict(data.district ?? "");
        setCity(data.city ?? "");
        setCountry(data.country ?? "");
        setLatitude(String(data.geo?.latitude ?? ""));
        setLongitude(String(data.geo?.longitude ?? ""));
        setWindowStart(data.deliveryWindow?.start ?? "08:00");
        setWindowEnd(data.deliveryWindow?.end ?? "16:00");
        setServiceTimeMin(String(data.serviceTimeMin ?? ""));
        setActive(data.active ?? true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, clientId, locationId]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        type,
        address: address.trim(),
        district: district.trim(),
        city: city.trim(),
        country: country.trim(),
        geo: {
          latitude: Number(latitude) || 0,
          longitude: Number(longitude) || 0,
        },
        deliveryWindow: { start: windowStart.trim() || "08:00", end: windowEnd.trim() || "16:00" },
        serviceTimeMin: Number(serviceTimeMin) || 0,
        active,
      };
      if (locationId) {
        await clientLocationService.editLocation(clientId, locationId, payload);
      } else {
        await clientLocationService.addLocation(clientId, payload);
      }
      onSuccess?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = name.trim();

  return (
    <Dialog
      header={isEdit ? "Editar ubicación" : "Agregar ubicación"}
      visible={visible}
      style={{ width: "28rem", maxWidth: "95vw" }}
      onHide={onHide}
      closable={!saving}
      closeOnEscape={!saving}
      dismissableMask={!saving}
      modal
    >
      {loading ? (
        <div className="py-8 text-center text-zinc-500">Cargando…</div>
      ) : (
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pt-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <InputText value={name} onChange={(e) => setName(e.target.value)} placeholder="CD Lima" className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
            <Dropdown value={type} options={TYPE_OPTIONS} onChange={(e) => setType(e.value)} className="w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Dirección</label>
            <InputText value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Argentina 2450" className="w-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Distrito</label>
              <InputText value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Callao" className="w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Ciudad</label>
              <InputText value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lima" className="w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">País</label>
            <InputText value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Perú" className="w-full" />
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Coordenadas</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Latitud</label>
                <InputText value={latitude} onChange={(e) => setLatitude(e.target.value)} type="number" step="any" placeholder="-12.048" className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Longitud</label>
                <InputText value={longitude} onChange={(e) => setLongitude(e.target.value)} type="number" step="any" placeholder="-77.118" className="w-full" />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ventana de entrega</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Inicio</label>
                <InputText value={windowStart} onChange={(e) => setWindowStart(e.target.value)} type="time" className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Fin</label>
                <InputText value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} type="time" className="w-full" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tiempo de servicio (min)</label>
            <InputText value={serviceTimeMin} onChange={(e) => setServiceTimeMin(e.target.value)} type="number" placeholder="45" className="w-full" />
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
