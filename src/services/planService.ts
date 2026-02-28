"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "plans";

export type PlanStatus = "draft" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface PlanRecord {
  id: string;
  code: string;
  date: string;
  zone: string;
  vehicleType: string;
  orderIds: string[];
  status: PlanStatus;
}

export interface PlanAddInput {
  code: string;
  date: string;
  zone: string;
  vehicleType: string;
  orderIds: string[];
  status: PlanStatus;
}

export type PlanEditInput = Partial<Omit<PlanRecord, "id">>;

function toStatus(v: unknown): PlanStatus {
  const s = String(v ?? "").toLowerCase();
  if (
    s === "confirmed" ||
    s === "in_progress" ||
    s === "completed" ||
    s === "cancelled"
  )
    return s;
  return "draft";
}

function toOrderIds(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  return [];
}

function toRecord(doc: { id: string } & Record<string, unknown>): PlanRecord {
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    date: String(doc.date ?? ""),
    zone: String(doc.zone ?? ""),
    vehicleType: String(doc.vehicleType ?? ""),
    orderIds: toOrderIds(doc.orderIds),
    status: toStatus(doc.status),
  };
}

export async function get(id: string): Promise<PlanRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function list(): Promise<PlanRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toRecord(d));
}

export async function add(data: PlanAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    date: data.date.trim(),
    zone: data.zone.trim(),
    vehicleType: data.vehicleType.trim(),
    orderIds: Array.isArray(data.orderIds) ? data.orderIds : [],
    status: data.status,
  } as Record<string, unknown>);
}

export async function edit(id: string, data: PlanEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  if (data.date !== undefined) payload.date = data.date;
  if (data.zone !== undefined) payload.zone = data.zone;
  if (data.vehicleType !== undefined) payload.vehicleType = data.vehicleType;
  if (data.orderIds !== undefined) payload.orderIds = data.orderIds;
  if (data.status !== undefined) payload.status = data.status;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
