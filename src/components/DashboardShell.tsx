"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Icon } from "./icons";

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

const HEADER_HEIGHT = 56;

export default function DashboardShell({ children, menu, appTitle = "ngx-admin" }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set(["Sistema"]));

  const toggleExpanded = (label: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

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

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
  };

  const sections = menuToSections(menu);

  const iconName = (name?: string): Parameters<typeof Icon>[0]["name"] => {
    if (!name) return "folder";
    return ICON_MAP[name] ?? "folder";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      {/* Header: ancho completo sobre todo */}
      <header
        className="z-50 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Toggle menu"
          >
            <Icon name="menu" />
          </button>
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {appTitle}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Buscar"
          >
            <Icon name="search" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Correo"
          >
            <Icon name="mail" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Notificaciones"
          >
            <Icon name="bell" />
          </button>
          <div className="ml-2 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <Icon name="user" className="h-5 w-5 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {userName}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
          className={`flex shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-[width] duration-200 dark:border-zinc-800 dark:bg-zinc-900 ${
            sidebarOpen ? "w-64" : "w-16"
          }`}
        >
          <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden py-3">
            {sections.map((section, idx) => (
              <div key={idx} className={`pb-4 ${sidebarOpen ? "px-2" : "px-0"}`}>
                {sidebarOpen && section.title && (
                  <div className="mb-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
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
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
                              <div className="ml-4 border-l border-zinc-200 pl-2 dark:border-zinc-700">
                                {item.children!.map((child, j) => {
                                  const childHref = child.link ?? "#";
                                  const childActive = childHref !== "#" && pathname === childHref;
                                  return (
                                    <Link
                                      key={j}
                                      href={childHref}
                                      className={`mb-0.5 flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                                        childActive
                                          ? "bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                                          : "text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                              : "text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
                              className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-zinc-700 transition-colors hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                                pathname === firstChildLink.link ? "bg-zinc-200 dark:bg-zinc-700" : ""
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
                              className="flex flex-col items-center justify-center rounded-lg p-2.5 text-zinc-500 dark:text-zinc-400"
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
                          className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-zinc-700 transition-colors hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                            isActive ? "bg-zinc-200 dark:bg-zinc-700" : ""
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
        <main
          className="min-w-0 flex-1 overflow-auto p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
