"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "positions";

export interface PositionRecord {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface PositionAddInput {
  code: string;
  name: string;
  active: boolean;
}

export type PositionEditInput = Partial<Omit<PositionRecord, "id">>;

function toRecord(doc: { id: string } & Record<string, unknown>): PositionRecord {
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    name: String(doc.name ?? ""),
    active: doc.active !== false,
  };
}

export async function get(id: string): Promise<PositionRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function list(): Promise<PositionRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toRecord(d));
}

export async function add(data: PositionAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    name: data.name.trim(),
    active: data.active !== false,
  });
}

export async function edit(id: string, data: PositionEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code.trim();
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.active !== undefined) payload.active = data.active;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
