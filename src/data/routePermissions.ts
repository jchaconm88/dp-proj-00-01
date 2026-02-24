import menuData from "./menu.json";

/** Ítem del menú (misma estructura que DashboardShell usa). */
interface MenuItemRaw {
  link?: string;
  permission?: string[];
  children?: { link?: string; permission?: string[] }[];
}

type MenuData = MenuItemRaw[];

/**
 * Construye el mapa de rutas a permiso desde menu.json (misma fuente que el menú).
 * Solo se incluyen ítems con "link" y "permission": ["view", "module"].
 */
function buildRoutePermissionsFromMenu(menu: MenuData): { pathPrefix: string; permission: string; module: string }[] {
  const seen = new Set<string>();
  const result: { pathPrefix: string; permission: string; module: string }[] = [];

  function add(link: string | undefined, permission: string[] | undefined) {
    if (!link || link === "#" || !Array.isArray(permission) || permission.length < 2) return;
    const [perm, module] = permission;
    if (!perm || !module) return;
    const pathPrefix = link.replace(/\/$/, "") || "/";
    if (seen.has(pathPrefix)) return;
    seen.add(pathPrefix);
    result.push({ pathPrefix, permission: perm, module });
  }

  for (const item of menu as MenuData) {
    add(item.link, item.permission);
    if (item.children) {
      for (const child of item.children) {
        add(child.link, child.permission);
      }
    }
  }
  return result;
}

export const ROUTE_PERMISSIONS = buildRoutePermissionsFromMenu(menuData as MenuData);

export function getRequiredPermissionForPath(pathname: string): { permission: string; module: string } | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  for (const { pathPrefix, permission, module } of ROUTE_PERMISSIONS) {
    if (normalized === pathPrefix || normalized.startsWith(pathPrefix + "/")) {
      return { permission, module };
    }
  }
  return null;
}
