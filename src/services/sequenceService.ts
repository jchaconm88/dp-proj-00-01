"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
  getCollectionWithFilter,
  runTransaction,
} from "@/lib/firestoreService";
import { doc } from "firebase/firestore";

const COLLECTION = "sequences";
const COUNTERS_COLLECTION = "counters";

export type ResetPeriod = "never" | "yearly" | "monthly" | "daily";

/** Placeholders permitidos en format: prefix | year | month | day | number */
export type FormatPlaceholder = "prefix" | "year" | "month" | "day" | "number";

export interface SequenceRecord {
  id: string;
  entity: string;
  prefix: string;
  digits: number;
  format: string;
  resetPeriod: ResetPeriod;
  allowManualOverride: boolean;
  preventGaps: boolean;
  active: boolean;
}

export interface SequenceAddInput {
  entity: string;
  prefix: string;
  digits: number;
  format: string;
  resetPeriod: ResetPeriod;
  allowManualOverride: boolean;
  preventGaps: boolean;
  active: boolean;
}

export type SequenceEditInput = Partial<Omit<SequenceRecord, "id">>;

function toSequenceRecord(doc: { id: string } & Record<string, unknown>): SequenceRecord {
  const rp = doc.resetPeriod as string;
  const resetPeriod: ResetPeriod =
    rp === "yearly" || rp === "monthly" || rp === "daily" ? rp : "never";
  return {
    id: doc.id,
    entity: String(doc.entity ?? ""),
    prefix: String(doc.prefix ?? ""),
    digits: Number(doc.digits) ?? 6,
    format: String(doc.format ?? "{prefix}-{number}"),
    resetPeriod,
    allowManualOverride: doc.allowManualOverride === true,
    preventGaps: doc.preventGaps === true,
    active: doc.active !== false,
  };
}

export async function get(id: string): Promise<SequenceRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toSequenceRecord(d) : null;
}

export async function list(): Promise<SequenceRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toSequenceRecord(d));
}

/** Obtiene la primera secuencia activa para la entidad indicada. */
export async function getActiveByEntity(entity: string): Promise<SequenceRecord | null> {
  const list = await getCollectionWithFilter<Record<string, unknown>>(
    COLLECTION,
    "entity",
    entity
  );
  const active = list.find((d) => (d as Record<string, unknown>).active !== false);
  return active ? toSequenceRecord(active) : null;
}

export async function add(data: SequenceAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    entity: data.entity.trim(),
    prefix: (data.prefix ?? "").trim(),
    digits: Number(data.digits) ?? 6,
    format: (data.format ?? "{prefix}-{number}").trim(),
    resetPeriod: data.resetPeriod ?? "yearly",
    allowManualOverride: !!data.allowManualOverride,
    preventGaps: !!data.preventGaps,
    active: data.active !== false,
  });
}

export async function edit(id: string, data: SequenceEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.entity !== undefined) payload.entity = data.entity.trim();
  if (data.prefix !== undefined) payload.prefix = data.prefix.trim();
  if (data.digits !== undefined) payload.digits = Number(data.digits) ?? 6;
  if (data.format !== undefined) payload.format = data.format.trim();
  if (data.resetPeriod !== undefined) payload.resetPeriod = data.resetPeriod;
  if (data.allowManualOverride !== undefined) payload.allowManualOverride = data.allowManualOverride;
  if (data.preventGaps !== undefined) payload.preventGaps = data.preventGaps;
  if (data.active !== undefined) payload.active = data.active;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}

/** ID del documento counter: sequenceId_period (period sin barras). */
export function makeCounterId(sequenceId: string, period: string): string {
  const safe = String(period ?? "").replace(/\//g, "-").trim() || "all";
  return `${sequenceId}_${safe}`;
}

/** Devuelve el periodo actual según resetPeriod: never -> "all", yearly -> "2026", monthly -> "2026-01", daily -> "2026-01-15". */
export function getCurrentPeriod(resetPeriod: ResetPeriod): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  switch (resetPeriod) {
    case "yearly":
      return String(y);
    case "monthly":
      return `${y}-${m}`;
    case "daily":
      return `${y}-${m}-${d}`;
    default:
      return "all";
  }
}

/**
 * Genera el siguiente número para la entidad según la secuencia configurada.
 * Usa una transacción para evitar condiciones de carrera por concurrencia.
 * Valida que exista secuencia activa; crea o actualiza el counter según resetPeriod.
 * @returns Cadena formateada según sequence.format (prefix, year, month, day, number con dígitos).
 */
export async function generateNumber(entity: string): Promise<string> {
  const sequence = await getActiveByEntity(entity);
  if (!sequence) {
    throw new Error(`No existe una secuencia activa para la entidad "${entity}".`);
  }

  const period = getCurrentPeriod(sequence.resetPeriod);
  const counterId = makeCounterId(sequence.id, period);

  const nextNumber = await runTransaction(async (transaction, db) => {
    const ref = doc(db, COUNTERS_COLLECTION, counterId);
    const snap = await transaction.get(ref);
    let next: number;
    if (!snap.exists()) {
      next = 1;
      transaction.set(ref, {
        sequenceId: sequence.id,
        sequence: `${sequence.entity} (${sequence.prefix})`.trim(),
        period,
        lastNumber: 1,
        active: true,
      });
    } else {
      const last = Number(snap.data()?.lastNumber ?? 0) || 0;
      next = last + 1;
      transaction.update(ref, { lastNumber: next });
    }
    return next;
  });

  const year = String(new Date().getFullYear());
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const day = String(new Date().getDate()).padStart(2, "0");
  const digits = Math.max(0, Number(sequence.digits) || 6);
  const numberStr = String(nextNumber).padStart(digits, "0");

  let out = String(sequence.format ?? "{prefix}-{number}")
    .replace(/\{prefix\}/gi, sequence.prefix ?? "")
    .replace(/\{year\}/gi, year)
    .replace(/\{month\}/gi, month)
    .replace(/\{day\}/gi, day)
    .replace(/\{number\}/gi, numberStr);

  return out;
}

/**
 * Devuelve el código a guardar: si currentCode tiene valor lo devuelve; si está vacío genera el siguiente con generateNumber(entity).
 * Útil en formularios que usan DpCodeInput para centralizar la lógica de "vacío = generar al grabar".
 */
export async function resolveCodeIfEmpty(currentCode: string, entity: string): Promise<string> {
  const trimmed = String(currentCode ?? "").trim();
  if (trimmed) return trimmed;
  return generateNumber(entity);
}
