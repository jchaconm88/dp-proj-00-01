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

export interface RouteRecord {
  id: string;
  name: string;
  code: string;
  totalEstimatedKm: number;
  totalEstimatedHours: number;
  active: boolean;
  createdAt?: unknown;
}

export interface RouteAddInput {
  name: string;
  code: string;
  totalEstimatedKm: number;
  totalEstimatedHours: number;
  active: boolean;
}

export type RouteEditInput = Partial<Omit<RouteRecord, "id" | "createdAt">>;

export interface StopRecord {
  id: string;
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
  return {
    id: doc.id,
    order: Number(doc.order) || 0,
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
    totalEstimatedKm: Number(data.totalEstimatedKm) || 0,
    totalEstimatedHours: Number(data.totalEstimatedHours) || 0,
    active: data.active,
  });
}

export async function editRoute(id: string, data: RouteEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
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
  return list.map((d) => toStopRecord(d)).sort((a, b) => a.order - b.order);
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
  await setDocumentWithIdInSubcollection(
    COLLECTION,
    routeId,
    STOPS_SUBCOLLECTION,
    stopId,
    {
      order: data.order,
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
  if (data.order !== undefined) payload.order = data.order;
  if (data.type !== undefined) payload.type = data.type;
  if (data.name !== undefined) payload.name = data.name;
  if (data.address !== undefined) payload.address = data.address;
  if (data.lat !== undefined) payload.lat = Number(data.lat) || 0;
  if (data.lng !== undefined) payload.lng = Number(data.lng) || 0;
  if (data.estimatedArrivalOffsetMinutes !== undefined)
    payload.estimatedArrivalOffsetMinutes = Number(data.estimatedArrivalOffsetMinutes) || 0;
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
