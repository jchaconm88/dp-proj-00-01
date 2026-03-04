"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "transport-services";

import type { CalculationType } from "@/services/contractService";

export type ServiceTypeCategory = "distribution" | "express" | "dedicated";

export interface ServiceTypeRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ServiceTypeCategory;
  defaultServiceTimeMin: number;
  calculationType: CalculationType;
  requiresAppointment: boolean;
  allowConsolidation: boolean;
  active: boolean;
}

export interface ServiceTypeAddInput {
  code: string;
  name: string;
  description: string;
  category: ServiceTypeCategory;
  defaultServiceTimeMin: number;
  calculationType: CalculationType;
  requiresAppointment: boolean;
  allowConsolidation: boolean;
  active: boolean;
}

export type ServiceTypeEditInput = Partial<Omit<ServiceTypeRecord, "id">>;

export async function get(id: string): Promise<ServiceTypeRecord | null> {
  const doc = await getDocument<Omit<ServiceTypeRecord, "id">>(COLLECTION, id);
  if (!doc) return null;
  return { id: doc.id, ...doc };
}

export async function list(): Promise<ServiceTypeRecord[]> {
  const docs = await getCollection<Omit<ServiceTypeRecord, "id">>(COLLECTION);
  return docs.map((d) => ({ id: d.id, ...d } as ServiceTypeRecord));
}

export async function add(data: ServiceTypeAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    name: data.name.trim(),
    description: (data.description ?? "").trim(),
    category: data.category,
    defaultServiceTimeMin: Number(data.defaultServiceTimeMin) || 0,
    calculationType: data.calculationType,
    requiresAppointment: !!data.requiresAppointment,
    allowConsolidation: data.allowConsolidation !== false,
    active: data.active !== false,
  });
}

export async function edit(id: string, data: ServiceTypeEditInput): Promise<void> {
  const payload: Record<string, unknown> = { ...data };
  if (payload.code !== undefined) payload.code = String(payload.code).trim();
  if (payload.name !== undefined) payload.name = String(payload.name).trim();
  if (payload.description !== undefined) payload.description = String(payload.description).trim();
  if (payload.defaultServiceTimeMin !== undefined) payload.defaultServiceTimeMin = Number(payload.defaultServiceTimeMin) || 0;
  if (payload.requiresAppointment !== undefined) payload.requiresAppointment = !!payload.requiresAppointment;
  if (payload.allowConsolidation !== undefined) payload.allowConsolidation = !!payload.allowConsolidation;
  if (payload.active !== undefined) payload.active = !!payload.active;
  return updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
