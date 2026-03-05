"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
  getSubcollection,
  getDocumentFromSubcollection,
  setDocumentWithIdInSubcollection,
  updateDocumentInSubcollection,
  deleteDocumentFromSubcollection,
} from "@/lib/firestoreService";

const COLLECTION = "resources";
const RESOURCE_COSTS_SUB = "resourceCosts";

export type ResourceRole = "driver";
export type ResourceEngagementType = "sporadic" | "permanent" | "contract";
export type ResourceStatus = "active" | "inactive" | "suspended";

export interface ResourceRecord {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  role: ResourceRole;
  engagementType: ResourceEngagementType;
  status: ResourceStatus;
}

export interface ResourceAddInput {
  code: string;
  firstName: string;
  lastName: string;
  role: ResourceRole;
  engagementType: ResourceEngagementType;
  status: ResourceStatus;
}

export type ResourceEditInput = Partial<Omit<ResourceRecord, "id">>;

export type ResourceCostType = "per_trip" | "per_hour" | "per_day" | "fixed";

export interface ResourceCostRecord {
  id: string;
  name: string;
  type: ResourceCostType;
  amount: number;
  currency: string;
  effectiveFrom: string;
  active: boolean;
}

export interface ResourceCostAddInput {
  id: string;
  name: string;
  type: ResourceCostType;
  amount: number;
  currency: string;
  effectiveFrom: string;
  active: boolean;
}

export type ResourceCostEditInput = Partial<Omit<ResourceCostRecord, "id">>;

function toResourceRecord(doc: { id: string } & Record<string, unknown>): ResourceRecord {
  const r = (doc.role as string) || "driver";
  const role: ResourceRole = r === "driver" ? "driver" : "driver";
  const e = (doc.engagementType as string) || "sporadic";
  const engagementType: ResourceEngagementType =
    e === "permanent" || e === "contract" ? e : "sporadic";
  const s = (doc.status as string) || "active";
  const status: ResourceStatus =
    s === "inactive" || s === "suspended" ? s : "active";
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    firstName: String(doc.firstName ?? ""),
    lastName: String(doc.lastName ?? ""),
    role,
    engagementType,
    status,
  };
}

function toResourceCostRecord(doc: { id: string } & Record<string, unknown>): ResourceCostRecord {
  const t = (doc.type as string) || "per_trip";
  const type: ResourceCostType =
    t === "per_hour" || t === "per_day" || t === "fixed" ? t : "per_trip";
  return {
    id: doc.id,
    name: String(doc.name ?? ""),
    type,
    amount: Number(doc.amount) ?? 0,
    currency: String(doc.currency ?? "PEN"),
    effectiveFrom: String(doc.effectiveFrom ?? ""),
    active: doc.active !== false,
  };
}

// --- Resources ---

export async function getResource(id: string): Promise<ResourceRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toResourceRecord(d) : null;
}

export async function listResources(): Promise<ResourceRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toResourceRecord(d));
}

export async function addResource(data: ResourceAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    role: data.role,
    engagementType: data.engagementType,
    status: data.status,
  });
}

export async function editResource(id: string, data: ResourceEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  if (data.firstName !== undefined) payload.firstName = data.firstName;
  if (data.lastName !== undefined) payload.lastName = data.lastName;
  if (data.role !== undefined) payload.role = data.role;
  if (data.engagementType !== undefined) payload.engagementType = data.engagementType;
  if (data.status !== undefined) payload.status = data.status;
  await updateDocument(COLLECTION, id, payload);
}

export async function removeResource(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeManyResources(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}

// --- Resource costs (subcollection) ---

export async function listResourceCosts(resourceId: string): Promise<ResourceCostRecord[]> {
  const list = await getSubcollection<Record<string, unknown>>(
    COLLECTION,
    resourceId,
    RESOURCE_COSTS_SUB
  );
  return list.map((d) => toResourceCostRecord(d));
}

export async function getResourceCost(
  resourceId: string,
  costId: string
): Promise<ResourceCostRecord | null> {
  const d = await getDocumentFromSubcollection<Record<string, unknown>>(
    COLLECTION,
    resourceId,
    RESOURCE_COSTS_SUB,
    costId
  );
  return d ? toResourceCostRecord(d) : null;
}

export async function addResourceCost(
  resourceId: string,
  data: ResourceCostAddInput
): Promise<string> {
  const id = String(data.id ?? "").trim().toUpperCase().replace(/\s+/g, "_") || "COST";
  await setDocumentWithIdInSubcollection(
    COLLECTION,
    resourceId,
    RESOURCE_COSTS_SUB,
    id,
    {
      name: data.name.trim(),
      type: data.type,
      amount: Number(data.amount) ?? 0,
      currency: (data.currency ?? "PEN").trim(),
      effectiveFrom: (data.effectiveFrom ?? "").trim(),
      active: data.active !== false,
    }
  );
  return id;
}

export async function editResourceCost(
  resourceId: string,
  costId: string,
  data: ResourceCostEditInput
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.type !== undefined) payload.type = data.type;
  if (data.amount !== undefined) payload.amount = Number(data.amount) ?? 0;
  if (data.currency !== undefined) payload.currency = data.currency;
  if (data.effectiveFrom !== undefined) payload.effectiveFrom = data.effectiveFrom;
  if (data.active !== undefined) payload.active = data.active;
  await updateDocumentInSubcollection(
    COLLECTION,
    resourceId,
    RESOURCE_COSTS_SUB,
    costId,
    payload
  );
}

export async function removeResourceCost(resourceId: string, costId: string): Promise<void> {
  return deleteDocumentFromSubcollection(
    COLLECTION,
    resourceId,
    RESOURCE_COSTS_SUB,
    costId
  );
}

export async function removeManyResourceCosts(
  resourceId: string,
  items: { id: string }[]
): Promise<void> {
  for (const item of items) {
    await deleteDocumentFromSubcollection(COLLECTION, resourceId, RESOURCE_COSTS_SUB, item.id);
  }
}
