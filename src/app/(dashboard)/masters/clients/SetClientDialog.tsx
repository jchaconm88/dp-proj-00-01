"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as clientService from "@/services/clientService";
import type { ClientStatus, PaymentCondition } from "@/services/clientService";
import { CLIENT_STATUS, statusToSelectOptions } from "@/constants/statusOptions";

export interface SetClientDialogProps {
  visible: boolean;
  clientId: string | null;
  onSuccess?: () => void;
}

const CLIENT_STATUS_OPTIONS = statusToSelectOptions(CLIENT_STATUS);

const PAYMENT_OPTIONS: { label: string; value: PaymentCondition }[] = [
  { label: "Transferencia", value: "transfer" },
  { label: "Efectivo", value: "cash" },
  { label: "Crédito", value: "credit" },
  { label: "Cheque", value: "check" },
];

const CURRENCY_OPTIONS = [
  { label: "PEN", value: "PEN" },
  { label: "USD", value: "USD" },
];

const DOC_TYPE_OPTIONS = [
  { label: "RUC", value: "RUC" },
  { label: "DNI", value: "DNI" },
  { label: "CE", value: "CE" },
];

export default function SetClientDialog({
  visible,
  clientId,
  onSuccess,
}: SetClientDialogProps) {
  const router = useRouter();
  const isEdit = !!clientId;
  const [code, setCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [creditDays, setCreditDays] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [currency, setCurrency] = useState("PEN");
  const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>("transfer");
  const [priority, setPriority] = useState<string>("");
  const [requiresAppointment, setRequiresAppointment] = useState(false);
  const [defaultServiceTimeMin, setDefaultServiceTimeMin] = useState<string>("");
  const [status, setStatus] = useState<ClientStatus>("active");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/masters/clients");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!clientId) {
      setCode("");
      setBusinessName("");
      setCommercialName("");
      setDocumentType("");
      setDocumentNumber("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setCreditDays("");
      setCreditLimit("");
      setCurrency("PEN");
      setPaymentCondition("transfer");
      setPriority("");
      setRequiresAppointment(false);
      setDefaultServiceTimeMin("");
      setStatus("active");
      setLoading(false);
      return;
    }
    setLoading(true);
    clientService
      .get(clientId)
      .then((data) => {
        if (!data) {
          setError("Cliente no encontrado.");
          return;
        }
        setCode(data.code ?? "");
        setBusinessName(data.businessName ?? "");
        setCommercialName(data.commercialName ?? "");
        setDocumentType(data.documentType ?? "");
        setDocumentNumber(data.documentNumber ?? "");
        setContactName(data.contact.contactName ?? "");
        setContactEmail(data.contact.email ?? "");
        setContactPhone(data.contact.phone ?? "");
        setCreditDays(String(data.billing.creditDays ?? ""));
        setCreditLimit(String(data.billing.creditLimit ?? ""));
        setCurrency(data.billing.currency ?? "PEN");
        setPaymentCondition(data.billing.paymentCondition ?? "transfer");
        setPriority(String(data.logistics.priority ?? ""));
        setRequiresAppointment(data.logistics.requiresAppointment ?? false);
        setDefaultServiceTimeMin(String(data.logistics.defaultServiceTimeMin ?? ""));
        setStatus(data.status ?? "active");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, clientId]);

  const save = async () => {
    if (!businessName.trim() || !code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: code.trim(),
        businessName: businessName.trim(),
        commercialName: commercialName.trim(),
        documentType: documentType.trim(),
        documentNumber: documentNumber.trim(),
        contact: {
          contactName: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
        },
        billing: {
          creditDays: Number(creditDays) || 0,
          creditLimit: Number(creditLimit) || 0,
          currency: currency.trim() || "PEN",
          paymentCondition,
        },
        logistics: {
          priority: Number(priority) || 0,
          requiresAppointment,
          defaultServiceTimeMin: Number(defaultServiceTimeMin) || 0,
        },
        status,
      };
      if (clientId) {
        await clientService.edit(clientId, payload);
      } else {
        await clientService.add(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const valid = code.trim() && businessName.trim();

  const goToLocations = () => {
    if (clientId) router.push(`/masters/clients/${encodeURIComponent(clientId)}/locations`);
  };

  return (
    <DpContentSet
      title={isEdit ? "Editar cliente" : "Agregar cliente"}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DpInput type="input" label="Código" name="code" value={code} onChange={setCode} placeholder="CLI-0001" />
            <DpInput type="select" label="Estado" name="status" value={status} onChange={(v) => setStatus(v as ClientStatus)} options={CLIENT_STATUS_OPTIONS} />
          </div>

          <DpInput type="input" label="Razón social" name="businessName" value={businessName} onChange={setBusinessName} placeholder="Supermercados Norte SAC" />
          <DpInput type="input" label="Nombre comercial" name="commercialName" value={commercialName} onChange={setCommercialName} placeholder="Super Norte" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DpInput type="select" label="Tipo documento" name="documentType" value={documentType} onChange={(v) => setDocumentType(String(v))} options={DOC_TYPE_OPTIONS} placeholder="RUC / DNI" />
            <DpInput type="input" label="Nº documento" name="documentNumber" value={documentNumber} onChange={setDocumentNumber} placeholder="20123456789" />
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Contacto</h4>
            <div className="flex flex-col gap-3">
              <DpInput type="input" label="Nombre contacto" name="contactName" value={contactName} onChange={setContactName} placeholder="María Torres" />
              <DpInput type="input" label="Email" name="contactEmail" value={contactEmail} onChange={setContactEmail} placeholder="maria.torres@supernorte.pe" />
              <DpInput type="input" label="Teléfono" name="contactPhone" value={contactPhone} onChange={setContactPhone} placeholder="999888777" />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Facturación</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DpInput type="number" label="Días de crédito" name="creditDays" value={creditDays} onChange={setCreditDays} placeholder="30" />
              <DpInput type="number" label="Límite de crédito" name="creditLimit" value={creditLimit} onChange={setCreditLimit} placeholder="50000" />
              <DpInput type="select" label="Moneda" name="currency" value={currency} onChange={(v) => setCurrency(String(v))} options={CURRENCY_OPTIONS} />
              <DpInput type="select" label="Condición de pago" name="paymentCondition" value={paymentCondition} onChange={(v) => setPaymentCondition(v as PaymentCondition)} options={PAYMENT_OPTIONS} />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Logística</h4>
            <div className="flex flex-col gap-3">
              <DpInput type="number" label="Prioridad" name="priority" value={priority} onChange={setPriority} placeholder="2" />
              <DpInput type="number" label="Tiempo de servicio por defecto (min)" name="defaultServiceTimeMin" value={defaultServiceTimeMin} onChange={setDefaultServiceTimeMin} placeholder="30" />
              <DpInput type="check" label="Requiere cita" name="requiresAppointment" value={requiresAppointment} onChange={setRequiresAppointment} />
            </div>
          </div>

          {isEdit && clientId && (
            <Button label="Gestionar ubicaciones" severity="secondary" onClick={goToLocations} className="w-full" />
          )}
        </div>
      )}
    </DpContentSet>
  );
}
