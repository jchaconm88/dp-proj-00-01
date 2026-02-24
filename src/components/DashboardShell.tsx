"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Icon } from "./icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Dropdown } from "primereact/dropdown";
import { useUser } from "@/contexts/UserContext";
import { isGranted as isGrantedAccess } from "@/services/accessService";
import DpAlertBanner from "@/components/DpAlertBanner";

/** Ítem del menú en formato plano (menu.json) */
export interface MenuItemRaw {
  title: string;
  enabled?: boolean;
  icon?: string;
  link?: string;
  home?: boolean;
  permission?: string[];
  group?: boolean;
  children?: { title: string; link?: string; permission?: string[] }[];
}

export type MenuData = MenuItemRaw[];

/** Convierte array plano en secciones: los ítems con group:true inician una nueva sección */
function menuToSections(menu: MenuData): { title?: string; items: MenuItemRaw[] }[] {
  const sections: { title?: string; items: MenuItemRaw[] }[] = [];
  let current: { title?: string; items: MenuItemRaw[] } = { items: [] };
  for (const item of menu) {
    if (item.group === true) {
      if (current.items.length > 0) sections.push(current);
      current = { title: item.title, items: [] };
    } else if (item.enabled !== false) {
      current.items.push(item);
    }
  }
  if (current.items.length > 0) sections.push(current);
  return sections;
}

/** Mapeo de iconos outline (menu.json) a nombres del componente Icon */
const ICON_MAP: Record<string, Parameters<typeof Icon>[0]["name"]> = {
  "shopping-cart-outline": "cart",
  "home-outline": "house",
  "layout-outline": "folder",
  "edit-outline": "pencil",
  "grid-outline": "grid",
  "square-outline": "square",
  "message-outline": "message",
  "map-outline": "map",
  "chart-outline": "chart",
  "text-outline": "text",
  "table-outline": "table",
  "wrench-outline": "wrench",
  "lock-outline": "lock",
};

interface DashboardShellProps {
  children: React.ReactNode;
  menu: MenuData;
  appTitle?: string;
}

const HEADER_HEIGHT = 75;

export default function DashboardShell({ children, menu, appTitle = "ngx-admin" }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme() ?? { theme: "light" as const, setTheme: () => { } };
  const { user: accessUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set(["Sistema"]));

  const themes = [
    { name: 'Claro', code: 'light' },
    { name: 'Oscuro', code: 'dark' }
];

  const toggleExpanded = (label: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      setUserName(user.displayName || user.email || "Usuario");
      if (db) {
        try {
          const q = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.displayName) setUserName(data.displayName);
          }
        } catch {
          // keep email/displayName from auth
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.replace("/");
  };

  const canSee = (perm?: string[]) => {
    if (!perm || perm.length < 2) return true;
    const [permission, module] = perm;
    return isGrantedAccess(accessUser, permission, module);
  };

  const filteredMenu = useMemo<MenuData>(() => {
    const out: MenuItemRaw[] = [];
    for (const item of menu) {
      // Los ítems con group:true solo definen secciones (se conservan).
      if (item.group === true) {
        out.push(item);
        continue;
      }
      if (item.enabled === false) continue;
      if (item.permission && !canSee(item.permission)) continue;

      if (item.children && item.children.length > 0) {
        const children = item.children.filter((c) => !c.permission || canSee(c.permission));
        if (children.length === 0) continue;
        out.push({ ...item, children });
      } else {
        out.push(item);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, accessUser]);

  const sections = useMemo(() => menuToSections(filteredMenu), [filteredMenu]);

  const iconName = (name?: string): Parameters<typeof Icon>[0]["name"] => {
    if (!name) return "folder";
    return ICON_MAP[name] ?? "folder";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-navy-900">
        <p className="text-zinc-600 dark:text-navy-300">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-navy-900">
      {/* Header: ancho completo sobre todo */}
      <header
        className="z-50 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-navy-600 dark:bg-navy-700"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center w-64 gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-navy-300 dark:hover:bg-navy-600"
            aria-label="Toggle menu"
          >
            <Icon name="menu" />
          </button>
          <span className="text-lg font-semibold text-zinc-900 dark:text-navy-100">
            {appTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-navy-300 dark:hover:bg-navy-600"
            aria-label="Buscar"
          >
            <Icon name="search" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-navy-300 dark:hover:bg-navy-600"
            aria-label="Correo"
          >
            <Icon name="mail" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-navy-300 dark:hover:bg-navy-600"
            aria-label="Notificaciones"
          >
            <Icon name="bell" />
          </button>
          <div className="ml-2 flex items-center gap-3">
          <Dropdown
            value={theme}
            onChange={(e) => setTheme(e.value ?? "light")}
            options={themes}
            optionLabel="name"
            optionValue="code"
            placeholder="Tema"
          />
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-navy-600 dark:bg-navy-600">
              <Icon name="user" className="h-5 w-5 text-zinc-500 dark:text-navy-300" />
              <span className="text-sm font-medium text-zinc-800 dark:text-navy-200">
                {userName}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-navy-300 dark:hover:bg-navy-600 dark:hover:text-navy-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Cuerpo: sidebar + contenido */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: colapsado = solo iconos; expandido = iconos + texto + submenús */}
        <aside
          className={`flex shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-[width] duration-200 dark:border-navy-600 dark:bg-navy-800 ${sidebarOpen ? "w-64" : "w-16"
            }`}
        >
          <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden py-3">
            {sections.map((section, idx) => (
              <div key={idx} className={`pb-4 ${sidebarOpen ? "px-2" : "px-0"}`}>
                {sidebarOpen && section.title && (
                  <div className="mb-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-navy-300">
                    {section.title}
                  </div>
                )}
                <nav className="space-y-0.5">
                  {section.items.map((item, i) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = hasChildren && expandedKeys.has(item.title);
                    const href = item.link ?? "#";
                    const isActive =
                      href !== "#" && pathname === href ||
                      (hasChildren && item.children!.some((c) => (c.link ?? "#") !== "#" && pathname === (c.link ?? "#")));

                    if (sidebarOpen) {
                      if (hasChildren) {
                        return (
                          <div key={i}>
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.title)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-200/80 dark:text-navy-200 dark:hover:bg-navy-600"
                            >
                              <Icon
                                name={iconName(item.icon)}
                                className="h-5 w-5 shrink-0"
                              />
                              <span className="flex-1">{item.title}</span>
                              <Icon
                                name={isExpanded ? "chevronDown" : "chevron"}
                                className="h-4 w-4 shrink-0 opacity-70"
                              />
                            </button>
                            {isExpanded && (
                              <div className="ml-4 border-l border-zinc-200 pl-2 dark:border-navy-500">
                                {item.children!.map((child, j) => {
                                  const childHref = child.link ?? "#";
                                  const childActive = childHref !== "#" && pathname === childHref;
                                  return (
                                    <Link
                                      key={j}
                                      href={childHref}
                                      className={`mb-0.5 flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${childActive
                                        ? "bg-blue-100 font-medium text-blue-800 dark:bg-navy-500 dark:text-navy-100"
                                        : "text-zinc-600 hover:bg-zinc-200/80 dark:text-navy-300 dark:hover:bg-navy-600"
                                        }`}
                                    >
                                      {child.title}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={i}
                          href={href}
                          title={item.title}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive
                            ? "bg-zinc-200 text-zinc-900 dark:bg-navy-500 dark:text-navy-100"
                            : "text-zinc-700 hover:bg-zinc-200/80 dark:text-navy-200 dark:hover:bg-navy-600"
                            }`}
                        >
                          {item.icon && (
                            <Icon
                              name={iconName(item.icon)}
                              className="h-5 w-5 shrink-0"
                            />
                          )}
                          <span className="flex-1">{item.title}</span>
                        </Link>
                      );
                    }

                    /* Colapsado: solo icono por ítem de cabecera */
                    if (hasChildren) {
                      const firstChildLink = item.children!.find((c) => c.link && c.link !== "#");
                      return (
                        <div key={i} className="flex justify-center">
                          {firstChildLink ? (
                            <Link
                              href={firstChildLink.link!}
                              title={item.title}
                              className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-zinc-700 transition-colors hover:bg-zinc-200/80 dark:text-navy-200 dark:hover:bg-navy-600 ${pathname === firstChildLink.link ? "bg-zinc-200 dark:bg-navy-500" : ""
                                }`}
                            >
                              <Icon
                                name={iconName(item.icon)}
                                className="h-5 w-5 shrink-0"
                              />
                            </Link>
                          ) : (
                            <span
                              title={item.title}
                              className="flex flex-col items-center justify-center rounded-lg p-2.5 text-zinc-500 dark:text-navy-300"
                            >
                              <Icon
                                name={iconName(item.icon)}
                                className="h-5 w-5 shrink-0"
                              />
                            </span>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex justify-center">
                        <Link
                          href={href}
                          title={item.title}
                          className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-zinc-700 transition-colors hover:bg-zinc-200/80 dark:text-navy-200 dark:hover:bg-navy-600 ${isActive ? "bg-zinc-200 dark:bg-navy-500" : ""
                            }`}
                        >
                          <Icon
                            name={iconName(item.icon)}
                            className="h-5 w-5 shrink-0"
                          />
                        </Link>
                      </div>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="min-w-0 flex-1 overflow-auto p-6">
          <DpAlertBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
