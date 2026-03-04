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
  getNestedSubcollection,
  addDocumentToNestedSubcollection,
  setDocumentWithIdInNestedSubcollection,
  deleteDocumentFromNestedSubcollection,
} from "@/lib/firestoreService";

const COLLECTION = "trips";
const TRIP_STOPS_SUB = "tripStops";
const EVIDENCE_SUB = "evidence";

export type TripStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type TripStopType = "origin" | "pickup" | "delivery" | "checkpoint" | "rest";
export type TripStopStatus = "pending" | "arrived" | "completed" | "skipped";

export interface TripRecord {
  id: string;
  code: string;
  routeId: string;
  /** Texto de ruta (interno o externo). Reemplaza `routeCode`. */
  route: string;
  /** Si true, la ruta es externa y se ingresa manualmente. */
  isExternalRoute: boolean;
  transportServiceId: string;
  /** Servicio de transporte (denormalizado) para mostrar en grilla. */
  transportService: string;
  clientId: string;
  /** Cliente (denormalizado) para mostrar en grilla. */
  client: string;
  driverId: string;
  /** Conductor (denormalizado): licenseNo - lastName firstName */
  driver: string;
  vehicleId: string;
  /** Vehículo (denormalizado): plate */
  vehicle: string;
  /** Guía de transporte (número o código). */
  transportGuide: string;
  status: TripStatus;
  scheduledStart: string;
}

export interface TripAddInput {
  code: string;
  routeId: string;
  route: string;
  isExternalRoute: boolean;
  transportServiceId: string;
  transportService: string;
  clientId: string;
  client: string;
  driverId: string;
  driver: string;
  vehicleId: string;
  vehicle: string;
  transportGuide: string;
  status: TripStatus;
  scheduledStart: string;
}

export type TripEditInput = Partial<Omit<TripRecord, "id">>;

export interface TripStopRecord {
  id: string;
  order: number;
  type: TripStopType;
  name: string;
  lat: number;
  lng: number;
  status: TripStopStatus;
  plannedArrival: string;
  actualArrival: string | null;
  actualDeparture: string | null;
}

export interface TripStopAddInput {
  id: string;
  order: number;
  type: TripStopType;
  name: string;
  lat: number;
  lng: number;
  status: TripStopStatus;
  plannedArrival: string;
  actualArrival: string | null;
  actualDeparture: string | null;
}

export type TripStopEditInput = Partial<Omit<TripStopRecord, "id">>;

export interface EvidenceRecord {
  id: string;
  url: string;
  uploadedAt: string;
}

export interface EvidenceAddInput {
  id: string;
  url: string;
}

function toTripRecord(doc: { id: string } & Record<string, unknown>): TripRecord {
  const st = doc.status as string;
  const status: TripStatus =
    st === "in_progress" || st === "completed" || st === "cancelled" ? st : "scheduled";
  const scheduledStart = doc.scheduledStart != null
    ? typeof doc.scheduledStart === "object" && "toDate" in doc.scheduledStart
      ? (doc.scheduledStart as { toDate: () => Date }).toDate().toISOString()
      : String(doc.scheduledStart)
    : "";
  const route = String(doc.route ?? doc.routeCode ?? "");
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    routeId: String(doc.routeId ?? ""),
    route,
    isExternalRoute: doc.isExternalRoute === true,
    transportServiceId: String(doc.transportServiceId ?? ""),
    transportService: String(doc.transportService ?? ""),
    clientId: String(doc.clientId ?? ""),
    client: String(doc.client ?? ""),
    driverId: String(doc.driverId ?? ""),
    driver: String(doc.driver ?? ""),
    vehicleId: String(doc.vehicleId ?? ""),
    vehicle: String(doc.vehicle ?? ""),
    transportGuide: String(doc.transportGuide ?? ""),
    status,
    scheduledStart,
  };
}

function toTripStopRecord(doc: { id: string } & Record<string, unknown>): TripStopRecord {
  const t = doc.type as string;
  const type: TripStopType =
    t === "origin" || t === "pickup" || t === "delivery" || t === "checkpoint" || t === "rest"
      ? t
      : "checkpoint";
  const s = doc.status as string;
  const status: TripStopStatus =
    s === "arrived" || s === "completed" || s === "skipped" ? s : "pending";
  const toStr = (v: unknown): string =>
    v != null && typeof v === "object" && "toDate" in v
      ? (v as { toDate: () => Date }).toDate().toISOString()
      : String(v ?? "");
  return {
    id: doc.id,
    order: Number(doc.order) || 0,
    type,
    name: String(doc.name ?? ""),
    lat: Number(doc.lat) || 0,
    lng: Number(doc.lng) || 0,
    status,
    plannedArrival: toStr(doc.plannedArrival),
    actualArrival: doc.actualArrival != null ? toStr(doc.actualArrival) : null,
    actualDeparture: doc.actualDeparture != null ? toStr(doc.actualDeparture) : null,
  };
}

function toEvidenceRecord(doc: { id: string } & Record<string, unknown>): EvidenceRecord {
  const raw = doc.uploadedAt ?? doc.createdAt;
  const uploadedAt =
    raw != null && typeof raw === "object" && "toDate" in raw
      ? (raw as { toDate: () => Date }).toDate().toISOString()
      : String(raw ?? "");
  return {
    id: doc.id,
    url: String(doc.url ?? ""),
    uploadedAt,
  };
}

// --- Trips ---

export async function getTrip(id: string): Promise<TripRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toTripRecord(d) : null;
}

export async function listTrips(): Promise<TripRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toTripRecord(d));
}

export async function addTrip(data: TripAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    routeId: data.routeId.trim(),
    route: data.route.trim(),
    isExternalRoute: data.isExternalRoute,
    transportServiceId: data.transportServiceId.trim(),
    transportService: data.transportService.trim(),
    clientId: data.clientId.trim(),
    client: data.client.trim(),
    driverId: data.driverId.trim(),
    driver: data.driver.trim(),
    vehicleId: data.vehicleId.trim(),
    vehicle: data.vehicle.trim(),
    transportGuide: (data.transportGuide ?? "").trim(),
    status: data.status,
    scheduledStart: data.scheduledStart.trim() || null,
  });
}

export async function editTrip(id: string, data: TripEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  if (data.routeId !== undefined) payload.routeId = data.routeId;
  if (data.route !== undefined) payload.route = data.route;
  if (data.isExternalRoute !== undefined) payload.isExternalRoute = data.isExternalRoute;
  if (data.transportServiceId !== undefined) payload.transportServiceId = data.transportServiceId;
  if (data.transportService !== undefined) payload.transportService = data.transportService;
  if (data.clientId !== undefined) payload.clientId = data.clientId;
  if (data.client !== undefined) payload.client = data.client;
  if (data.driverId !== undefined) payload.driverId = data.driverId;
  if (data.driver !== undefined) payload.driver = data.driver;
  if (data.vehicleId !== undefined) payload.vehicleId = data.vehicleId;
  if (data.vehicle !== undefined) payload.vehicle = data.vehicle;
  if (data.transportGuide !== undefined) payload.transportGuide = data.transportGuide;
  if (data.status !== undefined) payload.status = data.status;
  if (data.scheduledStart !== undefined) payload.scheduledStart = data.scheduledStart || null;
  await updateDocument(COLLECTION, id, payload);
}

export async function removeTrip(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeManyTrips(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}

// --- TripStops (trips/{tripId}/tripStops) ---

export async function listTripStops(tripId: string): Promise<TripStopRecord[]> {
  const list = await getSubcollection<Record<string, unknown>>(COLLECTION, tripId, TRIP_STOPS_SUB);
  return list.map((d) => toTripStopRecord(d)).sort((a, b) => a.order - b.order);
}

export async function getTripStop(tripId: string, stopId: string): Promise<TripStopRecord | null> {
  const d = await getDocumentFromSubcollection<Record<string, unknown>>(
    COLLECTION,
    tripId,
    TRIP_STOPS_SUB,
    stopId
  );
  return d ? toTripStopRecord(d) : null;
}

export async function addTripStop(tripId: string, data: TripStopAddInput): Promise<void> {
  const stopId = data.id.trim().toLowerCase().replace(/\s+/g, "-");
  await setDocumentWithIdInSubcollection(
    COLLECTION,
    tripId,
    TRIP_STOPS_SUB,
    stopId,
    {
      order: data.order,
      type: data.type,
      name: data.name.trim(),
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      status: data.status,
      plannedArrival: data.plannedArrival.trim() || null,
      actualArrival: data.actualArrival?.trim() || null,
      actualDeparture: data.actualDeparture?.trim() || null,
    }
  );
}

export async function editTripStop(
  tripId: string,
  stopId: string,
  data: TripStopEditInput
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.order !== undefined) payload.order = data.order;
  if (data.type !== undefined) payload.type = data.type;
  if (data.name !== undefined) payload.name = data.name;
  if (data.lat !== undefined) payload.lat = Number(data.lat) || 0;
  if (data.lng !== undefined) payload.lng = Number(data.lng) || 0;
  if (data.status !== undefined) payload.status = data.status;
  if (data.plannedArrival !== undefined) payload.plannedArrival = data.plannedArrival || null;
  if (data.actualArrival !== undefined) payload.actualArrival = data.actualArrival || null;
  if (data.actualDeparture !== undefined) payload.actualDeparture = data.actualDeparture || null;
  await updateDocumentInSubcollection(
    COLLECTION,
    tripId,
    TRIP_STOPS_SUB,
    stopId,
    payload
  );
}

export async function removeTripStop(tripId: string, stopId: string): Promise<void> {
  return deleteDocumentFromSubcollection(COLLECTION, tripId, TRIP_STOPS_SUB, stopId);
}

// --- Evidence (trips/{tripId}/tripStops/{stopId}/evidence) ---

export async function listEvidence(
  tripId: string,
  stopId: string
): Promise<EvidenceRecord[]> {
  const list = await getNestedSubcollection<Record<string, unknown>>(
    COLLECTION,
    tripId,
    TRIP_STOPS_SUB,
    stopId,
    EVIDENCE_SUB
  );
  return list.map((d) => toEvidenceRecord(d));
}

export async function addEvidence(
  tripId: string,
  stopId: string,
  data: EvidenceAddInput
): Promise<string> {
  const id = data.id.trim().toLowerCase().replace(/\s+/g, "-");
  await setDocumentWithIdInNestedSubcollection(
    COLLECTION,
    tripId,
    TRIP_STOPS_SUB,
    stopId,
    EVIDENCE_SUB,
    id,
    { url: data.url.trim() }
  );
  return id;
}

export async function removeEvidence(
  tripId: string,
  stopId: string,
  evidenceId: string
): Promise<void> {
  return deleteDocumentFromNestedSubcollection(
    COLLECTION,
    tripId,
    TRIP_STOPS_SUB,
    stopId,
    EVIDENCE_SUB,
    evidenceId
  );
}
