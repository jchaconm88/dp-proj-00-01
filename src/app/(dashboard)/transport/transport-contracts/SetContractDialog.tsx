"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import * as contractService from "@/services/contractService";
import type { ContractStatus, BillingCycle } from "@/services/contractService";
import * as clientService from "@/services/clientService";
import type { ClientRecord } from "@/services/clientService";

export interface SetContractDialogProps {
  visible: boolean;
  contractId: string | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { label: string; value: ContractStatus }[] = [
  { label: "Borrador", value: "draft" },
  { label: "Activo", value: "active" },
  { label: "Vencido", value: "expired" },
  { label: "Cancelado", value: "cancelled" },
];

const BILLING_OPTIONS: { label: string; value: BillingCycle }[] = [
  { label: "Mensual", value: "monthly" },
  { label: "Semanal", value: "weekly" },
  { label: "Por viaje", value: "per_trip" },
];

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
    <Dialog
      header={isEdit ? "Editar contrato" : "Agregar contrato"}
      visible={visible}
      style={{ width: "32rem" }}
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
              options={clientOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => onClientChange(e.value ?? "")}
              placeholder="Seleccione un cliente"
              filter
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Código contrato</label>
            <InputText
              value={contractCode}
              onChange={(e) => setContractCode(e.target.value)}
              placeholder="CONT-2026-001"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Descripción</label>
            <InputText
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contrato distribución Lima Metropolitana"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Moneda</label>
            <Dropdown
              value={currency}
              options={CURRENCY_OPTIONS}
              onChange={(e) => setCurrency(e.value ?? "PEN")}
              className="w-full"
            />
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
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Ciclo de facturación</label>
            <Dropdown
              value={billingCycle}
              options={BILLING_OPTIONS}
              onChange={(e) => setBillingCycle(e.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Días para pago</label>
            <InputText
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value)}
              type="number"
              placeholder="30"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
            <Dropdown value={status} options={STATUS_OPTIONS} onChange={(e) => setStatus(e.value)} className="w-full" />
          </div>
          {isEdit && contractId && (
            <Button
              label="Gestionar reglas de tarifa"
              severity="secondary"
              onClick={() => router.push(`/transport/transport-contracts/${encodeURIComponent(contractId)}/rate-rules`)}
              className="w-full"
            />
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button
              label={saving ? "Guardando…" : "Guardar"}
              onClick={save}
              disabled={saving || !valid}
              loading={saving}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
