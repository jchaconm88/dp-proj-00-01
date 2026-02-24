import type { UserAccess } from "@/contexts/UserContext";

/** Convierte { permission, module } al string normalizado "module:permission". */
export function toResolvedPermission(permission: string, module: string): string {
  return `${module}:${permission}`;
}

/**
 * Valida si el usuario logueado tiene permiso para un módulo.
 * permission: código (ej. "view")
 * module: módulo/colección (ej. "user")
 */
export function isGranted(
  user: UserAccess | null | undefined,
  permission: string,
  module: string
): boolean {
  if (!user) return false;
  if (!Array.isArray(user.resolvedPermissions)) return false;

  // Wildcards
  // - module:*  => cualquier permiso de ese módulo
  // - *:permission => ese permiso en cualquier módulo
  // - *:* => todo
  const exact = toResolvedPermission(permission, module);
  const moduleAll = toResolvedPermission("*", module);
  const anyModule = toResolvedPermission(permission, "*");
  const all = "*:*";

  return (
    user.resolvedPermissions.includes(exact) ||
    user.resolvedPermissions.includes(moduleAll) ||
    user.resolvedPermissions.includes(anyModule) ||
    user.resolvedPermissions.includes(all)
  );
}

