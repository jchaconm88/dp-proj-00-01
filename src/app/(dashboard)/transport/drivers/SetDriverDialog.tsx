"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as driverService from "@/services/driverService";
import type { RelationshipType, DriverStatus } from "@/services/driverService";
import { DRIVER_STATUS, statusToSelectOptions } from "@/constants/statusOptions";
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

const DRIVER_STATUS_OPTIONS = statusToSelectOptions(DRIVER_STATUS);

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
    <DpContentSet
      title={isEdit ? "Editar conductor" : "Agregar conductor"}
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

          <DpInput
            type="select"
            label="Tipo de vínculo"
            name="relationshipType"
            value={relationshipType}
            onChange={(v) => onRelationshipTypeChange(v as RelationshipType)}
            options={RELATIONSHIP_OPTIONS}
            placeholder="Seleccionar tipo"
          />

          {isEmployee && (
            <div className="flex flex-col gap-2">
              <DpInput
                type="select"
                label="Empleado"
                name="employeeId"
                value={selectedEmployeeId ?? ""}
                onChange={(v) => setSelectedEmployeeId(v ? String(v) : null)}
                options={employeeOptions}
                placeholder="Seleccionar empleado"
              />
              {lockedFromEmployee && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Los datos personales se completan desde el empleado seleccionado.
                </span>
              )}
            </div>
          )}

          <DpInput type="input" label="Nombre" name="firstName" value={firstName} onChange={setFirstName} placeholder="Juan" disabled={!!lockedFromEmployee} />
          <DpInput type="input" label="Apellido" name="lastName" value={lastName} onChange={setLastName} placeholder="Pérez" disabled={!!lockedFromEmployee} />
          <DpInput type="input" label="Nº documento" name="documentNo" value={documentNo} onChange={setDocumentNo} placeholder="12345678" disabled={!!lockedFromEmployee} />
          {isEmployee ? (
            <DpInput type="input" label="Tipo de documento" name="documentId" value={documentId ?? ""} onChange={() => {}} disabled placeholder="Desde empleado" />
          ) : (
            <DpInput
              type="select"
              label="Tipo de documento"
              name="documentId"
              value={documentId ?? ""}
              onChange={(v) => setDocumentId(v ? String(v) : null)}
              options={documentOptions}
              placeholder="Seleccionar documento"
            />
          )}
          <DpInput type="input" label="Teléfono" name="phoneNo" value={phoneNo} onChange={setPhoneNo} placeholder="999999999" disabled={!!lockedFromEmployee} />

          <DpInput type="input" label="Nº licencia" name="licenseNo" value={licenseNo} onChange={setLicenseNo} placeholder="A3C-445566" />
          <DpInput type="input" label="Categoría licencia" name="licenseCategory" value={licenseCategory} onChange={setLicenseCategory} placeholder="A3C" />
          <DpInput type="date" label="Vencimiento licencia" name="licenseExpiration" value={licenseExpiration} onChange={setLicenseExpiration} />
          <DpInput type="select" label="Estado" name="status" value={status} onChange={(v) => setStatus(v as DriverStatus)} options={DRIVER_STATUS_OPTIONS} />
          <DpInput type="input" label="Viaje actual" name="currentTripId" value={currentTripId} onChange={setCurrentTripId} placeholder="TRIP-2026-0001" />
        </div>
      )}
    </DpContentSet>
  );
}
