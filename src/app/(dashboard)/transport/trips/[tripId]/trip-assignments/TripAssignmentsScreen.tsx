"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tripAssignmentService from "@/services/tripAssignmentService";
import type { TripAssignmentRecord } from "@/services/tripAssignmentService";
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
import { TRIP_ASSIGNMENT_ENTITY_TYPE } from "@/constants/statusOptions";
import SetTripAssignmentDialog from "./SetTripAssignmentDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Tipo entidad", column: "entityType", order: 2, display: true, filter: true, type: "status", typeOptions: TRIP_ASSIGNMENT_ENTITY_TYPE },
  { header: "Posición", column: "position", order: 3, display: true, filter: true },
  { header: "Nombre a mostrar", column: "displayName", order: 4, display: true, filter: true },
];

export interface TripAssignmentsScreenProps {
  tripId: string;
}

export default function TripAssignmentsScreen({ tripId }: TripAssignmentsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<TripAssignmentRecord>>(null);
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState<string | null>(null);

  const fetchTrip = async () => {
    const t = await tripService.getTrip(tripId);
    setTrip(t ?? null);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await tripAssignmentService.listByTripId(tripId);
      tableRef.current?.setDatasource(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar asignaciones.");
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
    fetchAssignments();
  }, [tripId, refreshTrigger]);

  const handleRefresh = () => {
    fetchAssignments();
    fetchTrip();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_TRIP)) return;
    setShowAdd(true);
    setEditAssignmentId(null);
  };

  const openEdit = (row: TripAssignmentRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_TRIP)) return;
    setEditAssignmentId(row.id);
    setShowAdd(false);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_TRIP)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await tripAssignmentService.removeMany(selected);
      tableRef.current?.clearSelectedRows();
      await fetchAssignments();
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
    setEditAssignmentId(null);
  };

  const showDialog = showAdd || !!editAssignmentId;
  const backToTrips = () => router.push("/transport/trips");

  return (
    <DpContentInfo
      title={trip ? `Asignaciones: ${trip.code || trip.id}` : "Asignaciones del viaje"}
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
        filterPlaceholder="Filtrar por código, entidad, posición..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<TripAssignmentRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay asignaciones para este viaje."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetTripAssignmentDialog
        visible={showDialog}
        tripId={tripId}
        assignmentId={editAssignmentId}
        onSuccess={onDialogSuccess}
        onHide={() => {
          setShowAdd(false);
          setEditAssignmentId(null);
        }}
      />
    </DpContentInfo>
  );
}
