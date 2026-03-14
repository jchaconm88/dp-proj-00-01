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

// —— Asignaciones de viaje (trip-assignments) ——
/** Tipo de entidad en una asignación (empleado o recurso). */
export const TRIP_ASSIGNMENT_ENTITY_TYPE: Record<string, StatusOption> = {
  employee: { label: "Empleado", severity: "info" },
  resource: { label: "Recurso", severity: "warning" },
};

// —— Cargos de viaje (trip-charges) ——
/** Entidad a la que se cobra (cliente, etc.). */
export const TRIP_CHARGE_ENTITY: Record<string, StatusOption> = {
  customer: { label: "Cliente", severity: "info" },
};

/** Tipo de cargo (freight, etc.). */
export const TRIP_CHARGE_TYPE: Record<string, StatusOption> = {
  freight: { label: "Flete", severity: "info" },
  extra_waiting_time: { label: "Tiempo de Espera Extra", severity: "secondary" },
  extra_distance: { label: "Distancia Recorrida Extra", severity: "warning" },
  extra_weight: { label: "Peso Cargado Extra", severity: "success" },
  extra_volume: { label: "Volumen Cargado Extra", severity: "danger" },
};

/** Origen del cargo (contrato, manual, etc.). */
export const TRIP_CHARGE_SOURCE: Record<string, StatusOption> = {
  contract: { label: "Contrato", severity: "info" },
  manual: { label: "Manual", severity: "secondary" },
};

/** Estado del cargo. */
export const TRIP_CHARGE_STATUS: Record<string, StatusOption> = {
  open: { label: "Abierto", severity: "warning" },
  paid: { label: "Pagado", severity: "success" },
  cancelled: { label: "Anulado", severity: "danger" },
};

// —— Costos de viaje (trip-costs) ——
/** Entidad del costo (conductor, etc.). */
export const TRIP_COST_ENTITY: Record<string, StatusOption> = {
  assignment: { label: "Asignación", severity: "info" },
  company: { label: "Empresa", severity: "info" },
};

/** Tipo de costo. */
export const TRIP_COST_TYPE: Record<string, StatusOption> = {
  driver_payment: { label: "Pago a conductor", severity: "info" },
  fuel_expense: { label: "Gasto de combustible", severity: "warning" },
  toll_expense: { label: "Gasto de peaje", severity: "success" },
  parking_expense: { label: "Gasto de estacionamiento", severity: "danger" },
  other_expense: { label: "Otro gasto", severity: "secondary" },
};

/** Origen del costo. */
export const TRIP_COST_SOURCE: Record<string, StatusOption> = {
  salary_rule: { label: "Regla salarial", severity: "info" },
  manual: { label: "Manual", severity: "secondary" },
};

/** Estado del costo. */
export const TRIP_COST_STATUS: Record<string, StatusOption> = {
  open: { label: "Abierto", severity: "warning" },
  paid: { label: "Pagado", severity: "success" },
  cancelled: { label: "Anulado", severity: "danger" },
};

// —— Monedas (uso en cargos, tarifas, etc.) ——
export const CURRENCY: Record<string, StatusOption> = {
  PEN: { label: "Soles (PEN)", severity: "info" },
  USD: { label: "Dólares (USD)", severity: "info" },
  EUR: { label: "Euros (EUR)", severity: "info" },
};

// —— Paradas de viaje (trip-stops) ——
export const TRIP_STOP_STATUS: Record<string, StatusOption> = {
  pending: { label: "Pendiente", severity: "info" },
  arrived: { label: "Llegado", severity: "warning" },
  completed: { label: "Completado", severity: "success" },
  skipped: { label: "Omitido", severity: "secondary" },
};

export const TRIP_STOP_TYPE: Record<string, StatusOption> = {
  origin: { label: "Origen", severity: "info" },
  pickup: { label: "Recojo", severity: "warning" },
  delivery: { label: "Entrega", severity: "success" },
  checkpoint: { label: "Punto de control", severity: "info" },
  rest: { label: "Descanso", severity: "secondary" },
};

// —— Servicios de transporte (category / calculationType, mismo que rate-rules) ——
export const SERVICE_TYPE_CATEGORY: Record<string, StatusOption> = {
  distribution: { label: "Distribución", severity: "info" },
  express: { label: "Express", severity: "warning" },
  dedicated: { label: "Dedicado", severity: "secondary" },
};

/** Tipo de cálculo (servicios de transporte y reglas de tarifa). */
export const CALCULATION_TYPE: Record<string, StatusOption> = {
  fixed: { label: "Fijo", severity: "info" },
  zone: { label: "Zona", severity: "info" },
  per_km: { label: "Por km", severity: "info" },
  per_weight: { label: "Por peso", severity: "info" },
  per_volume: { label: "Por volumen", severity: "info" },
  percentage: { label: "Porcentaje", severity: "info" },
  formula: { label: "Fórmula", severity: "info" },
};

/** Periodo de reinicio de secuencias. */
export const RESET_PERIOD: Record<string, StatusOption> = {
  never: { label: "Nunca", severity: "secondary" },
  yearly: { label: "Anual", severity: "info" },
  monthly: { label: "Mensual", severity: "info" },
  daily: { label: "Diario", severity: "info" },
};

/** Rol del recurso (HR). */
export const RESOURCE_ROLE: Record<string, StatusOption> = {
  driver: { label: "Conductor", severity: "info" },
};

/** Tipo de vinculación del recurso. */
export const RESOURCE_ENGAGEMENT_TYPE: Record<string, StatusOption> = {
  sporadic: { label: "Esporádico", severity: "secondary" },
  permanent: { label: "Permanente", severity: "info" },
  contract: { label: "Contrato", severity: "warning" },
};

/** Estado del recurso. */
export const RESOURCE_STATUS: Record<string, StatusOption> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
  suspended: { label: "Suspendido", severity: "danger" },
};

/** Tipo de costo del recurso. */
export const RESOURCE_COST_TYPE: Record<string, StatusOption> = {
  per_trip: { label: "Por viaje", severity: "info" },
  per_hour: { label: "Por hora", severity: "info" },
  per_day: { label: "Por día", severity: "info" },
  fixed: { label: "Fijo", severity: "info" },
};

/** Cargo del empleado. */
export const EMPLOYEE_POSITION: Record<string, StatusOption> = {
  driver: { label: "Conductor", severity: "info" },
  analyst: { label: "Analista", severity: "info" },
  coordinator: { label: "Coordinador", severity: "info" },
  manager: { label: "Gerente", severity: "warning" },
  assistant: { label: "Asistente", severity: "secondary" },
};

/** Estado del empleado. */
export const EMPLOYEE_STATUS: Record<string, StatusOption> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
  suspended: { label: "Suspendido", severity: "danger" },
};

/** Tipo de salario (nómina). */
export const SALARY_TYPE: Record<string, StatusOption> = {
  monthly: { label: "Mensual", severity: "info" },
  weekly: { label: "Semanal", severity: "info" },
  daily: { label: "Diario", severity: "info" },
};
