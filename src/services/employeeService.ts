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

export interface EmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  documentNo: string;
  documentId: string;
  phoneNo: string;
  salary: number;
  hireDate: string;
}

export interface EmployeeAddInput {
  firstName: string;
  lastName: string;
  documentNo: string;
  documentId: string;
  phoneNo: string;
  salary: number;
  hireDate: string;
}

export type EmployeeEditInput = Partial<Omit<EmployeeRecord, "id">>;

function toRecord(doc: { id: string } & Record<string, unknown>): EmployeeRecord {
  return {
    id: doc.id,
    firstName: String(doc.firstName ?? ""),
    lastName: String(doc.lastName ?? ""),
    documentNo: String(doc.documentNo ?? ""),
    documentId: String(doc.documentId ?? ""),
    phoneNo: String(doc.phoneNo ?? ""),
    salary: Number(doc.salary) || 0,
    hireDate: String(doc.hireDate ?? ""),
  };
}

export async function get(id: string): Promise<EmployeeRecord | null> {
  const doc = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return doc ? toRecord(doc) : null;
}

export async function list(): Promise<EmployeeRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((doc) => toRecord(doc));
}

export async function add(data: EmployeeAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    documentNo: data.documentNo.trim(),
    documentId: data.documentId.trim(),
    phoneNo: data.phoneNo.trim(),
    salary: Number(data.salary) || 0,
    hireDate: data.hireDate.trim() || null,
  });
}

export async function edit(id: string, data: EmployeeEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.firstName = data.firstName;
  if (data.lastName !== undefined) payload.lastName = data.lastName;
  if (data.documentNo !== undefined) payload.documentNo = data.documentNo;
  if (data.documentId !== undefined) payload.documentId = data.documentId;
  if (data.phoneNo !== undefined) payload.phoneNo = data.phoneNo;
  if (data.salary !== undefined) payload.salary = Number(data.salary) || 0;
  if (data.hireDate !== undefined) payload.hireDate = data.hireDate || null;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
