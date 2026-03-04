/**
 * Constantes de permisos y módulos para validación de acceso.
 * Coinciden con los códigos usados en roles (Firestore) y menu.json.
 */

/** Códigos de permiso (ej. definidos en cada módulo en Firestore). */
export const PERMISSION_VIEW = "view";
export const PERMISSION_CREATE = "create";
export const PERMISSION_UPDATE = "update";
export const PERMISSION_DELETE = "delete";

/** Identificadores de módulo (colecciones / secciones del sistema). */
export const MODULE_USER = "user";
export const MODULE_ROLE = "role";
export const MODULE_MODULE = "module";
export const MODULE_DOCUMENT_TYPE = "document-type";
export const MODULE_DOCUMENT = "document";
export const MODULE_EMPLOYEE = "employee";
export const MODULE_CLIENT = "client";
export const MODULE_DRIVER = "driver";
export const MODULE_VEHICLE = "vehicle";
export const MODULE_ROUTE = "route";
export const MODULE_TRIP = "trip";
export const MODULE_ORDER = "order";
export const MODULE_PLAN = "plan";
export const MODULE_TRANSPORT_CONTRACT = "transport-contract";
export const MODULE_TRANSPORT_SERVICE = "transport-service";
export const MODULE_SEQUENCE = "sequence";
export const MODULE_COUNTER = "counter";
