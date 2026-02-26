"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import * as driverService from "@/services/driverService";
import type { RelationshipType, DriverStatus } from "@/services/driverService";
import * as employeeService from "@/services/employeeService";
import * as documentService from "@/services/documentService";

export interface SetDriverDialogProps {
  visible: boolean;
  driverId: string | null;
  onSuccess?: () => void;
}

const RELATIONSHIP_OPTIONS: { label: string; value: RelationshipType }[] = [
  { label: "Empleado", value: "employee" },
  { label: "Contratista", value: "contractor" },
];

const STATUS_OPTIONS: { label: string; value: DriverStatus }[] = [
  { label: "Disponible", value: "available" },
  { label: "Asignado", value: "assigned" },
];

export default function SetDriverDialog({
  visible,
  driverId,
  onSuccess,
}: SetDriverDialogProps) {
  const router = useRouter();
  const isEdit = !!driverId;
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("contractor");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [phoneNo, setPhoneNo] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("");
  const [licenseExpiration, setLicenseExpiration] = useState("");
  const [status, setStatus] = useState<DriverStatus>("available");
  const [currentTripId, setCurrentTripId] = useState("");
  const [employees, setEmployees] = useState<{ id: string; label: string }[]>([]);
  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/transport/drivers");
  const onHide = () => { if (!saving) hide(); }

  const isEmployee = relationshipType === "employee";
  const lockedFromEmployee = isEmployee && selectedEmployeeId;

  const loadEmployeeIntoForm = useCallback((emp: { firstName: string; lastName: string; documentNo: string; documentId: string; phoneNo: string }) => {
    setFirstName(emp.firstName ?? "");
    setLastName(emp.lastName ?? "");
    setDocumentNo(emp.documentNo ?? "");
    setDocumentId(emp.documentId || null);
    setPhoneNo(emp.phoneNo ?? "");
  }, []);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    employeeService
      .list()
      .then((list) => setEmployees(list.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName} (${e.id})` }))))
      .catch(() => setEmployees([]));
    documentService.list().then((list) => setDocuments(list)).catch(() => setDocuments([]));
    if (!driverId) {
      setRelationshipType("contractor");
      setSelectedEmployeeId(null);
      setFirstName("");
      setLastName("");
      setDocumentNo("");
      setDocumentId(null);
      setPhoneNo("");
      setLicenseNo("");
      setLicenseCategory("");
      setLicenseExpiration("");
      setStatus("available");
      setCurrentTripId("");
      setLoading(false);
      return;
    }
    setLoading(true);
    driverService
      .get(driverId)
      .then((data) => {
        if (!data) {
          setError("Conductor no encontrado.");
          return;
        }
        setRelationshipType(data.relationshipType ?? "contractor");
        setSelectedEmployeeId(data.employeeId ?? null);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setDocumentNo(data.documentNo ?? "");
        setDocumentId(data.documentId || null);
        setPhoneNo(data.phoneNo ?? "");
        setLicenseNo(data.licenseNo ?? "");
        setLicenseCategory(data.licenseCategory ?? "");
        setLicenseExpiration(data.licenseExpiration ?? "");
        setStatus(data.status ?? "available");
        setCurrentTripId(data.currentTripId ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, driverId]);

  useEffect(() => {
    if (!visible || !isEmployee || !selectedEmployeeId) return;
    employeeService.get(selectedEmployeeId).then((emp) => {
      if (emp) loadEmployeeIntoForm(emp);
    }).catch(() => {});
  }, [visible, isEmployee, selectedEmployeeId, loadEmployeeIntoForm]);

  const onRelationshipTypeChange = (value: RelationshipType) => {
    setRelationshipType(value);
    if (value === "contractor") {
      setSelectedEmployeeId(null);
      setFirstName("");
      setLastName("");
      setDocumentNo("");
      setDocumentId(null);
      setPhoneNo("");
    }
  };

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    if (isEmployee && !selectedEmployeeId) return;
    if (!isEmployee && !documentId) return;
    const empId = isEmployee ? selectedEmployeeId : null;
    const docId = documentId ?? "";
    setSaving(true);
    setError(null);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentNo: documentNo.trim(),
        documentId: docId,
        phoneNo: phoneNo.trim(),
        licenseNo: licenseNo.trim(),
        licenseCategory: licenseCategory.trim(),
        licenseExpiration: licenseExpiration.trim() || "",
        relationshipType,
        employeeId: empId,
        status,
        currentTripId: currentTripId.trim() || "",
      };
      if (driverId) {
        await driverService.edit(driverId, payload);
      } else {
        await driverService.add(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const employeeOptions = employees.map((e) => ({ label: e.label, value: e.id }));
  const documentOptions = documents.map((d) => ({ label: `${d.name} (${d.id})`, value: d.id }));
  const valid =
    firstName.trim() &&
    lastName.trim() &&
    (licenseNo.trim() || true) &&
    (isEmployee ? !!selectedEmployeeId : !!documentId);

  return (
    <Dialog
      header={isEdit ? "Editar conductor" : "Agregar conductor"}
      visible={visible}
      style={{ width: "28rem" }}
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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de vínculo</label>
            <Dropdown
              value={relationshipType}
              options={RELATIONSHIP_OPTIONS}
              onChange={(e) => onRelationshipTypeChange(e.value)}
              placeholder="Seleccionar tipo"
              className="w-full"
            />
          </div>

          {isEmployee && (
            <div className="flex flex-col gap-2">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Empleado</label>
              <Dropdown
                value={selectedEmployeeId}
                options={employeeOptions}
                onChange={(e) => setSelectedEmployeeId(e.value)}
                placeholder="Seleccionar empleado"
                className="w-full"
              />
              {lockedFromEmployee && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Los datos personales se completan desde el empleado seleccionado.
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <InputText
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan"
              className="w-full"
              disabled={!!lockedFromEmployee}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Apellido</label>
            <InputText
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez"
              className="w-full"
              disabled={!!lockedFromEmployee}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nº documento</label>
            <InputText
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              placeholder="12345678"
              className="w-full"
              disabled={!!lockedFromEmployee}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de documento</label>
            {isEmployee ? (
              <InputText value={documentId ?? ""} className="w-full" disabled placeholder="Desde empleado" />
            ) : (
              <Dropdown
                value={documentId}
                options={documentOptions}
                onChange={(e) => setDocumentId(e.value)}
                placeholder="Seleccionar documento"
                className="w-full"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Teléfono</label>
            <InputText
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              placeholder="999999999"
              className="w-full"
              disabled={!!lockedFromEmployee}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nº licencia</label>
            <InputText
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              placeholder="A3C-445566"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Categoría licencia</label>
            <InputText
              value={licenseCategory}
              onChange={(e) => setLicenseCategory(e.target.value)}
              placeholder="A3C"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Vencimiento licencia</label>
            <InputText
              value={licenseExpiration}
              onChange={(e) => setLicenseExpiration(e.target.value)}
              type="date"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
            <Dropdown
              value={status}
              options={STATUS_OPTIONS}
              onChange={(e) => setStatus(e.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Viaje actual</label>
            <InputText
              value={currentTripId}
              onChange={(e) => setCurrentTripId(e.target.value)}
              placeholder="TRIP-2026-0001"
              className="w-full"
            />
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
