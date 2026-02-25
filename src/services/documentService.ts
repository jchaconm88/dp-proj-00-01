"use client";

import {
  getDocument,
  getCollection,
  createDocumentWithId,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "documents";

export interface DocumentRecord {
  id: string;
  name: string;
  documentType: string;
}

export interface DocumentAddInput {
  /** Id del documento en la colección (ej. "dni"). */
  id: string;
  name: string;
  documentType: string;
}

export type DocumentEditInput = Partial<Omit<DocumentRecord, "id">>;

export async function get(id: string): Promise<DocumentRecord | null> {
  const doc = await getDocument<{ name?: string; documentType?: string; "document-type"?: string }>(COLLECTION, id);
  if (!doc) return null;
  const documentType = doc.documentType ?? doc["document-type"] ?? "";
  return { id: doc.id, name: doc.name ?? "", documentType };
}

export async function list(): Promise<DocumentRecord[]> {
  const list = await getCollection<{ name?: string; documentType?: string; "document-type"?: string }>(COLLECTION);
  return list.map((doc) => ({
    id: doc.id,
    name: doc.name ?? "",
    documentType: doc.documentType ?? doc["document-type"] ?? "",
  }));
}

export async function add(data: DocumentAddInput): Promise<string> {
  const id = data.id.trim().toLowerCase().replace(/\s+/g, "-");
  await createDocumentWithId(COLLECTION, id, {
    name: data.name.trim(),
    "document-type": data.documentType,
  });
  return id;
}

export async function edit(id: string, data: DocumentEditInput): Promise<void> {
  const payload: Record<string, unknown> = { ...data };
  if ("documentType" in payload && payload.documentType !== undefined) {
    payload["document-type"] = payload.documentType;
    delete payload.documentType;
  }
  return updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
