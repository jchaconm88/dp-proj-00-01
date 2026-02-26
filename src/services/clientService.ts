"use client";

import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteManyDocuments,
} from "@/lib/firestoreService";

const COLLECTION = "clients";

export type ClientStatus = "active" | "inactive" | "suspended";
export type PaymentCondition = "transfer" | "cash" | "credit" | "check";

export interface ClientContact {
  contactName: string;
  email: string;
  phone: string;
}

export interface ClientBilling {
  creditDays: number;
  creditLimit: number;
  currency: string;
  paymentCondition: PaymentCondition;
}

export interface ClientLogistics {
  priority: number;
  requiresAppointment: boolean;
  defaultServiceTimeMin: number;
}

export interface ClientRecord {
  id: string;
  code: string;
  businessName: string;
  commercialName: string;
  documentType: string;
  documentNumber: string;
  contact: ClientContact;
  billing: ClientBilling;
  logistics: ClientLogistics;
  status: ClientStatus;
}

export interface ClientAddInput {
  code: string;
  businessName: string;
  commercialName: string;
  documentType: string;
  documentNumber: string;
  contact: ClientContact;
  billing: ClientBilling;
  logistics: ClientLogistics;
  status: ClientStatus;
}

export type ClientEditInput = Partial<Omit<ClientRecord, "id">>;

function defaultContact(): ClientContact {
  return { contactName: "", email: "", phone: "" };
}

function defaultBilling(): ClientBilling {
  return { creditDays: 0, creditLimit: 0, currency: "PEN", paymentCondition: "transfer" };
}

function defaultLogistics(): ClientLogistics {
  return { priority: 0, requiresAppointment: false, defaultServiceTimeMin: 0 };
}

function toContact(v: unknown): ClientContact {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return {
      contactName: String(o.contactName ?? ""),
      email: String(o.email ?? ""),
      phone: String(o.phone ?? ""),
    };
  }
  return defaultContact();
}

function toBilling(v: unknown): ClientBilling {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const pay = o.paymentCondition as string;
    const paymentCondition: PaymentCondition =
      pay === "cash" || pay === "credit" || pay === "check" ? pay : "transfer";
    return {
      creditDays: Number(o.creditDays) || 0,
      creditLimit: Number(o.creditLimit) || 0,
      currency: String(o.currency ?? "PEN"),
      paymentCondition,
    };
  }
  return defaultBilling();
}

function toLogistics(v: unknown): ClientLogistics {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return {
      priority: Number(o.priority) || 0,
      requiresAppointment: o.requiresAppointment === true,
      defaultServiceTimeMin: Number(o.defaultServiceTimeMin) || 0,
    };
  }
  return defaultLogistics();
}

function toRecord(doc: { id: string } & Record<string, unknown>): ClientRecord {
  const st = doc.status as string;
  const status: ClientStatus =
    st === "inactive" || st === "suspended" ? st : "active";
  return {
    id: doc.id,
    code: String(doc.code ?? ""),
    businessName: String(doc.businessName ?? ""),
    commercialName: String(doc.commercialName ?? ""),
    documentType: String(doc.documentType ?? ""),
    documentNumber: String(doc.documentNumber ?? ""),
    contact: toContact(doc.contact),
    billing: toBilling(doc.billing),
    logistics: toLogistics(doc.logistics),
    status,
  };
}

export async function get(id: string): Promise<ClientRecord | null> {
  const d = await getDocument<Record<string, unknown>>(COLLECTION, id);
  return d ? toRecord(d) : null;
}

export async function list(): Promise<ClientRecord[]> {
  const list = await getCollection<Record<string, unknown>>(COLLECTION);
  return list.map((d) => toRecord(d));
}

export async function add(data: ClientAddInput): Promise<string> {
  return addDocument(COLLECTION, {
    code: data.code.trim(),
    businessName: data.businessName.trim(),
    commercialName: data.commercialName.trim(),
    documentType: data.documentType.trim(),
    documentNumber: data.documentNumber.trim(),
    contact: {
      contactName: data.contact.contactName.trim(),
      email: data.contact.email.trim(),
      phone: data.contact.phone.trim(),
    },
    billing: {
      creditDays: Number(data.billing.creditDays) || 0,
      creditLimit: Number(data.billing.creditLimit) || 0,
      currency: data.billing.currency.trim() || "PEN",
      paymentCondition: data.billing.paymentCondition,
    },
    logistics: {
      priority: Number(data.logistics.priority) || 0,
      requiresAppointment: data.logistics.requiresAppointment,
      defaultServiceTimeMin: Number(data.logistics.defaultServiceTimeMin) || 0,
    },
    status: data.status,
  });
}

export async function edit(id: string, data: ClientEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  if (data.businessName !== undefined) payload.businessName = data.businessName;
  if (data.commercialName !== undefined) payload.commercialName = data.commercialName;
  if (data.documentType !== undefined) payload.documentType = data.documentType;
  if (data.documentNumber !== undefined) payload.documentNumber = data.documentNumber;
  if (data.contact !== undefined) payload.contact = data.contact;
  if (data.billing !== undefined) payload.billing = data.billing;
  if (data.logistics !== undefined) payload.logistics = data.logistics;
  if (data.status !== undefined) payload.status = data.status;
  await updateDocument(COLLECTION, id, payload);
}

export async function remove(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id);
}

export async function removeMany(items: { id: string }[]): Promise<void> {
  return deleteManyDocuments(COLLECTION, items);
}
