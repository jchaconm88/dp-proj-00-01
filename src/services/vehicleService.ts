"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "vehicles";

export type VehicleStatus = "available" | "assigned";

export interface VehicleRecord {
  id: string;
  plate: string;
  type: string;
  brand: string;
  model: string;
  capacityKg: number;
  status: VehicleStatus;
  currentTripId: string;
  active: boolean;
}

export interface VehicleAddInput {
  plate: string;
  type: string;
  brand: string;
  model: string;
  capacityKg: number;
  status: VehicleStatus;
  currentTripId: string;
  active: boolean;
}

export type VehicleEditInput = Partial<Omit<VehicleRecord, "id">>;

function toRecord(doc: { id: string } & Record<string, unknown>): VehicleRecord {
  const st = doc.status === "assigned" ? "assigned" : "available";
  return {
    id: doc.id,
    plate: String(doc.plate ?? ""),
    type: String(doc.type ?? ""),
    brand: String(doc.brand ?? ""),
    model: String(doc.model ?? ""),
    capacityKg: Number(doc.capacityKg) || 0,
    status: st,
    currentTripId: String(doc.currentTripId ?? ""),
    active: doc.active === true,
  };
}

export async function get(id: string): Promise<VehicleRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function list(): Promise<VehicleRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toRecord(d));
}

export async function add(data: VehicleAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    plate: data.plate.trim(),
    type: data.type.trim(),
    brand: data.brand.trim(),
    model: data.model.trim(),
    capacityKg: Number(data.capacityKg) || 0,
    status: data.status,
    currentTripId: data.currentTripId.trim() || null,
    active: data.active,
  });
}

export async function edit(id: string, data: VehicleEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.plate !== undefined) payload.plate = data.plate;
  if (data.type !== undefined) payload.type = data.type;
  if (data.brand !== undefined) payload.brand = data.brand;
  if (data.model !== undefined) payload.model = data.model;
  if (data.capacityKg !== undefined) payload.capacityKg = Number(data.capacityKg) || 0;
  if (data.status !== undefined) payload.status = data.status;
  if (data.currentTripId !== undefined) payload.currentTripId = data.currentTripId?.trim() || null;
  if (data.active !== undefined) payload.active = data.active;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
