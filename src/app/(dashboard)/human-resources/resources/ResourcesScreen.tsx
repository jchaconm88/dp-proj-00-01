"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as resourceService from "@/services/resourceService";
import type { ResourceRecord } from "@/services/resourceService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn, DpTColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_RESOURCE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import {
  RESOURCE_ENGAGEMENT_TYPE,
  RESOURCE_STATUS,
} from "@/constants/statusOptions";

export type { ResourceRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Nombre", column: "fullName", order: 2, display: true, filter: true },
  { header: "Nº Doc", column: "documentNo", order: 3, display: true, filter: true },
  { header: "Cargo", column: "position", order: 4, display: true, filter: true },
  { header: "F. ingreso", column: "hireDate", order: 5, display: true, filter: true, type: "date" },
  { header: "Vinculación", column: "engagementType", order: 6, display: true, filter: true, type: "status", typeOptions: RESOURCE_ENGAGEMENT_TYPE },
  { header: "Estado", column: "status", order: 7, display: true, filter: true, type: "status", typeOptions: RESOURCE_STATUS },
  { header: "Costos", column: "costs", order: 8, display: true, filter: false },
];

export interface ResourcesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function ResourcesScreen({ refreshTrigger, onRefresh }: ResourcesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<ResourceRecord & { fullName?: string }>>(null);
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
      const list = await resourceService.listResources();
      tableRef.current?.setDatasource(
        list.map((r) => ({
          ...r,
          fullName: `${(r.firstName ?? "").trim()} ${(r.lastName ?? "").trim()}`.trim() || "—",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar recursos.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_RESOURCE)) return;
    router.push("/human-resources/resources/add");
  };

  const openEdit = (row: ResourceRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_RESOURCE)) return;
    router.push(`/human-resources/resources/edit/${encodeURIComponent(row.id)}`);
  };

  const openCosts = (row: ResourceRecord) => {
    router.push(`/human-resources/resources/${encodeURIComponent(row.id)}/resource-costs`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_RESOURCE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await resourceService.removeManyResources(selected);
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
    <DpContent title="RECURSOS EXTERNOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por código, nombre..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ResourceRecord & { fullName?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay recursos en la colección "resources".'
        emptyFilterMessage="No hay resultados para el filtro."
      >
        <DpTColumn<ResourceRecord> name="costs">
          {(row) => (
            <button
              type="button"
              onClick={() => openCosts(row)}
              className="p-button p-button-text p-button-rounded p-button-icon-only"
              aria-label="Costos del recurso"
              title="Costos"
            >
              <i className="pi pi-dollar" />
            </button>
          )}
        </DpTColumn>
      </DpTable>
    </DpContent>
  );
}
