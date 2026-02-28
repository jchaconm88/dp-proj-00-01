"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import * as contractService from "@/services/contractService";
import type {
  RateRuleConditions,
  RateRuleCalculation,
  RateRuleType,
  CalculationType,
} from "@/services/contractService";

const RULE_TYPE_OPTIONS: { label: string; value: RateRuleType }[] = [
  { label: "Base", value: "base" },
  { label: "Cargo extra", value: "extra_charge" },
  { label: "Penalidad", value: "penalty" },
  { label: "Descuento", value: "discount" },
];

const CALCULATION_TYPE_OPTIONS: { label: string; value: CalculationType }[] = [
  { label: "Fijo", value: "fixed" },
  { label: "Zona", value: "zone" },
  { label: "Por km", value: "per_km" },
  { label: "Por peso", value: "per_weight" },
  { label: "Por volumen", value: "per_volume" },
  { label: "Porcentaje", value: "percentage" },
  { label: "Fórmula", value: "formula" },
];

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
    <Dialog
      header={isEdit ? "Editar regla de tarifa" : "Agregar regla de tarifa"}
      visible={visible}
      style={{ width: "36rem", maxHeight: "90vh" }}
      contentStyle={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
      onHide={onHide}
      closable={!saving}
      closeOnEscape={!saving}
      dismissableMask={!saving}
      blockScroll
      modal
    >
      {loading ? (
        <div className="py-8 text-center text-zinc-500">Cargando…</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Código</label>
            <InputText
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LIMA_CENTRO_CALLAO_5TN"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <InputText
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zona Lima Centro - Callao 5TN"
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox inputId="active" checked={active} onChange={(e) => setActive(e.checked ?? true)} />
            <label htmlFor="active" className="font-medium text-zinc-700 dark:text-zinc-300">Activo</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Prioridad</label>
              <InputText value={priority} onChange={(e) => setPriority(e.target.value)} type="number" className="w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de regla</label>
              <Dropdown value={ruleType} options={RULE_TYPE_OPTIONS} onChange={(e) => setRuleType(e.value)} className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de cálculo</label>
              <Dropdown
                value={calculationType}
                options={CALCULATION_TYPE_OPTIONS}
                onChange={(e) => setCalculationType(e.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de vehículo</label>
              <InputText value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="5TN" className="w-full" />
            </div>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-navy-600">
            <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Condiciones</div>
            <div className="grid grid-cols-2 gap-2">
              <InputText value={originZone} onChange={(e) => setOriginZone(e.target.value)} placeholder="Zona origen" className="w-full text-sm" />
              <InputText value={destinationZone} onChange={(e) => setDestinationZone(e.target.value)} placeholder="Zona destino" className="w-full text-sm" />
              <InputText value={minWeight} onChange={(e) => setMinWeight(e.target.value)} type="number" placeholder="Peso min" className="w-full text-sm" />
              <InputText value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} type="number" placeholder="Peso max" className="w-full text-sm" />
              <InputText value={minDistanceKm} onChange={(e) => setMinDistanceKm(e.target.value)} type="number" placeholder="Km min" className="w-full text-sm" />
              <InputText value={maxDistanceKm} onChange={(e) => setMaxDistanceKm(e.target.value)} type="number" placeholder="Km max" className="w-full text-sm" />
            </div>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-navy-600">
            <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Cálculo</div>
            <div className="grid grid-cols-2 gap-2">
              <InputText value={basePrice} onChange={(e) => setBasePrice(e.target.value)} type="number" placeholder="Precio base" className="w-full text-sm" />
              <InputText value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} type="number" placeholder="Precio por km" className="w-full text-sm" />
              <InputText value={pricePerTon} onChange={(e) => setPricePerTon(e.target.value)} type="number" placeholder="Precio por ton" className="w-full text-sm" />
              <InputText value={pricePerM3} onChange={(e) => setPricePerM3(e.target.value)} type="number" placeholder="Precio por m³" className="w-full text-sm" />
              <InputText value={percentage} onChange={(e) => setPercentage(e.target.value)} type="number" placeholder="Porcentaje" className="w-full text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox inputId="stackable" checked={stackable} onChange={(e) => setStackable(e.checked ?? false)} />
            <label htmlFor="stackable" className="font-medium text-zinc-700 dark:text-zinc-300">Apilable</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Vigencia desde</label>
              <InputText value={validFrom} onChange={(e) => setValidFrom(e.target.value)} type="date" className="w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Vigencia hasta</label>
              <InputText value={validTo} onChange={(e) => setValidTo(e.target.value)} type="date" className="w-full" />
            </div>
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
