"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "drivers";

export type RelationshipType = "employee" | "contractor";
export type DriverStatus = "available" | "assigned";

export interface DriverRecord {
  id: string;
  firstName: string;
  lastName: string;
  documentNo: string;
  documentId: string;
  phoneNo: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiration: string;
  relationshipType: RelationshipType;
  employeeId: string | null;
  status: DriverStatus;
  currentTripId: string;
}

export interface DriverAddInput {
  firstName: string;
  lastName: string;
  documentNo: string;
  documentId: string;
  phoneNo: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiration: string;
  relationshipType: RelationshipType;
  employeeId: string | null;
  status: DriverStatus;
  currentTripId: string;
}

export type DriverEditInput = Partial<Omit<DriverRecord, "id">>;

function toRecord(doc: { id: string } & Record<string, unknown>): DriverRecord {
  const rel = doc.relationshipType === "contractor" ? "contractor" : "employee";
  const st = doc.status === "assigned" ? "assigned" : "available";
  return {
    id: doc.id,
    firstName: String(doc.firstName ?? ""),
    lastName: String(doc.lastName ?? ""),
    documentNo: String(doc.documentNo ?? ""),
    documentId: String(doc.documentId ?? ""),
    phoneNo: String(doc.phoneNo ?? ""),
    licenseNo: String(doc.licenseNo ?? ""),
    licenseCategory: String(doc.licenseCategory ?? ""),
    licenseExpiration: String(doc.licenseExpiration ?? ""),
    relationshipType: rel,
    employeeId: doc.employeeId != null && doc.employeeId !== "" ? String(doc.employeeId) : null,
    status: st,
    currentTripId: String(doc.currentTripId ?? ""),
  };
}

export async function get(id: string): Promise<DriverRecord | null> {
  const doc = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return doc ? toRecord(doc) : null;
}

export async function list(): Promise<DriverRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((doc) => toRecord(doc));
}

export async function add(data: DriverAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    documentNo: data.documentNo.trim(),
    documentId: data.documentId.trim(),
    phoneNo: data.phoneNo.trim(),
    licenseNo: data.licenseNo.trim(),
    licenseCategory: data.licenseCategory.trim(),
    licenseExpiration: data.licenseExpiration.trim() || null,
    relationshipType: data.relationshipType,
    employeeId: data.employeeId && data.employeeId.trim() ? data.employeeId.trim() : null,
    status: data.status,
    currentTripId: data.currentTripId.trim() || null,
  });
}

export async function edit(id: string, data: DriverEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.firstName = data.firstName;
  if (data.lastName !== undefined) payload.lastName = data.lastName;
  if (data.documentNo !== undefined) payload.documentNo = data.documentNo;
  if (data.documentId !== undefined) payload.documentId = data.documentId;
  if (data.phoneNo !== undefined) payload.phoneNo = data.phoneNo;
  if (data.licenseNo !== undefined) payload.licenseNo = data.licenseNo;
  if (data.licenseCategory !== undefined) payload.licenseCategory = data.licenseCategory;
  if (data.licenseExpiration !== undefined) payload.licenseExpiration = data.licenseExpiration || null;
  if (data.relationshipType !== undefined) payload.relationshipType = data.relationshipType;
  if (data.employeeId !== undefined) payload.employeeId = data.employeeId && data.employeeId.trim() ? data.employeeId.trim() : null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.currentTripId !== undefined) payload.currentTripId = data.currentTripId.trim() || null;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
