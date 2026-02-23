"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "users";

export interface UserRecord {
  id: string;
  displayName: string | null;
  email: string;
  role: string[];
}

export interface UserAddInput {
  displayName: string | null;
  email: string;
  role: string[];
}

export type UserEditInput = Partial<Omit<UserRecord, "id">>;

/** Obtiene un usuario por ID. */
export async function get(id: string): Promise<UserRecord | null> {
  const doc = await getDocument<UserRecord>(COLLECTION, id);
  return doc;
}

/** Lista todos los usuarios. */
export async function list(): Promise<UserRecord[]> {
  return getCollection<UserRecord>(COLLECTION);
}

/** Crea un usuario (incluye auditoría createdAt/createBy). */
export async function add(data: UserAddInput): Promise<string> {
  return addDocument(COLLECTION, data);
}

/** Actualiza un usuario (incluye auditoría updateAt/updateBy). */
export async function edit(id: string, data: UserEditInput): Promise<void> {
  return updateDocument(COLLECTION, id, data);
}

/** Elimina un usuario. */
export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

/** Elimina varios usuarios. */
export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
