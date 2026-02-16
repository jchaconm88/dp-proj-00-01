"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserRow {
  id: string;
  displayName: string | null;
  email: string;
  role: string[];
}

const PAGE_SIZE = 5;

export default function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!db) {
      setError("Firestore no está disponible.");
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const list: UserRow[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: (data.displayName as string) ?? null,
            email: (data.email as string) ?? "",
            role: Array.isArray(data.role) ? (data.role as string[]) : [],
          };
        });
        setUsers(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const pageUsers = users.slice(start, start + PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">Cargando usuarios…</p>
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
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[400px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <th className="w-10 border-b border-zinc-200 p-3 dark:border-zinc-700">
                <span className="sr-only">Selección</span>
              </th>
              <th className="border-b border-zinc-200 p-3 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                Nombre
              </th>
              <th className="border-b border-zinc-200 p-3 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                  No hay usuarios en la colección &quot;users&quot;.
                </td>
              </tr>
            ) : (
              pageUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                      aria-label={`Seleccionar ${user.email}`}
                    />
                  </td>
                  <td className="p-3 text-zinc-900 dark:text-zinc-100">
                    {user.displayName ?? "—"}
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {user.email}
                    {user.role.length > 0 && (
                      <span className="ml-2 text-xs text-zinc-500">
                        ({user.role.join(", ")})
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>Items por página:</span>
          <select
            className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            value={PAGE_SIZE}
            readOnly
          >
            <option value={5}>5</option>
          </select>
          <span>
            {start + 1}-{Math.min(start + PAGE_SIZE, users.length)} de {users.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
