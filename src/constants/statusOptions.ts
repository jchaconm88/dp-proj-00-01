/**
 * Opciones de estado (y similares) centralizadas para:
 * - DpTable type="status" (chip con label + color/severity)
 * - Selects en pantallas Set (options con label + value)
 * Usar statusToSelectOptions() para obtener el array de opciones del select.
 */

export type StatusSeverity = "success" | "info" | "warning" | "danger" | "secondary";

export interface StatusOption {
  label: string;
  severity: StatusSeverity;
}

/** Convierte un objeto de opciones (valor → { label, severity }) en array para DpInput type="select". */
export function statusToSelectOptions(obj: Record<string, StatusOption>): { label: string; value: string }[] {
  return Object.entries(obj).map(([value, { label }]) => ({ label, value }));
}

// —— Viajes (trips) ——
export const TRIP_STATUS: Record<string, StatusOption> = {
  scheduled: { label: "Programado", severity: "info" },
  in_progress: { label: "En curso", severity: "warning" },
  completed: { label: "Completado", severity: "success" },
  cancelled: { label: "Cancelado", severity: "danger" },
};

// —— Contratos ——
export const CONTRACT_STATUS: Record<string, StatusOption> = {
  draft: { label: "Borrador", severity: "secondary" },
  active: { label: "Activo", severity: "success" },
  expired: { label: "Vencido", severity: "danger" },
  cancelled: { label: "Cancelado", severity: "danger" },
};

export const BILLING_CYCLE: Record<string, StatusOption> = {
  monthly: { label: "Mensual", severity: "info" },
  weekly: { label: "Semanal", severity: "info" },
  per_trip: { label: "Por viaje", severity: "info" },
};

// —— Planes ——
export const PLAN_STATUS: Record<string, StatusOption> = {
  draft: { label: "Borrador", severity: "secondary" },
  confirmed: { label: "Confirmado", severity: "info" },
  in_progress: { label: "En curso", severity: "warning" },
  completed: { label: "Completado", severity: "success" },
  cancelled: { label: "Cancelado", severity: "danger" },
};

// —— Vehículos ——
export const VEHICLE_STATUS: Record<string, StatusOption> = {
  available: { label: "Disponible", severity: "success" },
  assigned: { label: "Asignado", severity: "warning" },
};

// —— Pedidos (orders) ——
export const ORDER_STATUS: Record<string, StatusOption> = {
  pending: { label: "Pendiente", severity: "info" },
  confirmed: { label: "Confirmado", severity: "info" },
  in_progress: { label: "En curso", severity: "warning" },
  delivered: { label: "Entregado", severity: "success" },
  cancelled: { label: "Cancelado", severity: "danger" },
};

// —— Clientes ——
export const CLIENT_STATUS: Record<string, StatusOption> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
  suspended: { label: "Suspendido", severity: "danger" },
};

// —— Paradas (stops / trip-stops) ——
export const STOP_STATUS: Record<string, StatusOption> = {
  pending: { label: "Pendiente", severity: "info" },
  arrived: { label: "Llegado", severity: "warning" },
  completed: { label: "Completado", severity: "success" },
  skipped: { label: "Omitido", severity: "secondary" },
};

// —— Conductores ——
export const DRIVER_STATUS: Record<string, StatusOption> = {
  available: { label: "Disponible", severity: "success" },
  assigned: { label: "Asignado", severity: "warning" },
};
