"use client";

import {
  getDocument,
  getCollectionWithFilter,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";
import {
  TRIP_COST_ENTITY,
  TRIP_COST_TYPE,
  TRIP_COST_SOURCE,
  TRIP_COST_STATUS,
} from "@/constants/statusOptions";
import type {
  TripCostRecord,
  TripCostAddInput,
  TripCostEditInput,
  TripCostEntity,
  TripCostType,
  TripCostSource,
  TripCostStatus,
} from "@/models/tripCost";

const COLLECTION = "tripCosts";

function toEntity(s: string): TripCostEntity {
  const v = (s || "").trim();
  return Object.prototype.hasOwnProperty.call(TRIP_COST_ENTITY, v)
    ? (v as TripCostEntity)
    : (Object.keys(TRIP_COST_ENTITY)[0] as TripCostEntity);
}

function toType(s: string): TripCostType {
  const v = (s || "").trim();
  return Object.prototype.hasOwnProperty.call(TRIP_COST_TYPE, v)
    ? (v as TripCostType)
    : (Object.keys(TRIP_COST_TYPE)[0] as TripCostType);
}

function toSource(s: string): TripCostSource {
  const v = (s || "").trim();
  return Object.prototype.hasOwnProperty.call(TRIP_COST_SOURCE, v)
    ? (v as TripCostSource)
    : (Object.keys(TRIP_COST_SOURCE)[0] as TripCostSource);
}

function toStatus(s: string): TripCostStatus {
  const v = (s || "").trim();
  return Object.prototype.hasOwnProperty.call(TRIP_COST_STATUS, v)
    ? (v as TripCostStatus)
    : (Object.keys(TRIP_COST_STATUS)[0] as TripCostStatus);
}

function toRecord(doc: { id: string } & Record<string, unknown>): TripCostRecord {
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    tripId: String(doc.tripId ?? ""),
    entity: toEntity(doc.entity as string),
    entityId: String(doc.entityId ?? ""),
    type: toType(doc.type as string),
    source: toSource(doc.source as string),
    amount: Number(doc.amount) ?? 0,
    currency: String(doc.currency ?? "PEN"),
    status: toStatus(doc.status as string),
    settlementId: doc.settlementId != null ? String(doc.settlementId) : null,
  };
}

export async function get(id: string): Promise<TripCostRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function listByTripId(tripId: string): Promise<TripCostRecord[]> {
  const list = await getCollectionWithFilter<Record<string, unknown>>(
    COLLECTION,
    "tripId",
    tripId
  );
  return list.map((d) => toRecord(d));
}

export async function add(data: TripCostAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    tripId: data.tripId.trim(),
    entity: data.entity,
    entityId: data.entityId.trim(),
    type: data.type,
    source: data.source,
    amount: Number(data.amount) ?? 0,
    currency: (data.currency ?? "PEN").trim(),
    status: data.status,
    settlementId: data.settlementId ?? null,
  });
}

export async function edit(id: string, data: TripCostEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code.trim();
  if (data.tripId !== undefined) payload.tripId = data.tripId.trim();
  if (data.entity !== undefined) payload.entity = data.entity;
  if (data.entityId !== undefined) payload.entityId = data.entityId.trim();
  if (data.type !== undefined) payload.type = data.type;
  if (data.source !== undefined) payload.source = data.source;
  if (data.amount !== undefined) payload.amount = Number(data.amount) ?? 0;
  if (data.currency !== undefined) payload.currency = data.currency.trim();
  if (data.status !== undefined) payload.status = data.status;
  if (data.settlementId !== undefined) payload.settlementId = data.settlementId ?? null;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
