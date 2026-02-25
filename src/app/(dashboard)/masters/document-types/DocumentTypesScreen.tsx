"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as documentTypeService from "@/services/documentTypeService";
import type { DocumentTypeRecord } from "@/services/documentTypeService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_DOCUMENT_TYPE,
  PERMISSION_VIEW,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { DocumentTypeRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Id", column: "id", order: 1, display: true, filter: true },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
];

export interface DocumentTypesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function DocumentTypesScreen({ refreshTrigger, onRefresh }: DocumentTypesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<DocumentTypeRecord>>(null);
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
      const list = await documentTypeService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar tipos de documento.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_DOCUMENT_TYPE)) return;
    router.push("/masters/document-types/add");
  };

  const openEdit = (row: DocumentTypeRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_DOCUMENT_TYPE)) return;
    router.push(`/masters/document-types/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_DOCUMENT_TYPE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await documentTypeService.removeMany(selected);
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
    <DpContent title="TIPOS DE DOCUMENTO">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<DocumentTypeRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por nombre..."
        emptyMessage='No hay tipos de documento en la colección "document-types".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
