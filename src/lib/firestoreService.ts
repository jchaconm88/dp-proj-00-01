"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "./firebase";

/** Obtiene el email del usuario logueado (para auditoría). */
function getCurrentUserEmail(): string | null {
  return auth?.currentUser?.email ?? null;
}

/**
 * Obtiene un documento por ID.
 * @returns Los datos del documento con `id` incluido, o null si no existe.
 */
export async function getDocument<T = DocumentData>(
  collectionName: string,
  id: string
): Promise<({ id: string } & T) | null> {
  if (!db) throw new Error("Firestore no está disponible.");
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as { id: string } & T;
}

/**
 * Agrega un documento a la colección. Añade automáticamente createdAt y createBy.
 * @returns El ID del documento creado.
 */
export async function addDocument<T>(
  collectionName: string,
  data: T
): Promise<string> {
  if (!db) throw new Error("Firestore no está disponible.");
  const createBy = getCurrentUserEmail();
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    createBy,
  });
  return ref.id;
}

/**
 * Crea un documento con ID específico. Añade createdAt y createBy.
 * Útil cuando el id debe ser un valor conocido (ej. nombre de colección).
 */
export async function createDocumentWithId<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  if (!db) throw new Error("Firestore no está disponible.");
  const createBy = getCurrentUserEmail();
  await setDoc(doc(db, collectionName, documentId), {
    ...data,
    createdAt: serverTimestamp(),
    createBy,
  }, { merge: false });
}

/** Elimina propiedades undefined de un objeto/array (Firestore no acepta undefined). */
function stripUndefined<T>(value: T): T {
  if (value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T;
  }
  return value;
}

/**
 * Actualiza un documento (parcial). Añade automáticamente updateAt y updateBy.
 * Los valores undefined en data se omiten (Firestore no los acepta).
 * updateAt se envía como serverTimestamp() sin procesar para que Firestore guarde la fecha en servidor.
 */
export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  if (!db) throw new Error("Firestore no está disponible.");
  const updateBy = getCurrentUserEmail();
  const cleanData = stripUndefined(data) as Record<string, unknown>;
  await updateDoc(doc(db, collectionName, documentId), {
    ...cleanData,
    updateAt: serverTimestamp(),
    updateBy,
  });
}

/**
 * Reemplaza un documento por completo (setDoc sin merge).
 * No añade campos de auditoría; inclúyelos en data si los necesitas.
 */
export async function replaceDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  if (!db) throw new Error("Firestore no está disponible.");
  await setDoc(doc(db, collectionName, documentId), data, { merge: false });
}

/**
 * Elimina un documento por ID.
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  if (!db) throw new Error("Firestore no está disponible.");
  await deleteDoc(doc(db, collectionName, documentId));
}

/**
 * Elimina varios documentos por sus IDs.
 * @param collectionName - Nombre de la colección.
 * @param items - Array de objetos con propiedad id.
 */
export async function deleteManyDocuments<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!db) throw new Error("Firestore no está disponible.");
  for (const item of items) {
    await deleteDoc(doc(db, collectionName, item.id));
  }
}

/**
 * Obtiene documentos de una colección con un filtro (campo == valor).
 */
export async function getCollectionWithFilter<T = DocumentData>(
  collectionName: string,
  filter: string,
  value: unknown
): Promise<({ id: string } & T)[]> {
  if (!db) throw new Error("Firestore no está disponible.");
  const q = query(
    collection(db, collectionName),
    where(filter, "==", value)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string } & T));
}

/**
 * Obtiene documentos con múltiples condiciones (QueryConstraint).
 */
export async function getCollectionWithMultiFilter<T = DocumentData>(
  collectionName: string,
  filterArray: QueryConstraint[]
): Promise<({ id: string } & T)[]> {
  if (!db) throw new Error("Firestore no está disponible.");
  const q = query(collection(db, collectionName), ...filterArray);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string } & T));
}

/**
 * Obtiene todos los documentos de una colección.
 */
export async function getCollection<T = DocumentData>(
  collectionName: string
): Promise<({ id: string } & T)[]> {
  if (!db) throw new Error("Firestore no está disponible.");
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string } & T));
}

/**
 * Obtiene el primer documento que cumple el filtro (campo == valor).
 */
export async function getFirst<T = DocumentData>(
  collectionName: string,
  filter: string,
  value: unknown
): Promise<({ id: string } & T) | null> {
  if (!db) throw new Error("Firestore no está disponible.");
  const q = query(
    collection(db, collectionName),
    where(filter, "==", value),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as { id: string } & T;
}
