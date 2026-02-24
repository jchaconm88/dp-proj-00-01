"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import * as roleService from "@/services/roleService";

export interface UserAccess {
  name: string;
  roles: string[];
  resolvedPermissions: string[];
}

export interface UserContextValue {
  user: UserAccess | null;
  loading: boolean;
  error: string | null;
  /** Refresca el perfil/permisos desde Firestore. */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

async function loadUserProfileByEmail(email: string): Promise<{ name: string; roles: string[] } | null> {
  if (!db) throw new Error("Firestore no está disponible.");
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data() as Record<string, unknown>;
  const displayName = typeof data.displayName === "string" ? data.displayName : null;
  const roles = Array.isArray(data.role) ? data.role.filter((r): r is string => typeof r === "string") : [];
  return { name: displayName ?? email, roles };
}

async function resolvePermissionsFromRoles(roleKeys: string[]): Promise<string[]> {
  const perms = new Set<string>();
  if (roleKeys.length === 0) return [];

  // Intento directo: cada valor en users.role es un id de documento en roles
  const direct = await Promise.all(roleKeys.map((k) => roleService.get(k).catch(() => null)));
  const missing: string[] = [];
  direct.forEach((r, idx) => {
    if (!r) missing.push(roleKeys[idx]);
    if (!r) return;
    for (const [module, codes] of Object.entries(r.permissions ?? {})) {
      for (const code of Array.isArray(codes) ? codes : []) perms.add(`${module}:${code}`);
    }
  });

  // Fallback: si algún rol no existe por id, buscar por name
  if (missing.length > 0) {
    const all = await roleService.list().catch(() => []);
    const byName = new Map(all.map((r) => [r.name, r]));
    for (const key of missing) {
      const r = byName.get(key);
      if (!r) continue;
      for (const [module, codes] of Object.entries(r.permissions ?? {})) {
        for (const code of Array.isArray(codes) ? codes : []) perms.add(`${module}:${code}`);
      }
    }
  }

  return [...perms];
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    if (!auth) {
      setUser(null);
      return;
    }
    const current = auth.currentUser;
    if (!current) {
      setUser(null);
      return;
    }
    const email = current.email ?? "";
    const fallbackName = current.displayName ?? email ?? "Usuario";
    try {
      const profile = email ? await loadUserProfileByEmail(email) : null;
      const roles = profile?.roles ?? [];
      const resolvedPermissions = await resolvePermissionsFromRoles(roles);
      setUser({
        name: profile?.name ?? fallbackName,
        roles,
        resolvedPermissions,
      });
    } catch (e) {
      setUser({
        name: fallbackName,
        roles: [],
        resolvedPermissions: [],
      });
      setError(e instanceof Error ? e.message : "Error al cargar permisos.");
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setUser(null);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      await refresh();
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ user, loading, error, refresh }),
    [user, loading, error]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de <UserProvider>.");
  return ctx;
}

