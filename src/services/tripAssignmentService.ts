"use client";

import {
  getDocument,
  getCollectionWithFilter,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "tripAssignments";

export type AssignmentEntityType = "employee" | "resource";

export interface TripAssignmentRecord {
  id: string;
  code: string;
  tripId: string;
  entityType: AssignmentEntityType;
  entityId: string;
  position: string;
  displayName: string;
  /** Id del costo del recurso (solo cuando entityType === "resource"). */
  resourceCostId: string;
}

export interface TripAssignmentAddInput {
  code: string;
  tripId: string;
  entityType: AssignmentEntityType;
  entityId: string;
  position: string;
  displayName: string;
  resourceCostId?: string;
}

export type TripAssignmentEditInput = Partial<Omit<TripAssignmentRecord, "id">>;

function toEntityType(s: string): AssignmentEntityType {
  const et = (s || "").toLowerCase();
  if (et === "resource") return "resource";
  return "employee";
}

function toRecord(doc: { id: string } & Record<string, unknown>): TripAssignmentRecord {
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    tripId: String(doc.tripId ?? ""),
    entityType: toEntityType(doc.entityType as string),
    entityId: String(doc.entityId ?? ""),
    position: String(doc.position ?? ""),
    displayName: String(doc.displayName ?? ""),
    resourceCostId: String(doc.resourceCostId ?? ""),
  };
}

export async function get(id: string): Promise<TripAssignmentRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function listByTripId(tripId: string): Promise<TripAssignmentRecord[]> {
  const list = await getCollectionWithFilter<Record<string, unknown>>(
    COLLECTION,
    "tripId",
    tripId
  );
  return list.map((d) => toRecord(d));
}

export async function add(data: TripAssignmentAddInput): Promise<string> {
  const payload: Record<string, unknown> = {
    code: data.code.trim(),
    tripId: data.tripId.trim(),
    entityType: data.entityType,
    entityId: data.entityId.trim(),
    position: data.position.trim(),
    displayName: data.displayName.trim(),
  };
  if (data.entityType === "resource" && data.resourceCostId?.trim()) {
    payload.resourceCostId = data.resourceCostId.trim();
  }
  return addDocument(COLLECTION, payload);
}

export async function edit(id: string, data: TripAssignmentEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code.trim();
  if (data.tripId !== undefined) payload.tripId = data.tripId.trim();
  if (data.entityType !== undefined) payload.entityType = data.entityType;
  if (data.entityId !== undefined) payload.entityId = data.entityId.trim();
  if (data.position !== undefined) payload.position = data.position.trim();
  if (data.displayName !== undefined) payload.displayName = data.displayName.trim();
  if (data.resourceCostId !== undefined) payload.resourceCostId = data.resourceCostId.trim();
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
