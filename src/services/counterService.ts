"use client";

import {
  getDocument,
  getCollection,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
  createDocumentWithId,
  getCollectionWithFilter,
} from "@/lib/firestoreService";
import { makeCounterId } from "@/services/sequenceService";

const COLLECTION = "counters";

export interface CounterRecord {
  id: string;
  sequenceId: string;
  /** Descripción denormalizada de la secuencia (ej. \"trip (TRIP)\"). */
  sequence: string;
  period: string;
  lastNumber: number;
  active: boolean;
}

export interface CounterAddInput {
  sequenceId: string;
  sequence: string;
  period: string;
  lastNumber: number;
  active: boolean;
}

export type CounterEditInput = Partial<Omit<CounterRecord, "id">>;

function toCounterRecord(doc: { id: string } & Record<string, unknown>): CounterRecord {
  return {
    id: doc.id,
    sequenceId: String(doc.sequenceId ?? ""),
    sequence: String(doc.sequence ?? ""),
    period: String(doc.period ?? ""),
    lastNumber: Number(doc.lastNumber) ?? 0,
    active: doc.active !== false,
  };
}

export async function get(id: string): Promise<CounterRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toCounterRecord(d) : null;
}

export async function list(): Promise<CounterRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toCounterRecord(d));
}

export async function listBySequenceId(sequenceId: string): Promise<CounterRecord[]> {
  const list = await getCollectionWithFilter<Record<string, unknown>>(
    COLLECTION,
    "sequenceId",
    sequenceId
  );
  return list.map((d) => toCounterRecord(d));
}

export async function add(data: CounterAddInput): Promise<string> {
  const id = makeCounterId(data.sequenceId.trim(), data.period.trim());
  await createDocumentWithId(COLLECTION, id, {
    sequenceId: data.sequenceId.trim(),
    sequence: data.sequence.trim(),
    period: data.period.trim(),
    lastNumber: Number(data.lastNumber) ?? 0,
    active: data.active !== false,
  });
  return id;
}

export async function edit(id: string, data: CounterEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.sequenceId !== undefined) payload.sequenceId = data.sequenceId;
   if (data.sequence !== undefined) payload.sequence = data.sequence;
  if (data.period !== undefined) payload.period = data.period;
  if (data.lastNumber !== undefined) payload.lastNumber = Number(data.lastNumber) ?? 0;
  if (data.active !== undefined) payload.active = data.active;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
