"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpContentSet } from "@/components/DpContent";
import * as employeeService from "@/services/employeeService";
import * as documentService from "@/services/documentService";

export interface SetEmployeeDialogProps {
  visible: boolean;
  employeeId: string | null;
  onSuccess?: () => void;
}

export default function SetEmployeeDialog({
  visible,
  employeeId,
  onSuccess,
}: SetEmployeeDialogProps) {
  const router = useRouter();
  const isEdit = !!employeeId;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [salary, setSalary] = useState<string>("");
  const [hireDate, setHireDate] = useState("");
  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/masters/employees");
  const onHide = () => { if (!saving) hide(); };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    documentService.list().then((list) => setDocuments(list)).catch(() => setDocuments([]));
    if (!employeeId) {
      setFirstName("");
      setLastName("");
      setDocumentNo("");
      setPhoneNo("");
      setSelectedDocumentId(null);
      setSalary("");
      setHireDate("");
      setLoading(false);
      return;
    }
    setLoading(true);
    employeeService
      .get(employeeId)
      .then((data) => {
        if (!data) {
          setError("Empleado no encontrado.");
          return;
        }
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setDocumentNo(data.documentNo ?? "");
        setPhoneNo(data.phoneNo ?? "");
        setSelectedDocumentId(data.documentId || null);
        setSalary(String(data.salary ?? ""));
        setHireDate(data.hireDate ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, employeeId]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim() || !selectedDocumentId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentNo: documentNo.trim(),
        documentId: selectedDocumentId,
        phoneNo: phoneNo.trim(),
        salary: Number(salary) || 0,
        hireDate: hireDate.trim() || "",
      };
      if (employeeId) {
        await employeeService.edit(employeeId, payload);
      } else {
        await employeeService.add(payload);
      }
      onSuccess?.();
      hide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const documentOptions = documents.map((d) => ({ label: `${d.name} (${d.id})`, value: d.id }));
  const valid = firstName.trim() && lastName.trim() && selectedDocumentId;

  return (
    <DpContentSet
      title={isEdit ? "Editar empleado" : "Agregar empleado"}
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
          <DpInput type="input" label="Nombre" name="firstName" value={firstName} onChange={setFirstName} placeholder="Juan" />
          <DpInput type="input" label="Apellido" name="lastName" value={lastName} onChange={setLastName} placeholder="Pérez" />
          <DpInput type="input" label="Nº documento" name="documentNo" value={documentNo} onChange={setDocumentNo} placeholder="12345678" />
          <DpInput
            type="select"
            label="Tipo de documento"
            name="documentId"
            value={selectedDocumentId ?? ""}
            onChange={(v) => setSelectedDocumentId(v != null ? String(v) : null)}
            options={documentOptions}
            placeholder="Seleccionar documento"
          />
          <DpInput type="input" label="Teléfono" name="phoneNo" value={phoneNo} onChange={setPhoneNo} placeholder="999999999" />
          <DpInput type="number" label="Salario" name="salary" value={salary} onChange={setSalary} placeholder="2500" />
          <DpInput type="date" label="Fecha de ingreso" name="hireDate" value={hireDate} onChange={setHireDate} />
        </div>
      )}
    </DpContentSet>
  );
}
