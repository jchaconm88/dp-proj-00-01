"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DpInput } from "@/components/DpInput";
import { DpCodeInput } from "@/components/DpCodeInput";
import { DpContentSet } from "@/components/DpContent";
import * as employeeService from "@/services/employeeService";
import type { EmployeeStatus, SalaryType } from "@/services/employeeService";
import * as positionService from "@/services/positionService";
import * as sequenceService from "@/services/sequenceService";
import * as documentService from "@/services/documentService";
import {
  EMPLOYEE_STATUS,
  SALARY_TYPE,
  statusToSelectOptions,
} from "@/constants/statusOptions";

export interface SetEmployeeDialogProps {
  visible: boolean;
  employeeId: string | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = statusToSelectOptions(EMPLOYEE_STATUS);
const SALARY_TYPE_OPTIONS = statusToSelectOptions(SALARY_TYPE);

export default function SetEmployeeDialog({
  visible,
  employeeId,
  onSuccess,
}: SetEmployeeDialogProps) {
  const router = useRouter();
  const isEdit = !!employeeId;
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [positionId, setPositionId] = useState("");
  const [position, setPosition] = useState("");
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState<EmployeeStatus>("active");
  const [salaryType, setSalaryType] = useState<SalaryType>("monthly");
  const [baseSalary, setBaseSalary] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [cts, setCts] = useState(true);
  const [gratification, setGratification] = useState(true);
  const [vacationDays, setVacationDays] = useState("30");
  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hide = () => router.push("/human-resources/employees");
  const onHide = () => {
    if (!saving) hide();
  };

  useEffect(() => {
    if (!visible) return;
    setError(null);
    documentService.list().then((list) => setDocuments(list)).catch(() => setDocuments([]));
    positionService.list().then((list) => setPositions(list.map((p) => ({ id: p.id, name: p.name })))).catch(() => setPositions([]));
    if (!employeeId) {
      setCode("");
      setFirstName("");
      setLastName("");
      setDocumentNo("");
      setDocumentId("");
      setPhone("");
      setEmail("");
      setPositionId("");
      setPosition("");
      setHireDate("");
      setStatus("active");
      setSalaryType("monthly");
      setBaseSalary("");
      setCurrency("PEN");
      setCts(true);
      setGratification(true);
      setVacationDays("30");
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
        setCode(data.code ?? "");
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setDocumentNo(data.documentNo ?? "");
        setDocumentId(data.documentId ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setPositionId(data.positionId ?? "");
        setPosition(data.position ?? "");
        setHireDate(data.hireDate ?? "");
        setStatus(data.status ?? "active");
        setSalaryType(data.payroll?.salaryType ?? "monthly");
        setBaseSalary(String(data.payroll?.baseSalary ?? ""));
        setCurrency(data.payroll?.currency ?? "PEN");
        setCts(data.benefits?.cts !== false);
        setGratification(data.benefits?.gratification !== false);
        setVacationDays(String(data.benefits?.vacationDays ?? 30));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, employeeId]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let finalCode: string;
      try {
        finalCode = await sequenceService.resolveCodeIfEmpty(code, "employee");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al generar código.");
        setSaving(false);
        return;
      }
      const payload = {
        code: finalCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentNo: documentNo.trim(),
        documentId: documentId.trim(),
        phone: phone.trim(),
        email: email.trim(),
        positionId: positionId.trim(),
        position: position.trim(),
        hireDate: hireDate.trim(),
        status,
        payroll: {
          salaryType,
          baseSalary: Number(baseSalary) || 0,
          currency: currency.trim() || "PEN",
        },
        benefits: {
          cts,
          gratification,
          vacationDays: Number(vacationDays) || 0,
        },
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
  const positionOptions = positions.map((p) => ({ label: p.name, value: p.id }));
  const onPositionChange = (v: string | number | boolean | null) => {
    const id = v != null ? String(v) : "";
    setPositionId(id);
    const found = positions.find((p) => p.id === id);
    setPosition(found ? found.name : "");
  };
  const valid = !!firstName.trim() && !!lastName.trim();

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
          <DpCodeInput entity="employee" label="Código" name="code" value={code} onChange={setCode} />
          <DpInput type="input" label="Nombre" name="firstName" value={firstName} onChange={setFirstName} placeholder="Carlos" />
          <DpInput type="input" label="Apellidos" name="lastName" value={lastName} onChange={setLastName} placeholder="Ramirez" />
          <DpInput type="input" label="Nº documento" name="documentNo" value={documentNo} onChange={setDocumentNo} placeholder="12345678" />
          <DpInput
            type="select"
            label="Tipo de documento"
            name="documentId"
            value={documentId}
            onChange={(v) => setDocumentId(v != null ? String(v) : "")}
            options={documentOptions}
            placeholder="Seleccionar"
          />
          <DpInput type="input" label="Teléfono" name="phone" value={phone} onChange={setPhone} placeholder="999999999" />
          <DpInput type="input" label="Email" name="email" value={email} onChange={setEmail} placeholder="juan@empresa.com" />
          <DpInput
            type="select"
            label="Cargo"
            name="position"
            value={positionId}
            onChange={(v) => onPositionChange(v)}
            options={positionOptions}
            placeholder="Seleccionar cargo"
          />
          <DpInput type="date" label="Fecha de ingreso" name="hireDate" value={hireDate} onChange={setHireDate} />
          <DpInput
            type="select"
            label="Estado"
            name="status"
            value={status}
            onChange={(v) => setStatus(v as EmployeeStatus)}
            options={STATUS_OPTIONS}
          />

          <div className="rounded border border-zinc-200 p-3 dark:border-navy-600">
            <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Nómina</div>
            <div className="flex flex-col gap-2">
              <DpInput
                type="select"
                label="Tipo de salario"
                name="salaryType"
                value={salaryType}
                onChange={(v) => setSalaryType(v as SalaryType)}
                options={SALARY_TYPE_OPTIONS}
              />
              <DpInput type="number" label="Salario base" name="baseSalary" value={baseSalary} onChange={setBaseSalary} placeholder="2800" />
              <DpInput type="input" label="Moneda" name="currency" value={currency} onChange={setCurrency} placeholder="PEN" />
            </div>
          </div>

          <div className="rounded border border-zinc-200 p-3 dark:border-navy-600">
            <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Beneficios</div>
            <div className="flex flex-col gap-2">
              <DpInput type="check" label="CTS" name="cts" value={cts} onChange={setCts} />
              <DpInput type="check" label="Gratificación" name="gratification" value={gratification} onChange={setGratification} />
              <DpInput type="number" label="Días de vacaciones" name="vacationDays" value={vacationDays} onChange={setVacationDays} placeholder="30" />
            </div>
          </div>
        </div>
      )}
    </DpContentSet>
  );
}
