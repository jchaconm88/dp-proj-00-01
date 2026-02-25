"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as documentService from "@/services/documentService";
import type { DocumentRecord } from "@/services/documentService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_DOCUMENT,
  PERMISSION_VIEW,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { DocumentRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Id", column: "id", order: 1, display: true, filter: true },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
  { header: "Tipo de documento", column: "documentType", order: 3, display: true, filter: true },
];

export interface DocumentsScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function DocumentsScreen({ refreshTrigger, onRefresh }: DocumentsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<DocumentRecord>>(null);
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
      const list = await documentService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar documentos.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_DOCUMENT)) return;
    router.push("/masters/documents/add");
  };

  const openEdit = (row: DocumentRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_DOCUMENT)) return;
    router.push(`/masters/documents/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_DOCUMENT)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await documentService.removeMany(selected);
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
    <DpContent title="DOCUMENTOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre o tipo..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<DocumentRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por nombre o tipo..."
        emptyMessage='No hay documentos en la colección "documents".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
