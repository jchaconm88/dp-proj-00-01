"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tripChargeService from "@/services/tripChargeService";
import type { TripChargeRecord } from "@/models/tripCharge";
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
  TRIP_CHARGE_TYPE,
  TRIP_CHARGE_SOURCE,
  TRIP_CHARGE_STATUS,
  CURRENCY,
} from "@/constants/statusOptions";
import SetTripChargeDialog from "./SetTripChargeDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Tipo", column: "type", order: 2, display: true, filter: true, type: "status", typeOptions: TRIP_CHARGE_TYPE },
  { header: "Origen", column: "source", order: 3, display: true, filter: true, type: "status", typeOptions: TRIP_CHARGE_SOURCE },
  { header: "Monto", column: "amount", order: 4, display: true, filter: true },
  { header: "Moneda", column: "currency", order: 5, display: true, filter: true, type: "status", typeOptions: CURRENCY },
  { header: "Estado", column: "status", order: 6, display: true, filter: true, type: "status", typeOptions: TRIP_CHARGE_STATUS },
];

export interface TripChargesScreenProps {
  tripId: string;
}

export default function TripChargesScreen({ tripId }: TripChargesScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<TripChargeRecord>>(null);
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editChargeId, setEditChargeId] = useState<string | null>(null);

  const fetchTrip = async () => {
    const t = await tripService.getTrip(tripId);
    setTrip(t ?? null);
  };

  const fetchCharges = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await tripChargeService.listByTripId(tripId);
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cargos.");
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
    fetchCharges();
  }, [tripId, refreshTrigger]);

  const handleRefresh = () => {
    fetchCharges();
    fetchTrip();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRIP)) return;
    setShowAdd(true);
    setEditChargeId(null);
  };

  const openEdit = (row: TripChargeRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRIP)) return;
    setEditChargeId(row.id);
    setShowAdd(false);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRIP)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await tripChargeService.removeMany(selected);
      tableRef.current?.clearSelectedRows();
      await fetchCharges();
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
    setEditChargeId(null);
  };

  const showDialog = showAdd || !!editChargeId;
  const backToTrips = () => router.push("/transport/trips");

  return (
    <DpContentInfo
      title={trip ? `Cargos: ${trip.code || trip.id}` : "Cargos del viaje"}
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

      <DpTable<TripChargeRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay cargos para este viaje."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetTripChargeDialog
        visible={showDialog}
        tripId={tripId}
        chargeId={editChargeId}
        onSuccess={onDialogSuccess}
        onHide={() => {
          setShowAdd(false);
          setEditChargeId(null);
        }}
      />
    </DpContentInfo>
  );
}
