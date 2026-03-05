"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as resourceService from "@/services/resourceService";
import type { ResourceCostRecord, ResourceRecord } from "@/services/resourceService";
import { DpContentInfo, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_RESOURCE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import { RESOURCE_COST_TYPE } from "@/constants/statusOptions";
import SetResourceCostDialog from "./SetResourceCostDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Id", column: "id", order: 1, display: true, filter: true },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
  { header: "Tipo", column: "type", order: 3, display: true, filter: true, type: "status", typeOptions: RESOURCE_COST_TYPE },
  { header: "Monto", column: "amount", order: 4, display: true, filter: true },
  { header: "Moneda", column: "currency", order: 5, display: true, filter: true },
  { header: "Vigente desde", column: "effectiveFrom", order: 6, display: true, filter: true, type: "date" },
  { header: "Activo", column: "active", order: 7, display: true, filter: true, type: "bool" },
];

export interface ResourceCostsScreenProps {
  resourceId: string;
}

export default function ResourceCostsScreen({ resourceId }: ResourceCostsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<ResourceCostRecord>>(null);
  const [resource, setResource] = useState<ResourceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editCostId, setEditCostId] = useState<string | null>(null);

  const fetchResource = async () => {
    const r = await resourceService.getResource(resourceId);
    setResource(r ?? null);
  };

  const fetchCosts = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await resourceService.listResourceCosts(resourceId);
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar costos.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchResource();
  }, [resourceId]);

  useEffect(() => {
    fetchCosts();
  }, [resourceId, refreshTrigger]);

  const handleRefresh = () => {
    fetchCosts();
    fetchResource();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_RESOURCE)) return;
    setShowAdd(true);
    setEditCostId(null);
  };

  const openEdit = (row: ResourceCostRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_RESOURCE)) return;
    setEditCostId(row.id);
    setShowAdd(false);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_RESOURCE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await resourceService.removeManyResourceCosts(resourceId, selected);
      tableRef.current?.clearSelectedRows();
      await fetchCosts();
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

  const backToResources = () => router.push("/human-resources/resources");

  const resourceLabel = resource
    ? `Costos: ${(resource.code || resource.id).trim()} – ${(resource.firstName ?? "").trim()} ${(resource.lastName ?? "").trim()}`.trim()
    : `Costos del recurso`;

  return (
    <DpContentInfo
      title={resourceLabel}
      backLabel="Volver a recursos"
      onBack={backToResources}
    >
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por id, nombre..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ResourceCostRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="id"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay costos en "resourceCosts".'
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetResourceCostDialog
        visible={showAdd || !!editCostId}
        resourceId={resourceId}
        costId={editCostId}
        onSuccess={() => setRefreshTrigger((k) => k + 1)}
        onHide={() => {
          setShowAdd(false);
          setEditCostId(null);
        }}
      />
    </DpContentInfo>
  );
}
