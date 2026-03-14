"use client";

import { useState, useEffect } from "react";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as tripChargeService from "@/services/tripChargeService";
import type { TripChargeType, TripChargeSource, TripChargeStatus } from "@/models/tripCharge";
import * as sequenceService from "@/services/sequenceService";
import {
  TRIP_CHARGE_TYPE,
  TRIP_CHARGE_SOURCE,
  TRIP_CHARGE_STATUS,
  CURRENCY,
  statusToSelectOptions,
} from "@/constants/statusOptions";

const TYPE_OPTIONS = statusToSelectOptions(TRIP_CHARGE_TYPE);
const SOURCE_OPTIONS = statusToSelectOptions(TRIP_CHARGE_SOURCE);
const STATUS_OPTIONS = statusToSelectOptions(TRIP_CHARGE_STATUS);
const CURRENCY_OPTIONS = statusToSelectOptions(CURRENCY);

export interface SetTripChargeDialogProps {
  visible: boolean;
  tripId: string;
  chargeId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}

export default function SetTripChargeDialog({
  visible,
  tripId,
  chargeId,
  onSuccess,
  onHide,
}: SetTripChargeDialogProps) {
  const isEdit = !!chargeId;
  const [code, setCode] = useState("");
  const [type, setType] = useState<TripChargeType>("freight");
  const [source, setSource] = useState<TripChargeSource>("contract");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("PEN");
  const [status, setStatus] = useState<TripChargeStatus>("open");
  const [settlementId, setSettlementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!chargeId) {
      setCode("");
      setType("freight");
      setSource("contract");
      setAmount("");
      setCurrency("PEN");
      setStatus("open");
      setSettlementId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    tripChargeService
      .get(chargeId)
      .then((data) => {
        if (!data) {
          setError("Cargo no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setType(data.type ?? "freight");
        setSource(data.source ?? "contract");
        setAmount(data.amount != null ? String(data.amount) : "");
        setCurrency(data.currency ?? "PEN");
        setStatus(data.status ?? "open");
        setSettlementId(data.settlementId ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, chargeId]);

  const valid =
    (isEdit ? !!code.trim() : true) &&
    tripId.trim() !== "" &&
    !Number.isNaN(Number(amount)) &&
    Number(amount) >= 0 &&
    currency.trim() !== "";

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const finalCode = await sequenceService.resolveCodeIfEmpty(code, "trip-charge");
      const numAmount = Number(amount) || 0;
      if (chargeId) {
        await tripChargeService.edit(chargeId, {
          code: finalCode,
          type,
          source,
          amount: numAmount,
          currency: currency.trim(),
          status,
          settlementId: settlementId ?? null,
        });
      } else {
        await tripChargeService.add({
          code: finalCode,
          tripId: tripId.trim(),
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
      title={isEdit ? "Editar cargo" : "Nuevo cargo"}
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
            entity="trip-charge"
            label="Código"
            name="code"
            value={code}
            onChange={setCode}
          />
          <DpInput
            type="select"
            label="Tipo"
            name="type"
            value={type}
            onChange={(v) => setType((v || "freight") as TripChargeType)}
            options={TYPE_OPTIONS}
            placeholder="Seleccionar tipo"
          />
          <DpInput
            type="select"
            label="Origen"
            name="source"
            value={source}
            onChange={(v) => setSource((v || "contract") as TripChargeSource)}
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
            onChange={(v) => setStatus((v || "open") as TripChargeStatus)}
            options={STATUS_OPTIONS}
            placeholder="Seleccionar estado"
          />
        </div>
      )}
    </DpContentSet>
  );
}
