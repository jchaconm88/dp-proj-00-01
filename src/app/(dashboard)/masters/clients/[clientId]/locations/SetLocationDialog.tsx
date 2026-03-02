"use client";

import { useState, useEffect } from "react";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
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
    <DpContentSet
      title={isEdit ? "Editar ubicación" : "Agregar ubicación"}
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
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pt-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="CD Lima" />
          <DpInput type="select" label="Tipo" name="type" value={type} onChange={(v) => setType(v as LocationType)} options={TYPE_OPTIONS} />
          <DpInput type="input" label="Dirección" name="address" value={address} onChange={setAddress} placeholder="Av. Argentina 2450" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DpInput type="input" label="Distrito" name="district" value={district} onChange={setDistrict} placeholder="Callao" />
            <DpInput type="input" label="Ciudad" name="city" value={city} onChange={setCity} placeholder="Lima" />
          </div>
          <DpInput type="input" label="País" name="country" value={country} onChange={setCountry} placeholder="Perú" />

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Coordenadas</h4>
            <div className="grid grid-cols-2 gap-3">
              <DpInput type="number" label="Latitud" name="latitude" value={latitude} onChange={setLatitude} placeholder="-12.048" />
              <DpInput type="number" label="Longitud" name="longitude" value={longitude} onChange={setLongitude} placeholder="-77.118" />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ventana de entrega</h4>
            <div className="grid grid-cols-2 gap-3">
              <DpInput type="time" label="Inicio" name="windowStart" value={windowStart} onChange={setWindowStart} />
              <DpInput type="time" label="Fin" name="windowEnd" value={windowEnd} onChange={setWindowEnd} />
            </div>
          </div>

          <DpInput type="number" label="Tiempo de servicio (min)" name="serviceTimeMin" value={serviceTimeMin} onChange={setServiceTimeMin} placeholder="45" />
          <DpInput type="check" label="Activo" name="active" value={active} onChange={setActive} />
        </div>
      )}
    </DpContentSet>
  );
}
