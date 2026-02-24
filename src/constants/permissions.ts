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
