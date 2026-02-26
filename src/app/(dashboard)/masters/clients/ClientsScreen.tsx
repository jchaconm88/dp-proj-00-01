"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as clientService from "@/services/clientService";
import type { ClientRecord } from "@/services/clientService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_CLIENT,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { ClientRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Razón social", column: "businessName", order: 2, display: true, filter: true },
  { header: "Nombre comercial", column: "commercialName", order: 3, display: true, filter: true },
  { header: "Tipo doc", column: "documentType", order: 4, display: true, filter: true },
  { header: "Nº documento", column: "documentNumber", order: 5, display: true, filter: true },
  { header: "Contacto", column: "contactName", order: 6, display: true, filter: true },
  { header: "Estado", column: "status", order: 7, display: true, filter: true },
];

export interface ClientsScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function ClientsScreen({ refreshTrigger, onRefresh }: ClientsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<ClientRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await clientService.list();
      tableRef.current?.setDatasource(
        list.map((c) => ({ ...c, contactName: c.contact.contactName }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar clientes.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchList();
    onRefresh?.();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_CLIENT)) return;
    router.push("/masters/clients/add");
  };

  const openEdit = (row: ClientRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_CLIENT)) return;
    router.push(`/masters/clients/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_CLIENT)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await clientService.removeMany(selected);
      tableRef.current?.clearSelectedRows();
      await fetchList();
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
    <DpContent title="CLIENTES">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por código, razón social..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ClientRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="commercialName"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay clientes en la colección "clients".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
