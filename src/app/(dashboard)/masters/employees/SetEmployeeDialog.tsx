"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
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
    <Dialog
      header={isEdit ? "Editar empleado" : "Agregar empleado"}
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
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <InputText
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Apellido</label>
            <InputText
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Nº documento</label>
            <InputText
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              placeholder="12345678"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de documento</label>
            <Dropdown
              value={selectedDocumentId}
              options={documentOptions}
              onChange={(e) => setSelectedDocumentId(e.value)}
              placeholder="Seleccionar documento"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Teléfono</label>
            <InputText
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              placeholder="999999999"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Salario</label>
            <InputText
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              type="number"
              placeholder="2500"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">Fecha de ingreso</label>
            <InputText
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              type="date"
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
