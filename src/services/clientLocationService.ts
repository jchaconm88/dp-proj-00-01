"use client";

import { GeoPoint } from "firebase/firestore";
import {
  getSubcollection,
  getDocumentFromSubcollection,
  addDocumentToSubcollection,
  updateDocumentInSubcollection,
  deleteDocumentFromSubcollection,
} from "@/lib/firestoreService";

const COLLECTION = "clients";
const SUBCOLLECTION = "locations";

export type LocationType = "warehouse" | "store" | "office" | "plant";

export interface ClientLocationGeo {
  latitude: number;
  longitude: number;
}

export interface ClientLocationDeliveryWindow {
  start: string;
  end: string;
}

export interface ClientLocationRecord {
  id: string;
  name: string;
  type: LocationType;
  address: string;
  district: string;
  city: string;
  country: string;
  geo: ClientLocationGeo;
  deliveryWindow: ClientLocationDeliveryWindow;
  serviceTimeMin: number;
  active: boolean;
}

export interface ClientLocationAddInput {
  name: string;
  type: LocationType;
  address: string;
  district: string;
  city: string;
  country: string;
  geo: ClientLocationGeo;
  deliveryWindow: ClientLocationDeliveryWindow;
  serviceTimeMin: number;
  active: boolean;
}

export type ClientLocationEditInput = Partial<Omit<ClientLocationRecord, "id">>;

function toGeo(v: unknown): ClientLocationGeo {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const lat = o.latitude ?? (o as { latitude?: number }).latitude;
    const lng = o.longitude ?? (o as { longitude?: number }).longitude;
    if (typeof lat === "number" && typeof lng === "number") return { latitude: lat, longitude: lng };
  }
  if (v && typeof v === "object" && "latitude" in v && "longitude" in v) {
    const gp = v as { latitude: number; longitude: number };
    return { latitude: gp.latitude, longitude: gp.longitude };
  }
  return { latitude: 0, longitude: 0 };
}

function toDeliveryWindow(v: unknown): ClientLocationDeliveryWindow {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return {
      start: String(o.start ?? "08:00"),
      end: String(o.end ?? "16:00"),
    };
  }
  return { start: "08:00", end: "16:00" };
}

function toRecord(doc: { id: string } & Record<string, unknown>): ClientLocationRecord {
  const t = doc.type as string;
  const type: LocationType =
    t === "store" || t === "office" || t === "plant" ? t : "warehouse";
  const geo = toGeo(doc.geo ?? doc.geoPoint);
  return {
    id: doc.id,
    name: String(doc.name ?? ""),
    type,
    address: String(doc.address ?? ""),
    district: String(doc.district ?? ""),
    city: String(doc.city ?? ""),
    country: String(doc.country ?? ""),
    geo,
    deliveryWindow: toDeliveryWindow(doc.deliveryWindow),
    serviceTimeMin: Number(doc.serviceTimeMin) || 0,
    active: doc.active === true,
  };
}

export async function listLocations(clientId: string): Promise<ClientLocationRecord[]> {
  const list = await getSubcollection<Record<string, unknown>>(COLLECTION, clientId, SUBCOLLECTION);
  return list.map((d) => toRecord(d));
}

export async function getLocation(
  clientId: string,
  locationId: string
): Promise<ClientLocationRecord | null> {
  const d = await getDocumentFromSubcollection<Record<string, unknown>>(
    COLLECTION,
    clientId,
    SUBCOLLECTION,
    locationId
  );
  return d ? toRecord(d) : null;
}

export async function addLocation(
  clientId: string,
  data: ClientLocationAddInput
): Promise<string> {
  const lat = Number(data.geo.latitude) || 0;
  const lng = Number(data.geo.longitude) || 0;
  return addDocumentToSubcollection(
    COLLECTION,
    clientId,
    SUBCOLLECTION,
    {
      name: data.name.trim(),
      type: data.type,
      address: data.address.trim(),
      district: data.district.trim(),
      city: data.city.trim(),
      country: data.country.trim(),
      geo: { latitude: lat, longitude: lng },
      geoPoint: new GeoPoint(lat, lng),
      deliveryWindow: {
        start: data.deliveryWindow.start.trim() || "08:00",
        end: data.deliveryWindow.end.trim() || "16:00",
      },
      serviceTimeMin: Number(data.serviceTimeMin) || 0,
      active: data.active,
    } as Record<string, unknown>
  );
}

export async function editLocation(
  clientId: string,
  locationId: string,
  data: ClientLocationEditInput
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.type !== undefined) payload.type = data.type;
  if (data.address !== undefined) payload.address = data.address;
  if (data.district !== undefined) payload.district = data.district;
  if (data.city !== undefined) payload.city = data.city;
  if (data.country !== undefined) payload.country = data.country;
  if (data.geo !== undefined) {
    const lat = Number(data.geo.latitude) || 0;
    const lng = Number(data.geo.longitude) || 0;
    payload.geo = { latitude: lat, longitude: lng };
    payload.geoPoint = new GeoPoint(lat, lng);
  }
  if (data.deliveryWindow !== undefined) payload.deliveryWindow = data.deliveryWindow;
  if (data.serviceTimeMin !== undefined) payload.serviceTimeMin = Number(data.serviceTimeMin) || 0;
  if (data.active !== undefined) payload.active = data.active;
  await updateDocumentInSubcollection(
    COLLECTION,
    clientId,
    SUBCOLLECTION,
    locationId,
    payload
  );
}

export async function removeLocation(
  clientId: string,
  locationId: string
): Promise<void> {
  return deleteDocumentFromSubcollection(COLLECTION, clientId, SUBCOLLECTION, locationId);
}
