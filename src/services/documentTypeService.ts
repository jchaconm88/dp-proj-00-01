"use client";

import {
  getDocument,
  getCollection,
  createDocumentWithId,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "document-types";

export interface DocumentTypeRecord {
  id: string;
  name: string;
}

export interface DocumentTypeAddInput {
  /** Id del documento en la colección (ej. "identity"). */
  id: string;
  name: string;
}

export type DocumentTypeEditInput = Partial<Omit<DocumentTypeRecord, "id">>;

export async function get(id: string): Promise<DocumentTypeRecord | null> {
  const doc = await getDocument<DocumentTypeRecord>(COLLECTION, id);
  return doc;
}

export async function list(): Promise<DocumentTypeRecord[]> {
  return getCollection<DocumentTypeRecord>(COLLECTION);
}

export async function add(data: DocumentTypeAddInput): Promise<string> {
  const id = data.id.trim().toLowerCase().replace(/\s+/g, "-");
  await createDocumentWithId(COLLECTION, id, { name: data.name.trim() });
  return id;
}

export async function edit(id: string, data: DocumentTypeEditInput): Promise<void> {
  return updateDocument(COLLECTION, id, data);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
