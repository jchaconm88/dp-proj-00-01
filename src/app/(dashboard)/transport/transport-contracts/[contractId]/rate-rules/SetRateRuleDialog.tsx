"use client";

import { useState, useEffect, useMemo } from "react";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as contractService from "@/services/contractService";
import type {
  RateRuleConditions,
  RateRuleCalculation,
  RateRuleType,
  CalculationType,
} from "@/services/contractService";
import * as serviceTypeService from "@/services/serviceTypeService";
import type { ServiceTypeRecord } from "@/services/serviceTypeService";
import { CALCULATION_TYPE, statusToSelectOptions } from "@/constants/statusOptions";

const RULE_TYPE_OPTIONS: { label: string; value: RateRuleType }[] = [
  { label: "Base", value: "base" },
  { label: "Cargo extra", value: "extra_charge" },
  { label: "Penalidad", value: "penalty" },
  { label: "Descuento", value: "discount" },
];

const CALCULATION_TYPE_OPTIONS = statusToSelectOptions(CALCULATION_TYPE);

export interface SetRateRuleDialogProps {
  visible: boolean;
  contractId: string;
  ruleId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}

const emptyConditions: RateRuleConditions = {
  originZone: null,
  destinationZone: null,
  minWeight: null,
  maxWeight: null,
  minDistanceKm: null,
  maxDistanceKm: null,
  priorityLevel: null,
  dayOfWeek: null,
};

const emptyCalculation: RateRuleCalculation = {
  basePrice: null,
  pricePerKm: null,
  pricePerTon: null,
  pricePerM3: null,
  percentage: null,
};

export default function SetRateRuleDialog({
  visible,
  contractId,
  ruleId,
  onSuccess,
  onHide,
}: SetRateRuleDialogProps) {
  const isEdit = !!ruleId;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [priority, setPriority] = useState("");
  const [ruleType, setRuleType] = useState<RateRuleType>("base");
  const [calculationType, setCalculationType] = useState<CalculationType>("zone");
  const [transportServiceId, setTransportServiceId] = useState("");
  const [transportService, setTransportService] = useState("");
  const [services, setServices] = useState<ServiceTypeRecord[]>([]);
  const [vehicleType, setVehicleType] = useState("");
  const [stackable, setStackable] = useState(false);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [originZone, setOriginZone] = useState("");
  const [destinationZone, setDestinationZone] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [minDistanceKm, setMinDistanceKm] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [pricePerKm, setPricePerKm] = useState("");
  const [pricePerTon, setPricePerTon] = useState("");
  const [pricePerM3, setPricePerM3] = useState("");
  const [percentage, setPercentage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!ruleId) {
      setCode("");
      setName("");
      setActive(true);
      setPriority("1");
      setRuleType("base");
      setCalculationType("zone");
      setTransportServiceId("");
      setTransportService("");
      setVehicleType("");
      setStackable(false);
      const today = new Date().toISOString().slice(0, 10);
      setValidFrom(today);
      setValidTo("");
      setOriginZone("");
      setDestinationZone("");
      setMinWeight("");
      setMaxWeight("");
      setMinDistanceKm("");
      setMaxDistanceKm("");
      setBasePrice("");
      setPricePerKm("");
      setPricePerTon("");
      setPricePerM3("");
      setPercentage("");
      setLoading(false);
      return;
    }
    setLoading(true);
    contractService
      .getRateRule(contractId, ruleId)
      .then((data) => {
        if (!data) {
          setError("Regla no encontrada.");
          return;
        }
        setCode(data.code ?? "");
        setName(data.name ?? "");
        setActive(data.active ?? true);
        setPriority(String(data.priority ?? "1"));
        setRuleType(data.ruleType ?? "base");
        setCalculationType(data.calculationType ?? "zone");
        setTransportServiceId(data.transportServiceId ?? "");
        setTransportService(data.transportService ?? "");
        setVehicleType(data.vehicleType ?? "");
        setStackable(data.stackable ?? false);
        setValidFrom(data.validFrom ?? "");
        setValidTo(data.validTo ?? "");
        const c = data.conditions ?? emptyConditions;
        setOriginZone(String(c.originZone ?? ""));
        setDestinationZone(String(c.destinationZone ?? ""));
        setMinWeight(c.minWeight != null ? String(c.minWeight) : "");
        setMaxWeight(c.maxWeight != null ? String(c.maxWeight) : "");
        setMinDistanceKm(c.minDistanceKm != null ? String(c.minDistanceKm) : "");
        setMaxDistanceKm(c.maxDistanceKm != null ? String(c.maxDistanceKm) : "");
        const calc = data.calculation ?? emptyCalculation;
        setBasePrice(calc.basePrice != null ? String(calc.basePrice) : "");
        setPricePerKm(calc.pricePerKm != null ? String(calc.pricePerKm) : "");
        setPricePerTon(calc.pricePerTon != null ? String(calc.pricePerTon) : "");
        setPricePerM3(calc.pricePerM3 != null ? String(calc.pricePerM3) : "");
        setPercentage(calc.percentage != null ? String(calc.percentage) : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, contractId, ruleId]);

  useEffect(() => {
    if (!visible) return;
    serviceTypeService.list().then(setServices).catch(() => setServices([]));
  }, [visible]);

  const filteredServices = useMemo(
    () => services.filter((s) => s.calculationType === calculationType),
    [services, calculationType]
  );
  const serviceOptions = useMemo(
    () => filteredServices.map((s) => ({ label: s.name || s.code || s.id, value: s.id })),
    [filteredServices]
  );

  const onTransportServiceChange = (value: string | number) => {
    const id = value != null ? String(value) : "";
    setTransportServiceId(id);
    const svc = services.find((s) => s.id === id);
    setTransportService(svc ? (svc.name || svc.code || "").trim() : "");
  };

  const save = async () => {
    if (!name.trim()) return;
    if (!isEdit && !code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const conditions: RateRuleConditions = {
        originZone: originZone.trim() || null,
        destinationZone: destinationZone.trim() || null,
        minWeight: minWeight !== "" ? Number(minWeight) : null,
        maxWeight: maxWeight !== "" ? Number(maxWeight) : null,
        minDistanceKm: minDistanceKm !== "" ? Number(minDistanceKm) : null,
        maxDistanceKm: maxDistanceKm !== "" ? Number(maxDistanceKm) : null,
        priorityLevel: null,
        dayOfWeek: null,
      };
      const calculation: RateRuleCalculation = {
        basePrice: basePrice !== "" ? Number(basePrice) : null,
        pricePerKm: pricePerKm !== "" ? Number(pricePerKm) : null,
        pricePerTon: pricePerTon !== "" ? Number(pricePerTon) : null,
        pricePerM3: pricePerM3 !== "" ? Number(pricePerM3) : null,
        percentage: percentage !== "" ? Number(percentage) : null,
      };
      const payload = {
        code: code.trim(),
        name: name.trim(),
        active,
        priority: Number(priority) || 0,
        ruleType,
        calculationType,
        transportServiceId: transportServiceId.trim(),
        transportService: transportService.trim(),
        vehicleType: vehicleType.trim(),
        conditions,
        calculation,
        stackable,
        validFrom: validFrom.trim(),
        validTo: validTo.trim(),
      };
      if (ruleId) {
        await contractService.editRateRule(contractId, ruleId, payload);
      } else {
        await contractService.addRateRule(contractId, payload);
      }
      onSuccess?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = name.trim() && (isEdit || code.trim());

  return (
    <DpContentSet
      title={isEdit ? "Editar regla de tarifa" : "Agregar regla de tarifa"}
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
        <>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          <DpInput type="input" label="Código" name="code" value={code} onChange={setCode} placeholder="LIMA_CENTRO_CALLAO_5TN" />
          <DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} placeholder="Zona Lima Centro - Callao 5TN" />
          <DpInput type="check" label="Activo" name="active" value={active} onChange={setActive} />
          <div className="grid grid-cols-2 gap-4">
            <DpInput type="number" label="Prioridad" name="priority" value={priority} onChange={setPriority} />
            <DpInput
              type="select"
              label="Tipo de regla"
              name="ruleType"
              value={ruleType}
              onChange={(v) => setRuleType(v as RateRuleType)}
              options={RULE_TYPE_OPTIONS}
            />
          </div>
          <DpInput
            type="select"
            label="Tipo de cálculo"
            name="calculationType"
            value={calculationType}
            onChange={(v) => {
              setCalculationType(v as CalculationType);
              setTransportServiceId("");
              setTransportService("");
            }}
            options={CALCULATION_TYPE_OPTIONS}
          />
          {calculationType && (
            <DpInput
              type="select"
              label="Servicio de transporte"
              name="transportServiceId"
              value={transportServiceId}
              onChange={onTransportServiceChange}
              options={serviceOptions}
              placeholder={filteredServices.length === 0 ? "No hay servicios con este tipo de cálculo" : "Seleccionar servicio"}
            />
          )}
          <DpInput type="input" label="Tipo de vehículo" name="vehicleType" value={vehicleType} onChange={setVehicleType} placeholder="5TN" />
          <div className="rounded border border-zinc-200 p-3 dark:border-navy-600">
            <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Condiciones</div>
            <div className="grid grid-cols-2 gap-2">
              <DpInput type="input" label="Zona origen" name="originZone" value={originZone} onChange={setOriginZone} placeholder="Zona origen" className="text-sm" />
              <DpInput type="input" label="Zona destino" name="destinationZone" value={destinationZone} onChange={setDestinationZone} placeholder="Zona destino" className="text-sm" />
              <DpInput type="number" label="Peso min" name="minWeight" value={minWeight} onChange={setMinWeight} placeholder="Peso min" className="text-sm" />
              <DpInput type="number" label="Peso max" name="maxWeight" value={maxWeight} onChange={setMaxWeight} placeholder="Peso max" className="text-sm" />
              <DpInput type="number" label="Km min" name="minDistanceKm" value={minDistanceKm} onChange={setMinDistanceKm} placeholder="Km min" className="text-sm" />
              <DpInput type="number" label="Km max" name="maxDistanceKm" value={maxDistanceKm} onChange={setMaxDistanceKm} placeholder="Km max" className="text-sm" />
            </div>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-navy-600">
            <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Cálculo</div>
            <div className="grid grid-cols-2 gap-2">
              <DpInput type="number" label="Precio base" name="basePrice" value={basePrice} onChange={setBasePrice} placeholder="Precio base" className="text-sm" />
              <DpInput type="number" label="Precio por km" name="pricePerKm" value={pricePerKm} onChange={setPricePerKm} placeholder="Precio por km" className="text-sm" />
              <DpInput type="number" label="Precio por ton" name="pricePerTon" value={pricePerTon} onChange={setPricePerTon} placeholder="Precio por ton" className="text-sm" />
              <DpInput type="number" label="Precio por m³" name="pricePerM3" value={pricePerM3} onChange={setPricePerM3} placeholder="Precio por m³" className="text-sm" />
              <DpInput type="number" label="Porcentaje" name="percentage" value={percentage} onChange={setPercentage} placeholder="Porcentaje" className="text-sm" />
            </div>
          </div>
          <DpInput type="check" label="Apilable" name="stackable" value={stackable} onChange={setStackable} />
          <div className="grid grid-cols-2 gap-4">
            <DpInput type="date" label="Vigencia desde" name="validFrom" value={validFrom} onChange={setValidFrom} />
            <DpInput type="date" label="Vigencia hasta" name="validTo" value={validTo} onChange={setValidTo} />
          </div>
        </>
      )}
    </DpContentSet>
  );
}
