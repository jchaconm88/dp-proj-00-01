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
  TRIP_CHARGE_TYPE,
  TRIP_CHARGE_SOURCE,
  TRIP_CHARGE_STATUS,
} from "@/constants/statusOptions";
import type {
  TripChargeRecord,
  TripChargeAddInput,
  TripChargeEditInput,
  TripChargeType,
  TripChargeSource,
  TripChargeStatus,
} from "@/models/tripCharge";

const COLLECTION = "tripCharges";

function toType(s: string): TripChargeType {
  const v = (s || "").trim();
  return Object.prototype.hasOwnProperty.call(TRIP_CHARGE_TYPE, v)
    ? (v as TripChargeType)
    : (Object.keys(TRIP_CHARGE_TYPE)[0] as TripChargeType);
}

function toSource(s: string): TripChargeSource {
  const v = (s || "").trim();
  return Object.prototype.hasOwnProperty.call(TRIP_CHARGE_SOURCE, v)
    ? (v as TripChargeSource)
    : (Object.keys(TRIP_CHARGE_SOURCE)[0] as TripChargeSource);
}

function toStatus(s: string): TripChargeStatus {
  const v = (s || "").trim();
  return Object.prototype.hasOwnProperty.call(TRIP_CHARGE_STATUS, v)
    ? (v as TripChargeStatus)
    : (Object.keys(TRIP_CHARGE_STATUS)[0] as TripChargeStatus);
}

function toRecord(doc: { id: string } & Record<string, unknown>): TripChargeRecord {
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    tripId: String(doc.tripId ?? ""),
    type: toType(doc.type as string),
    source: toSource(doc.source as string),
    amount: Number(doc.amount) ?? 0,
    currency: String(doc.currency ?? "PEN"),
    status: toStatus(doc.status as string),
    settlementId: doc.settlementId != null ? String(doc.settlementId) : null,
  };
}

export async function get(id: string): Promise<TripChargeRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function listByTripId(tripId: string): Promise<TripChargeRecord[]> {
  const list = await getCollectionWithFilter<Record<string, unknown>>(
    COLLECTION,
    "tripId",
    tripId
  );
  return list.map((d) => toRecord(d));
}

export async function add(data: TripChargeAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    tripId: data.tripId.trim(),
    type: data.type,
    source: data.source,
    amount: Number(data.amount) ?? 0,
    currency: (data.currency ?? "PEN").trim(),
    status: data.status,
    settlementId: data.settlementId ?? null,
  });
}

export async function edit(id: string, data: TripChargeEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code.trim();
  if (data.tripId !== undefined) payload.tripId = data.tripId.trim();
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
