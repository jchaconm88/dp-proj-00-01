"use client";

import { GeoPoint } from "firebase/firestore";
import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "orders";

export type OrderStatus = "pending" | "confirmed" | "in_progress" | "delivered" | "cancelled";

export interface OrderLocation {
  latitude: number;
  longitude: number;
}

export interface OrderRecord {
  id: string;
  code: string;
  clientId: string;
  client: string;
  deliveryAddress: string;
  location: OrderLocation;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  weight: number;
  volume: number;
  status: OrderStatus;
}

export interface OrderAddInput {
  code: string;
  clientId: string;
  client: string;
  deliveryAddress: string;
  location: OrderLocation;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  weight: number;
  volume: number;
  status: OrderStatus;
}

export type OrderEditInput = Partial<Omit<OrderRecord, "id">>;

function toLocation(v: unknown): OrderLocation {
  if (v && typeof v === "object" && "latitude" in v && "longitude" in v) {
    const gp = v as { latitude: number; longitude: number };
    return { latitude: Number(gp.latitude) || 0, longitude: Number(gp.longitude) || 0 };
  }
  return { latitude: 0, longitude: 0 };
}

function toRecord(doc: { id: string } & Record<string, unknown>): OrderRecord {
  const st = doc.status as string;
  const status: OrderStatus =
    st === "confirmed" || st === "in_progress" || st === "delivered" || st === "cancelled"
      ? st
      : "pending";
  const location = toLocation(doc.location ?? doc.geoPoint);
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    clientId: String(doc.clientId ?? ""),
    client: String(doc.client ?? ""),
    deliveryAddress: String(doc.deliveryAddress ?? ""),
    location,
    deliveryWindowStart: String(doc.deliveryWindowStart ?? "08:00"),
    deliveryWindowEnd: String(doc.deliveryWindowEnd ?? "12:00"),
    weight: Number(doc.weight) || 0,
    volume: Number(doc.volume) || 0,
    status,
  };
}

export async function get(id: string): Promise<OrderRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function list(): Promise<OrderRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toRecord(d));
}

export async function add(data: OrderAddInput): Promise<string> {
  const lat = Number(data.location.latitude) || 0;
  const lng = Number(data.location.longitude) || 0;
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    clientId: data.clientId.trim(),
    client: data.client.trim(),
    deliveryAddress: data.deliveryAddress.trim(),
    location: new GeoPoint(lat, lng),
    deliveryWindowStart: data.deliveryWindowStart.trim() || "08:00",
    deliveryWindowEnd: data.deliveryWindowEnd.trim() || "12:00",
    weight: Number(data.weight) || 0,
    volume: Number(data.volume) || 0,
    status: data.status,
  } as Record<string, unknown>);
}

export async function edit(id: string, data: OrderEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  if (data.clientId !== undefined) payload.clientId = data.clientId;
  if (data.client !== undefined) payload.client = data.client;
  if (data.deliveryAddress !== undefined) payload.deliveryAddress = data.deliveryAddress;
  if (data.location !== undefined) {
    const lat = Number(data.location.latitude) || 0;
    const lng = Number(data.location.longitude) || 0;
    payload.location = new GeoPoint(lat, lng);
  }
  if (data.deliveryWindowStart !== undefined) payload.deliveryWindowStart = data.deliveryWindowStart;
  if (data.deliveryWindowEnd !== undefined) payload.deliveryWindowEnd = data.deliveryWindowEnd;
  if (data.weight !== undefined) payload.weight = Number(data.weight) || 0;
  if (data.volume !== undefined) payload.volume = Number(data.volume) || 0;
  if (data.status !== undefined) payload.status = data.status;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
