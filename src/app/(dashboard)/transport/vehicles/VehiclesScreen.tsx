"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as vehicleService from "@/services/vehicleService";
import type { VehicleRecord } from "@/services/vehicleService";
import { DpContent, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_VEHICLE,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";

export type { VehicleRecord };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Placa", column: "plate", order: 1, display: true, filter: true },
  { header: "Tipo", column: "type", order: 2, display: true, filter: true },
  { header: "Marca", column: "brand", order: 3, display: true, filter: true },
  { header: "Modelo", column: "model", order: 4, display: true, filter: true },
  { header: "Capacidad (kg)", column: "capacityKg", order: 5, display: true, filter: true },
  { header: "Estado", column: "status", order: 6, display: true, filter: true },
  { header: "Viaje actual", column: "currentTripId", order: 7, display: true, filter: true },
  { header: "Activo", column: "active", order: 8, display: true, filter: true },
];

export interface VehiclesScreenProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function VehiclesScreen({ refreshTrigger, onRefresh }: VehiclesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<VehicleRecord>>(null);
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
      const list = await vehicleService.list();
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar vehículos.");
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
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_VEHICLE)) return;
    router.push("/transport/vehicles/add");
  };

  const openEdit = (row: VehicleRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_VEHICLE)) return;
    router.push(`/transport/vehicles/edit/${encodeURIComponent(row.id)}`);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_VEHICLE)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await vehicleService.removeMany(selected);
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
    <DpContent title="VEHÍCULOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por placa, marca..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<VehicleRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="plate"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage='No hay vehículos en la colección "vehicles".'
        emptyFilterMessage="No hay resultados para el filtro."
      />
    </DpContent>
  );
}
