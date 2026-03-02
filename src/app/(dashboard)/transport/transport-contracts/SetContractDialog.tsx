"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as contractService from "@/services/contractService";
import type { ContractStatus, BillingCycle } from "@/services/contractService";
import { CONTRACT_STATUS, BILLING_CYCLE, statusToSelectOptions } from "@/constants/statusOptions";
import * as clientService from "@/services/clientService";
import type { ClientRecord } from "@/services/clientService";

export interface SetContractDialogProps {
  visible: boolean;
  contractId: string | null;
  onSuccess?: () => void;
}

const CONTRACT_STATUS_OPTIONS = statusToSelectOptions(CONTRACT_STATUS);
const BILLING_OPTIONS = statusToSelectOptions(BILLING_CYCLE);

const CURRENCY_OPTIONS = [
  { label: "PEN", value: "PEN" },
  { label: "USD", value: "USD" },
];

export default function SetContractDialog({
  visible,
  contractId,
  onSuccess,
}: SetContractDialogProps) {
  const router = useRouter();
  const isEdit = !!contractId;
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientId, setClientId] = useState("");
  const [client, setClient] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [paymentTermsDays, setPaymentTermsDays] = useState("");
  const [status, setStatus] = useState<ContractStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/transport-contracts");
  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    clientService.list().then(setClients).catch(() => setClients([]));
    if (!contractId) {
      setClientId("");
      setClient("");
      setContractCode("");
      setDescription("");
      setCurrency("PEN");
      const today = new Date().toISOString().slice(0, 10);
      setValidFrom(today);
      setValidTo("");
      setBillingCycle("monthly");
      setPaymentTermsDays("30");
      setStatus("draft");
      setLoading(false);
      return;
    }
    setLoading(true);
    contractService
      .getContract(contractId)
      .then((data) => {
        if (!data) {
          setError("Contrato no encontrado.");
          return;
        }
        setClientId(data.clientId ?? "");
        setClient(data.client ?? "");
        setContractCode(data.contractCode ?? "");
        setDescription(data.description ?? "");
        setCurrency(data.currency ?? "PEN");
        setValidFrom(data.validFrom ?? "");
        setValidTo(data.validTo ?? "");
        setBillingCycle(data.billingCycle ?? "monthly");
        setPaymentTermsDays(String(data.paymentTermsDays ?? "30"));
        setStatus(data.status ?? "draft");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, contractId]);

  const onClientChange = (value: string) => {
    const id = value ?? "";
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c) setClient((c.commercialName || c.businessName || c.code || "").trim());
    else setClient("");
  };

  useEffect(() => {
    if (!clientId || client) return;
    const c = clients.find((x) => x.id === clientId);
    if (c) setClient((c.commercialName || c.businessName || c.code || "").trim());
  }, [clientId, client, clients]);

  const save = async () => {
    if (!clientId.trim() || !contractCode.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        clientId: clientId.trim(),
        client: client.trim(),
        contractCode: contractCode.trim(),
        description: description.trim(),
        currency: currency.trim() || "PEN",
        validFrom: validFrom.trim(),
        validTo: validTo.trim(),
        billingCycle,
        paymentTermsDays: Number(paymentTermsDays) || 30,
        status,
      };
      if (contractId) {
        await contractService.editContract(contractId, payload);
      } else {
        await contractService.addContract(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const clientOptions = clients.map((c) => ({
    label: (c.commercialName || c.businessName || c.code || c.id).trim(),
    value: c.id,
  }));
  const valid = !!clientId.trim() && !!contractCode.trim();

  return (
    <DpContentSet
      title={isEdit ? "Editar contrato" : "Agregar contrato"}
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

          <DpInput
            type="select"
            label="Cliente"
            name="clientId"
            value={clientId}
            onChange={(v) => onClientChange(String(v))}
            options={clientOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccione un cliente"
            filter
          />
          <DpInput
            type="input"
            label="Código contrato"
            name="contractCode"
            value={contractCode}
            onChange={setContractCode}
            placeholder="CONT-2026-001"
          />
          <DpInput
            type="input"
            label="Descripción"
            name="description"
            value={description}
            onChange={setDescription}
            placeholder="Contrato distribución Lima Metropolitana"
          />
          <DpInput
            type="select"
            label="Moneda"
            name="currency"
            value={currency}
            onChange={(v) => setCurrency(String(v))}
            options={CURRENCY_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-4">
            <DpInput
              type="date"
              label="Vigencia desde"
              name="validFrom"
              value={validFrom}
              onChange={setValidFrom}
            />
            <DpInput
              type="date"
              label="Vigencia hasta"
              name="validTo"
              value={validTo}
              onChange={setValidTo}
            />
          </div>
          <DpInput
            type="select"
            label="Ciclo de facturación"
            name="billingCycle"
            value={billingCycle}
            onChange={(v) => setBillingCycle(v as BillingCycle)}
            options={BILLING_OPTIONS}
          />
          <DpInput
            type="number"
            label="Días para pago"
            name="paymentTermsDays"
            value={paymentTermsDays}
            onChange={setPaymentTermsDays}
            placeholder="30"
          />
          <DpInput
            type="select"
            label="Estado"
            name="status"
            value={status}
            onChange={(v) => setStatus(v as ContractStatus)}
            options={CONTRACT_STATUS_OPTIONS}
          />
          {isEdit && contractId && (
            <Button
              label="Gestionar reglas de tarifa"
              severity="secondary"
              onClick={() => router.push(`/transport/transport-contracts/${encodeURIComponent(contractId)}/rate-rules`)}
              className="w-full"
            />
          )}
        </>
      )}
    </DpContentSet>
  );
}
