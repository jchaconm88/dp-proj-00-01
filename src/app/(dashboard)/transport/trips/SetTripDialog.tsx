"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as tripService from "@/services/tripService";
import type { TripStatus } from "@/services/tripService";
import * as sequenceService from "@/services/sequenceService";
import { TRIP_STATUS, statusToSelectOptions } from "@/constants/statusOptions";
import * as routeService from "@/services/routeService";
import * as clientService from "@/services/clientService";
import type { ClientRecord } from "@/services/clientService";
import * as serviceTypeService from "@/services/serviceTypeService";
import type { ServiceTypeRecord } from "@/services/serviceTypeService";
import * as driverService from "@/services/driverService";
import type { DriverRecord } from "@/services/driverService";
import * as vehicleService from "@/services/vehicleService";
import type { VehicleRecord } from "@/services/vehicleService";

export interface SetTripDialogProps {
  visible: boolean;
  tripId: string | null;
  onSuccess?: () => void;
}

const TRIP_STATUS_OPTIONS = statusToSelectOptions(TRIP_STATUS);

export default function SetTripDialog({
  visible,
  tripId,
  onSuccess,
}: SetTripDialogProps) {
  const router = useRouter();
  const isEdit = !!tripId;
  const [code, setCode] = useState("");
  const [routeId, setRouteId] = useState<string | null>(null);
  const [isExternalRoute, setIsExternalRoute] = useState(false);
  const [route, setRoute] = useState("");
  const [transportServiceId, setTransportServiceId] = useState<string | null>(null);
  const [transportService, setTransportService] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState("");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driver, setDriver] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [transportGuide, setTransportGuide] = useState("");
  const [status, setStatus] = useState<TripStatus>("scheduled");
  const [scheduledStart, setScheduledStart] = useState("");
  const [routes, setRoutes] = useState<routeService.RouteRecord[]>([]);
  const [services, setServices] = useState<ServiceTypeRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/trips");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    routeService.listRoutes().then(setRoutes).catch(() => setRoutes([]));
    serviceTypeService.list().then(setServices).catch(() => setServices([]));
    clientService.list().then(setClients).catch(() => setClients([]));
    driverService.list().then(setDrivers).catch(() => setDrivers([]));
    vehicleService.list().then(setVehicles).catch(() => setVehicles([]));
    if (!tripId) {
      setCode("");
      setRouteId(null);
      setIsExternalRoute(false);
      setRoute("");
      setTransportServiceId(null);
      setTransportService("");
      setClientId(null);
      setClient("");
      setDriverId(null);
      setDriver("");
      setVehicleId(null);
      setVehicle("");
      setTransportGuide("");
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
        setCode(data.code ?? "");
        setRouteId(data.routeId || null);
        setIsExternalRoute(data.isExternalRoute === true);
        setRoute(data.route ?? "");
        setTransportServiceId(data.transportServiceId || null);
        setTransportService(data.transportService ?? "");
        setClientId(data.clientId || null);
        setClient(data.client ?? "");
        setDriverId(data.driverId || null);
        setDriver(data.driver ?? "");
        setVehicleId(data.vehicleId || null);
        setVehicle(data.vehicle ?? "");
        setTransportGuide(data.transportGuide ?? "");
        setStatus(data.status ?? "scheduled");
        setScheduledStart(data.scheduledStart ? data.scheduledStart.slice(0, 16) : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, tripId]);

  // Rellenar driver/vehicle desde listas si al editar venían vacíos (viajes antiguos)
  useEffect(() => {
    if (!driverId || driver) return;
    const d = drivers.find((x) => x.id === driverId);
    if (d) setDriver(`${(d.licenseNo || "").trim()} - ${(d.lastName || "").trim()} ${(d.firstName || "").trim()}`.trim());
  }, [driverId, driver, drivers]);
  useEffect(() => {
    if (!vehicleId || vehicle) return;
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) setVehicle((v.plate || "").trim());
  }, [vehicleId, vehicle, vehicles]);

  const save = async () => {
    const routeOk = isExternalRoute ? !!route.trim() : !!routeId;
    if (!routeOk || !driverId || !vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      let finalCode: string;
      try {
        finalCode = await sequenceService.resolveCodeIfEmpty(code, "trip");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al generar código.");
        setSaving(false);
        return;
      }
      const payload = {
        code: finalCode,
        routeId: isExternalRoute ? "" : String(routeId ?? ""),
        route: route.trim(),
        isExternalRoute,
        transportServiceId: String(transportServiceId ?? "").trim(),
        transportService: transportService.trim(),
        clientId: String(clientId ?? "").trim(),
        client: client.trim(),
        driverId,
        driver,
        vehicleId,
        vehicle,
        transportGuide: transportGuide.trim(),
        status,
        scheduledStart: scheduledStart.trim() || "",
      };
      if (tripId) {
        await tripService.editTrip(tripId, payload);
      } else {
        await tripService.addTrip(payload);
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

  const onRouteChange = (value: string) => {
    setRouteId(value);
    const r = routes.find((x) => x.id === value);
    if (r) setRoute((r.code || r.name || r.id).trim());
  };

  const onClientChange = (value: string) => {
    const id = value ?? "";
    setClientId(id || null);
    const c = clients.find((x) => x.id === id);
    if (c) setClient(((c.commercialName || c.businessName || c.code || c.id) ?? "").trim());
    else setClient("");
  };

  const onServiceChange = (value: string) => {
    const id = value ?? "";
    setTransportServiceId(id || null);
    const s = services.find((x) => x.id === id);
    if (s) setTransportService(((s.name || s.code || s.id) ?? "").trim());
    else setTransportService("");
  };

  const onDriverChange = (value: string) => {
    const id = value ?? "";
    setDriverId(id);
    const d = drivers.find((x) => x.id === id);
    if (d) setDriver(`${(d.licenseNo || "").trim()} - ${(d.lastName || "").trim()} ${(d.firstName || "").trim()}`.trim());
    else setDriver("");
  };

  const onVehicleChange = (value: string) => {
    const id = value ?? "";
    setVehicleId(id);
    const v = vehicles.find((x) => x.id === id);
    if (v) setVehicle((v.plate || "").trim());
    else setVehicle("");
  };

  const routeOptions = [
    { label: "— Sin ruta —", value: "" },
    ...routes.map((r) => ({ label: `${r.name} (${r.code || r.id})`, value: r.id })),
  ];
  const serviceOptions = [
    { label: "— Sin servicio —", value: "" },
    ...services.map((s) => ({
      label: `${(s.name || s.code || s.id).trim()} (${(s.code || s.id).trim()})`,
      value: s.id,
    })),
  ];
  const clientOptions = [
    { label: "— Sin cliente —", value: "" },
    ...clients.map((c) => ({
      label: `${(c.commercialName || c.businessName || c.code || c.id).trim()} (${(c.code || c.id).trim()})`,
      value: c.id,
    })),
  ];
  const driverOptions = drivers.map((d) => ({
    label: `${(d.licenseNo || "").trim()} - ${(d.lastName || "").trim()} ${(d.firstName || "").trim()}`.trim() || d.id,
    value: d.id,
  }));
  const vehicleOptions = vehicles.map((v) => ({ label: (v.plate || "").trim() || v.id, value: v.id }));
  const valid = (isExternalRoute ? !!route.trim() : !!routeId) && !!driverId && !!vehicleId;

  return (
    <DpContentSet
      title={isEdit ? "Editar viaje" : "Agregar viaje"}
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
          <DpCodeInput entity="trip" label="Código" name="code" value={code} onChange={setCode} />
          <DpInput
            type="check"
            label="Ruta externa"
            name="isExternalRoute"
            value={isExternalRoute}
            onChange={(v) => {
              setIsExternalRoute(!!v);
              setRouteId(null);
              setRoute("");
            }}
          />
          {isExternalRoute ? (
            <DpInput type="input" label="Ruta" name="route" value={route} onChange={setRoute} placeholder="Ingresar ruta manualmente" />
          ) : (
            <DpInput
              type="select"
              label="Ruta"
              name="routeId"
              value={routeId ?? ""}
              onChange={(v) => onRouteChange(String(v))}
              options={routeOptions}
              placeholder="Seleccionar ruta"
              filter
            />
          )}
          <DpInput
            type="select"
            label="Servicio de transporte"
            name="transportServiceId"
            value={transportServiceId ?? ""}
            onChange={(v) => onServiceChange(String(v))}
            options={serviceOptions}
            placeholder="Seleccionar servicio"
            filter
          />
          <DpInput
            type="input"
            label="Guía de transporte"
            name="transportGuide"
            value={transportGuide}
            onChange={setTransportGuide}
            placeholder="Número o código de guía"
          />
          <DpInput
            type="select"
            label="Cliente"
            name="clientId"
            value={clientId ?? ""}
            onChange={(v) => onClientChange(String(v))}
            options={clientOptions}
            placeholder="Seleccionar cliente"
            filter
          />
          <DpInput
            type="select"
            label="Conductor"
            name="driverId"
            value={driverId ?? ""}
            onChange={(v) => onDriverChange(String(v))}
            options={driverOptions}
            placeholder="Seleccionar conductor"
            filter
          />
          <DpInput
            type="select"
            label="Vehículo"
            name="vehicleId"
            value={vehicleId ?? ""}
            onChange={(v) => onVehicleChange(String(v))}
            options={vehicleOptions}
            placeholder="Seleccionar vehículo"
            filter
          />
          <DpInput type="select" label="Estado" name="status" value={status} onChange={(v) => setStatus(v as TripStatus)} options={TRIP_STATUS_OPTIONS} />
          <DpInput type="datetime" label="Inicio programado" name="scheduledStart" value={scheduledStart} onChange={setScheduledStart} />
          {isEdit && (
            <Button label="Gestionar paradas del viaje" severity="secondary" onClick={goToTripStops} className="w-full" />
          )}
        </div>
      )}
    </DpContentSet>
  );
}
