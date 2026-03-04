"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as counterService from "@/services/counterService";
import type { CounterRecord } from "@/services/counterService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_COUNTER,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { CounterRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Secuencia", column: "sequence", order: 1, display: true, filter: true },
  { header: "Periodo", column: "period", order: 2, display: true, filter: true },
  { header: "Último número", column: "lastNumber", order: 3, display: true, filter: true },
  { header: "Activo", column: "active", order: 4, display: true, filter: true, type: "bool" },
];

export interface CountersScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function CountersScreen({ refreshTrigger, onRefresh }: CountersScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<CounterRecord>>(null);
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
      const list = await counterService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contadores.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_COUNTER)) return;
    router.push("/system/counters/add");
  };

  const openEdit = (row: CounterRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_COUNTER)) return;
    router.push(`/system/counters/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_COUNTER)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await counterService.removeMany(selected);
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
    <DpContent title="CONTADORES">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por secuencia, periodo..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<CounterRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="id"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay contadores en la colección "counters".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
