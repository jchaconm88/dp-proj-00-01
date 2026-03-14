"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "employees";

export type EmployeeStatus = "active" | "inactive" | "suspended";
export type SalaryType = "monthly" | "weekly" | "daily";

export interface EmployeePayroll {
  salaryType: SalaryType;
  baseSalary: number;
  currency: string;
}

export interface EmployeeBenefits {
  cts: boolean;
  gratification: boolean;
  vacationDays: number;
}

export interface EmployeeRecord {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  documentNo: string;
  documentId: string;
  phone: string;
  email: string;
  positionId: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  payroll: EmployeePayroll;
  benefits: EmployeeBenefits;
}

export interface EmployeeAddInput {
  code: string;
  firstName: string;
  lastName: string;
  documentNo: string;
  documentId: string;
  phone: string;
  email: string;
  positionId: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  payroll: EmployeePayroll;
  benefits: EmployeeBenefits;
}

export type EmployeeEditInput = Partial<Omit<EmployeeRecord, "id">>;

function defaultPayroll(): EmployeePayroll {
  return { salaryType: "monthly", baseSalary: 0, currency: "PEN" };
}

function defaultBenefits(): EmployeeBenefits {
  return { cts: true, gratification: true, vacationDays: 30 };
}

function toPayroll(v: unknown): EmployeePayroll {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const st = (o.salaryType as string) || "monthly";
    const salaryType: SalaryType =
      st === "weekly" || st === "daily" ? st : "monthly";
    return {
      salaryType,
      baseSalary: Number(o.baseSalary) || 0,
      currency: String(o.currency ?? "PEN"),
    };
  }
  return defaultPayroll();
}

function toBenefits(v: unknown): EmployeeBenefits {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return {
      cts: o.cts === true,
      gratification: o.gratification === true,
      vacationDays: Number(o.vacationDays) || 0,
    };
  }
  return defaultBenefits();
}

function toStatus(s: string): EmployeeStatus {
  const t = (s || "").toLowerCase();
  if (t === "inactive" || t === "suspended") return t;
  return "active";
}

function toRecord(doc: { id: string } & Record<string, unknown>): EmployeeRecord {
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    firstName: String(doc.firstName ?? ""),
    lastName: String(doc.lastName ?? ""),
    documentNo: String(doc.documentNo ?? ""),
    documentId: String(doc.documentId ?? ""),
    phone: String(doc.phone ?? doc.phoneNo ?? ""),
    email: String(doc.email ?? ""),
    positionId: String(doc.positionId ?? ""),
    position: String(doc.position ?? ""),
    hireDate: String(doc.hireDate ?? ""),
    status: toStatus(doc.status as string),
    payroll: toPayroll(doc.payroll),
    benefits: toBenefits(doc.benefits),
  };
}

export async function get(id: string): Promise<EmployeeRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function list(): Promise<EmployeeRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toRecord(d));
}

export async function add(data: EmployeeAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    documentNo: data.documentNo.trim(),
    documentId: data.documentId.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    positionId: data.positionId.trim(),
    position: data.position.trim(),
    hireDate: data.hireDate.trim() || null,
    status: data.status,
    payroll: {
      salaryType: data.payroll.salaryType,
      baseSalary: Number(data.payroll.baseSalary) || 0,
      currency: (data.payroll.currency ?? "PEN").trim(),
    },
    benefits: {
      cts: data.benefits.cts === true,
      gratification: data.benefits.gratification === true,
      vacationDays: Number(data.benefits.vacationDays) ?? 0,
    },
  });
}

export async function edit(id: string, data: EmployeeEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  if (data.firstName !== undefined) payload.firstName = data.firstName;
  if (data.lastName !== undefined) payload.lastName = data.lastName;
  if (data.documentNo !== undefined) payload.documentNo = data.documentNo;
  if (data.documentId !== undefined) payload.documentId = data.documentId;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.positionId !== undefined) payload.positionId = data.positionId;
  if (data.position !== undefined) payload.position = data.position;
  if (data.hireDate !== undefined) payload.hireDate = data.hireDate || null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.payroll !== undefined) {
    payload.payroll = {
      salaryType: data.payroll.salaryType,
      baseSalary: Number(data.payroll.baseSalary) ?? 0,
      currency: (data.payroll.currency ?? "PEN").trim(),
    };
  }
  if (data.benefits !== undefined) {
    payload.benefits = {
      cts: data.benefits.cts === true,
      gratification: data.benefits.gratification === true,
      vacationDays: Number(data.benefits.vacationDays) ?? 0,
    };
  }
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
