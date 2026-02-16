"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  displayName: string | null;
  email: string;
  role: string[];
}

export default function AccountContent() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (!db) {
        setError("Firestore no está disponible.");
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setUserProfile({
            displayName: user.displayName ?? null,
            email: user.email ?? "",
            role: [],
          });
        } else {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setUserProfile({
            displayName: (data.displayName as string) ?? null,
            email: (data.email as string) ?? user.email ?? "",
            role: Array.isArray(data.role) ? (data.role as string[]) : [],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">Cargando…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Datos del usuario
      </h2>
      <dl className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Nombre
          </dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {userProfile?.displayName ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Email
          </dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {userProfile?.email ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Roles
          </dt>
          <dd className="mt-1">
            {userProfile?.role && userProfile.role.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {userProfile.role.map((r) => (
                  <li
                    key={r}
                    className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400">—</span>
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-8">
        <Link
          href="/home"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
