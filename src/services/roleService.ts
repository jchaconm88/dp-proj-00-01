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

/** Por cada módulo (id de colección), lista de códigos de permiso asignados al rol. */
export type RolePermissions = Record<string, string[]>;

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermissions;
}

export interface RoleAddInput {
  name: string;
  description: string | null;
}

export type RoleEditInput = Partial<Omit<RoleRecord, "id">>;

function normalizePermissions(raw: unknown): RolePermissions {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: RolePermissions = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== "string") continue;
    if (Array.isArray(value)) {
      out[key] = value.filter((c): c is string => typeof c === "string");
    }
  }
  return out;
}

/** Obtiene un rol por ID. */
export async function get(id: string): Promise<RoleRecord | null> {
  const doc = await getDocument<RoleRecord & { permissions?: unknown }>(COLLECTION, id);
  if (!doc) return null;
  return {
    ...doc,
    permissions: normalizePermissions(doc.permissions),
  };
}

/** Lista todos los roles. */
export async function list(): Promise<RoleRecord[]> {
  const list = await getCollection<RoleRecord & { permissions?: unknown }>(COLLECTION);
  return list.map((doc) => ({
    ...doc,
    permissions: normalizePermissions(doc.permissions),
  }));
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
