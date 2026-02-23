"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "roles";

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleAddInput {
  name: string;
  description: string | null;
}

export type RoleEditInput = Partial<Omit<RoleRecord, "id">>;

/** Obtiene un rol por ID. */
export async function get(id: string): Promise<RoleRecord | null> {
  const doc = await getDocument<RoleRecord>(COLLECTION, id);
  return doc;
}

/** Lista todos los roles. */
export async function list(): Promise<RoleRecord[]> {
  return getCollection<RoleRecord>(COLLECTION);
}

/** Crea un rol (incluye auditoría createdAt/createBy). */
export async function add(data: RoleAddInput): Promise<string> {
  return addDocument(COLLECTION, data);
}

/** Actualiza un rol (incluye auditoría updateAt/updateBy). */
export async function edit(id: string, data: RoleEditInput): Promise<void> {
  return updateDocument(COLLECTION, id, data);
}

/** Elimina un rol. */
export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

/** Elimina varios roles. */
export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
