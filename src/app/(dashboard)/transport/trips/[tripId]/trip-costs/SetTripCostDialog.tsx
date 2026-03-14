"use client";

import { useState, useEffect } from "react";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as tripCostService from "@/services/tripCostService";
import type { TripCostEntity, TripCostType, TripCostSource, TripCostStatus } from "@/models/tripCost";
import * as sequenceService from "@/services/sequenceService";
import {
  TRIP_COST_ENTITY,
  TRIP_COST_TYPE,
  TRIP_COST_SOURCE,
  TRIP_COST_STATUS,
  CURRENCY,
  statusToSelectOptions,
} from "@/constants/statusOptions";

const ENTITY_OPTIONS = statusToSelectOptions(TRIP_COST_ENTITY);
const TYPE_OPTIONS = statusToSelectOptions(TRIP_COST_TYPE);
const SOURCE_OPTIONS = statusToSelectOptions(TRIP_COST_SOURCE);
const STATUS_OPTIONS = statusToSelectOptions(TRIP_COST_STATUS);
const CURRENCY_OPTIONS = statusToSelectOptions(CURRENCY);

export interface SetTripCostDialogProps {
  visible: boolean;
  tripId: string;
  costId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}

export default function SetTripCostDialog({
  visible,
  tripId,
  costId,
  onSuccess,
  onHide,
}: SetTripCostDialogProps) {
  const isEdit = !!costId;
  const [code, setCode] = useState("");
  const [entity, setEntity] = useState<TripCostEntity>("driver");
  const [entityId, setEntityId] = useState("");
  const [type, setType] = useState<TripCostType>("driver_payment");
  const [source, setSource] = useState<TripCostSource>("salary_rule");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("PEN");
  const [status, setStatus] = useState<TripCostStatus>("open");
  const [settlementId, setSettlementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!costId) {
      setCode("");
      setEntity("driver");
      setEntityId("");
      setType("driver_payment");
      setSource("salary_rule");
      setAmount("");
      setCurrency("PEN");
      setStatus("open");
      setSettlementId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    tripCostService
      .get(costId)
      .then((data) => {
        if (!data) {
          setError("Costo no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setEntity(data.entity ?? "driver");
        setEntityId(data.entityId ?? "");
        setType(data.type ?? "driver_payment");
        setSource(data.source ?? "salary_rule");
        setAmount(data.amount != null ? String(data.amount) : "");
        setCurrency(data.currency ?? "PEN");
        setStatus(data.status ?? "open");
        setSettlementId(data.settlementId ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, costId]);

  const valid =
    (isEdit ? !!code.trim() : true) &&
    tripId.trim() !== "" &&
    entityId.trim() !== "" &&
    !Number.isNaN(Number(amount)) &&
    Number(amount) >= 0 &&
    currency.trim() !== "";

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const finalCode = await sequenceService.resolveCodeIfEmpty(code, "trip-cost");
      const numAmount = Number(amount) || 0;
      if (costId) {
        await tripCostService.edit(costId, {
          code: finalCode,
          entity,
          entityId: entityId.trim(),
          type,
          source,
          amount: numAmount,
          currency: currency.trim(),
          status,
          settlementId: settlementId ?? null,
        });
      } else {
        await tripCostService.add({
          code: finalCode,
          tripId: tripId.trim(),
          entity,
          entityId: entityId.trim(),
          type,
          source,
          amount: numAmount,
          currency: currency.trim(),
          status,
          settlementId: null,
        });
      }
      onSuccess?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentSet
      title={isEdit ? "Editar costo" : "Nuevo costo"}
      saveLabel="Guardar"
      onCancel={onHide}
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
          <DpCodeInput
            entity="trip-cost"
            label="Código"
            name="code"
            value={code}
            onChange={setCode}
          />
          <DpInput
            type="select"
            label="Entidad"
            name="entity"
            value={entity}
            onChange={(v) => setEntity((v || "driver") as TripCostEntity)}
            options={ENTITY_OPTIONS}
            placeholder="Seleccionar entidad"
          />
          <DpInput
            type="input"
            label="ID entidad"
            name="entityId"
            value={entityId}
            onChange={setEntityId}
            placeholder="Ej. DRIVER01"
          />
          <DpInput
            type="select"
            label="Tipo"
            name="type"
            value={type}
            onChange={(v) => setType((v || "driver_payment") as TripCostType)}
            options={TYPE_OPTIONS}
            placeholder="Seleccionar tipo"
          />
          <DpInput
            type="select"
            label="Origen"
            name="source"
            value={source}
            onChange={(v) => setSource((v || "salary_rule") as TripCostSource)}
            options={SOURCE_OPTIONS}
            placeholder="Seleccionar origen"
          />
          <DpInput
            type="input-decimal"
            label="Monto"
            name="amount"
            value={amount}
            onChange={setAmount}
            placeholder="0"
          />
          <DpInput
            type="select"
            label="Moneda"
            name="currency"
            value={currency}
            onChange={(v) => setCurrency(String(v ?? "PEN").trim())}
            options={CURRENCY_OPTIONS}
            placeholder="Seleccionar moneda"
          />
          <DpInput
            type="select"
            label="Estado"
            name="status"
            value={status}
            onChange={(v) => setStatus((v || "open") as TripCostStatus)}
            options={STATUS_OPTIONS}
            placeholder="Seleccionar estado"
          />
        </div>
      )}
    </DpContentSet>
  );
}
