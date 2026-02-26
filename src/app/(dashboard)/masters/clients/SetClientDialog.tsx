"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import * as clientService from "@/services/clientService";
import type { ClientStatus, PaymentCondition } from "@/services/clientService";

export interface SetClientDialogProps {
  visible: boolean;
  clientId: string | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { label: string; value: ClientStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
  { label: "Suspendido", value: "suspended" },
];

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
    <Dialog
      header={isEdit ? "Editar cliente" : "Agregar cliente"}
      visible={visible}
      style={{ width: "32rem", maxWidth: "95vw" }}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Código</label>
              <InputText value={code} onChange={(e) => setCode(e.target.value)} placeholder="CLI-0001" className="w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
              <Dropdown value={status} options={STATUS_OPTIONS} onChange={(e) => setStatus(e.value)} className="w-full" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Razón social</label>
            <InputText
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Supermercados Norte SAC"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre comercial</label>
            <InputText
              value={commercialName}
              onChange={(e) => setCommercialName(e.target.value)}
              placeholder="Super Norte"
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo documento</label>
              <Dropdown
                value={documentType}
                options={DOC_TYPE_OPTIONS}
                onChange={(e) => setDocumentType(e.value ?? "")}
                placeholder="RUC / DNI"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Nº documento</label>
              <InputText
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="20123456789"
                className="w-full"
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Contacto</h4>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Nombre contacto</label>
                <InputText value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="María Torres" className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Email</label>
                <InputText value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="maria.torres@supernorte.pe" className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Teléfono</label>
                <InputText value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="999888777" className="w-full" />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Facturación</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Días de crédito</label>
                <InputText value={creditDays} onChange={(e) => setCreditDays(e.target.value)} type="number" placeholder="30" className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Límite de crédito</label>
                <InputText value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} type="number" placeholder="50000" className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Moneda</label>
                <Dropdown value={currency} options={CURRENCY_OPTIONS} onChange={(e) => setCurrency(e.value ?? "PEN")} className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Condición de pago</label>
                <Dropdown value={paymentCondition} options={PAYMENT_OPTIONS} onChange={(e) => setPaymentCondition(e.value)} className="w-full" />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Logística</h4>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Prioridad</label>
                <InputText value={priority} onChange={(e) => setPriority(e.target.value)} type="number" placeholder="2" className="w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-600 dark:text-zinc-400">Tiempo de servicio por defecto (min)</label>
                <InputText value={defaultServiceTimeMin} onChange={(e) => setDefaultServiceTimeMin(e.target.value)} type="number" placeholder="30" className="w-full" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox inputId="requiresAppointment" checked={requiresAppointment} onChange={(e) => setRequiresAppointment(e.checked ?? false)} />
                <label htmlFor="requiresAppointment" className="text-zinc-600 dark:text-zinc-400">Requiere cita</label>
              </div>
            </div>
          </div>

          {isEdit && clientId && (
            <Button label="Gestionar ubicaciones" severity="secondary" onClick={goToLocations} className="w-full" />
          )}

          <div className="mt-2 flex justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <Button label="Cancelar" severity="secondary" onClick={onHide} disabled={saving} />
            <Button label={saving ? "Guardando…" : "Guardar"} onClick={save} disabled={saving || !valid} loading={saving} />
          </div>
        </div>
      )}
    </Dialog>
  );
}
