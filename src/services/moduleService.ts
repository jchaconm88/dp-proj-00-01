"use client";

import {
  getDocument,
  getCollection,
  createDocumentWithId,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "modules";

export interface ModulePermission {
  code: string;
  label: string;
  description: string;
}

export interface ModuleColumn {
  order: number;
  name: string;
  header: string;
  filter: boolean;
  format?: string;
}

export interface ModuleRecord {
  id: string;
  description: string;
  permissions: ModulePermission[];
  columns: ModuleColumn[];
}

export interface ModuleAddInput {
  /** Nombre de la colección (será el id del documento) */
  name: string;
  description: string;
}

export type ModuleEditInput = Partial<Omit<ModuleRecord, "id">>;

/** Obtiene un módulo por ID (nombre de colección). Normaliza permissions y columns a arrays. */
export async function get(id: string): Promise<ModuleRecord | null> {
  const doc = await getDocument<Omit<ModuleRecord, "id">>(COLLECTION, id);
  if (!doc) return null;
  return {
    ...doc,
    permissions: Array.isArray(doc.permissions)
      ? doc.permissions.map((p) => {
          if (typeof p === "string") {
            return { code: p, label: p, description: "" };
          }
          if (p != null && typeof p === "object") {
            const o = p as Record<string, unknown>;
            return {
              code: String(o?.code ?? ""),
              label: String(o?.label ?? ""),
              description: String(o?.description ?? ""),
            };
          }
          return { code: "", label: "", description: "" };
        }).filter((p) => p.code !== "")
      : [],
    columns: Array.isArray(doc.columns)
      ? doc.columns.map((c) => ({
          order: Number(c?.order) || 0,
          name: String(c?.name ?? ""),
          header: String(c?.header ?? ""),
          filter: Boolean(c?.filter),
          ...(c?.format != null && c.format !== "" ? { format: String(c.format) } : {}),
        }))
      : [],
  };
}

/** Lista todos los módulos. */
export async function list(): Promise<ModuleRecord[]> {
  return getCollection<Omit<ModuleRecord, "id">>(COLLECTION);
}

/** Crea un módulo con id = name (incluye auditoría). Inicializa permissions: [] y columns: []. */
export async function add(data: ModuleAddInput): Promise<void> {
  await createDocumentWithId(COLLECTION, data.name.trim(), {
    description: data.description.trim(),
    permissions: [],
    columns: [],
  });
}

/** Actualiza un módulo (incluye auditoría). */
export async function edit(id: string, data: ModuleEditInput): Promise<void> {
  return updateDocument(COLLECTION, id, data);
}

/** Elimina un módulo. */
export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

/** Elimina varios módulos. */
export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
