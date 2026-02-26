"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as clientLocationService from "@/services/clientLocationService";
import type { ClientLocationRecord } from "@/services/clientLocationService";
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
import SetLocationDialog from "./SetLocationDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "name", order: 1, display: true, filter: true },
  { header: "Tipo", column: "type", order: 2, display: true, filter: true },
  { header: "Dirección", column: "address", order: 3, display: true, filter: true },
  { header: "Distrito", column: "district", order: 4, display: true, filter: true },
  { header: "Ciudad", column: "city", order: 5, display: true, filter: true },
  { header: "País", column: "country", order: 6, display: true, filter: true },
  { header: "Ventana entrega", column: "deliveryWindowStr", order: 7, display: true, filter: true },
  { header: "Tiempo serv. (min)", column: "serviceTimeMin", order: 8, display: true, filter: true },
  { header: "Activo", column: "active", order: 9, display: true, filter: true },
];

export interface LocationsScreenProps {
  clientId: string;
}

export default function LocationsScreen({ clientId }: LocationsScreenProps) {
  const router = useRouter();
  const { requirePermissionOrAlert } = useAccessService();
  const tableRef = useRef<DpTableRef<ClientLocationRecord & { deliveryWindowStr?: string }>>(null);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editLocationId, setEditLocationId] = useState<string | null>(null);

  const fetchClient = async () => {
    const c = await clientService.get(clientId);
    setClient(c ?? null);
  };

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    try {
      const list = await clientLocationService.listLocations(clientId);
      tableRef.current?.setDatasource(
        list.map((loc) => ({
          ...loc,
          deliveryWindowStr: `${loc.deliveryWindow.start} - ${loc.deliveryWindow.end}`,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ubicaciones.");
      tableRef.current?.clearDatasource();
    } finally {
      setLoading(false);
      tableRef.current?.setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  useEffect(() => {
    fetchLocations();
  }, [clientId, refreshTrigger]);

  const handleRefresh = () => {
    fetchLocations();
    fetchClient();
  };

  const openAdd = () => {
    if (!requirePermissionOrAlert(PERMISSION_CREATE, MODULE_CLIENT)) return;
    setShowAdd(true);
    setEditLocationId(null);
  };

  const openEdit = (row: ClientLocationRecord) => {
    if (!requirePermissionOrAlert(PERMISSION_UPDATE, MODULE_CLIENT)) return;
    setEditLocationId(row.id);
    setShowAdd(false);
  };

  const deleteSelected = async () => {
    if (!requirePermissionOrAlert(PERMISSION_DELETE, MODULE_CLIENT)) return;
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const loc of selected) {
        await clientLocationService.removeLocation(clientId, loc.id);
      }
      tableRef.current?.clearSelectedRows();
      await fetchLocations();
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
    setEditLocationId(null);
  };

  const showDialog = showAdd || !!editLocationId;

  return (
    <DpContent title={client ? `Ubicaciones: ${client.commercialName || client.code}` : "Ubicaciones"}>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/masters/clients")}
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Volver a clientes
        </button>
      </div>
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={handleRefresh}
        onCreate={openAdd}
        onDelete={deleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar ubicaciones..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ClientLocationRecord & { deliveryWindowStr?: string }>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar..."
        emptyMessage="No hay ubicaciones para este cliente."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetLocationDialog
        visible={showDialog}
        clientId={clientId}
        locationId={editLocationId}
        onSuccess={onDialogSuccess}
        onHide={() => {
          setShowAdd(false);
          setEditLocationId(null);
        }}
      />
    </DpContent>
  );
}
