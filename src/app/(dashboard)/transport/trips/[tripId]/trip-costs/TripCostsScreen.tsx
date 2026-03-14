"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tripCostService from "@/services/tripCostService";
import type { TripCostRecord } from "@/models/tripCost";
import * as tripService from "@/services/tripService";
import type { TripRecord } from "@/services/tripService";
import { DpContentInfo, DpContentHeader } from "@/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "@/components/DpTable";
import { useAccessService } from "@/hooks/useAccessService";
import {
  MODULE_TRIP,
  PERMISSION_CREATE,
  PERMISSION_UPDATE,
  PERMISSION_DELETE,
} from "@/constants/permissions";
import {
  TRIP_COST_ENTITY,
  TRIP_COST_TYPE,
  TRIP_COST_SOURCE,
  TRIP_COST_STATUS,
  CURRENCY,
} from "@/constants/statusOptions";
import SetTripCostDialog from "./SetTripCostDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Entidad", column: "entity", order: 2, display: true, filter: true, type: "status", typeOptions: TRIP_COST_ENTITY },
  { header: "ID entidad", column: "entityId", order: 3, display: true, filter: true },
  { header: "Tipo", column: "type", order: 4, display: true, filter: true, type: "status", typeOptions: TRIP_COST_TYPE },
  { header: "Origen", column: "source", order: 5, display: true, filter: true, type: "status", typeOptions: TRIP_COST_SOURCE },
  { header: "Monto", column: "amount", order: 6, display: true, filter: true },
  { header: "Moneda", column: "currency", order: 7, display: true, filter: true, type: "status", typeOptions: CURRENCY },
  { header: "Estado", column: "status", order: 8, display: true, filter: true, type: "status", typeOptions: TRIP_COST_STATUS },
];

export interface TripCostsScreenProps {
  tripId: string;
}

export default function TripCostsScreen({ tripId }: TripCostsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<TripCostRecord>>(null);
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editCostId, setEditCostId] = useState<string | null>(null);

  const fetchTrip = async () => {
    const t = await tripService.getTrip(tripId);
    setTrip(t ?? null);
  };

  const fetchCosts = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await tripCostService.listByTripId(tripId);
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
    fetchTrip();
  }, [tripId]);

  useEffect(() => {
    fetchCosts();
  }, [tripId, refreshTrigger]);

  const handleRefresh = () => {
    fetchCosts();
    fetchTrip();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRIP)) return;
    setShowAdd(true);
    setEditCostId(null);
  };

  const openEdit = (row: TripCostRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRIP)) return;
    setEditCostId(row.id);
    setShowAdd(false);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRIP)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await tripCostService.removeMany(selected);
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

  const onDialogSuccess = () => {
    setRefreshTrigger((k) => k + 1);
    setShowAdd(false);
    setEditCostId(null);
  };

  const showDialog = showAdd || !!editCostId;
  const backToTrips = () => router.push("/transport/trips");

  return (
    <DpContentInfo
      title={trip ? `Costos: ${trip.code || trip.id}` : "Costos del viaje"}
      backLabel="Volver a viajes"
      onBack={backToTrips}
    >
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por código, entidad..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<TripCostRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay costos para este viaje."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetTripCostDialog
        visible={showDialog}
        tripId={tripId}
        costId={editCostId}
        onSuccess={onDialogSuccess}
        onHide={() => {
          setShowAdd(false);
          setEditCostId(null);
        }}
      />
    </DpContentInfo>
  );
}
