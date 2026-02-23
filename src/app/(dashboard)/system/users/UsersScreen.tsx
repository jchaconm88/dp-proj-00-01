"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn, type DpTableRow } from "@/components/DpTable";

export interface UserRecord extends DpTableRow {
  displayName: string | null;
  email: string;
  role: string[];
}

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "displayName", order: 1, display: true, filter: true },
  { header: "Correo", column: "email", order: 2, display: true, filter: true },
  { header: "Roles", column: "role", order: 3, display: true, filter: true },
];

export interface UsersScreenProps {
  /** Cuando cambia, se vuelve a cargar la lista (ej. tras guardar en un diálogo) */
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function UsersScreen({ refreshTrigger, onRefresh }: UsersScreenProps) {
  const router = useRouter();
  const tableRef = useRef<DpTableRef<UserRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  const fetchUsers = async () => {
    if (!db) {
      setError("Firestore no está disponible.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
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
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchUsers();
    onRefresh?.();
  };

  const openAdd = () => {
    router.push("/system/users/add");
  };

  const openEdit = (user: UserRecord) => {
    router.push(`/system/users/edit/${user.id}`);
  };

  const deleteSelected = async () => {
    if (!db) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const user of selected) {
        await deleteDoc(doc(db, "users", user.id));
      }
      tableRef.current?.clearSelectedRows();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  return (
    <DpContent title="USUARIOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre, correo o rol..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<UserRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="displayName"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por nombre, correo o rol..."
        emptyMessage='No hay usuarios en la colección "users".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
