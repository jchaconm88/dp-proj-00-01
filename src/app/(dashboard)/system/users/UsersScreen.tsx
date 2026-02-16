"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Icon } from "@/components/icons";

export interface UserRecord {
  id: string;
  displayName: string | null;
  email: string;
  role: string[];
}

const PAGE_SIZES = [5, 10, 25];

export default function UsersScreen() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    if (!db) {
      setError("Firestore no está disponible.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const list: UserRecord[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return users;
    const q = filter.toLowerCase().trim();
    return users.filter(
      (u) =>
        (u.displayName ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.some((r) => r.toLowerCase().includes(q))
    );
  }, [users, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = page * pageSize;
  const pageUsers = filtered.slice(start, start + pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pageUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageUsers.map((u) => u.id)));
    }
  };

  const openAdd = () => {
    setEditingUser(null);
    setFormDisplayName("");
    setFormEmail("");
    setFormRole("");
    setModal("add");
  };

  const openEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormDisplayName(user.displayName ?? "");
    setFormEmail(user.email);
    setFormRole(user.role.join(", "));
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setEditingUser(null);
  };

  const saveUser = async () => {
    if (!db) return;
    const roles = formRole
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    setSaving(true);
    try {
      if (modal === "add") {
        await addDoc(collection(db, "users"), {
          displayName: formDisplayName || null,
          email: formEmail.trim(),
          role: roles,
        });
      } else if (editingUser) {
        await updateDoc(doc(db, "users", editingUser.id), {
          displayName: formDisplayName || null,
          email: formEmail.trim(),
          role: roles,
        });
      }
      closeModal();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!db || selectedIds.size === 0) return;
    setSaving(true);
    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "users", id));
      }
      setSelectedIds(new Set());
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const goToFirst = () => setPage(0);
  const goToPrev = () => setPage((p) => Math.max(0, p - 1));
  const goToNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goToLast = () => setPage(totalPages - 1);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
        Usuarios
      </h1>

      {/* Barra: filtro + acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="search"
            placeholder="Filtrar por nombre, correo o rol..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="rounded-full border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Actualizar"
          >
            <Icon name="refresh" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={selectedIds.size === 0 || saving}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
          </div>
        ) : (
          <table className="w-full min-w-[500px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="w-10 border-b border-zinc-200 p-3 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={pageUsers.length > 0 && selectedIds.size === pageUsers.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="w-10 border-b border-zinc-200 p-3 dark:border-zinc-700">
                  <span className="sr-only">Editar</span>
                </th>
                <th className="border-b border-zinc-200 p-3 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                  Nombre
                </th>
                <th className="border-b border-zinc-200 p-3 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                  Correo
                </th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    {filter ? "No hay resultados para el filtro." : 'No hay usuarios en la colección "users".'}
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
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                        aria-label={`Seleccionar ${user.email}`}
                      />
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                        aria-label={`Editar ${user.email}`}
                      >
                        <Icon name="pencil" className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="text-left font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {user.displayName ?? "—"}
                      </button>
                    </td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">
                      {user.email}
                      {user.role.length > 0 && (
                        <span className="ml-1 text-xs text-zinc-500">
                          ({user.role.join(", ")})
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        <div className="flex flex-wrap items-center justify-end gap-4 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>Items por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              {filtered.length === 0
                ? "0 de 0"
                : `${start + 1}-${Math.min(start + pageSize, filtered.length)} de ${filtered.length}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToFirst}
              disabled={page === 0}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Primera página"
            >
              «
            </button>
            <button
              type="button"
              onClick={goToPrev}
              disabled={page === 0}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              disabled={page >= totalPages - 1}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Siguiente"
            >
              ›
            </button>
            <button
              type="button"
              onClick={goToLast}
              disabled={page >= totalPages - 1}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Última página"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Modal Agregar / Editar */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {modal === "add" ? "Agregar usuario" : "Editar usuario"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="Nombre para mostrar"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Correo
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Roles (separados por coma)
                </label>
                <input
                  type="text"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="admin, editor"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveUser}
                disabled={saving || !formEmail.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
