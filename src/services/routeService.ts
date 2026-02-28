"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
  getSubcollection,
  getDocumentFromSubcollection,
  setDocumentWithIdInSubcollection,
  updateDocumentInSubcollection,
  deleteDocumentFromSubcollection,
} from "@/lib/firestoreService";

const COLLECTION = "routes";
const STOPS_SUBCOLLECTION = "stops";

export type StopType = "origin" | "pickup" | "delivery" | "checkpoint" | "rest";
export type StopStatus = "pending" | "arrived" | "completed" | "skipped";

export interface RouteRecord {
  id: string;
  name: string;
  code: string;
  /** Referencia al plan (plans/{planId}). */
  planId: string;
  /** Código del plan (denormalizado) para mostrar en grilla. */
  planCode: string;
  totalEstimatedKm: number;
  totalEstimatedHours: number;
  active: boolean;
  createdAt?: unknown;
}

export interface RouteAddInput {
  name: string;
  code: string;
  planId: string;
  planCode: string;
  totalEstimatedKm: number;
  totalEstimatedHours: number;
  active: boolean;
}

export type RouteEditInput = Partial<Omit<RouteRecord, "id" | "createdAt">>;

export interface StopRecord {
  id: string;
  /** ID del pedido asociado (orders/{orderId}). Puede estar vacío en paradas sin pedido. */
  orderId: string;
  /** Secuencia de la parada dentro de la ruta (1..N). */
  sequence: number;
  /** Hora estimada de llegada (HH:mm). */
  eta: string;
  /** Ventana de llegada (HH:mm). */
  arrivalWindowStart: string;
  /** Ventana de llegada (HH:mm). */
  arrivalWindowEnd: string;
  status: StopStatus;

  /** Compatibilidad: campo anterior para ordenar. Mantener sincronizado con `sequence`. */
  order: number;
  type: StopType;
  name: string;
  address: string;
  lat: number;
  lng: number;
  estimatedArrivalOffsetMinutes: number;
}

export interface StopAddInput {
  id: string;
  orderId: string;
  sequence: number;
  eta: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  status: StopStatus;
  order: number;
  type: StopType;
  name: string;
  address: string;
  lat: number;
  lng: number;
  estimatedArrivalOffsetMinutes: number;
}

export type StopEditInput = Partial<Omit<StopRecord, "id">>;

function toRouteRecord(doc: { id: string } & Record<string, unknown>): RouteRecord {
  return {
    id: doc.id,
    name: String(doc.name ?? ""),
    code: String(doc.code ?? ""),
    planId: String(doc.planId ?? ""),
    planCode: String(doc.planCode ?? ""),
    totalEstimatedKm: Number(doc.totalEstimatedKm) || 0,
    totalEstimatedHours: Number(doc.totalEstimatedHours) || 0,
    active: doc.active === true,
    createdAt: doc.createdAt,
  };
}

function toStopRecord(doc: { id: string } & Record<string, unknown>): StopRecord {
  const t = doc.type as string;
  const type: StopType =
    t === "origin" || t === "pickup" || t === "delivery" || t === "checkpoint" || t === "rest"
      ? t
      : "checkpoint";
  const s = doc.status as string;
  const status: StopStatus =
    s === "arrived" || s === "completed" || s === "skipped" ? s : "pending";
  const sequence = Number(doc.sequence ?? doc.order) || 0;
  return {
    id: doc.id,
    orderId: String(doc.orderId ?? ""),
    sequence,
    eta: String(doc.eta ?? ""),
    arrivalWindowStart: String(doc.arrivalWindowStart ?? ""),
    arrivalWindowEnd: String(doc.arrivalWindowEnd ?? ""),
    status,
    order: Number(doc.order ?? sequence) || 0,
    type,
    name: String(doc.name ?? ""),
    address: String(doc.address ?? ""),
    lat: Number(doc.lat) || 0,
    lng: Number(doc.lng) || 0,
    estimatedArrivalOffsetMinutes: Number(doc.estimatedArrivalOffsetMinutes) || 0,
  };
}

// --- Routes ---

export async function getRoute(id: string): Promise<RouteRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRouteRecord(d) : null;
}

export async function listRoutes(): Promise<RouteRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toRouteRecord(d));
}

export async function addRoute(data: RouteAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    name: data.name.trim(),
    code: data.code.trim(),
    planId: data.planId.trim(),
    planCode: data.planCode.trim(),
    totalEstimatedKm: Number(data.totalEstimatedKm) || 0,
    totalEstimatedHours: Number(data.totalEstimatedHours) || 0,
    active: data.active,
  });
}

export async function editRoute(id: string, data: RouteEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.planId !== undefined) payload.planId = data.planId;
  if (data.planCode !== undefined) payload.planCode = data.planCode;
  if (data.totalEstimatedKm !== undefined) payload.totalEstimatedKm = Number(data.totalEstimatedKm) || 0;
  if (data.totalEstimatedHours !== undefined) payload.totalEstimatedHours = Number(data.totalEstimatedHours) || 0;
  if (data.active !== undefined) payload.active = data.active;
  await updateDocument(COLLECTION, id, payload);
}

export async function removeRoute(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeManyRoutes(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}

// --- Stops (subcollection routes/{routeId}/stops) ---

export async function listStops(routeId: string): Promise<StopRecord[]> {
  const list = await getSubcollection<Record<string, unknown>>(COLLECTION, routeId, STOPS_SUBCOLLECTION);
  return list.map((d) => toStopRecord(d)).sort((a, b) => a.sequence - b.sequence);
}

export async function getStop(routeId: string, stopId: string): Promise<StopRecord | null> {
  const d = await getDocumentFromSubcollection<Record<string, unknown>>(
    COLLECTION,
    routeId,
    STOPS_SUBCOLLECTION,
    stopId
  );
  return d ? toStopRecord(d) : null;
}

export async function addStop(routeId: string, data: StopAddInput): Promise<void> {
  const stopId = data.id.trim().toLowerCase().replace(/\s+/g, "-");
  const sequence = Number(data.sequence ?? data.order) || 0;
  await setDocumentWithIdInSubcollection(
    COLLECTION,
    routeId,
    STOPS_SUBCOLLECTION,
    stopId,
    {
      orderId: data.orderId.trim(),
      sequence,
      eta: data.eta.trim() || "",
      arrivalWindowStart: data.arrivalWindowStart.trim() || "",
      arrivalWindowEnd: data.arrivalWindowEnd.trim() || "",
      status: data.status,
      order: sequence,
      type: data.type,
      name: data.name.trim(),
      address: data.address.trim(),
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      estimatedArrivalOffsetMinutes: Number(data.estimatedArrivalOffsetMinutes) || 0,
    }
  );
}

export async function editStop(routeId: string, stopId: string, data: StopEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.orderId !== undefined) payload.orderId = data.orderId;
  if (data.sequence !== undefined) payload.sequence = Number(data.sequence) || 0;
  if (data.eta !== undefined) payload.eta = data.eta || "";
  if (data.arrivalWindowStart !== undefined) payload.arrivalWindowStart = data.arrivalWindowStart || "";
  if (data.arrivalWindowEnd !== undefined) payload.arrivalWindowEnd = data.arrivalWindowEnd || "";
  if (data.status !== undefined) payload.status = data.status;
  if (data.order !== undefined) payload.order = Number(data.order) || 0;
  if (data.type !== undefined) payload.type = data.type;
  if (data.name !== undefined) payload.name = data.name;
  if (data.address !== undefined) payload.address = data.address;
  if (data.lat !== undefined) payload.lat = Number(data.lat) || 0;
  if (data.lng !== undefined) payload.lng = Number(data.lng) || 0;
  if (data.estimatedArrivalOffsetMinutes !== undefined)
    payload.estimatedArrivalOffsetMinutes = Number(data.estimatedArrivalOffsetMinutes) || 0;
  // Mantener consistencia entre `sequence` y `order` cuando se edita solo uno.
  if (payload.sequence !== undefined && payload.order === undefined) payload.order = payload.sequence;
  if (payload.order !== undefined && payload.sequence === undefined) payload.sequence = payload.order;
  await updateDocumentInSubcollection(
    COLLECTION,
    routeId,
    STOPS_SUBCOLLECTION,
    stopId,
    payload
  );
}

export async function removeStop(routeId: string, stopId: string): Promise<void> {
  return deleteDocumentFromSubcollection(COLLECTION, routeId, STOPS_SUBCOLLECTION, stopId);
}
